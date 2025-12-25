/*
 * dashboard.js
 * Dashboard principal con datos de Store.js y Chart.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // Store ya está inicializado por store.js
    cargarDashboard();

    // Escuchar cambios en el espacio para actualizar
    document.addEventListener('cambio-espacio', () => {
        cargarDashboard();
    });
});

function cargarDashboard() {
    // 1. Fecha actual
    const hoy = new Date();
    const fechaEl = document.getElementById('fecha-actual');
    if (fechaEl) {
        fechaEl.textContent = hoy.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 2. Obtener tareas del Store (datos locales)
    const tareas = Store.state.tareas || [];
    console.log('📊 Dashboard cargando con', tareas.length, 'tareas');

    // 3. Calcular y mostrar estadísticas
    calcularStats(tareas);

    // 4. Renderizar gráficos
    renderWeeklyTrend(tareas);
    renderSpaceDistribution(tareas);

    // 5. Renderizar Tareas de Hoy
    renderTodaysTasks(tareas);

    // 6. Inicializar iconos
    if (typeof Icons !== 'undefined') Icons.init();
}

function calcularStats(tareas) {
    const hoyStr = Store.fechaIsoLocal(new Date());
    const inicioSemana = getStartOfWeek();
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);

    // Tareas Hoy (completadas)
    const tareasHoyCompletadas = tareas.filter(t => t.fecha === hoyStr && t.completada).length;
    const elHoy = document.getElementById('stat-hoy');
    if (elHoy) elHoy.textContent = tareasHoyCompletadas;

    // Tareas Esta Semana (completadas)
    const tareasSemana = tareas.filter(t => {
        const fecha = new Date(t.fecha + 'T00:00:00');
        return fecha >= inicioSemana && fecha <= finSemana && t.completada;
    }).length;
    const elSemana = document.getElementById('stat-semana');
    if (elSemana) elSemana.textContent = tareasSemana;

    // Horas Focus (REALES, persistidas en usuario)
    const minutosFocus = (Store.state.usuario && Store.state.usuario.minutosFocus) ? Store.state.usuario.minutosFocus : 0;
    const horasFocus = (minutosFocus / 60).toFixed(1); // Un decimal ej: 1.5h
    const elFocus = document.getElementById('stat-focus');
    if (elFocus) elFocus.textContent = horasFocus + 'h';

    // Racha (simple: días consecutivos con al menos 1 tarea completada)
    const elRacha = document.getElementById('stat-racha');
    if (elRacha) {
        const racha = calcularRacha(tareas);
        elRacha.textContent = racha + ' días';
    }
}

function calcularRacha(tareas) {
    // Contar días consecutivos hacia atrás con tareas completadas
    let racha = 0;
    const hoy = new Date();

    for (let i = 0; i < 30; i++) { // Max 30 días
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = Store.fechaIsoLocal(fecha);

        const tieneCompletada = tareas.some(t => t.fecha === fechaStr && t.completada);
        if (tieneCompletada) {
            racha++;
        } else if (i > 0) { // Permitir que hoy no tenga aún
            break;
        }
    }
    return racha;
}

function getStartOfWeek() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    const inicio = new Date(d.setDate(diff));
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

// Variables globales para destruir gráficos anteriores
let chartTrend = null;
let chartEspacios = null;

function renderWeeklyTrend(tareas) {
    const ctx = document.getElementById('weekly-trend-chart');
    if (!ctx) return;

    // Destruir previo si existe
    if (chartTrend) chartTrend.destroy();

    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const completadas = [0, 0, 0, 0, 0, 0, 0];
    const totales = [0, 0, 0, 0, 0, 0, 0];

    const inicioSemana = getStartOfWeek();

    tareas.forEach(t => {
        if (!t.fecha) return;
        const fecha = new Date(t.fecha + 'T00:00:00');
        if (fecha >= inicioSemana) {
            const diaIndex = (fecha.getDay() + 6) % 7; // Lunes = 0
            if (diaIndex >= 0 && diaIndex < 7) {
                totales[diaIndex]++;
                if (t.completada) completadas[diaIndex]++;
            }
        }
    });

    // Calcular completitud total
    const totalComp = completadas.reduce((a, b) => a + b, 0);
    const totalTar = totales.reduce((a, b) => a + b, 0);
    const porcentaje = totalTar > 0 ? Math.round((totalComp / totalTar) * 100) : 0;

    const badge = document.getElementById('completion-badge');
    if (badge) badge.textContent = `${porcentaje}% completado`;

    chartTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Completadas',
                data: completadas,
                borderColor: '#429155',
                backgroundColor: 'rgba(66, 145, 85, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#429155',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1E1E2E',
                    titleColor: '#fff',
                    bodyColor: '#ccc'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8F90A0', stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8F90A0' }
                }
            }
        }
    });
}

function renderSpaceDistribution(tareas) {
    const container = document.getElementById('space-distribution');
    if (!container) return;

    // Crear canvas si no existe
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        container.innerHTML = '<canvas id="space-pie-chart"></canvas>';
        canvas = document.getElementById('space-pie-chart');
    }

    if (chartEspacios) chartEspacios.destroy();

    // Contar tareas por espacio
    const espacios = { 'Personal': 0, 'Escuela': 0, 'Trabajo': 0 };
    tareas.forEach(t => {
        if (espacios.hasOwnProperty(t.espacio)) {
            espacios[t.espacio]++;
        }
    });

    const labels = Object.keys(espacios);
    const data = Object.values(espacios);
    const total = data.reduce((a, b) => a + b, 0);

    // Si no hay datos, mostrar mensaje
    if (total === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:40px; color:var(--color-texto-tenue);">
                <p>No hay tareas para mostrar distribución</p>
            </div>
        `;
        return;
    }

    const colorMap = {
        'Personal': '#EC4899',
        'Escuela': '#3B82F6',
        'Trabajo': '#F59E0B'
    };
    const backgroundColors = labels.map(l => colorMap[l]);

    chartEspacios = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#dadada', font: { size: 12 } }
                }
            },
            cutout: '60%'
        }
    });
}

function renderTodaysTasks(tareas) {
    const container = document.getElementById('today-tasks-list');
    if (!container) return;

    const hoyStr = Store.fechaIsoLocal(new Date());
    const tareasHoy = tareas.filter(t => t.fecha === hoyStr).sort((a, b) => {
        if (a.completada === b.completada) return 0;
        return a.completada ? 1 : -1;
    });

    if (tareasHoy.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="calendar-off" style="width:48px; height:48px; opacity:0.5;"></i>
                <p>No hay tareas programadas para hoy</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = tareasHoy.map(t => `
        <div class="task-item">
            <div class="task-checkbox ${t.completada ? 'completed' : ''}">
                ${t.completada ? '<i data-lucide="check" style="width:14px; height:14px; color:white;"></i>' : ''}
            </div>
            <div style="flex:1;">
                <div class="task-title ${t.completada ? 'completed' : ''}">${t.titulo}</div>
                <div style="font-size:0.8rem; color:var(--color-texto-tenue);">
                    ${t.espacio} • ${t.horaInicio || 'Todo el día'}
                </div>
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}
