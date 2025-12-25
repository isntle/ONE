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

    let horasEstimadas = 0;
    tareasHoy.forEach(t => {
        let peso = 1.0; // 1 hora base
        const titulo = (t.titulo || "").toLowerCase();
        // Keywords de complejidad
        if (titulo.includes('proyecto') || titulo.includes('examen') || titulo.includes('tesis') || titulo.includes('entrega')) {
            peso = 3.0;
        } else if (titulo.includes('leer') || titulo.includes('revisar') || titulo.includes('mail')) {
            peso = 0.5;
        } else if (titulo.includes('clase') || titulo.includes('reunion') || titulo.includes('junta')) {
            peso = 1.5;
        }
        horasEstimadas += peso;
    });

    actualizarUI(horasEstimadas, horasProductivas);
    renderizarPrediccion(horasProductivas);
}

function actualizarUI(carga, limite) {
    document.getElementById('dato-carga-hoy').textContent = `${carga.toFixed(1)}h`;

    const porcentaje = carga / limite;

    // Reset luces
    document.querySelectorAll('.luz').forEach(l => l.classList.remove('activo'));
    const recomendacion = document.getElementById('dato-recomendacion');
    const estadoTexto = document.getElementById('dato-estado-texto');

    if (porcentaje < 0.8) {
        // OPTIMO (Verde)
        document.getElementById('luz-verde').classList.add('activo');
        estadoTexto.textContent = "Óptimo";
        estadoTexto.style.color = "#429155";
        recomendacion.textContent = "Tienes margen de maniobra para hoy.";
    } else if (porcentaje <= 1.0) {
        // DENSO (Amarillo)
        document.getElementById('luz-amarillo').classList.add('activo');
        estadoTexto.textContent = "Denso";
        estadoTexto.style.color = "#F59E0B";
        recomendacion.textContent = "Estás en tu límite productivo.";
    } else {
        // SOBRECARGADO (Rojo)
        document.getElementById('luz-rojo').classList.add('activo');
        estadoTexto.textContent = "Sobrecargado";
        estadoTexto.style.color = "#EF4444";
        const exceso = (carga - limite).toFixed(1);
        recomendacion.textContent = `Te excedes por ${exceso}h. Prioriza tareas críticas.`;
    }
}

function renderizarPrediccion(limite) {
    const grid = document.getElementById('grid-prediccion');
    grid.innerHTML = '';

    // Obtener el Lunes de la semana actual
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 (Dom) a 6 (Sab)
    const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Ajustar para que el Lunes sea el primer día
    const lunes = new Date(hoy.setDate(diff));

    // Renderizar Lunes a Domingo (7 días)
    for (let i = 0; i < 7; i++) {
        const d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        const iso = Store.fechaIsoLocal(d);
        const diaNombre = d.toLocaleDateString('es-ES', { weekday: 'short' });

        // Calcular carga del día basado en tareas (usando peso simplificado 1h para predicción)
        const tareasDia = Store.state.tareas.filter(t => t.fecha === iso && !t.completada);
        let cargaDia = 0;
        tareasDia.forEach(t => {
            let peso = 1.0;
            const titulo = (t.titulo || "").toLowerCase();
            if (titulo.includes('proyecto') || titulo.includes('examen')) peso = 3.0;
            else if (titulo.includes('clase')) peso = 1.5;
            cargaDia += peso;
        });

        const porcentaje = Math.min((cargaDia / limite) * 100, 100);
        let claseColor = '#429155'; // Verde
        if (porcentaje > 100) claseColor = '#EF4444'; // Rojo (excedido)
        else if (porcentaje >= 80) claseColor = '#F59E0B'; // Amarillo (denso)

        const div = document.createElement('div');
        div.className = 'dia-cap';
        if (iso === Store.fechaIsoLocal(new Date())) {
            div.classList.add('hoy-cap');
            div.style.background = 'rgba(66, 145, 85, 0.1)';
            div.style.border = '1px solid var(--color-acento)';
            div.style.borderRadius = '12px';
            div.style.padding = '10px';
        }

        div.innerHTML = `
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--color-texto-tenue);">${diaNombre}</div>
            <div style="font-weight:bold; font-size:1.1rem; margin:4px 0;">${cargaDia.toFixed(1)}h</div>
            <div class="cap-barra" style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                <div class="cap-progreso" style="width:${porcentaje}%; background:${claseColor}; height:100%; transition: width 0.3s ease;"></div>
            </div>
        `;
        grid.appendChild(div);
    }
}
