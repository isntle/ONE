/*
 * onboarding.js
 * Lógica para el wizard de configuración inicial
 */

document.addEventListener('DOMContentLoaded', () => {
    // Interacción de wizard (solo visual por ahora)
    const pasos = document.querySelectorAll('.paso');
    pasos.forEach((p, i) => {
        p.addEventListener('click', () => {
            pasos.forEach(x => x.classList.remove('activo'));
            p.classList.add('activo');
        });
    });

    // Manejo del formulario
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Recoger preferencias
            const tema = document.getElementById('tema').value;
            // (Aquí podríamos recoger los espacios seleccionados también)

            // Actualizar usuario en Store
            const usuario = Store.obtenerUsuario();
            if (usuario) {
                usuario.tema = tema;
                usuario.configurado = true;
                Store.guardarUsuario(usuario);
            }

            // Redirigir
            window.location.href = 'semana.html';
        });
    }

    // Botones de espacios (visual)
    const botonesEspacio = document.querySelectorAll('.boton-secundario');
    botonesEspacio.forEach(btn => {
        btn.addEventListener('click', () => {
            // Alternar estilo "seleccionado" simulado
            if (btn.style.backgroundColor === 'rgb(66, 145, 85)' || btn.style.backgroundColor === '#429155') {
                // Desactivar
                btn.style.backgroundColor = 'transparent';
                btn.style.color = '#C7C8D5';
                btn.style.border = '1px solid #3E2C5C';
            } else {
                // Activar
                btn.style.backgroundColor = '#429155';
                btn.style.color = '#FFFFFF';
                btn.style.border = 'none';
            }
        });
    });
});
