/*
 * capacidad.js
 * Lógica de cálculo de carga laboral (Semáforo)
 */

document.addEventListener('DOMContentLoaded', () => {
    calcularCapacidad();
    Icons.init();
});

function calcularCapacidad() {
    const horasProductivas = parseFloat(document.getElementById('input-horas-productivas').value) || 6;
    const tareas = Store.state.tareas;
    const hoyIso = Store.fechaIsoLocal(new Date());

    // 1. Calcular carga de HOY
    const tareasHoy = tareas.filter(t => t.fecha === hoyIso && !t.completada);
    // Estimación simple: 1h por tarea si no tiene duración (o random 1-2h para demo)
    // Para simplificar: Tareas simples = 1h, Tareas complejas = 2h?
    // Usemos conteo simple modificado por "densidad" (keywords)

    let horasEstimadas = 0;
    tareasHoy.forEach(t => {
        let peso = 1.0; // 1 hora base
        const titulo = t.titulo.toLowerCase();
        // Keywords de complejidad
        if (titulo.includes('proyecto') || titulo.includes('examen') || titulo.includes('tesis')) {
            peso = 2.5;
        } else if (titulo.includes('leer') || titulo.includes('revisar')) {
            peso = 0.5;
        }
        horasEstimadas += peso;
    });

    actualizarUI(horasEstimadas, horasProductivas);
    renderizarPrediccion(horasProductivas);
}

function actualizarUI(carga, limite) {
    // Actualizar Texto
    document.getElementById('dato-carga-hoy').textContent = `${carga.toFixed(1)}h`;

    // Lógica Semáforo
    const porcentaje = carga / limite;

    // Reset luces
    document.querySelectorAll('.luz').forEach(l => l.classList.remove('activo'));
    const recomendacion = document.getElementById('dato-recomendacion');
    const estadoTexto = document.getElementById('dato-estado-texto');

    if (porcentaje < 0.7) {
        document.getElementById('luz-verde').classList.add('activo');
        estadoTexto.textContent = "Disponible";
        estadoTexto.style.color = "#429155";
        recomendacion.textContent = "Tienes espacio para adelantar pendientes.";
    } else if (porcentaje <= 1.0) {
        document.getElementById('luz-amarillo').classList.add('activo');
        estadoTexto.textContent = "Moderado";
        estadoTexto.style.color = "#F59E0B";
        recomendacion.textContent = "Día balanceado, mantén el ritmo.";
    } else {
        document.getElementById('luz-rojo').classList.add('activo');
        estadoTexto.textContent = "Sobrecargado";
        estadoTexto.style.color = "#EF4444";
        const exceso = (carga - limite).toFixed(1);
        recomendacion.textContent = `Te excedes por ${exceso}h. Mueve tareas a mañana.`;
    }
}

function renderizarPrediccion(limite) {
    const grid = document.getElementById('grid-prediccion');
    grid.innerHTML = '';

    // Próximos 5 días
    const hoy = new Date();
    for (let i = 1; i <= 5; i++) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() + i);
        const iso = Store.fechaIsoLocal(d);
        const diaNombre = d.toLocaleDateString('es-ES', { weekday: 'short' });

        // Calcular carga del día
        const tareasDia = Store.state.tareas.filter(t => t.fecha === iso);
        const cargaDia = tareasDia.length * 1.0; // Simplificado para predicción

        const porcentaje = Math.min(cargaDia / limite, 1.0) * 100;
        let claseColor = '#429155';
        if (porcentaje > 80) claseColor = '#EF4444';
        else if (porcentaje > 50) claseColor = '#F59E0B';

        const div = document.createElement('div');
        div.className = 'dia-cap';
        div.innerHTML = `
            <div style="font-size:0.8rem; margin-bottom:4px;">${diaNombre}</div>
            <div style="font-weight:bold;">${Math.round(cargaDia)}h</div>
            <div class="cap-barra">
                <div class="cap-progreso" style="width:${porcentaje}%; background:${claseColor};"></div>
            </div>
        `;
        grid.appendChild(div);
    }
}
