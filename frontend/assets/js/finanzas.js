/*
 * finanzas.js
 * Lógica para la vista de Finanzas personales
 */

let graficaGastos = null;

document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date();
    const inputMes = document.getElementById('filtro-mes');
    const inputFecha = document.getElementById('input-fecha-gasto');

    if (inputMes) {
        inputMes.value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    }

    if (inputFecha && typeof Store !== 'undefined') {
        inputFecha.value = Store.fechaIsoLocal(hoy);
    }

    configurarEventos();
    renderizarFinanzas();

    document.addEventListener('cambio-espacio', () => {
        renderizarFinanzas();
    });
});

function configurarEventos() {
    const inputMes = document.getElementById('filtro-mes');
    const inputPresupuesto = document.getElementById('input-presupuesto');
    const btnAgregar = document.getElementById('btn-agregar-gasto');

    const inputDescripcion = document.getElementById('input-descripcion-gasto');
    const inputMonto = document.getElementById('input-monto-gasto');
    const inputCategoria = document.getElementById('input-categoria-gasto');
    const inputFecha = document.getElementById('input-fecha-gasto');

    inputMes?.addEventListener('change', () => {
        renderizarFinanzas();
    });

    btnAgregar?.addEventListener('click', () => {
        guardarGasto();
    });

    [inputDescripcion, inputMonto, inputCategoria, inputFecha].forEach(input => {
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                guardarGasto();
            }
        });
    });

    inputPresupuesto?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            guardarPresupuesto();
        }
    });

    inputPresupuesto?.addEventListener('blur', () => {
        guardarPresupuesto();
    });
}

function obtenerPeriodoSeleccionado() {
    const inputMes = document.getElementById('filtro-mes');
    const valor = inputMes?.value;
    const fecha = valor ? new Date(`${valor}-01T00:00:00`) : new Date();
    return {
        mes: fecha.getMonth() + 1,
        anio: fecha.getFullYear()
    };
}

function guardarPresupuesto() {
    const inputPresupuesto = document.getElementById('input-presupuesto');
    if (!inputPresupuesto) return;

    const valor = inputPresupuesto.value.trim();
    if (valor === '') return;

    const monto = Number(valor);
    if (Number.isNaN(monto)) {
        UI.toast('Escribe un monto válido', 'error');
        return;
    }

    const { mes, anio } = obtenerPeriodoSeleccionado();
    Store.definirPresupuestoMensual(mes, anio, monto);
    renderizarFinanzas();
    UI.toast('Presupuesto actualizado', 'success');
}

function guardarGasto() {
    const inputDescripcion = document.getElementById('input-descripcion-gasto');
    const inputMonto = document.getElementById('input-monto-gasto');
    const inputCategoria = document.getElementById('input-categoria-gasto');
    const inputFecha = document.getElementById('input-fecha-gasto');

    if (!inputDescripcion || !inputMonto || !inputCategoria || !inputFecha) return;

    const descripcion = inputDescripcion.value.trim();
    const monto = Number(inputMonto.value);
    const categoria = inputCategoria.value.trim();
    const fecha = inputFecha.value || Store.fechaIsoLocal(new Date());

    if (!descripcion) {
        UI.toast('Escribe en qué gastaste', 'error');
        return;
    }
    if (Number.isNaN(monto) || monto <= 0) {
        UI.toast('Escribe un monto válido', 'error');
        return;
    }

    Store.agregarGasto({
        descripcion,
        categoria,
        fecha,
        monto
    });

    inputDescripcion.value = '';
    inputMonto.value = '';
    inputDescripcion.focus();

    renderizarFinanzas();
}

function renderizarFinanzas() {
    const { mes, anio } = obtenerPeriodoSeleccionado();
    const gastos = Store.obtenerGastos();
    const gastosMes = filtrarGastosPorMes(gastos, mes, anio);

    const presupuesto = Store.obtenerPresupuestoMensual(mes, anio);
    const montoPresupuesto = presupuesto ? Number(presupuesto.monto) : 0;
    const totalGasto = gastosMes.reduce((acc, gasto) => acc + Number(gasto.monto || 0), 0);
    const disponible = montoPresupuesto - totalGasto;

    actualizarResumen(montoPresupuesto, totalGasto, disponible, presupuesto);
    renderizarListaGastos(gastosMes);
    renderizarGrafica(gastosMes);
}

function filtrarGastosPorMes(gastos, mes, anio) {
    const mesStr = String(mes).padStart(2, '0');
    const prefijo = `${anio}-${mesStr}`;
    return gastos.filter(gasto => {
        if (!gasto.fecha) return false;
        return String(gasto.fecha).startsWith(prefijo);
    });
}

function actualizarResumen(montoPresupuesto, totalGasto, disponible, presupuesto) {
    const presupuestoEl = document.getElementById('presupuesto-mes');
    const gastoEl = document.getElementById('gasto-mes');
    const disponibleEl = document.getElementById('disponible-mes');
    const notaDisponible = document.getElementById('nota-disponible');
    const inputPresupuesto = document.getElementById('input-presupuesto');

    if (presupuestoEl) presupuestoEl.textContent = formatearMoneda(montoPresupuesto);
    if (gastoEl) gastoEl.textContent = formatearMoneda(totalGasto);
    if (disponibleEl) disponibleEl.textContent = formatearMoneda(disponible);

    if (notaDisponible) {
        if (!presupuesto) {
            notaDisponible.textContent = 'Sin presupuesto definido';
        } else if (disponible < 0) {
            notaDisponible.textContent = 'Te pasaste del presupuesto';
        } else {
            notaDisponible.textContent = 'Te queda disponible este mes';
        }
    }

    if (inputPresupuesto && document.activeElement !== inputPresupuesto) {
        inputPresupuesto.value = presupuesto ? Number(presupuesto.monto) : '';
    }
}

function renderizarListaGastos(gastos) {
    const lista = document.getElementById('lista-gastos');
    if (!lista) return;

    if (gastos.length === 0) {
        lista.innerHTML = `<div class="estado-vacio">Sin gastos registrados en este mes.</div>`;
        return;
    }

    const ordenados = gastos.slice().sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaB - fechaA;
    });

    lista.innerHTML = '';
    ordenados.forEach(gasto => {
        const item = document.createElement('div');
        item.className = 'item-gasto';
        item.innerHTML = `
            <div>
                <h4>${gasto.descripcion}</h4>
                <div class="meta">${gasto.categoria || 'Sin categoría'} · ${formatearFecha(gasto.fecha)}</div>
            </div>
            <div class="acciones-gasto">
                <div class="monto-gasto">${formatearMoneda(gasto.monto)}</div>
                <button class="btn-eliminar-gasto" data-id="${gasto.id}">Eliminar</button>
            </div>
        `;

        const btnEliminar = item.querySelector('.btn-eliminar-gasto');
        btnEliminar.addEventListener('click', () => {
            Store.eliminarGasto(gasto.id);
            renderizarFinanzas();
        });

        lista.appendChild(item);
    });
}

function renderizarGrafica(gastos) {
    const canvas = document.getElementById('grafica-gastos');
    const estadoGrafica = document.getElementById('estado-grafica');
    if (!canvas || typeof Chart === 'undefined') return;

    if (graficaGastos) {
        graficaGastos.destroy();
        graficaGastos = null;
    }

    const categorias = {};
    gastos.forEach(gasto => {
        const categoria = gasto.categoria || 'Sin categoría';
        categorias[categoria] = (categorias[categoria] || 0) + Number(gasto.monto || 0);
    });

    const etiquetas = Object.keys(categorias);
    const valores = Object.values(categorias);
    const tieneDatos = etiquetas.length > 0;

    const palette = ['#429155', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
    const colores = etiquetas.map((_, index) => palette[index % palette.length]);

    if (!tieneDatos) {
        if (estadoGrafica) estadoGrafica.classList.add('activo');
        return;
    }

    if (estadoGrafica) estadoGrafica.classList.remove('activo');

    const data = {
        labels: etiquetas,
        datasets: [{
            data: valores,
            backgroundColor: colores,
            borderColor: '#0E1017',
            borderWidth: 2
        }]
    };

    graficaGastos = new Chart(canvas, {
        type: 'doughnut',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#F5F5F5', boxWidth: 12 },
                    display: true
                },
                tooltip: {
                    backgroundColor: '#1E1E2E',
                    titleColor: '#fff',
                    bodyColor: '#ccc'
                }
            },
            cutout: '60%'
        }
    });
}

function formatearMoneda(valor) {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return '';
    const fecha = new Date(`${fechaIso}T00:00:00`);
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}
