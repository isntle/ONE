/*
 * habitos.js
 * Lógica para la gestión de hábitos (GitHub Style + Contexto)
 */

// Estado de navegación
let fechaFocoHabitos = new Date();

document.addEventListener('DOMContentLoaded', () => {
    renderizarHabitos();
    configurarNavegacionSemana();
});

function configurarNavegacionSemana() {
    const cabecera = document.querySelector('.titulo-y-nav-habitos');
    if (!cabecera) return;

    const existeNav = document.querySelector('.navegacion-semana-habitos');
    if (existeNav) return;

    const navDiv = document.createElement('div');
    navDiv.className = 'navegacion-semana-habitos';
    navDiv.innerHTML = `
        <button class="btn-nav-mini" id="btn-prev-semana-habitos">◀</button>
        <button class="btn-nav-mini" id="btn-hoy-habitos">Hoy</button>
        <button class="btn-nav-mini" id="btn-next-semana-habitos">▶</button>
    `;

    cabecera.appendChild(navDiv);

    document.getElementById('btn-prev-semana-habitos').addEventListener('click', () => {
        fechaFocoHabitos.setDate(fechaFocoHabitos.getDate() - 7);
        renderizarHabitos();
    });

    document.getElementById('btn-next-semana-habitos').addEventListener('click', () => {
        fechaFocoHabitos.setDate(fechaFocoHabitos.getDate() + 7);
        renderizarHabitos();
    });

    document.getElementById('btn-hoy-habitos').addEventListener('click', () => {
        fechaFocoHabitos = new Date();
        renderizarHabitos();
    });
}

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
        divNombre.className = 'nombre-habito';
        divNombre.textContent = habito.nombre;
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
}

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
