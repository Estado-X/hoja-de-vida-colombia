// Pruebas sin dependencias: node --test pruebas/
const test = require('node:test');
const assert = require('node:assert');
const E = require('../assets/esquema.js');
const X = require('../assets/experiencia.js');

const HOY = new Date(2026, 10, 4); // 4 nov 2026

test('lee fechas dd/mm/aaaa y rechaza las imposibles', () => {
  assert.ok(X.leerFecha('01/02/2020') !== null);
  assert.strictEqual(X.leerFecha('31/02/2020'), null);
  assert.strictEqual(X.leerFecha('2020-02-01'), null);
  assert.strictEqual(X.leerFecha(''), null);
});

test('un año exacto, con ambos días incluidos', () => {
  const r = X.dias([{ ingreso: '01/01/2025', retiro: '31/12/2025' }]);
  assert.strictEqual(r.dias, 365);
  assert.deepStrictEqual(X.aniosMeses(r.meses), { anios: 1, meses: 0 });
});

test('los periodos que se cruzan cuentan una sola vez', () => {
  const r = X.dias([
    { ingreso: '01/01/2024', retiro: '30/06/2024' },
    { ingreso: '01/04/2024', retiro: '31/12/2024' }
  ]);
  assert.strictEqual(r.dias, 366); // 2024 es bisiesto
});

test('periodos seguidos se unen sin perder días', () => {
  const r = X.dias([
    { ingreso: '01/01/2024', retiro: '31/01/2024' },
    { ingreso: '01/02/2024', retiro: '29/02/2024' }
  ]);
  assert.strictEqual(r.dias, 60);
  assert.strictEqual(r.meses, 2);
});

test('un periodo largo da meses calendario, no meses de 30 días', () => {
  const r = X.dias([{ ingreso: '01/08/2013', retiro: '31/10/2026' }]);
  assert.deepStrictEqual(X.aniosMeses(r.meses), { anios: 13, meses: 3 });
});

test('los días sueltos de varios periodos se suman', () => {
  const r = X.dias([
    { ingreso: '01/01/2024', retiro: '20/01/2024' },
    { ingreso: '01/03/2024', retiro: '20/03/2024' }
  ]);
  assert.strictEqual(r.meses, 1); // 20 + 20 días
});

test('el empleo actual (sin retiro) cuenta hasta hoy', () => {
  const r = X.dias([{ ingreso: '04/11/2025', retiro: '' }], HOY);
  assert.strictEqual(r.dias, 366);
});

test('retiro antes del ingreso se marca como error y no suma', () => {
  const r = X.dias([{ ingreso: '01/05/2024', retiro: '01/01/2024' }]);
  assert.strictEqual(r.dias, 0);
  assert.deepStrictEqual(r.errores, [0]);
});

test('resumen por ocupación y total sin doble conteo', () => {
  const datos = E.vacio();
  datos.experiencia = [
    { empresa: 'Alcaldía', sector: 'Pública', cargo: 'Profesional universitario', ingreso: '01/01/2020', retiro: '31/12/2021' },
    { empresa: 'Gobernación', sector: 'Pública', cargo: 'Contrato de prestación de servicios', ingreso: '01/01/2022', retiro: '31/12/2022' },
    { empresa: 'Banco', sector: 'Privada', cargo: 'Analista', ingreso: '01/07/2021', retiro: '31/12/2021' }
  ];
  const r = X.resumen(datos, HOY);
  const fila = (n) => r.filas.find((f) => f.ocupacion === n);
  assert.deepStrictEqual(fila('Servidor público').tiempo, { anios: 2, meses: 0 });
  assert.deepStrictEqual(fila('Trabajador independiente').tiempo, { anios: 1, meses: 0 });
  assert.deepStrictEqual(fila('Empleado del sector privado').tiempo, { anios: 0, meses: 6 });
  // 2020–2022 sin huecos = 1.096 días; el banco se cruza con la alcaldía
  assert.strictEqual(r.total.dias, 1096);
  assert.deepStrictEqual(r.total.tiempo, { anios: 3, meses: 0 });
});

test('la ocupación escogida manda sobre la regla por defecto', () => {
  assert.strictEqual(X.ocupacionDe({ sector: 'Pública', ocupacion: 'Trabajador independiente' }), 'Trabajador independiente');
  assert.strictEqual(X.ocupacionDe({ sector: 'Privada' }), 'Empleado del sector privado');
  assert.strictEqual(X.ocupacionDe({}), '');
});

test('extrae el JSON de una respuesta de IA con texto alrededor', () => {
  const respuesta = 'Claro, aquí está:\n```json\n{"personales":{"nombres":"Ana María","primer_apellido":"Gómez","x":"{raro}"},"idiomas":[{"idioma":"Inglés","habla":"B"}]}\n```\nMe falta: libreta militar.';
  const obj = E.extraerJSON(respuesta);
  assert.ok(obj);
  const d = E.normalizar(obj);
  assert.strictEqual(d.personales.nombres, 'Ana María');
  assert.strictEqual(d.idiomas[0].habla, 'B');
  assert.strictEqual(d.idiomas[0].lee, '');
  assert.strictEqual(d.personales.x, undefined);
});

test('normalizar ignora lo que no es del molde y no se rompe con basura', () => {
  assert.deepStrictEqual(E.normalizar(null), E.vacio());
  const d = E.normalizar({ experiencia: 'no es lista', superior: [null, 3, { titulo: 42 }] });
  assert.deepStrictEqual(d.experiencia, []);
  assert.strictEqual(d.superior.length, 1);
  assert.strictEqual(d.superior[0].titulo, '42');
  assert.strictEqual(E.extraerJSON('sin llaves'), null);
});

test('descarta lo que la IA copió del molde sin llenar', () => {
  const d = E.normalizar({ personales: { tipo_documento: 'C.C. | C.E. | Pasaporte', nacimiento_fecha: 'dd/mm/aaaa', nombres: 'Ana' }, docente: [{ institucion: '' }], superior: [{ graduado: true, titulo: 'Derecho' }] });
  assert.strictEqual(d.personales.tipo_documento, '');
  assert.strictEqual(d.personales.nacimiento_fecha, '');
  assert.strictEqual(d.personales.nombres, 'Ana');
  assert.deepStrictEqual(d.docente, []);
  assert.strictEqual(d.superior[0].graduado, 'Sí');
});

test('encuentra el bloque aunque haya llaves antes o el chat completo', () => {
  const t = 'Usé el molde {campos}. Molde: {"personales":{"nombres":""}}\nRespuesta: {"personales":{"nombres":"Ana"}}';
  assert.strictEqual(E.normalizar(E.extraerJSON(t)).personales.nombres, 'Ana');
});

test('«actual» en la fecha de retiro cuenta como empleo vigente', () => {
  const r = X.dias([{ ingreso: '04/11/2025', retiro: 'Actual' }], HOY);
  assert.strictEqual(r.dias, 366);
  assert.deepStrictEqual(r.errores, []);
});
