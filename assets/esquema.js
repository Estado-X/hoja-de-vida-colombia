/* Campos del Formato Único de Hoja de Vida · Persona Natural
   (Función Pública, versión de marzo de 2026: Leyes 190 de 1995, 489 y 443 de 1998).
   El orden de las secciones y de los campos es el del formato. */
(function (raiz) {
  'use strict';

  var FECHA = 'dd/mm/aaaa';
  var MES_ANIO = 'mm/aaaa';

  var SECCIONES = [
    {
      id: 'personales', numero: 1, titulo: 'Datos personales', tipo: 'campos',
      campos: [
        { id: 'primer_apellido', etq: 'Primer apellido' },
        { id: 'segundo_apellido', etq: 'Segundo apellido (o de casada)' },
        { id: 'nombres', etq: 'Nombres' },
        { id: 'tipo_documento', etq: 'Documento de identificación', opciones: ['C.C.', 'C.E.', 'Pasaporte'] },
        { id: 'numero_documento', etq: 'Número de documento' },
        { id: 'genero', etq: 'Género', opciones: ['F', 'M', 'NB'] },
        { id: 'nacionalidad', etq: 'Nacionalidad', opciones: ['Colombiana', 'Extranjera'] },
        { id: 'pais_nacionalidad', etq: 'País (si es extranjera)' },
        { id: 'libreta_clase', etq: 'Libreta militar', opciones: ['Primera clase', 'Segunda clase', 'No aplica'] },
        { id: 'libreta_numero', etq: 'Número de libreta militar' },
        { id: 'libreta_dm', etq: 'Distrito militar (D.M.)' },
        { id: 'nacimiento_fecha', etq: 'Fecha de nacimiento', formato: FECHA },
        { id: 'nacimiento_pais', etq: 'País de nacimiento' },
        { id: 'nacimiento_depto', etq: 'Departamento de nacimiento' },
        { id: 'nacimiento_municipio', etq: 'Municipio de nacimiento' },
        { id: 'direccion', etq: 'Dirección de correspondencia' },
        { id: 'direccion_pais', etq: 'País (correspondencia)' },
        { id: 'direccion_depto', etq: 'Departamento (correspondencia)' },
        { id: 'direccion_municipio', etq: 'Municipio (correspondencia)' },
        { id: 'telefono', etq: 'Teléfono' },
        { id: 'email', etq: 'Correo electrónico' }
      ]
    },
    {
      id: 'basica', numero: 2, titulo: 'Educación básica y media', tipo: 'campos',
      ayuda: 'Último grado aprobado. Los grados 1.º a 6.º de bachillerato equivalen a 6.º a 11.º.',
      campos: [
        { id: 'ultimo_grado', etq: 'Último grado aprobado', opciones: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] },
        { id: 'titulo_bachiller', etq: 'Título obtenido' },
        { id: 'fecha_grado', etq: 'Fecha de grado', formato: MES_ANIO }
      ]
    },
    {
      id: 'superior', numero: 2, titulo: 'Educación superior (pregrado y posgrado)', tipo: 'lista',
      ayuda: 'En estricto orden cronológico. Modalidad: TC técnica, TL tecnológica, TE tecnológica especializada, UN universitaria, ES especialización, MG maestría, DOC doctorado.',
      elemento: 'Estudio',
      campos: [
        { id: 'modalidad', etq: 'Modalidad académica', opciones: ['TC', 'TL', 'TE', 'UN', 'ES', 'MG', 'DOC'] },
        { id: 'semestres', etq: 'Semestres aprobados' },
        { id: 'graduado', etq: 'Graduado', opciones: ['Sí', 'No'] },
        { id: 'titulo', etq: 'Nombre de los estudios o título obtenido' },
        { id: 'terminacion', etq: 'Terminación', formato: MES_ANIO },
        { id: 'tarjeta', etq: 'Número de tarjeta profesional' }
      ]
    },
    {
      id: 'trabajo', numero: 3, titulo: 'Educación para el trabajo y el desarrollo humano', tipo: 'lista',
      ayuda: 'Cursos, diplomados y programas técnicos laborales, en orden cronológico. Modalidad: INF educación informal, TR_DES educación para el trabajo y el desarrollo humano.',
      elemento: 'Curso',
      campos: [
        { id: 'institucion', etq: 'Institución' },
        { id: 'modalidad', etq: 'Modalidad', opciones: ['INF', 'TR_DES'] },
        { id: 'horas', etq: 'Número total de horas' },
        { id: 'graduado', etq: 'Graduado', opciones: ['Sí', 'No'] },
        { id: 'titulo', etq: 'Nombre de los estudios o títulos obtenidos' },
        { id: 'terminacion', etq: 'Terminación', formato: MES_ANIO }
      ]
    },
    {
      id: 'idiomas', numero: 4, titulo: 'Idiomas', tipo: 'lista',
      ayuda: 'Idiomas diferentes al español: R regular, B bien, MB muy bien.',
      elemento: 'Idioma',
      campos: [
        { id: 'idioma', etq: 'Idioma' },
        { id: 'habla', etq: 'Lo habla', opciones: ['R', 'B', 'MB'] },
        { id: 'lee', etq: 'Lo lee', opciones: ['R', 'B', 'MB'] },
        { id: 'escribe', etq: 'Lo escribe', opciones: ['R', 'B', 'MB'] }
      ]
    },
    {
      id: 'experiencia', numero: 5, titulo: 'Experiencia laboral', tipo: 'lista',
      ayuda: 'Empleos y contratos de prestación de servicios, en estricto orden cronológico, empezando por el actual. Si es el actual, deja vacía la fecha de retiro.',
      elemento: 'Empleo o contrato',
      campos: [
        { id: 'empresa', etq: 'Empresa o entidad' },
        { id: 'sector', etq: 'Pública o privada', opciones: ['Pública', 'Privada'] },
        { id: 'pais', etq: 'País' },
        { id: 'depto', etq: 'Departamento' },
        { id: 'municipio', etq: 'Municipio' },
        { id: 'correo', etq: 'Correo electrónico de la entidad' },
        { id: 'telefonos', etq: 'Teléfonos' },
        { id: 'ingreso', etq: 'Fecha de ingreso', formato: FECHA },
        { id: 'retiro', etq: 'Fecha de retiro', formato: FECHA },
        { id: 'cargo', etq: 'Cargo o contrato' },
        { id: 'dependencia', etq: 'Dependencia' },
        { id: 'direccion', etq: 'Dirección' },
        { id: 'ocupacion', etq: 'Para el tiempo total cuenta como', opciones: ['Servidor público', 'Empleado del sector privado', 'Trabajador independiente'], propio: true,
          ayudaCampo: 'No está en el formato: sirve para calcular la sección 7. Un contrato de prestación de servicios cuenta como trabajador independiente.' }
      ]
    },
    {
      id: 'docente', numero: 6, titulo: 'Experiencia laboral docente', tipo: 'lista',
      ayuda: 'Solo si has sido docente. En orden cronológico.',
      elemento: 'Experiencia docente',
      campos: [
        { id: 'institucion', etq: 'Institución educativa' },
        { id: 'sector', etq: 'Pública o privada', opciones: ['Pública', 'Privada'] },
        { id: 'pais', etq: 'País' },
        { id: 'depto', etq: 'Departamento' },
        { id: 'municipio', etq: 'Municipio' },
        { id: 'correo', etq: 'Correo electrónico' },
        { id: 'telefonos', etq: 'Teléfonos' },
        { id: 'ingreso', etq: 'Fecha de ingreso', formato: FECHA },
        { id: 'retiro', etq: 'Fecha de retiro', formato: FECHA },
        { id: 'area', etq: 'Área de conocimiento' },
        { id: 'nivel', etq: 'Nivel educativo' },
        { id: 'direccion', etq: 'Dirección' }
      ]
    },
    {
      id: 'firma', numero: 8, titulo: 'Firma del servidor público o contratista', tipo: 'campos',
      ayuda: 'Bajo la gravedad del juramento declaras si estás o no dentro de las causales de inhabilidad e incompatibilidad, y certificas que los datos son verdaderos (art. 5 de la Ley 190 de 1995). La firma va a mano o en el SIGEP.',
      campos: [
        { id: 'inhabilidad', etq: '¿Me encuentro dentro de las causales de inhabilidad e incompatibilidad?', opciones: ['No', 'Sí'] },
        { id: 'ciudad_fecha', etq: 'Ciudad y fecha de diligenciamiento' }
      ]
    }
  ];

  function vacio() {
    var d = {};
    SECCIONES.forEach(function (s) {
      if (s.tipo === 'lista') { d[s.id] = []; return; }
      var o = {};
      s.campos.forEach(function (c) { o[c.id] = ''; });
      d[s.id] = o;
    });
    return d;
  }

  function elementoVacio(seccion) {
    var o = {};
    seccion.campos.forEach(function (c) { o[c.id] = ''; });
    return o;
  }

  /* Recibe cualquier objeto (por ejemplo, lo que devolvió la IA) y deja solo
     las llaves conocidas, como texto. Lo desconocido se ignora. */
  function normalizar(entrada) {
    var d = vacio();
    if (!entrada || typeof entrada !== 'object') return d;
    SECCIONES.forEach(function (s) {
      var v = entrada[s.id];
      if (s.tipo === 'lista') {
        if (!Array.isArray(v)) return;
        d[s.id] = v.slice(0, 60).filter(function (x) { return x && typeof x === 'object'; }).map(function (x) {
          var o = elementoVacio(s);
          s.campos.forEach(function (c) { o[c.id] = texto(x[c.id]); });
          return o;
        });
      } else if (v && typeof v === 'object') {
        s.campos.forEach(function (c) { d[s.id][c.id] = texto(v[c.id]); });
      }
    });
    return d;
  }

  function texto(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return String(v);
    if (typeof v !== 'string') return '';
    return v.trim().slice(0, 600);
  }

  /* Busca el primer objeto JSON dentro de un texto (la IA suele envolverlo en ```json). */
  function extraerJSON(textoLargo) {
    if (typeof textoLargo !== 'string') return null;
    var inicio = textoLargo.indexOf('{');
    if (inicio < 0) return null;
    var nivel = 0, enCadena = false, escape = false;
    for (var i = inicio; i < textoLargo.length; i++) {
      var ch = textoLargo[i];
      if (enCadena) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === '"') enCadena = false;
        continue;
      }
      if (ch === '"') enCadena = true;
      else if (ch === '{') nivel++;
      else if (ch === '}') {
        nivel--;
        if (nivel === 0) {
          try { return JSON.parse(textoLargo.slice(inicio, i + 1)); } catch (e) { return null; }
        }
      }
    }
    return null;
  }

  var api = { SECCIONES: SECCIONES, vacio: vacio, elementoVacio: elementoVacio, normalizar: normalizar, extraerJSON: extraerJSON };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Esquema = api;
})(this);
