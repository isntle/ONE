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
            <div style="text-align:center; padding: 40px; color: var(--color-texto-tenue);">
                <i data-lucide="folder-open" style="width: 48px; height: 48px; margin-bottom: 10px; opacity:0.5;"></i>
                <p>No hay proyectos en este espacio.</p>
                <p style="font-size:0.9rem;">Crea uno nuevo para empezar.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    proyectos.forEach(p => {
        const article = document.createElement('article');
        article.className = 'tarjeta-proyecto';
        article.style.setProperty('--color-referencia', p.color || 'var(--color-acento)');

        // Convertir etiquetas string a array si es necesario
        const tags = p.etiquetas ? p.etiquetas.split(',').map(t => t.trim()) : [];
        const tagsHtml = tags.map(t => `<span class="etiqueta-proyecto">${t}</span>`).join('');

        article.innerHTML = `
            <div class="titulo-proyecto">${p.titulo}</div>
            <div class="detalle-proyecto">${p.descripcion || 'Sin descripción'}</div>
            <div class="etiquetas-container">
                ${tagsHtml}
            </div>
            <!-- Barra de progreso simulada -->
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 12px; overflow:hidden;">
                <div style="height: 100%; width: ${Math.random() * 80 + 10}%; background: var(--color-referencia, var(--color-acento));"></div>
            </div>
        `;

        // Click para editar (futuro sprint) o detalle
        article.addEventListener('click', () => {
            // alert('Detalle del proyecto (Próximamente)');
        });

        lista.appendChild(article);
    });

    contenedor.appendChild(lista);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === MODAL DE CREACIÓN ===
window.abrirModalCreacion = () => {
    // Si ya existe borralo
    const existente = document.getElementById('modal-proyecto');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-proyecto';
    overlay.onclick = (e) => {
        if (e.target === overlay) cerrarModal();
    };

    overlay.innerHTML = `
        <div class="modal-proyecto">
            <div class="modal-header">
                <h3>Nuevo Proyecto En ${Store.obtenerEspacioActual()}</h3>
                <button class="modal-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            
            <div class="modal-campo">
                <label>Nombre del proyecto</label>
                <input type="text" id="input-titulo" placeholder="Ej. Tesis, Portafolio..." autofocus>
            </div>
            
            <div class="modal-campo">
                <label>Descripción corta</label>
                <textarea id="input-desc" placeholder="Objetivo principal..."></textarea>
            </div>
            
            <div class="modal-campo">
                <label>Etiquetas (separadas por coma)</label>
                <input type="text" id="input-tags" placeholder="Urgente, Diseño, Dev">
            </div>

            <div class="modal-acciones">
                <button class="btn-cancelar" onclick="cerrarModal()">Cancelar</button>
                <button class="btn-crear" onclick="guardarProyecto()">Crear Proyecto</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('input-titulo').focus(), 100);
}

window.guardarProyecto = () => {
    const titulo = document.getElementById('input-titulo').value.trim();
    const desc = document.getElementById('input-desc').value.trim();
    const tags = document.getElementById('input-tags').value.trim();

    if (!titulo) {
        alert('Escribe un nombre para el proyecto');
        return;
    }

    Store.agregarProyecto({
        titulo: titulo,
        descripcion: desc,
        etiquetas: tags,
        color: '#8B5CF6' // Morado por defecto para proyectos
    });

    cerrarModal();
    renderizarProyectos();
}

window.cerrarModal = () => {
    const overlay = document.getElementById('modal-proyecto');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    }
}
