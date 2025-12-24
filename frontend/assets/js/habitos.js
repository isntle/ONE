/*
 * habitos.js
 * Lógica para la gestión de hábitos (GitHub Style + Contexto)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar cambios de espacio (si decidimos filtrar hábitos por espacio)
    renderizarHabitos();
});

function renderizarHabitos() {
    const contenedor = document.querySelector('.cuadro-habitos');
    const habitos = Store.obtenerHabitos(); // Por ahora globales
    if (!contenedor || !habitos) return;

    // Limpiar contenedor pero manteniendo el header si se desea,
    // o reconstruirlo todo. Vamos a reconstruir filas debajo del header.
    // Asumimos que el HTML tiene un header fijo que no borramos?
    // Mejor borramos todo menos el header estático si existe, o usamos un div contenedor de filas.
    // Para simplificar, limpiamos y re-agregamos.

    // Generar fechas de los últimos 7 días (incluyendo hoy)
    const fechasMostradas = [];
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() - i);
        fechasMostradas.push({
            iso: d.toISOString().split('T')[0],
            dia: d.toLocaleDateString('es-ES', { weekday: 'narrow' }), // L, M, X...
            num: d.getDate()
        });
    }

    // Limpiar filas viejas (mantenemos el header de la tabla si existe en HTML, o lo generamos)
    // Vamos a buscar si existe un contenedor de filas, si no lo creamos.
    let contenedorFilas = contenedor.querySelector('.contenedor-filas');
    if (!contenedorFilas) {
        // Si no existe estructura, la creamos (primera vez o borrado total)
        contenedor.innerHTML = '';

        // Header de fechas
        const header = document.createElement('header');
        header.innerHTML = `
            <span>Hábito</span>
            <div class="encabezado-dias">
                ${fechasMostradas.map(f => `<span style="width:28px; text-align:center;">${f.dia}</span>`).join('')}
            </div>
        `;
        contenedor.appendChild(header);

        contenedorFilas = document.createElement('div');
        contenedorFilas.className = 'contenedor-filas';
        contenedor.appendChild(contenedorFilas);
    } else {
        contenedorFilas.innerHTML = '';
    }

    habitos.forEach(habito => {
        const fila = document.createElement('div');
        fila.className = 'fila-habito';

        // Nombre
        const divNombre = document.createElement('div');
        divNombre.className = 'nombre-habito';
        divNombre.textContent = habito.nombre;
        fila.appendChild(divNombre);

        // Marcas (Grid)
        const divMarcas = document.createElement('div');
        divMarcas.className = 'marcas-habito';

        fechasMostradas.forEach(fecha => {
            const registro = habito.registros ? habito.registros[fecha.iso] : null;
            const completado = registro && registro.completado;
            const tieneNota = registro && registro.nota;

            const marcaContenedor = document.createElement('div');
            marcaContenedor.className = 'marca-contenedor';

            const spanMarca = document.createElement('span');
            spanMarca.className = `marca ${completado ? 'llena' : ''} ${tieneNota ? 'con-nota' : ''}`;
            spanMarca.title = registro ? registro.nota : fecha.iso;

            // Click abre modal contexto
            spanMarca.onclick = () => {
                abrirModalContexto(habito, fecha.iso);
            };

            marcaContenedor.appendChild(spanMarca);
            divMarcas.appendChild(marcaContenedor);
        });

        fila.appendChild(divMarcas);
        contenedorFilas.appendChild(fila);
    });
}

window.abrirModalContexto = (habito, fechaIso) => {
    // Verificar estado actual
    const registro = habito.registros ? habito.registros[fechaIso] : null;
    const completado = registro && registro.completado;

    // Si ya está completado, al hacer click podríamos querer:
    // 1. Desmarcar (borrar)
    // 2. Editar nota
    // Vamos a mostrar un modal pequeño

    // Eliminar modal anterior
    const existente = document.getElementById('modal-contexto');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-contexto';
    overlay.onclick = (e) => {
        if (e.target === overlay) cerrarModalContexto();
    };

    const notaActual = registro ? registro.nota : '';

    const textoAccion = completado ? 'Actualizar detalles' : 'Completar hábito';
    const textoBoton = completado ? 'Guardar Cambios' : 'Marcar Completado';

    overlay.innerHTML = `
        <div class="modal-contexto-habito" onclick="event.stopPropagation()">
            <div class="modal-contexto-header">
                ${habito.nombre} <span style="font-weight:400; color:#888;">(${fechaIso})</span>
            </div>
            
            <input type="text" id="input-contexto" 
                   class="input-contexto" 
                   value="${notaActual}" 
                   placeholder="Añade contexto (ej. pág 20, 30 mins)..." 
                   autofocus>
                   
            <div style="display:flex; gap:8px;">
                ${completado ? `<button onclick="borrarRegistro(${habito.id}, '${fechaIso}')" style="background:#EF4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">Desmarcar</button>` : ''}
                <button class="btn-guardar-contexto" onclick="guardarContexto(${habito.id}, '${fechaIso}')">
                    ${textoBoton}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('input-contexto')?.focus(), 100);
};

window.guardarContexto = (idHabito, fechaIso) => {
    const nota = document.getElementById('input-contexto').value.trim();
    Store.toggleHabitoDia(idHabito, fechaIso, nota);
    cerrarModalContexto();
    renderizarHabitos();
};

window.borrarRegistro = (idHabito, fechaIso) => {
    if (confirm('¿Desmarcar este día?')) {
        // Enviar nota vacía y forzar lógica de toggle off si estaba on
        // Pero toggleHabitoDia espera un toggle.
        // Si está ON y mando vacía -> se borra (según lógica store.js updateada)
        // Store.toggleHabitoDia hace: si existe y completado y !nota -> delete.
        Store.toggleHabitoDia(idHabito, fechaIso, "");
        cerrarModalContexto();
        renderizarHabitos();
    }
}

window.cerrarModalContexto = () => {
    const m = document.getElementById('modal-contexto');
    if (m) m.remove();
};
