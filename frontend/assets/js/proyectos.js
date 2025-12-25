/*
 * proyectos.js
 * Lógica para la vista de Proyectos (Grid y Modal)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar cambios de espacio (ya que app.js maneja la UI global)
    document.addEventListener('cambio-espacio', () => {
        renderizarProyectos();
        actualizarTitulo();
    });

    // Acción botón "Nuevo Proyecto"
    const btnNuevo = document.querySelector('.boton-primario');
    if (btnNuevo) {
        // Clonar para eliminar eventos viejos si los hubiera
        const nuevoBtn = btnNuevo.cloneNode(true);
        btnNuevo.parentNode.replaceChild(nuevoBtn, btnNuevo);
        nuevoBtn.addEventListener('click', abrirModalCreacion);
    }

    renderizarProyectos();
    actualizarTitulo();
});

function actualizarTitulo() {
    const titulo = document.querySelector('.titulo-principal');
    if (titulo) {
        titulo.textContent = `Proyectos de ${Store.obtenerEspacioActual()}`;
    }
}

function renderizarProyectos() {
    const contenedor = document.querySelector('.contenedor-proyectos');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const proyectos = Store.obtenerProyectos();

    // Crear contenedor grid
    const lista = document.createElement('div');
    lista.className = 'lista-proyectos';

    // Tarjeta "Nuevo Proyecto" (Inline opcional, o solo botón flotante?)
    // Por ahora usamos el botón principal del header, aquí van las cards.

    if (proyectos.length === 0) {
        contenedor.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; min-height:400px; text-align:center; color: var(--color-texto-tenue);">
                <div>
                    <i data-lucide="folder-open" style="width: 48px; height: 48px; margin-bottom: 10px; opacity:0.5;"></i>
                    <p style="margin:10px 0;">No hay proyectos en este espacio.</p>
                    <p style="font-size:0.9rem; opacity:0.7;">Crea uno nuevo para empezar.</p>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    proyectos.forEach(p => {
        // Defensivo: asegurarse de que el proyecto tenga las propiedades básicas
        if (!p || !p.titulo) {
            console.warn('Proyecto inválido detectado:', p);
            return;
        }

        const article = document.createElement('article');
        article.className = 'tarjeta-proyecto';
        article.style.setProperty('--color-referencia', p.color || '#8B5CF6');

        // Convertir etiquetas string a array si es necesario
        const tags = p.etiquetas ? String(p.etiquetas).split(',').map(t => t.trim()).filter(t => t) : [];
        const tagsHtml = tags.length > 0 ? tags.map(t => `<span class="etiqueta-proyecto">${t}</span>`).join('') : '';

        article.innerHTML = `
            <div class="proyecto-header-wrapper">
                <div class="titulo-proyecto">${p.titulo || 'Sin título'}</div>
                <button class="btn-eliminar-proyecto" onclick="event.stopPropagation(); confirmarEliminarProyecto(${p.id})" title="Eliminar proyecto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
            </div>
            <div class="detalle-proyecto">${p.descripcion || 'Sin descripción'}</div>
            <div class="etiquetas-container">
                ${tagsHtml}
            </div>
            <!-- Barra de progreso -->
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 12px; overflow:hidden;">
                <div style="height: 100%; width: ${p.progreso || 0}%; background: var(--color-referencia, var(--color-acento));"></div>
            </div>
        `;

        // Click para ver detalle
        article.addEventListener('click', () => {
            window.location.href = `detalle-proyecto.html?id=${p.id}`;
        });

        lista.appendChild(article);
    });

    contenedor.appendChild(lista);

    if (typeof lucide !== 'undefined') Icons.init();
}

// === MODAL DE CREACIÓN / EDICIÓN ===
window.abrirModalCreacion = (proyectoEditar = null) => {
    // Si ya existe borralo
    const existente = document.getElementById('modal-proyecto');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-proyecto';
    overlay.onclick = (e) => {
        if (e.target === overlay) cerrarModal();
    };

    // Debug log para ver qué estamos recibiendo
    console.log('Modal con proyecto:', proyectoEditar);

    const tituloModal = proyectoEditar ? 'Editar Proyecto' : `Nuevo Proyecto En ${Store.obtenerEspacioActual()}`;
    const valTitulo = (proyectoEditar && proyectoEditar.titulo) ? proyectoEditar.titulo : '';
    const valDesc = (proyectoEditar && proyectoEditar.descripcion) ? proyectoEditar.descripcion : '';
    const valTags = (proyectoEditar && proyectoEditar.etiquetas) ? proyectoEditar.etiquetas : '';
    const idProyecto = (proyectoEditar && proyectoEditar.id) ? proyectoEditar.id : '';
    // Color por defecto o el del proyecto
    let colorSeleccionado = (proyectoEditar && proyectoEditar.color) ? proyectoEditar.color : '#8B5CF6';
    // Fecha objetivo (formato ISO para input type="date")
    const valFecha = (proyectoEditar && proyectoEditar.objetivo) ? proyectoEditar.objetivo : '';

    const colores = ['#8B5CF6', '#1469FF', '#429155', '#FFBE3D', '#EF4444', '#EC4899'];

    overlay.innerHTML = `
        <div class="modal-proyecto">
            <div class="modal-header">
                <h3>${tituloModal}</h3>
                <button class="modal-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            
            <div class="modal-campo">
                <label>Nombre del proyecto</label>
                <input type="text" id="input-titulo" placeholder="Ej. Tesis, Portafolio..." value="${valTitulo}" autofocus>
            </div>
            
            <div class="modal-campo">
                <label>Descripción corta</label>
                <textarea id="input-desc" placeholder="Objetivo principal...">${valDesc}</textarea>
            </div>

            <div class="modal-campo">
                <label>Color</label>
                <div class="color-picker" id="color-picker-container">
                    ${colores.map(c => `
                        <div class="color-option ${c === colorSeleccionado ? 'seleccionado' : ''}" 
                             style="background-color: ${c}" 
                             onclick="seleccionarColor(this, '${c}')">
                        </div>
                    `).join('')}
                </div>
                <input type="hidden" id="input-color" value="${colorSeleccionado}">
            </div>

            <div class="modal-campo">
                <label>Fecha objetivo</label>
                <input type="date" id="input-fecha" value="${valFecha}">
            </div>
            
            <div class="modal-campo">
                <label>Etiquetas (separadas por coma)</label>
                <input type="text" id="input-tags" placeholder="Urgente, Diseño, Dev" value="${valTags}">
            </div>

            <div class="modal-acciones">
                ${proyectoEditar ? `<button class="btn-cancelar" style="color:#EF4444; margin-right:auto;" onclick="borrarProyecto(${idProyecto})">Eliminar</button>` : ''}
                <button class="btn-cancelar" onclick="cerrarModal()">Cancelar</button>
                <button class="btn-crear" onclick="guardarProyecto(${idProyecto})">${proyectoEditar ? 'Guardar Cambios' : 'Crear Proyecto'}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('input-titulo').focus(), 100);
}

window.seleccionarColor = (elemento, color) => {
    document.getElementById('input-color').value = color;
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('seleccionado'));
    elemento.classList.add('seleccionado');
};

window.guardarProyecto = (idExistente) => {
    const titulo = document.getElementById('input-titulo').value.trim();
    const desc = document.getElementById('input-desc').value.trim();
    const tags = document.getElementById('input-tags').value.trim();
    const color = document.getElementById('input-color').value;
    const fecha = document.getElementById('input-fecha').value;

    if (!titulo) {
        UI.toast('Escribe un nombre para el proyecto', 'error');
        return;
    }

    // Si idExistente es un número o string válido, editar. Si no, crear.
    if (idExistente && idExistente !== '' && idExistente !== 'undefined') {
        // Editar
        console.log('Editando proyecto con ID:', idExistente);
        const proyectos = Store.state.proyectos;
        const index = proyectos.findIndex(p => p.id == idExistente);
        if (index !== -1) {
            proyectos[index].titulo = titulo;
            proyectos[index].descripcion = desc;
            proyectos[index].color = color;
            proyectos[index].objetivo = fecha;
            proyectos[index].etiquetas = tags;
            Store.guardarEstado();
        }
    } else {
        // Crear
        console.log('Creando nuevo proyecto');
        Store.agregarProyecto({
            titulo: titulo,
            descripcion: desc,
            etiquetas: tags,
            color: color || '#8B5CF6',
            objetivo: fecha,
            progreso: 0
        });
    }

    cerrarModal();
    renderizarProyectos();
}

window.borrarProyecto = async (id) => {
    // Buscar nombre si es posible
    const p = Store.state.proyectos.find(x => x.id == id);
    const titulo = p ? p.titulo : 'el proyecto';

    const confirmado = await UI.confirm({
        titulo: 'Eliminar Proyecto',
        mensaje: `¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`,
        textoConfirmar: 'Eliminar',
        textoCancelar: 'Conservar'
    });

    if (confirmado) {
        Store.state.proyectos = Store.state.proyectos.filter(p => p.id != id);
        Store.guardarEstado();
        cerrarModal(); // Si se llamó desde el modal
        renderizarProyectos();
    }
}

// Alias para el botón de la tarjeta
window.confirmarEliminarProyecto = window.borrarProyecto;

window.cerrarModal = () => {
    const overlay = document.getElementById('modal-proyecto');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    }
}
