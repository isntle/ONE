/*
 * habitos.js
 * Lógica para la gestión de hábitos (GitHub Style + Contexto)
 */

// Estado de navegación
let fechaFocoHabitos = new Date();

document.addEventListener('DOMContentLoaded', () => {
    renderizarHabitos();
});

window.cambiarSemana = (dias) => {
    fechaFocoHabitos.setDate(fechaFocoHabitos.getDate() + dias);
    renderizarHabitos();
};

window.irHoy = () => {
    fechaFocoHabitos = new Date();
    renderizarHabitos();
};

function inicioDeSemanaLunes(fecha) {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    const idxLunes = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - idxLunes);
    return d;
}

function renderizarHabitos() {
    const contenedor = document.querySelector('.cuadro-habitos');
    const habitos = Store.obtenerHabitos();
    if (!contenedor || !habitos) return;

    const inicioSemana = inicioDeSemanaLunes(fechaFocoHabitos);
    const fechasMostradas = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const d = new Date(inicioSemana);
        d.setDate(inicioSemana.getDate() + i);
        const esHoy = d.getTime() === hoy.getTime();
        fechasMostradas.push({
            iso: Store.fechaIsoLocal(d),
            dia: d.toLocaleDateString('es-ES', { weekday: 'narrow' }),
            num: d.getDate(),
            esHoy: esHoy
        });
    }

    // 1. Navegación (FUERA del cuadro, arriba de los días)
    let navSuperior = document.querySelector('.navegacion-superior-habitos');
    if (!navSuperior) {
        navSuperior = document.createElement('div');
        navSuperior.className = 'navegacion-superior-habitos';
        contenedor.parentNode.insertBefore(navSuperior, contenedor);
    }
    navSuperior.innerHTML = `
        <div class="nav-grid-wrapper">
            <button class="btn-nav-grid" onclick="cambiarSemana(-7)">◀</button>
            <button class="btn-nav-grid" onclick="irHoy()">Hoy</button>
            <button class="btn-nav-grid" onclick="cambiarSemana(7)">▶</button>
        </div>
    `;

    let contenedorFilas = contenedor.querySelector('.contenedor-filas');
    if (!contenedorFilas) {
        contenedor.innerHTML = '';

        const header = document.createElement('header');
        header.innerHTML = `
            <div class="habito-header-nombre">
                <span>Hábito</span>
                <button class="btn-nuevo-habito-mini" onclick="activarInputNuevoHabito()" title="Nuevo hábito">+</button>
            </div>
            <div class="encabezado-dias">
                ${fechasMostradas.map(f => `
                    <span class="dia-header ${f.esHoy ? 'dia-hoy' : ''}" style="width:28px; text-align:center; display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:0.7rem; color: ${f.esHoy ? 'var(--color-acento)' : 'var(--color-texto-secundario)'};">${f.dia}</span>
                        <span style="font-size:0.8rem; font-weight:${f.esHoy ? '700' : '400'}; color: ${f.esHoy ? 'var(--color-acento)' : 'var(--color-texto-blanco)'};">${f.num}</span>
                    </span>
                `).join('')}
            </div>
        `;
        contenedor.appendChild(header);

        contenedorFilas = document.createElement('div');
        contenedorFilas.className = 'contenedor-filas';
        contenedor.appendChild(contenedorFilas);
    } else {
        const header = contenedor.querySelector('header');
        if (header) {
            header.innerHTML = `
                <div class="habito-header-nombre">
                    <span>Hábito</span>
                    <button class="btn-nuevo-habito-mini" onclick="activarInputNuevoHabito()" title="Nuevo hábito">+</button>
                </div>
                <div class="encabezado-dias">
                    ${fechasMostradas.map(f => `
                        <span class="dia-header ${f.esHoy ? 'dia-hoy' : ''}" style="width:28px; text-align:center; display:flex; flex-direction:column; align-items:center;">
                            <span style="font-size:0.7rem; color: ${f.esHoy ? 'var(--color-acento)' : 'var(--color-texto-secundario)'};">${f.dia}</span>
                            <span style="font-size:0.8rem; font-weight:${f.esHoy ? '700' : '400'}; color: ${f.esHoy ? 'var(--color-acento)' : 'var(--color-texto-blanco)'};">${f.num}</span>
                        </span>
                    `).join('')}
                </div>
            `;
        }
        contenedorFilas.innerHTML = '';
    }

    habitos.forEach(habito => {
        const fila = document.createElement('div');
        fila.className = 'fila-habito';

        const divNombre = document.createElement('div');
        divNombre.className = 'nombre-habito-container';
        divNombre.innerHTML = `
            <span class="nombre-texto">${habito.nombre}</span>
            <button class="btn-eliminar-habito" onclick="confirmarEliminarHabito('${habito.id}')" title="Eliminar hábito">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
        `;
        fila.appendChild(divNombre);

        const divMarcas = document.createElement('div');
        divMarcas.className = 'marcas-habito';

        fechasMostradas.forEach(fecha => {
            const registro = habito.registros ? habito.registros[fecha.iso] : null;
            const completado = registro && registro.completado;

            const marcaContenedor = document.createElement('div');
            marcaContenedor.className = 'marca-contenedor';

            const spanMarca = document.createElement('span');
            spanMarca.className = `marca ${completado ? 'llena' : ''}`;
            spanMarca.title = fecha.iso;

            spanMarca.onclick = () => {
                Store.toggleHabitoDia(habito.id, fecha.iso, '');
                renderizarHabitos();
            };

            marcaContenedor.appendChild(spanMarca);
            divMarcas.appendChild(marcaContenedor);
        });

        fila.appendChild(divMarcas);
        contenedorFilas.appendChild(fila);
    });

    actualizarResumenHabitos(habitos, fechasMostradas);
}

window.confirmarEliminarHabito = async (id) => {
    const listado = Store.obtenerHabitos();
    const habito = listado.find(h => String(h.id) === String(id));
    const nombre = habito ? habito.nombre : 'este hábito';

    const confirmado = await UI.confirm({
        titulo: 'Eliminar Hábito',
        mensaje: `¿Estás seguro de que quieres eliminar "${nombre}" y todo su historial?`,
        textoConfirmar: 'Eliminar',
        textoCancelar: 'Cancelar'
    });

    if (confirmado) {
        Store.eliminarHabito(id);
        renderizarHabitos();
    }
};

// Botón "Nuevo hábito" inline se maneja vía onclick en el icono "+"


function activarInputNuevoHabito() {
    const contenedorFilas = document.querySelector('.contenedor-filas');
    if (!contenedorFilas) return;

    if (document.getElementById('input-nuevo-habito')) return;

    const fila = document.createElement('div');
    fila.className = 'fila-habito input-wrapper-habito';
    fila.id = 'input-nuevo-habito';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-habito';
    input.placeholder = 'Nombre del hábito (Enter para guardar)...';

    fila.appendChild(input);
    contenedorFilas.insertBefore(fila, contenedorFilas.firstChild);
    input.focus();

    let yaGuardado = false;
    const guardar = () => {
        if (yaGuardado) return;
        const nombre = input.value.trim();
        if (nombre) {
            yaGuardado = true;
            Store.agregarHabito({ nombre });
            renderizarHabitos();
        } else {
            fila.remove();
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            guardar();
        } else if (e.key === 'Escape') {
            yaGuardado = true;
            fila.remove();
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => { if (!yaGuardado) guardar(); }, 100);
    });
}

function actualizarResumenHabitos(habitos, fechasMostradas) {
    const rachaEl = document.getElementById('racha-valor');
    const activosEl = document.getElementById('habitos-activos-valor');
    const perfectosEl = document.getElementById('dias-perfectos-valor');

    const totalHabitos = habitos.length;
    const racha = calcularRacha(habitos);
    const diasPerfectos = calcularDiasPerfectos(habitos, fechasMostradas);

    if (rachaEl) rachaEl.textContent = `${racha} día${racha === 1 ? '' : 's'}`;
    if (activosEl) activosEl.textContent = `${totalHabitos}`;
    if (perfectosEl) perfectosEl.textContent = `${diasPerfectos}`;
}

function calcularRacha(habitos) {
    if (!habitos || habitos.length === 0) return 0;

    const fechasConHabitos = new Set();
    habitos.forEach(habito => {
        const registros = habito.registros || {};
        Object.keys(registros).forEach(fechaIso => {
            if (registros[fechaIso] && registros[fechaIso].completado) {
                fechasConHabitos.add(fechaIso);
            }
        });
    });

    if (fechasConHabitos.size === 0) return 0;

    let racha = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (true) {
        const iso = Store.fechaIsoLocal(cursor);
        if (!fechasConHabitos.has(iso)) break;
        racha += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return racha;
}

function calcularDiasPerfectos(habitos, fechasMostradas) {
    if (!habitos || habitos.length === 0) return 0;
    if (!fechasMostradas || fechasMostradas.length === 0) return 0;

    let perfectos = 0;
    fechasMostradas.forEach(fecha => {
        const completo = habitos.every(h => {
            const registro = h.registros ? h.registros[fecha.iso] : null;
            return registro && registro.completado;
        });
        if (completo) perfectos += 1;
    });

    return perfectos;
}
