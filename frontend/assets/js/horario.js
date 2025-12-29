/*
 * horario.js
 * Lógica para la vista de Horario de Clases
 */

const DIAS_SEMANA = [
    { valor: 0, nombre: 'Lunes' },
    { valor: 1, nombre: 'Martes' },
    { valor: 2, nombre: 'Miércoles' },
    { valor: 3, nombre: 'Jueves' },
    { valor: 4, nombre: 'Viernes' }
];

const COLORES_CLASE = [
    { nombre: 'Verde', valor: '#429155' },
    { nombre: 'Azul', valor: '#3B82F6' },
    { nombre: 'Morado', valor: '#8B5CF6' },
    { nombre: 'Amarillo', valor: '#F59E0B' },
    { nombre: 'Rojo', valor: '#EF4444' },
    { nombre: 'Rosa', valor: '#EC4899' }
];

const HORA_INICIO = 7;
const HORA_FIN = 21;
const ALTURA_HORA = 56;

document.addEventListener('DOMContentLoaded', () => {
    configurarBotonModal();
    renderizarHorario();
    actualizarEstadoEnVivo();

    document.addEventListener('cambio-espacio', () => {
        renderizarHorario();
        actualizarEstadoEnVivo();
    });

    setInterval(() => {
        actualizarEstadoEnVivo();
    }, 60000);
});

function configurarBotonModal() {
    const btnNuevaClase = document.getElementById('btn-nueva-clase');
    btnNuevaClase?.addEventListener('click', () => {
        abrirModalClase();
    });
}

function abrirModalClase() {
    const existente = document.getElementById('modal-clase');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-clase';
    overlay.onclick = (e) => {
        if (e.target === overlay) cerrarModalClase();
    };

    const diaActual = obtenerDiaActual();
    const colorDefault = COLORES_CLASE[0].valor;

    overlay.innerHTML = `
        <div class="modal-clase">
            <div class="modal-header">
                <h3>Nueva clase</h3>
                <button class="modal-cerrar" onclick="cerrarModalClase()">&times;</button>
            </div>

            <div class="modal-campo">
                <label>Materia</label>
                <input type="text" id="input-materia-clase" placeholder="Ej. Matemáticas" autofocus>
            </div>

            <div class="modal-campo">
                <label>Día de la semana</label>
                <select id="input-dia-clase">
                    ${DIAS_SEMANA.map(dia => `
                        <option value="${dia.valor}" ${dia.valor === diaActual ? 'selected' : ''}>${dia.nombre}</option>
                    `).join('')}
                </select>
            </div>

            <div class="modal-campo">
                <label>Horario</label>
                <div style="display:flex; gap:10px;">
                    <input type="time" id="input-hora-inicio-clase" value="08:00">
                    <input type="time" id="input-hora-fin-clase" value="09:00">
                </div>
            </div>

            <div class="modal-campo">
                <label>Profesor (opcional)</label>
                <input type="text" id="input-profesor-clase" placeholder="Nombre del profesor">
            </div>

            <div class="modal-campo">
                <label>Salón (opcional)</label>
                <input type="text" id="input-salon-clase" placeholder="Ej. 201, Laboratorio 3">
            </div>

            <div class="modal-campo">
                <label>Color</label>
                <div class="color-picker" id="color-picker-clase">
                    ${COLORES_CLASE.map(color => `
                        <div class="color-option ${color.valor === colorDefault ? 'seleccionado' : ''}"
                            style="background-color: ${color.valor}"
                            onclick="seleccionarColorClase(this, '${color.valor}')">
                        </div>
                    `).join('')}
                </div>
                <input type="hidden" id="input-color-clase" value="${colorDefault}">
            </div>

            <div class="modal-acciones">
                <button class="btn-cancelar" onclick="cerrarModalClase()">Cancelar</button>
                <button class="btn-guardar" onclick="guardarClaseModal()">Guardar clase</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('input-materia-clase')?.focus(), 100);
}

window.seleccionarColorClase = (elemento, color) => {
    document.getElementById('input-color-clase').value = color;
    document.querySelectorAll('#color-picker-clase .color-option').forEach(el => el.classList.remove('seleccionado'));
    elemento.classList.add('seleccionado');
};

window.cerrarModalClase = () => {
    const modal = document.getElementById('modal-clase');
    if (modal) modal.remove();
};

window.guardarClaseModal = () => {
    const inputMateria = document.getElementById('input-materia-clase');
    const selectDia = document.getElementById('input-dia-clase');
    const inputHoraInicio = document.getElementById('input-hora-inicio-clase');
    const inputHoraFin = document.getElementById('input-hora-fin-clase');
    const inputProfesor = document.getElementById('input-profesor-clase');
    const inputSalon = document.getElementById('input-salon-clase');
    const inputColor = document.getElementById('input-color-clase');

    if (!inputMateria || !selectDia || !inputHoraInicio || !inputHoraFin || !inputColor) return;

    const materia = inputMateria.value.trim();
    const diaSemana = Number(selectDia.value);
    const horaInicio = inputHoraInicio.value;
    const horaFin = inputHoraFin.value;
    const profesor = inputProfesor ? inputProfesor.value.trim() : '';
    const salon = inputSalon ? inputSalon.value.trim() : '';
    const color = inputColor.value || '#429155';

    if (!materia) {
        UI.toast('Escribe la materia', 'error');
        return;
    }
    if (!horaInicio || !horaFin) {
        UI.toast('Define hora de inicio y fin', 'error');
        return;
    }

    const inicioMin = convertirHoraAMinutos(horaInicio);
    const finMin = convertirHoraAMinutos(horaFin);

    if (finMin <= inicioMin) {
        UI.toast('La hora de fin debe ser mayor a la de inicio', 'error');
        return;
    }

    Store.agregarClase({
        materia,
        diaSemana,
        horaInicio,
        horaFin,
        profesor,
        salon,
        color
    });

    cerrarModalClase();
    renderizarHorario();
    actualizarEstadoEnVivo();
};

function obtenerDiaActual() {
    const hoy = new Date();
    const dia = (hoy.getDay() + 6) % 7;
    return dia > 4 ? 0 : dia;
}

function renderizarHorario() {
    const contenedor = document.getElementById('grid-horario');
    const estadoVacio = document.getElementById('estado-horario');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    contenedor.style.setProperty('--altura-hora', `${ALTURA_HORA}px`);
    contenedor.style.setProperty('--altura-total', `${(HORA_FIN - HORA_INICIO) * ALTURA_HORA}px`);

    const columnaHoras = document.createElement('div');
    columnaHoras.className = 'columna-horas';
    columnaHoras.innerHTML = `<div class="cabecera-horas">Hora</div>`;

    for (let hora = HORA_INICIO; hora < HORA_FIN; hora++) {
        const horaEl = document.createElement('div');
        horaEl.className = 'hora-item';
        horaEl.textContent = `${String(hora).padStart(2, '0')}:00`;
        columnaHoras.appendChild(horaEl);
    }

    contenedor.appendChild(columnaHoras);

    const clases = Store.obtenerClases();
    const clasesValidas = clases.filter(c => DIAS_SEMANA.some(d => d.valor === Number(c.diaSemana)));

    DIAS_SEMANA.forEach(dia => {
        const columnaDia = document.createElement('div');
        columnaDia.className = 'columna-dia';
        columnaDia.innerHTML = `<div class="cabecera-dia">${dia.nombre}</div>`;

        const cuerpo = document.createElement('div');
        cuerpo.className = 'dia-cuerpo';

        const clasesDia = clasesValidas
            .filter(c => Number(c.diaSemana) === dia.valor)
            .sort((a, b) => convertirHoraAMinutos(a.horaInicio) - convertirHoraAMinutos(b.horaInicio));

        clasesDia.forEach(clase => {
            const inicioMin = convertirHoraAMinutos(clase.horaInicio);
            const finMin = convertirHoraAMinutos(clase.horaFin);
            const top = ((inicioMin - HORA_INICIO * 60) / 60) * ALTURA_HORA;
            const height = ((finMin - inicioMin) / 60) * ALTURA_HORA;

            if (height <= 0) return;

            const bloque = document.createElement('div');
            bloque.className = 'bloque-clase';
            bloque.style.top = `${top}px`;
            bloque.style.height = `${height}px`;
            bloque.style.background = clase.color || '#429155';
            bloque.dataset.dia = dia.valor;
            bloque.dataset.inicio = inicioMin;
            bloque.dataset.fin = finMin;
            bloque.dataset.id = clase.id;

            bloque.innerHTML = `
                <h4>${clase.materia}</h4>
                <p>${clase.horaInicio} - ${clase.horaFin}</p>
                ${clase.profesor ? `<p>${clase.profesor}</p>` : ''}
                ${clase.salon ? `<p>${clase.salon}</p>` : ''}
                <div class="acciones-clase">
                    <button class="btn-eliminar-clase" data-id="${clase.id}">Eliminar</button>
                </div>
            `;

            const btnEliminar = bloque.querySelector('.btn-eliminar-clase');
            btnEliminar.addEventListener('click', () => {
                Store.eliminarClase(clase.id);
                renderizarHorario();
                actualizarEstadoEnVivo();
            });

            cuerpo.appendChild(bloque);
        });

        columnaDia.appendChild(cuerpo);
        contenedor.appendChild(columnaDia);
    });

    if (estadoVacio) {
        estadoVacio.textContent = clasesValidas.length === 0
            ? 'Todavía no tienes clases registradas. Agrega tu primer bloque arriba.'
            : '';
    }
}

function actualizarEstadoEnVivo() {
    const estado = document.getElementById('estado-clase');
    if (!estado) return;

    const ahora = new Date();
    const diaActual = (ahora.getDay() + 6) % 7;
    const minutosActual = ahora.getHours() * 60 + ahora.getMinutes();

    const clasesHoy = Store.obtenerClases()
        .filter(c => Number(c.diaSemana) === diaActual)
        .sort((a, b) => convertirHoraAMinutos(a.horaInicio) - convertirHoraAMinutos(b.horaInicio));

    let mensaje = 'Sin clases registradas';
    let claseActual = null;
    let siguiente = null;

    clasesHoy.forEach(clase => {
        const inicio = convertirHoraAMinutos(clase.horaInicio);
        const fin = convertirHoraAMinutos(clase.horaFin);
        if (minutosActual >= inicio && minutosActual < fin) {
            claseActual = clase;
        } else if (!siguiente && inicio > minutosActual) {
            siguiente = clase;
        }
    });

    if (diaActual > 4) {
        mensaje = 'Hoy no hay clases';
    } else if (claseActual) {
        const lugar = claseActual.salon ? ` (${claseActual.salon})` : '';
        mensaje = `Ahorita estás en: ${claseActual.materia}${lugar}`;
    } else if (siguiente) {
        const minutosPara = convertirHoraAMinutos(siguiente.horaInicio) - minutosActual;
        const lugar = siguiente.salon ? ` (${siguiente.salon})` : '';
        mensaje = `Siguiente clase en ${minutosPara} min: ${siguiente.materia}${lugar}`;
    } else if (clasesHoy.length > 0) {
        mensaje = 'Clases terminadas por hoy';
    }

    estado.textContent = mensaje;

    document.querySelectorAll('.bloque-clase').forEach(bloque => {
        const dia = Number(bloque.dataset.dia);
        const inicio = Number(bloque.dataset.inicio);
        const fin = Number(bloque.dataset.fin);
        const enVivo = dia === diaActual && minutosActual >= inicio && minutosActual < fin;
        bloque.classList.toggle('en-vivo', enVivo);
    });
}

function convertirHoraAMinutos(hora) {
    if (!hora) return 0;
    const partes = hora.split(':');
    const horas = Number(partes[0]) || 0;
    const minutos = Number(partes[1]) || 0;
    return horas * 60 + minutos;
}
