/* detalle-proyecto.js */

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        window.location.href = 'proyectos.html';
        return;
    }

    inicializarTabs();
    cargarDatosProyecto(projectId);
    Icons.init();
});

let currentProject = null;

function syncProyecto(changes) {
    const updated = Store.actualizarProyecto(currentProject.id, changes);
    if (updated) currentProject = updated;
}

function cargarDatosProyecto(id) {
    const proyectos = Store.state.proyectos;
    currentProject = proyectos.find(p => p.id == id);

    if (!currentProject) {
        UI.alert({
            titulo: 'Error',
            mensaje: 'Proyecto no encontrado'
        }).then(() => {
            window.location.href = 'proyectos.html';
        });
        return;
    }

    // Renderizar Header
    document.getElementById('proyecto-titulo').textContent = currentProject.titulo;
    document.getElementById('proyecto-color').style.backgroundColor = currentProject.color || '#1469FF';
    document.getElementById('proyecto-fecha').textContent = currentProject.objetivo || 'Sin fecha establecida';

    // Mostrar descripción
    const descEl = document.getElementById('proyecto-descripcion');
    if (descEl) {
        descEl.textContent = currentProject.descripcion || 'Sin descripción';
        descEl.style.color = currentProject.descripcion ? 'var(--color-texto-secundario)' : 'var(--color-texto-tenue)';
    }

    // Renderizar Progreso
    actualizarProgresoUI();

    // Renderizar Tareas
    renderizarTareas();

    // Cargar Notas
    const editor = document.getElementById('editor-contenido');
    editor.innerHTML = currentProject.notas || '';

    // Guardar cambios en el editor al escribir
    editor.addEventListener('input', () => {
        syncProyecto({ notas: editor.innerHTML });
    });
}

window.abrirEdicionProyecto = () => {
    // Comprobar si la función ya existe (el script ya se cargó)
    if (typeof window.abrirModalCreacion === 'function') {
        window.abrirModalCreacion(currentProject);
        return;
    }

    // Cargar el script de proyectos si no está cargado
    const script = document.createElement('script');
    script.src = '../assets/js/proyectos.js?v=6';
    script.onload = () => {
        // Al terminar de cargar, abrir el modal con los datos del proyecto actual
        if (typeof window.abrirModalCreacion === 'function') {
            window.abrirModalCreacion(currentProject);
        }

        // Sobreescribir renderizarProyectos para recargar la página de detalles tras guardar
        const originalGuardar = window.guardarProyecto;
        window.guardarProyecto = function (idExistente) {
            originalGuardar(idExistente);
            // Recargar la página actual para mostrar los datos actualizados
            setTimeout(() => {
                location.reload();
            }, 200);
        };
    };
    document.head.appendChild(script);
};

function inicializarTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.seccion-tab');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

function renderizarTareas() {
    const container = document.getElementById('lista-tareas');
    container.innerHTML = '';

    const tareas = currentProject.tareas || [];

    if (tareas.length === 0) {
        container.innerHTML = '<p style="color:var(--color-texto-tenue); text-align:center; padding: 20px;">No hay tareas aún.</p>';
        return;
    }

    tareas.forEach((t, index) => {
        const item = document.createElement('div');
        item.className = `tarea-item ${t.completada ? 'completed' : ''}`;

        item.innerHTML = `
            <div class="status-check">
                <i data-lucide="check" style="width:14px; height:14px;"></i>
            </div>
            <span class="texto-tarea">${t.texto}</span>
        `;

        item.addEventListener('click', () => {
            t.completada = !t.completada;
            syncProyecto({ tareas: currentProject.tareas });
            renderizarTareas();
            actualizarProgresoUI();
        });

        container.appendChild(item);
    });

    Icons.init();
}

function actualizarProgresoUI() {
    const tareas = currentProject.tareas || [];
    let progreso = 0;

    if (tareas.length > 0) {
        const completadas = tareas.filter(t => t.completada).length;
        progreso = Math.round((completadas / tareas.length) * 100);
    } else {
        progreso = currentProject.progreso || 0;
    }

    document.getElementById('progreso-texto').textContent = `${progreso}%`;
    document.getElementById('progreso-barra-fill').style.width = `${progreso}%`;

    syncProyecto({ progreso: progreso });
}

// === FUNCIONES DEL EDITOR RICO ===
window.formatear = (comando, valor = null) => {
    document.execCommand(comando, false, valor);
    document.getElementById('editor-contenido').focus();
};

window.crearEnlace = () => {
    const url = prompt('Introduce la URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
};

// Acción añadir tarea con input inline (estilo Figma/Semana)
document.getElementById('btn-añadir-tarea').addEventListener('click', () => {
    activarInputNuevaTarea();
});

function activarInputNuevaTarea() {
    const container = document.getElementById('lista-tareas');
    const btn = document.getElementById('btn-añadir-tarea');

    // Evitar duplicados
    if (document.getElementById('input-nueva-tarea-proyecto')) return;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'tarea-item input-wrapper-proyecto';
    inputWrapper.id = 'input-nueva-tarea-proyecto';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-tarea-proyecto';
    input.placeholder = 'Escribe la tarea y presiona Enter...';

    inputWrapper.appendChild(input);
    container.appendChild(inputWrapper);
    input.focus();

    let yaGuardado = false;
    const guardar = () => {
        if (yaGuardado) return;
        const texto = input.value.trim();
        if (texto) {
            yaGuardado = true;
            if (!currentProject.tareas) currentProject.tareas = [];
            currentProject.tareas.push({
                texto: texto,
                completada: false
            });
            syncProyecto({ tareas: currentProject.tareas });
            renderizarTareas();
            actualizarProgresoUI();
        } else {
            inputWrapper.remove();
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            guardar();
        } else if (e.key === 'Escape') {
            yaGuardado = true;
            inputWrapper.remove();
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => { if (!yaGuardado) guardar(); }, 100);
    });
}
