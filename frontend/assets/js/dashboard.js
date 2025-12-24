/*
 * dashboard.js
 * Dashboard principal (NO AI Insights) con datos del Backend Real
 */

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDashboard();
    Icons.init();
});

async function cargarDashboard() {
    // Fecha actual
    const hoy = new Date();
    document.getElementById('fecha-actual').textContent = hoy.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Cargar tareas desde el backend (o IndexedDB si offline)
    await cargarTareas();

    // Calcular y mostrar estadísticas
    calcularStats();

    // Renderizar gráficos
    renderWeeklyTrend();
    renderSpaceDistribution();
    renderTodaysTasks();
}

async function cargarTareas() {
    // Intentar cargar del backend primero
    if (navigator.onLine) {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/tasks/');
            if (response.ok) {
                const tareas = await response.json();
                Store.state.tareas = tareas;

                // Actualizar IndexedDB también
                for (const tarea of tareas) {
                    await DBManager.save('tareas', tarea);
                }
                console.log('✅ Tareas cargadas desde Django Backend');
                return;
            }
        } catch (error) {
            console.warn('⚠️ Backend no disponible, usando datos locales');
        }
    }

    // Fallback a IndexedDB
    if (typeof DBManager !== 'undefined') {
        const tareasLocales = await DBManager.getAll('tareas');
        if (tareasLocales.length > 0) {
            Store.state.tareas = tareasLocales;
            console.log('📦 Tareas cargadas desde IndexedDB');
        }
    }
}

function calcularStats() {
    const tareas = Store.state.tareas;
    const hoy = Store.fechaIsoLocal(new Date());
    const inicioSemana = getStartOfWeek();

    // Tareas de hoy
    const tareasHoy = tareas.filter(t => t.fecha === hoy && t.completada).length;
    document.getElementById('stat-hoy').textContent = tareasHoy;

    // Tareas de la semana
    const tareasSemana = tareas.filter(t => {
        const fechaTarea = new Date(`${t.fecha}T00:00:00`);
        return fechaTarea >= inicioSemana && t.completada;
    }).length;
    document.getElementById('stat-semana').textContent = tareasSemana;

    // Horas focus (simulado por ahora)
    document.getElementById('stat-focus').textContent = Math.floor(Math.random() * 20) + 5 + 'h';

    // Racha (simulado)
    document.getElementById('stat-racha').textContent = Math.floor(Math.random() * 15) + 1 + ' días';
}

function getStartOfWeek() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const inicio = new Date(d.setDate(diff));
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

function renderWeeklyTrend() {
    const ctx = document.getElementById('weekly-trend-chart');
    if (!ctx) return;

    const tareas = Store.state.tareas;
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const completadas = Array(7).fill(0);
    const totales = Array(7).fill(0);

    // Calcular completitud por día
    const inicioSemana = getStartOfWeek();
    tareas.forEach(t => {
        const fecha = new Date(`${t.fecha}T00:00:00`);
        if (fecha >= inicioSemana) {
            const diaIndex = (fecha.getDay() + 6) % 7; // Lunes = 0
            totales[diaIndex]++;
            if (t.completada) completadas[diaIndex]++;
        }
    });

    // Tasa de completitud
    const tasaTotal = totales.reduce((sum, t, i) => sum + (t > 0 ? (completadas[i] / t) : 0), 0) / 7;
    document.getElementById('completion-badge').textContent = Math.round(tasaTotal * 100) + '% completitud';

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dias,
            datasets: [{
                label: 'Completadas',
                data: completadas,
                backgroundColor: '#429155',
                borderRadius: 8
            }, {
                label: 'Totales',
                data: totales,
                backgroundColor: 'rgba(100, 116, 139, 0.3)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8F90A0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8F90A0' }
                }
            }
        }
    });
}

function renderSpaceDistribution() {
    const container = document.getElementById('space-distribution');
    if (!container) return;

    const tareas = Store.state.tareas;
    const espacios = {
        'Personal': { color: '#EC4899', total: 0, completadas: 0 },
        'Escuela': { color: '#3B82F6', total: 0, completadas: 0 },
        'Trabajo': { color: '#F59E0B', total: 0, completadas: 0 }
    };

    tareas.forEach(t => {
        if (espacios[t.espacio]) {
            espacios[t.espacio].total++;
            if (t.completada) espacios[t.espacio].completadas++;
        }
    });

    container.innerHTML = '';
    Object.entries(espacios).forEach(([nombre, data]) => {
        if (data.total === 0) return;

        const progreso = (data.completadas / data.total) * 100;

        const div = document.createElement('div');
        div.className = 'space-bar';
        div.innerHTML = `
            <div class="space-bar-header">
                <div class="space-name">
                    <span class="space-dot" style="background: ${data.color}"></span>
                    ${nombre}
                </div>
                <span>${data.completadas} / ${data.total}</span>
            </div>
            <div class="space-progress">
                <div class="space-progress-fill" style="width: ${progreso}%; background: ${data.color};"></div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderTodaysTasks() {
    const container = document.getElementById('today-tasks-list');
    if (!container) return;

    const hoy = Store.fechaIsoLocal(new Date());
    const tareasHoy = Store.state.tareas.filter(t => t.fecha === hoy).slice(0, 5);

    if (tareasHoy.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="check-circle-2"></i>
                <p>No hay tareas programadas para hoy</p>
            </div>
        `;
        Icons.init();
        return;
    }

    container.innerHTML = tareasHoy.map(t => `
        <div class="task-item">
            <div class="task-checkbox ${t.completada ? 'completed' : ''}">
                ${t.completada ? '<i data-lucide="check"></i>' : ''}
            </div>
            <div class="task-title ${t.completada ? 'completed' : ''}">${t.titulo}</div>
            ${t.duracion ? `<span class="task-badge">${t.duracion}m</span>` : ''}
        </div>
    `).join('');

    Icons.init();
}
