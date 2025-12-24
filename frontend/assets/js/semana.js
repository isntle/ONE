/*
 * semana.js
 * Lógica específica para la vista de Semana (Tweek Logic)
 */

// Estado local de la vista
let fechaInicioSemana = new Date(); // Se ajustará al lunes de la semana actual
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEM = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
    renderizarSemana();
    configurarEventos();

    // Escuchar cambios de espacio
    document.addEventListener('cambio-espacio', () => renderizarSemana());

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
});

function inicializarFechas() {
    // Ajustar al lunes de esta semana
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=Domingo, 1=Lunes
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    fechaInicioSemana = new Date(hoy.setDate(diff));
}

function configurarEventos() {
    document.getElementById('btn-prev-semana')?.addEventListener('click', () => cambiarSemana(-7));
    document.getElementById('btn-next-semana')?.addEventListener('click', () => cambiarSemana(7));
}

window.hoy = () => {
    inicializarFechas();
    renderizarSemana();
}

function cambiarSemana(dias) {
    fechaInicioSemana.setDate(fechaInicioSemana.getDate() + dias);
    renderizarSemana();
}

function renderizarSemana() {
    const rejilla = document.querySelector('.rejilla-semana');
    const tituloSemana = document.querySelector('.cabecera-vista h1');
    if (!rejilla) return;

    rejilla.innerHTML = '';

    // Actualizar título (ej. "Noviembre 2023")
    const mesActual = MESES[fechaInicioSemana.getMonth()];
    const anioActual = fechaInicioSemana.getFullYear();
    if (tituloSemana) tituloSemana.textContent = `${mesActual} ${anioActual}`;

    const tareas = Store.obtenerTareas();

    // Iterar 7 días desde el lunes
    for (let i = 0; i < 7; i++) {
        const fechaDia = new Date(fechaInicioSemana);
        fechaDia.setDate(fechaInicioSemana.getDate() + i);

        const fechaIso = fechaDia.toISOString().split('T')[0]; // YYYY-MM-DD
        const nombreDia = DIAS_SEM[fechaDia.getDay()]; // Lunes, Martes...
        const numeroDia = fechaDia.getDate();

        // Filtrar tareas por fecha exacta
        const tareasDia = tareas.filter(t => t.fecha === fechaIso);
        tareasDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

        const article = document.createElement('article');
        article.className = 'columna-dia';

        // Marcar hoy
        const hoyIso = new Date().toISOString().split('T')[0];
        if (fechaIso === hoyIso) article.classList.add('es-hoy');

        let htmlTareas = '<ul class="lista-tareas-dia">';
        tareasDia.forEach(t => {
            let claseColor = t.color ? `color-${t.color}` : '';
            // Fallback de color por espacio si no tiene
            if (!claseColor) {
                if (t.espacio === 'Escuela') claseColor = 'horario-escuela';
                else if (t.espacio === 'Trabajo') claseColor = 'horario-trabajo';
                else claseColor = 'horario-personal';
            }

            htmlTareas += `
                <li class="bloque ${claseColor}" onclick="abrirModalEdicion(${t.id})">
                    <div class="titulo-bloque">${t.titulo}</div>
                    <span>${t.horaInicio || ''} ${t.horaFin ? '– ' + t.horaFin : ''}</span>
                </li>
            `;
        });
        htmlTareas += '</ul>';

        article.innerHTML = `
            <header>
                <span class="nombre-dia">${nombreDia}</span>
                <span class="fecha-dia">${numeroDia}</span>
            </header>
            ${htmlTareas}
            <button class="boton-agregar-tarea" onclick="activarInputRegistro(this, '${fechaIso}')">
                <i data-lucide="plus" style="width:14px; height:14px;"></i> Agregar
            </button>
        `;

        rejilla.appendChild(article);
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// === MODAL DE EDICIÓN ===
window.abrirModalEdicion = (tareaId) => {
    const tarea = Store.state.tareas.find(t => t.id === tareaId);
    if (!tarea) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-edicion';
    overlay.onclick = (e) => {
        if (e.target === overlay) cerrarModal();
    };

    const colorActual = tarea.color || 'verde';

    overlay.innerHTML = `
        <div class="modal-tarea">
            <div class="modal-header">
                <h3>Editar tarea</h3>
                <button class="modal-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            
            <div class="modal-campo">
                <label>Título</label>
                <input type="text" id="modal-titulo" value="${tarea.titulo}" />
            </div>

            <!-- Mostrar fecha para debug/edición -->
            <div class="modal-campo">
                <label>Fecha</label>
                <input type="date" id="modal-fecha" value="${tarea.fecha}" />
            </div>
            
            <div class="modal-campo" style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label>Hora inicio</label>
                    <input type="time" id="modal-hora-inicio" value="${tarea.horaInicio}" />
                </div>
                <div style="flex: 1;">
                    <label>Hora fin</label>
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
            
            <div class="modal-acciones">
                <button class="btn-eliminar" onclick="eliminarTareaModal(${tarea.id})">
                    Eliminar
                </button>
                <button class="btn-guardar" onclick="guardarEdicion(${tarea.id})">
                    Guardar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('modal-titulo')?.focus(), 100);
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

    if (!titulo || !fecha) {
        alert('Título y fecha son requeridos');
        return;
    }

    Store.actualizarTarea(tareaId, {
        titulo, fecha, horaInicio, horaFin, color: colorSeleccionado
    });

    cerrarModal();
    renderizarSemana();
};

window.eliminarTareaModal = (tareaId) => {
    if (confirm('¿Eliminar tarea?')) {
        Store.eliminarTarea(tareaId);
        cerrarModal();
        renderizarSemana();
    }
};

function cerrarModal() {
    const modal = document.getElementById('modal-edicion');
    if (modal) modal.remove();
}

// === AGREGAR TAREA (Click-to-Type) ===
window.activarInputRegistro = (btn, fechaIso) => {
    const parent = btn.parentNode;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-tarea-figma';
    input.placeholder = 'Escribe y enter...';

    btn.style.display = 'none';
    parent.appendChild(input);
    input.focus();

    let yaGuardado = false;

    const guardar = () => {
        if (yaGuardado) return;

        const titulo = input.value.trim();
        if (titulo) {
            yaGuardado = true;
            Store.agregarTarea({
                titulo,
                descripcion: "",
                fecha: fechaIso, // Fecha correcta
                horaInicio: "12:00",
                horaFin: "13:00",
                color: "verde"
            });
            renderizarSemana();
        } else {
            input.remove();
            btn.style.display = 'flex';
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            guardar();
        } else if (e.key === 'Escape') {
            yaGuardado = true;
            input.remove();
            btn.style.display = 'flex';
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => { if (!yaGuardado) guardar(); }, 100);
    });
};
