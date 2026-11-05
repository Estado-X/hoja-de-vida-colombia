/* Interfaz: formulario, «Llévalo a tu IA», lista para copiar e impresión.
   Todo pasa en el navegador. Solo se guarda algo si la persona marca «Recordar en este navegador». */
(function () {
  'use strict';

  var E = window.Esquema, X = window.Experiencia;
  var CLAVE = 'hoja-de-vida-colombia:v1';
  var datos = E.vacio();
  var recordar = false;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, attrs, hijos) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'texto') n.textContent = attrs[k];
      else if (k === 'clase') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h); });
    return n;
  }

  /* ---------- Guardar en este navegador (opcional) ---------- */
  function cargarGuardado() {
    try {
      var t = localStorage.getItem(CLAVE);
      if (t) { datos = E.normalizar(JSON.parse(t)); recordar = true; }
    } catch (e) { /* sin almacenamiento: se trabaja en memoria */ }
  }
  function guardar() {
    if (!recordar) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
  }
  function olvidar() { try { localStorage.removeItem(CLAVE); } catch (e) {} }

  /* ---------- Copiar ---------- */
  function copiar(texto, boton) {
    var hecho = function () {
      if (!boton) return;
      var antes = boton.textContent;
      boton.textContent = 'Copiado';
      boton.classList.add('ok');
      setTimeout(function () { boton.textContent = antes; boton.classList.remove('ok'); }, 1400);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(hecho, function () { copiarViejo(texto); hecho(); });
    } else { copiarViejo(texto); hecho(); }
  }
  function copiarViejo(texto) {
    var t = el('textarea', { readonly: '', 'aria-hidden': 'true' });
    t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
  }

  /* ---------- Prompt para la IA ---------- */
  function construirPrompt() {
    var molde = {};
    E.SECCIONES.forEach(function (s) {
      if (s.id === 'firma') return; // la declaración juramentada la hace la persona, no la IA
      var o = {};
      s.campos.forEach(function (c) {
        var pista = c.opciones ? c.opciones.join(' | ') : (c.formato || '');
        o[c.id] = pista;
      });
      molde[s.id] = s.tipo === 'lista' ? [o] : o;
    });
    return [
      'Vas a organizar mi hoja de vida en los campos del Formato Único de Hoja de Vida Persona Natural de Función Pública (Colombia). Te la pego al final.',
      '',
      'Reglas:',
      '1. Responde primero con un único bloque JSON que siga exactamente este molde. Las llaves no se cambian.',
      '2. Donde el molde muestra opciones separadas por « | », escoge una de ellas, escrita igual.',
      '3. Fechas completas en dd/mm/aaaa; terminación de estudios y fecha de grado en mm/aaaa.',
      '4. No inventes nada. Si un dato no aparece en mi hoja de vida, deja "" (vacío). No completes con suposiciones.',
      '5. Experiencia laboral en orden cronológico, empezando por el empleo o contrato actual (con "retiro" vacío). Un contrato de prestación de servicios va con "ocupacion": "Trabajador independiente".',
      '6. Educación superior y cursos en orden cronológico. Los diplomados y cursos van en "trabajo"; los títulos técnicos, tecnológicos, universitarios y de posgrado, en "superior".',
      '7. Después del bloque JSON, escribe solo una lista corta titulada «Me falta» con los datos que el formato pide y que no encontraste.',
      '',
      'Molde:',
      '```json',
      JSON.stringify(molde, null, 2),
      '```',
      '',
      'Mi hoja de vida:',
      '[pega aquí tu hoja de vida, o adjúntala]'
    ].join('\n');
  }

  /* ---------- Formulario ---------- */
  function idCampo(sec, i, c) { return 'f-' + sec + (i === null ? '' : '-' + i) + '-' + c; }

  function control(sec, i, c, valor, alCambiar) {
    var id = idCampo(sec.id, i, c.id);
    var input;
    if (c.opciones) {
      input = el('select', { id: id });
      input.appendChild(el('option', { value: '', texto: '—' }));
      c.opciones.forEach(function (o) {
        var op = el('option', { value: o, texto: o });
        if (o === valor) op.selected = true;
        input.appendChild(op);
      });
      if (valor && c.opciones.indexOf(valor) < 0) {
        var extra = el('option', { value: valor, texto: valor });
        extra.selected = true; input.appendChild(extra);
      }
      input.addEventListener('change', function () { alCambiar(input.value); });
    } else {
      input = el('input', { id: id, type: c.id === 'email' || c.id === 'correo' ? 'email' : 'text', autocomplete: 'off', spellcheck: 'false' });
      if (c.formato) { input.setAttribute('placeholder', c.formato); input.setAttribute('inputmode', 'numeric'); }
      input.value = valor || '';
      input.addEventListener('input', function () { alCambiar(input.value); });
      if (c.formato) input.addEventListener('blur', function () { revisarFecha(input, c.formato); });
    }
    var ayuda = el('p', { clase: 'campo__ayuda', id: id + '-ayuda', texto: c.ayudaCampo || '' });
    input.setAttribute('aria-describedby', id + '-ayuda');
    var caja = el('div', { clase: 'campo' + (c.propio ? ' campo--propio' : '') }, [el('label', { for: id, texto: c.etq }), input, ayuda]);
    if (c.formato) setTimeout(function () { revisarFecha(input, c.formato); }, 0);
    return caja;
  }

  function revisarFecha(input, formato) {
    var v = input.value.trim();
    var ayuda = document.getElementById(input.id + '-ayuda');
    var bien = !v || /^(actual|actualmente|presente|hoy|a la fecha|vigente)$/i.test(v) || (formato === 'dd/mm/aaaa' ? X.leerFecha(v) !== null : /^(0?[1-9]|1[0-2])\/\d{4}$/.test(v));
    input.classList.toggle('mal', !bien);
    if (ayuda && !ayuda.dataset.fijo) { ayuda.textContent = bien ? '' : 'Escríbela como ' + formato + '.'; ayuda.classList.toggle('alerta', !bien); }
  }

  function pintarFormulario() {
    var raiz = $('#formulario');
    raiz.textContent = '';
    E.SECCIONES.forEach(function (s) {
      var cuerpo = el('div', { clase: 'seccion__cuerpo' });
      if (s.ayuda) cuerpo.appendChild(el('p', { clase: 'ayuda', texto: s.ayuda }));
      if (s.tipo === 'campos') {
        var grilla = el('div', { clase: 'campos' });
        s.campos.forEach(function (c) {
          grilla.appendChild(control(s, null, c, datos[s.id][c.id], function (v) { datos[s.id][c.id] = v; cambio(); }));
        });
        cuerpo.appendChild(grilla);
      } else {
        datos[s.id].forEach(function (item, i) {
          var grilla = el('div', { clase: 'campos' });
          s.campos.forEach(function (c) {
            grilla.appendChild(control(s, i, c, item[c.id], function (v) { item[c.id] = v; cambio(); }));
          });
          var cab = el('div', { clase: 'item__cab' }, [
            el('h4', { texto: s.elemento + ' ' + (i + 1) + (s.id === 'experiencia' && i === 0 ? ' · el actual o el más reciente' : '') }),
            el('div', { clase: 'item__acciones' }, [
              i > 0 ? el('button', { type: 'button', clase: 'enlace', texto: 'Subir', onclick: function () { mover(s.id, i, -1); } }) : null,
              el('button', { type: 'button', clase: 'enlace enlace--peligro', texto: 'Quitar', onclick: function () { datos[s.id].splice(i, 1); cambio(); pintarFormulario(); } })
            ])
          ]);
          cuerpo.appendChild(el('div', { clase: 'item' }, [cab, grilla]));
        });
        cuerpo.appendChild(el('button', { type: 'button', clase: 'boton boton--claro', texto: '+ Agregar ' + s.elemento.toLowerCase(), onclick: function () {
          datos[s.id].push(E.elementoVacio(s)); cambio(); pintarFormulario();
          var n = datos[s.id].length - 1; var f = document.getElementById(idCampo(s.id, n, s.campos[0].id)); if (f) f.focus();
        } }));
      }
      var det = el('details', { clase: 'seccion tarjeta', open: '' }, [
        el('summary', {}, [el('span', { clase: 'seccion__num', texto: String(s.numero) }), el('span', { clase: 'seccion__titulo', texto: s.titulo }), el('span', { clase: 'seccion__cuenta', 'data-cuenta': s.id })]),
        cuerpo
      ]);
      raiz.appendChild(det);
    });
    contar();
  }

  function mover(sec, i, d) {
    var l = datos[sec], j = i + d;
    if (j < 0 || j >= l.length) return;
    var t = l[i]; l[i] = l[j]; l[j] = t;
    cambio(); pintarFormulario();
  }

  function llenos(s) {
    if (s.tipo === 'campos') {
      var n = 0; s.campos.forEach(function (c) { if (datos[s.id][c.id]) n++; });
      return n + ' de ' + s.campos.length;
    }
    var k = datos[s.id].length;
    return k === 0 ? 'vacía' : k + (k === 1 ? ' registro' : ' registros');
  }
  function contar() {
    E.SECCIONES.forEach(function (s) {
      var c = document.querySelector('[data-cuenta="' + s.id + '"]');
      if (c) c.textContent = llenos(s);
    });
  }

  /* ---------- Lista para copiar ---------- */
  function filaCopiar(etq, valor) {
    var b = el('button', { type: 'button', clase: 'copiar', texto: 'Copiar', 'aria-label': 'Copiar ' + etq });
    if (!valor) b.disabled = true;
    b.addEventListener('click', function () { copiar(valor, b); });
    return el('div', { clase: 'fila' + (valor ? '' : ' fila--vacia') }, [
      el('span', { clase: 'fila__etq', texto: etq }),
      el('span', { clase: 'fila__valor', texto: valor || 'Sin llenar' }),
      b
    ]);
  }

  function textoSeccion(s) {
    var lineas = [s.numero + '. ' + s.titulo.toUpperCase()];
    var bloque = function (obj) {
      s.campos.forEach(function (c) { if (!c.propio && obj[c.id]) lineas.push(c.etq + ': ' + obj[c.id]); });
    };
    if (s.tipo === 'campos') bloque(datos[s.id]);
    else datos[s.id].forEach(function (it, i) { lineas.push(''); lineas.push(s.elemento + ' ' + (i + 1)); bloque(it); });
    return lineas.join('\n');
  }

  function pintarCopiar() {
    var raiz = $('#copiar');
    raiz.textContent = '';
    var r = X.resumen(datos);
    E.SECCIONES.forEach(function (s) {
      if (s.id === 'firma') raiz.appendChild(tarjetaTiempo(r));
      var cuerpo = el('div', { clase: 'copiar__cuerpo' });
      if (s.tipo === 'campos') {
        s.campos.forEach(function (c) { cuerpo.appendChild(filaCopiar(c.etq, datos[s.id][c.id])); });
      } else if (!datos[s.id].length) {
        cuerpo.appendChild(el('p', { clase: 'nota', texto: 'Sin registros.' }));
      } else {
        datos[s.id].forEach(function (it, i) {
          var g = el('div', { clase: 'copiar__item' }, [el('h4', { texto: s.elemento + ' ' + (i + 1) })]);
          s.campos.forEach(function (c) {
            if (c.propio) return;
            g.appendChild(filaCopiar(c.etq, it[c.id]));
          });
          cuerpo.appendChild(g);
        });
      }
      var bSec = el('button', { type: 'button', clase: 'boton boton--claro boton--chico', texto: 'Copiar sección' });
      bSec.addEventListener('click', function () { copiar(textoSeccion(s), bSec); });
      raiz.appendChild(el('section', { clase: 'tarjeta copiar__sec' }, [
        el('div', { clase: 'copiar__cab' }, [el('h3', {}, [el('span', { clase: 'seccion__num', texto: String(s.numero) }), s.titulo]), bSec]),
        cuerpo
      ]));
    });
  }

  function textoTiempo(t) { return t.anios + ' años y ' + t.meses + ' meses'; }

  function tarjetaTiempo(r) {
    var tabla = el('table', { clase: 'tiempo' }, [
      el('thead', {}, [el('tr', {}, [el('th', { texto: 'Ocupación' }), el('th', { texto: 'Años' }), el('th', { texto: 'Meses' })])])
    ]);
    var tb = el('tbody');
    r.filas.forEach(function (f) {
      tb.appendChild(el('tr', {}, [el('td', { texto: f.ocupacion }), el('td', { clase: 'n', texto: String(f.tiempo.anios) }), el('td', { clase: 'n', texto: String(f.tiempo.meses) })]));
    });
    tb.appendChild(el('tr', { clase: 'total' }, [el('td', { texto: 'Total (referencia; no está en el formato de 2026)' }), el('td', { clase: 'n', texto: String(r.total.tiempo.anios) }), el('td', { clase: 'n', texto: String(r.total.tiempo.meses) })]));
    tabla.appendChild(tb);
    var avisos = [];
    if (r.errores.length) avisos.push('Hay ' + r.errores.length + ' fecha(s) que no se pudieron leer o con retiro antes del ingreso: revísalas arriba.');
    if (r.sinOcupacion) avisos.push(r.sinOcupacion + ' empleo(s) sin «Pública o privada» ni ocupación: no entran en las filas, sí en el total.');
    var b = el('button', { type: 'button', clase: 'boton boton--claro boton--chico', texto: 'Copiar sección' });
    b.addEventListener('click', function () {
      copiar(['7. TIEMPO TOTAL DE EXPERIENCIA'].concat(r.filas.map(function (f) { return f.ocupacion + ': ' + textoTiempo(f.tiempo); }))
        .join('\n'), b);
    });
    return el('section', { clase: 'tarjeta copiar__sec' }, [
      el('div', { clase: 'copiar__cab' }, [el('h3', {}, [el('span', { clase: 'seccion__num', texto: '7' }), 'Tiempo total de experiencia']), b]),
      el('div', { clase: 'tabla-scroll' }, [tabla]),
      el('p', { clase: 'nota', texto: 'Calculado con tus fechas: los periodos que se cruzan cuentan una sola vez y se cuentan meses calendario completos. Es una referencia; la entidad lo verifica con tus certificados.' }),
      avisos.length ? el('p', { clase: 'nota alerta', texto: avisos.join(' ') }) : null
    ]);
  }

  /* ---------- Impresión ---------- */
  function pintarImpresion() {
    var raiz = $('#impresion');
    raiz.textContent = '';
    var p = datos.personales;
    var nombre = [p.nombres, p.primer_apellido, p.segundo_apellido].filter(Boolean).join(' ');
    raiz.appendChild(el('header', { clase: 'imp__cab' }, [
      el('p', { clase: 'imp__kicker', texto: 'Hoja de vida organizada según el Formato Único de Función Pública' }),
      el('h1', { texto: nombre || 'Hoja de vida' }),
      el('p', { clase: 'imp__nota', texto: 'Documento de apoyo para diligenciar el formato oficial o el SIGEP. No reemplaza el formato firmado.' })
    ]));
    var r = X.resumen(datos);
    E.SECCIONES.forEach(function (s) {
      if (s.id === 'firma') {
        var t = el('section', { clase: 'imp__sec' }, [el('h2', { texto: '7. Tiempo total de experiencia' })]);
        var dl = el('dl');
        r.filas.concat([{ ocupacion: 'Total (referencia; no está en el formato de 2026)', tiempo: r.total.tiempo }]).forEach(function (f) {
          dl.appendChild(el('dt', { texto: f.ocupacion })); dl.appendChild(el('dd', { texto: textoTiempo(f.tiempo) }));
        });
        t.appendChild(dl); raiz.appendChild(t);
      }
      var sec = el('section', { clase: 'imp__sec' }, [el('h2', { texto: s.numero + '. ' + s.titulo })]);
      var bloque = function (obj) {
        var dl = el('dl');
        s.campos.forEach(function (c) { if (!c.propio && obj[c.id]) { dl.appendChild(el('dt', { texto: c.etq })); dl.appendChild(el('dd', { texto: obj[c.id] })); } });
        return dl;
      };
      if (s.tipo === 'campos') sec.appendChild(bloque(datos[s.id]));
      else if (!datos[s.id].length) sec.appendChild(el('p', { texto: 'Sin registros.' }));
      else datos[s.id].forEach(function (it, i) { sec.appendChild(el('h3', { texto: s.elemento + ' ' + (i + 1) })); sec.appendChild(bloque(it)); });
      raiz.appendChild(sec);
    });
    raiz.appendChild(el('p', { clase: 'imp__pie', texto: 'Hecha con la herramienta abierta de Estado X · estado-x.github.io/hoja-de-vida-colombia' }));
  }

  /* ---------- Cambios ---------- */
  var pendiente = null;
  function cambio() {
    guardar(); contar();
    clearTimeout(pendiente);
    pendiente = setTimeout(pintarCopiar, 250);
  }

  function aviso(id, texto, tipo) {
    var n = $(id);
    n.textContent = texto;
    n.className = 'mensaje' + (tipo ? ' mensaje--' + tipo : '');
    n.hidden = !texto;
  }

  function contarLlenos(d) {
    var n = 0;
    E.SECCIONES.forEach(function (s) {
      if (s.tipo === 'campos') s.campos.forEach(function (c) { if (d[s.id][c.id]) n++; });
      else d[s.id].forEach(function (it) { s.campos.forEach(function (c) { if (it[c.id]) n++; }); });
    });
    return n;
  }

  function usarRespuesta() {
    var t = $('#respuesta').value;
    var obj = E.extraerJSON(t);
    if (!obj) { aviso('#msg-ia', 'No encontré el bloque JSON en lo que pegaste. Copia la respuesta completa de la IA, incluido lo que está entre { y }.', 'error'); return; }
    var nuevo = E.normalizar(obj);
    var n = contarLlenos(nuevo);
    if (!n) { aviso('#msg-ia', 'El bloque no trae datos que reconozca. Revisa que la IA haya usado el molde sin cambiar las llaves.', 'error'); return; }
    datos = nuevo;
    guardar(); pintarFormulario(); pintarCopiar();
    aviso('#msg-ia', 'Listo: se llenaron ' + n + ' campos. Revisa cada sección en el paso 2: la IA puede equivocarse.', 'ok');
    $('#paso-2').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function descargar() {
    var blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'mi-hoja-de-vida.json' });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 500);
  }

  function cargarArchivo(f) {
    if (!f) return;
    var lector = new FileReader();
    lector.onload = function () {
      var obj = E.extraerJSON(String(lector.result));
      if (!obj) { aviso('#msg-datos', 'Ese archivo no tiene datos que reconozca.', 'error'); return; }
      datos = E.normalizar(obj);
      guardar(); pintarFormulario(); pintarCopiar();
      aviso('#msg-datos', 'Datos cargados.', 'ok');
    };
    lector.readAsText(f);
  }

  function iniciar() {
    cargarGuardado();
    var prompt = construirPrompt();
    $('#prompt').value = prompt;
    $('#copiar-prompt').addEventListener('click', function (e) { copiar(prompt, e.currentTarget); });
    $('#usar-respuesta').addEventListener('click', usarRespuesta);
    $('#recordar').checked = recordar;
    $('#recordar').addEventListener('change', function (e) {
      recordar = e.target.checked;
      if (recordar) { guardar(); aviso('#msg-datos', 'Se guardará en este navegador hasta que lo borres.', 'ok'); }
      else { olvidar(); aviso('#msg-datos', 'Ya no se guarda en este navegador.', ''); }
    });
    var confirmar = $('#confirmar-borrar');
    $('#borrar').addEventListener('click', function () { confirmar.hidden = false; $('#si-borrar').focus(); });
    $('#no-borrar').addEventListener('click', function () { confirmar.hidden = true; });
    $('#si-borrar').addEventListener('click', function () {
      datos = E.vacio(); olvidar(); confirmar.hidden = true;
      $('#respuesta').value = '';
      pintarFormulario(); pintarCopiar();
      aviso('#msg-datos', 'Se borró todo.', 'ok');
    });
    $('#descargar').addEventListener('click', descargar);
    $('#cargar').addEventListener('change', function (e) { cargarArchivo(e.target.files[0]); e.target.value = ''; });
    $('#imprimir').addEventListener('click', function () { pintarImpresion(); window.print(); });
    window.addEventListener('beforeprint', pintarImpresion);
    pintarFormulario();
    pintarCopiar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
