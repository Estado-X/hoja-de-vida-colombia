/* Tiempo total de experiencia (sección 7 del Formato Único).
   - Los periodos que se cruzan se cuentan una sola vez (Decreto 1083 de 2015, art. 2.2.2.3.8).
   - Se cuentan días calendario, con el día de ingreso y el de retiro incluidos,
     y se cuentan meses calendario completos; los días que sobran de cada periodo
     se suman y cada 30 hacen un mes. Es un cálculo de referencia. */
(function (raiz) {
  'use strict';

  var DIA = 86400000;

  function leerFecha(t) {
    var m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(t || '');
    if (!m) return null;
    var d = +m[1], mes = +m[2], a = +m[3];
    var f = new Date(Date.UTC(a, mes - 1, d));
    if (f.getUTCFullYear() !== a || f.getUTCMonth() !== mes - 1 || f.getUTCDate() !== d) return null;
    return f.getTime();
  }

  function hoyUTC(hoy) {
    var h = hoy || new Date();
    return Date.UTC(h.getFullYear(), h.getMonth(), h.getDate());
  }

  /* periodos: [{ingreso:'dd/mm/aaaa', retiro:'dd/mm/aaaa' | ''}] */
  function intervalos(periodos, hoy) {
    var lista = [], errores = [];
    (periodos || []).forEach(function (p, i) {
      var a = leerFecha(p.ingreso);
      var ret = p.retiro ? String(p.retiro).trim() : '';
      if (/^(actual|actualmente|presente|hoy|a la fecha|vigente)$/i.test(ret)) ret = '';
      var b = ret ? leerFecha(ret) : hoyUTC(hoy);
      if (a === null) { if (p.ingreso || p.retiro) errores.push(i); return; }
      if (b === null || b < a) { errores.push(i); return; }
      lista.push([a, b]);
    });
    lista.sort(function (x, y) { return x[0] - y[0]; });
    var unidos = [];
    lista.forEach(function (iv) {
      var u = unidos[unidos.length - 1];
      if (u && iv[0] <= u[1] + DIA) u[1] = Math.max(u[1], iv[1]);
      else unidos.push([iv[0], iv[1]]);
    });
    return { unidos: unidos, errores: errores };
  }

  /* Meses calendario completos entre a y el día siguiente a b, más los días que sobran. */
  function mesesDe(a, b) {
    var fin = b + DIA;
    var da = new Date(a), k = 0;
    var y = da.getUTCFullYear(), m = da.getUTCMonth(), d = da.getUTCDate();
    function mas(n) {
      var mm = m + n, yy = y + Math.floor(mm / 12); mm = ((mm % 12) + 12) % 12;
      var ultimo = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
      return Date.UTC(yy, mm, Math.min(d, ultimo));
    }
    while (mas(k + 1) <= fin) k++;
    return { meses: k, sobran: Math.round((fin - mas(k)) / DIA) };
  }

  function dias(periodos, hoy) {
    var r = intervalos(periodos, hoy);
    var total = 0, meses = 0, sobran = 0;
    r.unidos.forEach(function (iv) {
      total += Math.round((iv[1] - iv[0]) / DIA) + 1;
      var t = mesesDe(iv[0], iv[1]);
      meses += t.meses; sobran += t.sobran;
    });
    meses += Math.floor(sobran / 30);
    return { dias: total, meses: meses, errores: r.errores };
  }

  function aniosMeses(meses) {
    return { anios: Math.floor(meses / 12), meses: meses % 12 };
  }

  var CATEGORIAS = ['Servidor público', 'Empleado del sector privado', 'Trabajador independiente'];

  /* Ocupación por defecto si la persona no la escogió. */
  function ocupacionDe(e) {
    if (CATEGORIAS.indexOf(e.ocupacion) >= 0) return e.ocupacion;
    if (/prestaci[oó]n de servicios|contratista|contrato de servicios|honorarios|independiente/i.test(e.cargo || '')) return 'Trabajador independiente';
    if (e.sector === 'Pública') return 'Servidor público';
    if (e.sector === 'Privada') return 'Empleado del sector privado';
    return '';
  }

  function resumen(datos, hoy) {
    var exp = (datos && datos.experiencia) || [];
    var doc = (datos && datos.docente) || [];
    var filas = CATEGORIAS.map(function (cat) {
      var r = dias(exp.filter(function (e) { return ocupacionDe(e) === cat; }), hoy);
      return { ocupacion: cat, dias: r.dias, tiempo: aniosMeses(r.meses) };
    });
    var rd = dias(doc, hoy);
    filas.push({ ocupacion: 'Experiencia docente', dias: rd.dias, tiempo: aniosMeses(rd.meses) });
    var todos = dias(exp.concat(doc), hoy);
    var errores = dias(exp, hoy).errores.map(function (i) { return { seccion: 'experiencia', indice: i }; })
      .concat(rd.errores.map(function (i) { return { seccion: 'docente', indice: i }; }));
    var sinOcupacion = exp.filter(function (e) { return (e.ingreso || e.retiro) && !ocupacionDe(e); }).length;
    return { filas: filas, total: { dias: todos.dias, tiempo: aniosMeses(todos.meses) }, errores: errores, sinOcupacion: sinOcupacion };
  }

  var api = { leerFecha: leerFecha, dias: dias, aniosMeses: aniosMeses, resumen: resumen, ocupacionDe: ocupacionDe, CATEGORIAS: CATEGORIAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Experiencia = api;
})(this);
