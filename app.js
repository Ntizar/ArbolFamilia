/* ÁrbolFamilia — app.js
   Modelo: personas[] + uniones[] (parejas, con año de boda opcional).
   Los hijos cuelgan de una unión (o de una persona suelta).
   Render: Mermaid generado en caliente → pele (SVG vestido de Aurora). */

'use strict';

const CLAVE = 'arbofamilia-v1';
const $ = (sel) => document.querySelector(sel);

let estado = { personas: [], uniones: [] };
let montado = null;      // instancia pele del lienzo
let editandoId = null;   // persona en edición

/* ---------- persistencia ---------- */

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    $('#aviso-guardado').textContent = 'Guardado ✓ en este navegador';
  } catch (e) {
    $('#aviso-guardado').textContent = 'No se pudo guardar en el navegador';
  }
}

function cargar() {
  try {
    const bruto = localStorage.getItem(CLAVE);
    if (bruto) estado = JSON.parse(bruto);
  } catch (e) { /* estado por defecto */ }
}

/* ---------- utilidades ---------- */

function nuevoId(prefijo) {
  return prefijo + Math.random().toString(36).slice(2, 8);
}

function persona(id) {
  return estado.personas.find(p => p.id === id);
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;');
}

function fechasTexto(p) {
  const nac = (p.nacimiento || '').trim();
  const fal = (p.fallecimiento || '').trim();
  if (nac && fal) return `${nac} – †${fal}`;
  if (fal) return `†${fal}`;
  if (nac) return `n. ${nac}`;
  return '';
}

function nodoPersona(p) {
  const fechas = fechasTexto(p);
  const etiqueta = fechas
    ? `${escapar(p.nombre)}<br/>${escapar(fechas)}`
    : escapar(p.nombre);
  return `p${p.id}["${etiqueta}"]`;
}

/* ---------- mermaid ---------- */

function generarMermaid() {
  const lineas = ['flowchart TB'];
  for (const p of estado.personas) lineas.push('  ' + nodoPersona(p));
  for (const u of estado.uniones) {
    const a = persona(u.a), b = persona(u.b);
    if (!a || !b) continue;
    lineas.push(`  u${u.id}((" "))`);
    const etiquetaBoda = u.boda ? ` ---|"boda ${escapar(u.boda)}"| ` : ' --- ';
    lineas.push(`  p${a.id}${etiquetaBoda}u${u.id}`);
    lineas.push(`  p${b.id} --- u${u.id}`);
  }
  for (const p of estado.personas) {
    if (!p.padresId) continue;
    if (estado.uniones.some(u => u.id === p.padresId)) {
      lineas.push(`  u${p.padresId} --> p${p.id}`);
    } else if (persona(p.padresId)) {
      lineas.push(`  p${p.padresId} --> p${p.id}`);
    }
  }
  return lineas.join('\n');
}

function pintarArbol() {
  const lienzo = $('#lienzo');
  const texto = generarMermaid();
  if (estado.personas.length === 0) {
    if (montado) { try { montado.destroy(); } catch (e) {} montado = null; }
    lienzo.innerHTML = '<p class="nz-text--muted">Añade la primera persona con el formulario de la izquierda y el árbol se dibuja aquí solo.</p>';
    return;
  }
  try {
    if (montado) {
      montado.update(texto);
    } else {
      lienzo.innerHTML = '';
      montado = window.pele.mount(lienzo, texto);
    }
    $('#mensaje-error').hidden = true;
  } catch (e) {
    // pele pisó el stage: hay que destruir y remontar tras el error de sintaxis
    if (montado) { try { montado.destroy(); } catch (e2) {} montado = null; }
    lienzo.innerHTML = '';
    try {
      montado = window.pele.mount(lienzo, texto);
      $('#mensaje-error').hidden = true;
    } catch (e3) {
      const aviso = $('#mensaje-error');
      aviso.hidden = false;
      aviso.textContent = 'No se pudo dibujar el árbol: ' + (e3.message || e3);
    }
  }
}

/* ---------- selects y listas ---------- */

function etiquetaUnion(u) {
  const a = persona(u.a), b = persona(u.b);
  if (!a || !b) return '(unión incompleta)';
  const boda = u.boda ? ` — boda ${u.boda}` : '';
  return `${a.nombre} + ${b.nombre}${boda}`;
}

function repoblarSelects() {
  // Select "hijo/a de"
  const sel = $('#p-padres');
  const previo = sel.value;
  sel.innerHTML = '<option value="">— Nadie, persona raíz —</option>';
  for (const u of estado.uniones) {
    const a = persona(u.a), b = persona(u.b);
    if (!a || !b) continue;
    const op = document.createElement('option');
    op.value = u.id;
    op.textContent = 'Hijo/a de ' + etiquetaUnion(u);
    sel.appendChild(op);
  }
  for (const p of estado.personas) {
    const op = document.createElement('option');
    op.value = p.id;
    op.textContent = 'Hijo/a de ' + p.nombre;
    sel.appendChild(op);
  }
  sel.value = previo;

  // Selects de unión
  for (const [idSel, rotuloRaiz] of [['#u-a', true], ['#u-b', true]]) {
    const s = $(idSel);
    const antes = s.value;
    s.innerHTML = '';
    if (rotuloRaiz) {
      const op = document.createElement('option');
      op.value = '';
      op.textContent = '— Elige una persona —';
      s.appendChild(op);
    }
    for (const p of estado.personas) {
      const op = document.createElement('option');
      op.value = p.id;
      op.textContent = p.nombre || '(sin nombre)';
      s.appendChild(op);
    }
    s.value = antes;
  }
}

function listarPersonas() {
  const cont = $('#lista-personas');
  cont.innerHTML = '';
  if (estado.personas.length === 0) {
    cont.innerHTML = '<p class="nz-text--muted">Todavía no hay personas.</p>';
    return;
  }
  for (const p of estado.personas) {
    const fila = document.createElement('div');
    fila.className = 'nz-cluster';
    fila.style.justifyContent = 'space-between';
    const fechas = fechasTexto(p);
    const texto = document.createElement('span');
    texto.innerHTML = `<span class="nz-text--peso-medio">${p.nombre}</span>` +
      (fechas ? ` <span class="nz-text--muted">(${fechas})</span>` : '');
    const acciones = document.createElement('span');
    acciones.className = 'nz-cluster';
    const bEditar = document.createElement('button');
    bEditar.className = 'nz-btn nz-btn--ghost nz-btn--sm';
    bEditar.textContent = 'Editar';
    bEditar.addEventListener('click', () => editarPersona(p.id));
    const bBorrar = document.createElement('button');
    bBorrar.className = 'nz-btn nz-btn--ghost nz-btn--sm';
    bBorrar.textContent = 'Quitar';
    bBorrar.addEventListener('click', () => borrarPersona(p.id));
    acciones.append(bEditar, bBorrar);
    fila.append(texto, acciones);
    cont.appendChild(fila);
  }
}

function listarUniones() {
  const cont = $('#lista-uniones');
  cont.innerHTML = '';
  for (const u of estado.uniones) {
    const fila = document.createElement('div');
    fila.className = 'nz-cluster';
    fila.style.justifyContent = 'space-between';
    const texto = document.createElement('span');
    texto.textContent = etiquetaUnion(u);
    const bBorrar = document.createElement('button');
    bBorrar.className = 'nz-btn nz-btn--ghost nz-btn--sm';
    bBorrar.textContent = 'Separar';
    bBorrar.addEventListener('click', () => borrarUnion(u.id));
    fila.append(texto, bBorrar);
    cont.appendChild(fila);
  }
}

/* ---------- acciones ---------- */

function refrescar() {
  repoblarSelects();
  listarPersonas();
  listarUniones();
  pintarArbol();
  guardar();
}

function limpiarFormPersona() {
  editandoId = null;
  $('#p-nombre').value = '';
  $('#p-nacimiento').value = '';
  $('#p-fallecimiento').value = '';
  $('#p-padres').value = '';
  $('#titulo-form-persona').textContent = 'Añadir persona';
  $('#btn-guardar-persona').textContent = 'Añadir al árbol';
  $('#btn-cancelar-edicion').hidden = true;
}

function guardarPersona() {
  const nombre = $('#p-nombre').value.trim();
  if (!nombre) { $('#p-nombre').focus(); return; }
  const datos = {
    nombre,
    nacimiento: $('#p-nacimiento').value.trim(),
    fallecimiento: $('#p-fallecimiento').value.trim(),
    padresId: $('#p-padres').value || null,
  };
  if (editandoId) {
    const p = persona(editandoId);
    if (p) Object.assign(p, datos);
    limpiarFormPersona();
  } else {
    estado.personas.push({ id: nuevoId('x'), ...datos });
    limpiarFormPersona();
  }
  refrescar();
}

function editarPersona(id) {
  const p = persona(id);
  if (!p) return;
  editandoId = id;
  $('#p-nombre').value = p.nombre;
  $('#p-nacimiento').value = p.nacimiento || '';
  $('#p-fallecimiento').value = p.fallecimiento || '';
  $('#p-padres').value = p.padresId || '';
  $('#titulo-form-persona').textContent = 'Editar: ' + p.nombre;
  $('#btn-guardar-persona').textContent = 'Guardar cambios';
  $('#btn-cancelar-edicion').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function borrarPersona(id) {
  estado.personas = estado.personas.filter(p => p.id !== id);
  estado.uniones = estado.uniones.filter(u => u.a !== id && u.b !== id);
  for (const p of estado.personas) if (p.padresId === id) p.padresId = null;
  if (editandoId === id) limpiarFormPersona();
  refrescar();
}

function unir() {
  const a = $('#u-a').value, b = $('#u-b').value;
  if (!a || !b || a === b) return;
  const yaExiste = estado.uniones.some(u =>
    (u.a === a && u.b === b) || (u.a === b && u.b === a));
  if (!yaExiste) {
    estado.uniones.push({ id: nuevoId('y'), a, b, boda: $('#u-boda').value.trim() });
    $('#u-boda').value = '';
    refrescar();
  }
}

function borrarUnion(id) {
  estado.uniones = estado.uniones.filter(u => u.id !== id);
  for (const p of estado.personas) if (p.padresId === id) p.padresId = null;
  refrescar();
}

function descargar() {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'arbol-familia.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function cargarFichero(fichero) {
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const datos = JSON.parse(lector.result);
      if (!Array.isArray(datos.personas)) throw new Error('falta «personas»');
      datos.uniones = Array.isArray(datos.uniones) ? datos.uniones : [];
      estado = datos;
      limpiarFormPersona();
      refrescar();
    } catch (e) {
      const aviso = $('#mensaje-error');
      aviso.hidden = false;
      aviso.textContent = 'Ese fichero no parece un árbol de ÁrbolFamilia: ' + e.message;
    }
  };
  lector.readAsText(fichero);
}

/* ---------- arranque ---------- */

document.addEventListener('DOMContentLoaded', () => {
  cargar();
  refrescar();

  $('#btn-guardar-persona').addEventListener('click', guardarPersona);
  $('#btn-cancelar-edicion').addEventListener('click', limpiarFormPersona);
  $('#btn-unir').addEventListener('click', unir);
  $('#btn-descargar').addEventListener('click', descargar);
  $('#btn-cargar').addEventListener('click', () => $('#fichero-cargar').click());
  $('#fichero-cargar').addEventListener('change', (ev) => {
    if (ev.target.files[0]) cargarFichero(ev.target.files[0]);
    ev.target.value = '';
  });
  $('#btn-vaciar').addEventListener('click', () => {
    if (confirm('¿Borrar todo el árbol y empezar de cero?')) {
      estado = { personas: [], uniones: [] };
      limpiarFormPersona();
      refrescar();
    }
  });
});
