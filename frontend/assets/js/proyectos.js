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
        if (typeof lucide !== 'undefined') Icons.init();
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
            <div class="titulo-proyecto">${p.titulo || 'Sin título'}</div>
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

window.guardarProyecto = (idExistente) => {
    const titulo = document.getElementById('input-titulo').value.trim();
    const desc = document.getElementById('input-desc').value.trim();
    const tags = document.getElementById('input-tags').value.trim();

    if (!titulo) {
        alert('Escribe un nombre para el proyecto');
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
            color: '#8B5CF6',
            progreso: 0
        });
    }

    cerrarModal();
    renderizarProyectos();
}

window.borrarProyecto = (id) => {
    if (confirm('¿Eliminar proyecto?')) {
        Store.state.proyectos = Store.state.proyectos.filter(p => p.id != id);
        Store.guardarEstado();
        cerrarModal();
        renderizarProyectos();
    }
}

window.cerrarModal = () => {
    const overlay = document.getElementById('modal-proyecto');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    }
}
