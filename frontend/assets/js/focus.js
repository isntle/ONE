/*
 * focus.js
 * Lógica para Modo Focus 2.0 (Timer Visual + Audio + Contexto)
 */

let timerInterval;
let tiempoTotal = 25 * 60;
let tiempoRestante = 25 * 60;
let enPausa = true;
let tareaActiva = null;

// Configuración de anillo de progreso
const circle = document.querySelector('.progress-ring__circle');
const radius = circle ? circle.r.baseVal.value : 140;
const circumference = radius * 2 * Math.PI;

document.addEventListener('DOMContentLoaded', () => {
    if (circle) {
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference;
    }

    cargarTareasSetup();
    configurarBotonesModo();
    Icons.init();
});

function cargarTareasSetup() {
    // Cargar tareas de HOY para el selector
    const select = document.getElementById('select-tarea-focus');
    const hoy = Store.fechaIsoLocal(new Date());
    // Obtener tareas globales (de todos los espacios) o solo del actual? 
    // Mejor de todos para "Deep Work" global. O filtrado por espacio actual si queremos consistencia.
    // Usemos global filter by date = hoy
    // Store.state.tareas tiene todo.

    const tareasHoy = Store.state.tareas.filter(t => t.fecha === hoy && !t.completada);

    select.innerHTML = '<option value="">-- Selecciona una tarea de hoy --</option>';
    if (tareasHoy.length === 0) {
        const option = document.createElement('option');
        option.text = "No tienes tareas pendientes para hoy (Crear una rápida)";
        option.value = "new"; // Logic to create new inline? Or just generic
        select.appendChild(option);
    }

    tareasHoy.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.text = `${t.titulo} (${t.espacio})`;
        select.appendChild(option);
    });

    // Opción genérica
    const optGen = document.createElement('option');
    optGen.value = "generic";
    optGen.text = "Trabajo General / Sin Tarea";
    select.appendChild(optGen);
}

function configurarBotonesModo() {
    document.querySelectorAll('.btn-modo').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-modo').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');

            const mins = parseInt(btn.dataset.min);
            tiempoTotal = mins * 60;
            tiempoRestante = tiempoTotal; // Reset al cambiar modo
        });
    });
}

window.iniciarFocus = () => {
    const tareaId = document.getElementById('select-tarea-focus').value;
    if (!tareaId) {
        UI.toast("Por favor selecciona en qué vas a trabajar.", "info");
        return;
    }

    // UI Switch
    document.getElementById('configuracion-focus').style.display = 'none';
    document.getElementById('sesion-activa').style.display = 'flex';

    // Set Tarea Title
    if (tareaId === 'generic' || tareaId === 'new') {
        document.getElementById('titulo-tarea-activa').textContent = "Sesión de Enfoque";
    } else {
        const t = Store.state.tareas.find(task => task.id == tareaId);
        if (t) document.getElementById('titulo-tarea-activa').textContent = t.titulo;
    }

    enPausa = false;
    actualizarDisplay();
    timerInterval = setInterval(tick, 1000);

    // Cambiar icono pausa/play
    const btn = document.getElementById('btn-pausa');
    btn.innerHTML = '<i data-app-icon="pause"></i>';
    Icons.init();
};

function tick() {
    if (!enPausa && tiempoRestante > 0) {
        tiempoRestante--;
        actualizarDisplay();
        setProgress(tiempoRestante);
    } else if (tiempoRestante === 0) {
        completarSesion();
    }
}

function actualizarDisplay() {
    const m = Math.floor(tiempoRestante / 60);
    const s = tiempoRestante % 60;
    document.getElementById('display-tiempo').textContent =
        `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function setProgress(timeRemain) {
    const offset = circumference - (timeRemain / tiempoTotal) * circumference;
    if (circle) circle.style.strokeDashoffset = offset;
}

window.pausarReanudar = () => {
    enPausa = !enPausa;
    const btn = document.getElementById('btn-pausa');
    if (enPausa) {
        btn.innerHTML = '<i data-app-icon="play"></i>';
    } else {
        btn.innerHTML = '<i data-app-icon="pause"></i>';
    }
    Icons.init();
};

window.detenerSesion = async () => {
    const confirmacion = await UI.confirm({
        titulo: 'Detener sesión',
        mensaje: '¿Detener la sesión de enfoque? Se guardará el tiempo transcurrido.',
        textoConfirmar: 'Detener',
        textoCancelar: 'Continuar'
    });

    if (confirmacion) {
        registrarTiempoParcial();
        finalizar();
    }
};

async function completarSesion() {
    // Registrar tiempo real (el total de la sesión)
    // Convertir segundos a minutos
    const minutos = Math.round(tiempoTotal / 60);
    Store.registrarTiempoFocus(minutos);

    // Sonido final? (Opcional)
    finalizar();

    // Modal de celebración
    await UI.alert({
        titulo: '¡Sesión Completada!',
        mensaje: `Has sumado <b>${minutos} minutos</b> de foco productivo.`
    });
}

// Helper para registrar tiempo parcial al detener
function registrarTiempoParcial() {
    const tiempoTranscurrido = tiempoTotal - tiempoRestante;
    if (tiempoTranscurrido > 60) { // Solo si pasó más de 1 minuto
        const minutos = Math.round(tiempoTranscurrido / 60);
        Store.registrarTiempoFocus(minutos);
        UI.toast(`Sesión detenida. Se sumaron ${minutos}m.`, 'info');
    }
}

function finalizar() {
    clearInterval(timerInterval);
    detenerAudios();
    // Reset UI
    document.getElementById('configuracion-focus').style.display = 'block';
    document.getElementById('sesion-activa').style.display = 'none';

    tiempoRestante = tiempoTotal; // Reset timer logic
    setProgress(tiempoTotal); // Full circle
}

// === AUDIO MIXER ===
window.toggleAudio = (tipo) => {
    const audio = document.getElementById(`audio-${tipo}`);
    const btn = document.querySelector(`.btn-audio[onclick="toggleAudio('${tipo}')"]`);

    if (audio.paused) {
        audio.play().catch(e => console.log("Audio play error (user interaction needed first):", e));
        btn.classList.add('activo-audio');
    } else {
        audio.pause();
        btn.classList.remove('activo-audio');
    }
};

function detenerAudios() {
    ['lluvia', 'fuego', 'cafe'].forEach(tipo => {
        const a = document.getElementById(`audio-${tipo}`);
        a.pause();
        a.currentTime = 0;
        document.querySelectorAll('.btn-audio').forEach(b => b.classList.remove('activo-audio'));
    });
}

// Exit Intent Link Override (Header)
window.confirmarSalida = async (e) => {
    if (document.getElementById('sesion-activa').style.display === 'flex') {
        e.preventDefault();
        const urlDestino = e.currentTarget.href;

        const confirmacion = await UI.confirm({
            titulo: '¿Abandonar sesión?',
            mensaje: 'Si sales ahora, se detendrá el temporizador.',
            textoConfirmar: 'Salir',
            textoCancelar: 'Quedarse'
        });

        if (confirmacion) {
            window.location.href = urlDestino;
        }
    }
};
