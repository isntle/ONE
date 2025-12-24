/*
 * semana.js
 * Lógica específica para la vista de Semana (Tweek Logic)
 */

// Estado local de la vista
let fechaFoco = new Date(); // Día ancla (siempre local, 00:00)
let tipoVista = 'semana'; // 'dia', 'semana', 'mes'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEM = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_SEM_CORTO_LUNES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function normalizarFechaLocal(fecha) {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isoLocal(fecha) {
    if (typeof Store !== 'undefined' && typeof Store.fechaIsoLocal === 'function') {
        return Store.fechaIsoLocal(fecha);
    }
    const d = new Date(fecha);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function inicioDeSemanaLunes(fecha) {
    const d = normalizarFechaLocal(fecha);
    // JS: 0=Dom..6=Sáb -> Lunes=0
    const idxLunes = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - idxLunes);
    return d;
}

function diasEnMes(anio, mesIndex) {
    return new Date(anio, mesIndex + 1, 0).getDate();
}

function moverMesClamp(fecha, offsetMeses) {
    const d = normalizarFechaLocal(fecha);
    const dia = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + offsetMeses);
    const ultimo = diasEnMes(d.getFullYear(), d.getMonth());
    d.setDate(Math.min(dia, ultimo));
    return d;
}

function formatearRangoSemana(inicio, fin) {
    const mismoAnio = inicio.getFullYear() === fin.getFullYear();
    const mismoMes = inicio.getMonth() === fin.getMonth() && mismoAnio;

    const inicioStr = `${inicio.getDate()} ${MESES[inicio.getMonth()].slice(0, 3)}`;
    const finStr = `${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)}`;

    if (mismoMes) return `${inicio.getDate()}–${finStr} ${fin.getFullYear()}`;
    if (mismoAnio) return `${inicioStr} – ${finStr} ${fin.getFullYear()}`;
    return `${inicioStr} ${inicio.getFullYear()} – ${finStr} ${fin.getFullYear()}`;
}

// Colores disponibles para tareas
const COLORES_TAREA = [
    { nombre: 'verde', hex: '#429155' },
    { nombre: 'azul', hex: '#3B82F6' },
    { nombre: 'morado', hex: '#8B5CF6' },
    { nombre: 'rosa', hex: '#EC4899' },
    { nombre: 'amarillo', hex: '#F59E0B' },
    { nombre: 'rojo', hex: '#EF4444' }
];

document.addEventListener('DOMContentLoaded', () => {
    inicializarFechas();
    renderizarVista();
    configurarEventos();

    // Escuchar cambios de espacio
    document.addEventListener('cambio-espacio', () => renderizarVista());

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
});

function inicializarFechas() {
    // Día foco por defecto: hoy (local, sin desfases de zona horaria)
    fechaFoco = normalizarFechaLocal(new Date());
    // UI inicial del selector
    document.querySelectorAll('.btn-vista').forEach(b => {
        b.classList.toggle('activo', b.dataset.vista === tipoVista);
    });
}

function configurarEventos() {
    document.getElementById('btn-prev-semana')?.addEventListener('click', () => navegarTemporal(-1));
    document.getElementById('btn-next-semana')?.addEventListener('click', () => navegarTemporal(1));

    // Botones de Selector de Vistas
    const botonesVista = document.querySelectorAll('.btn-vista');
    botonesVista.forEach(btn => {
        btn.addEventListener('click', () => {
            const vistaSeleccionada = btn.dataset.vista;
            if (tipoVista === vistaSeleccionada) return; // nada que hacer
            tipoVista = vistaSeleccionada;
            renderizarVista();
        });
    });
}

window.hoy = () => {
    // Mantener la vista actual, solo regresar el foco a hoy
    fechaFoco = normalizarFechaLocal(new Date());
    renderizarVista();
}

function navegarTemporal(direccion) {
    if (tipoVista === 'semana') {
        fechaFoco.setDate(fechaFoco.getDate() + (direccion * 7));
    } else if (tipoVista === 'dia') {
        fechaFoco.setDate(fechaFoco.getDate() + direccion);
    } else if (tipoVista === 'mes') {
        fechaFoco = moverMesClamp(fechaFoco, direccion);
    }
    renderizarVista();
}

function renderizarVista() {
    const rejilla = document.querySelector('.rejilla-semana');
    const tituloSemana = document.querySelector('.cabecera-vista h1');
    const subtituloVista = document.querySelector('.cabecera-vista p');
    const contenedorPrincipal = document.querySelector('main.zona-contenido');
    // Sincronizar estado visual del selector flotante
    document.querySelectorAll('.btn-vista').forEach(b => {
        b.classList.toggle('activo', b.dataset.vista === tipoVista);
    });

    // Textos de botones de navegación
    const btnPrev = document.getElementById('btn-prev-semana');
    const btnNext = document.getElementById('btn-next-semana');

    if (!rejilla || !contenedorPrincipal) return;

    // Resetear clases de layout
    contenedorPrincipal.classList.add('vista-semana'); // base estable
    contenedorPrincipal.classList.remove('vista-dia', 'vista-mes');
    if (tipoVista !== 'semana') contenedorPrincipal.classList.add(`vista-${tipoVista}`);

    rejilla.innerHTML = '';

    // Actualizar Textos Dinámicos
    const mesActual = MESES[fechaFoco.getMonth()];
    const anioActual = fechaFoco.getFullYear();

    if (tituloSemana) {
        if (tipoVista === 'dia') {
            const numDia = fechaFoco.getDate();
            tituloSemana.textContent = `${DIAS_SEM[fechaFoco.getDay()]} ${numDia} · ${mesActual} ${anioActual}`;
            if (subtituloVista) subtituloVista.textContent = 'Enfoque diario';
            if (btnPrev) btnPrev.textContent = '◀ Día anterior';
            if (btnNext) btnNext.textContent = 'Día siguiente ▶';
        } else if (tipoVista === 'mes') {
            tituloSemana.textContent = `${mesActual} ${anioActual}`;
            if (subtituloVista) subtituloVista.textContent = 'Panorama mensual';
            if (btnPrev) btnPrev.textContent = '◀ Mes anterior';
            if (btnNext) btnNext.textContent = 'Mes siguiente ▶';
        } else {
            const inicio = inicioDeSemanaLunes(fechaFoco);
            const fin = new Date(inicio);
            fin.setDate(inicio.getDate() + 6);
            tituloSemana.textContent = `Semana · ${formatearRangoSemana(inicio, fin)}`;
            if (subtituloVista) subtituloVista.textContent = 'Clases, proyectos y bloques de estudio organizados por día.';
            if (btnPrev) btnPrev.textContent = '◀ Semana anterior';
            if (btnNext) btnNext.textContent = 'Semana siguiente ▶';
        }
    }

    const tareas = (typeof Store !== 'undefined' && Array.isArray(Store.obtenerTareas())) ? Store.obtenerTareas() : [];

    // Lógica principal de renderizado
    if (tipoVista === 'mes') {
        renderizarMes(rejilla, tareas, fechaFoco);
        reiniciarIconos();
        return;
    }

    let iteraciones = 1;
    let fechaIterar = new Date(fechaFoco);

    if (tipoVista === 'semana') {
        fechaIterar = inicioDeSemanaLunes(fechaFoco);
        iteraciones = 7;
    }

    for (let i = 0; i < iteraciones; i++) {
        const d = new Date(fechaIterar);
        d.setDate(fechaIterar.getDate() + i);
        renderizarColumnaDia(rejilla, d, tareas);
    }

    reiniciarIconos();
}

function reiniciarIconos() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof Icons !== 'undefined') Icons.init();
}

function renderizarMes(contenedor, todasLasTareas, fechaBase) {
    const base = normalizarFechaLocal(fechaBase);
    const anio = base.getFullYear();
    const mes = base.getMonth();

    const primerDiaMes = new Date(anio, mes, 1);
    const inicioIdx = (primerDiaMes.getDay() + 6) % 7; // Lunes=0

    const totalDiasMes = diasEnMes(anio, mes);
    const totalCeldas = Math.ceil((inicioIdx + totalDiasMes) / 7) * 7;

    const inicioGrid = new Date(anio, mes, 1 - inicioIdx);
    inicioGrid.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalCeldas; i++) {
        const d = new Date(inicioGrid);
        d.setDate(inicioGrid.getDate() + i);
        const esOtroMes = d.getMonth() !== mes;
        renderizarColumnaDia(contenedor, d, todasLasTareas, { esOtroMes, modoMes: true });
    }
}

function renderizarColumnaDia(contenedor, fecha, todasLasTareas, opciones = {}) {
    const fechaIso = isoLocal(fecha);
    const nombreDia = DIAS_SEM[fecha.getDay()];
    const numeroDia = fecha.getDate();

    const tareasDia = todasLasTareas.filter(t => t.fecha === fechaIso);
    tareasDia.sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));

    const article = document.createElement('article');
    article.className = 'columna-dia';
    if (opciones.esOtroMes) article.classList.add('es-otro-mes');

    // Marcar hoy
    const hoyIso = isoLocal(new Date());
    if (fechaIso === hoyIso) article.classList.add('es-hoy');

    let htmlTareas = '<ul class="lista-tareas-dia">';
    tareasDia.forEach(t => {
        let claseColor = t.color ? `color-${t.color}` : 'horario-personal';
        const completadaClass = t.completada ? 'completada' : '';
        const iconoCheck = t.completada ? 'check-circle-2' : 'circle';

        htmlTareas += `
            <li class="bloque ${claseColor} ${completadaClass}" onclick="abrirModalEdicion(${t.id})">
                <div class="contenido-bloque">
                    <div class="titulo-y-hora">
                        <div class="titulo-bloque">${t.titulo}</div>
                        ${!opciones.modoMes ? `<span class="hora-tarea">${t.horaInicio || ''}</span>` : ''}
                    </div>
                    <button class="btn-check-tarea" onclick="toggleCompletada(event, ${t.id})">
                        <i data-lucide="${iconoCheck}"></i>
                    </button>
                </div>
            </li>
        `;
    });
    htmlTareas += '</ul>';

    // Botón agregar
    const botonAgregar = tipoVista === 'mes'
        ? `<button class="boton-agregar-tarea-mini" onclick="activarInputRegistro(this, '${fechaIso}')" title="Agregar">+</button>`
        : `<button class="boton-agregar-tarea" onclick="activarInputRegistro(this, '${fechaIso}')">
             <i data-lucide="plus" style="width:14px; height:14px;"></i> Agregar
           </button>`;

    article.innerHTML = `
        <header>
            <span class="nombre-dia">${tipoVista === 'mes' ? DIAS_SEM_CORTO_LUNES[(fecha.getDay() + 6) % 7] : nombreDia.substring(0, 3)}</span> 
            <span class="fecha-dia">${numeroDia}</span>
        </header>
        ${htmlTareas}
        ${botonAgregar}
    `;

    contenedor.appendChild(article);
}

// === TOGGLE COMPLETADA ===
window.toggleCompletada = (e, tareaId) => {
    e.stopPropagation(); // Evitar abrir el modal
    const tarea = Store.state.tareas.find(t => t.id === tareaId);
    if (tarea) {
        Store.actualizarTarea(tareaId, { completada: !tarea.completada });
        renderizarVista();
    }
};

// === MODAL DE EDICIÓN ===
window.abrirModalEdicion = (tareaId) => {
    const tarea = Store.state.tareas.find(t => t.id === tareaId);
    if (!tarea) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-edicion';
    overlay.onclick = (e) => { if (e.target === overlay) cerrarModal(); };

    const colorActual = tarea.color || 'verde';

    overlay.innerHTML = `
        <div class="modal-tarea modal-tarea-expandida">
            <div class="modal-header">
                <h3>Editar tarea</h3>
                <button class="modal-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            <div class="modal-campo">
                <label>Título</label>
                <input type="text" id="modal-titulo" value="${tarea.titulo}" />
            </div>
            <div class="modal-campo">
                <label>Fecha</label>
                <input type="date" id="modal-fecha" value="${tarea.fecha}" />
            </div>
            <div class="modal-campo" style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label>Inicio</label>
                    <input type="time" id="modal-hora-inicio" value="${tarea.horaInicio}" />
                </div>
                <div style="flex: 1;">
                    <label>Fin</label>
                    <input type="time" id="modal-hora-fin" value="${tarea.horaFin}" />
                </div>
            </div>
            <div class="modal-campo">
                <label>Color</label>
                <div class="selector-colores">
                    ${COLORES_TAREA.map(c => `
                        <div class="color-opcion ${c.nombre === colorActual ? 'seleccionado' : ''}" 
                             data-color="${c.nombre}" 
                             style="background: ${c.hex};"
                             onclick="seleccionarColor('${c.nombre}')">
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-campo">
                <label>Notas</label>
                <div class="editor-notas-container">
                    <div class="toolbar-editor">
                        <button type="button" title="Header" onclick="formatearTarea('formatBlock', 'h3')"><i data-lucide="heading"></i></button>
                        <button type="button" title="Negrita" onclick="formatearTarea('bold')"><i data-lucide="bold"></i></button>
                        <button type="button" title="Lista" onclick="formatearTarea('insertUnorderedList')"><i data-lucide="list"></i></button>
                        <button type="button" title="Alinear Centro" onclick="formatearTarea('justifyCenter')"><i data-lucide="align-center"></i></button>
                        <button type="button" title="Enlace" onclick="crearEnlaceTarea()"><i data-lucide="link"></i></button>
                    </div>
                    <div id="editor-notas-tarea" class="editor-body" contenteditable="true">${tarea.notas || ''}</div>
                </div>
            </div>
            <div class="modal-acciones">
                <button class="btn-eliminar" onclick="eliminarTareaModal(${tarea.id})">Eliminar</button>
                <button class="btn-guardar" onclick="guardarEdicion(${tarea.id})">Guardar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => {
        document.getElementById('modal-titulo')?.focus();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);
};

// Funciones de formateo para el editor de notas
window.formatearTarea = (comando, valor = null) => {
    document.execCommand(comando, false, valor);
    document.getElementById('editor-notas-tarea')?.focus();
};

window.crearEnlaceTarea = () => {
    const url = prompt('Introduce la URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
};

window.seleccionarColor = (colorNombre) => {
    document.querySelectorAll('.color-opcion').forEach(el => {
        el.classList.remove('seleccionado');
        if (el.dataset.color === colorNombre) el.classList.add('seleccionado');
    });
};

window.guardarEdicion = (tareaId) => {
    const titulo = document.getElementById('modal-titulo')?.value.trim();
    const fecha = document.getElementById('modal-fecha')?.value;
    const horaInicio = document.getElementById('modal-hora-inicio')?.value;
    const horaFin = document.getElementById('modal-hora-fin')?.value;
    const colorSeleccionado = document.querySelector('.color-opcion.seleccionado')?.dataset.color || 'verde';
    const notas = document.getElementById('editor-notas-tarea')?.innerHTML || '';

    if (!titulo || !fecha) return;

    Store.actualizarTarea(tareaId, {
        titulo,
        fecha,
        horaInicio,
        horaFin,
        color: colorSeleccionado,
        notas: notas
    });
    cerrarModal();
    renderizarVista();
};

window.eliminarTareaModal = (tareaId) => {
    if (confirm('¿Eliminar tarea?')) {
        Store.eliminarTarea(tareaId);
        cerrarModal();
        renderizarVista();
    }
};

function cerrarModal() {
    const modal = document.getElementById('modal-edicion');
    if (modal) modal.remove();
}

window.activarInputRegistro = (btn, fechaIso) => {
    const parent = btn.parentNode;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-tarea-figma';
    input.placeholder = tipoVista === 'mes' ? '+' : 'Escribe y enter...';

    btn.style.display = 'none';
    parent.appendChild(input);
    input.focus();

    let yaGuardado = false;
    const guardar = () => {
        if (yaGuardado) return;
        const titulo = input.value.trim();
        if (titulo) {
            yaGuardado = true;
            Store.agregarTarea({ titulo, fecha: fechaIso, horaInicio: "12:00", horaFin: "13:00", color: "verde", completada: false });
            renderizarVista();
        } else {
            input.remove();
            btn.style.display = tipoVista === 'mes' ? 'block' : 'flex';
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); guardar(); }
        else if (e.key === 'Escape') { yaGuardado = true; input.remove(); btn.style.display = tipoVista === 'mes' ? 'block' : 'flex'; }
    });

    input.addEventListener('blur', () => { setTimeout(() => { if (!yaGuardado) guardar(); }, 100); });
};
