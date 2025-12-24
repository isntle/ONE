/*
 * auth.js
 * Lógica de autenticación (Login / Registro)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Detectar si estamos en Login o Registro
    const formLogin = document.querySelector('form[action="semana.html"]'); // Selector basado en el action actual
    const formRegistro = document.querySelector('form[action="onboarding.html"]');

    if (formLogin) {
        configurarLogin(formLogin);
    }

    if (formRegistro) {
        configurarRegistro(formRegistro);
    }
});

function configurarLogin(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Simulación de validación
        if (email && password.length >= 4) {
            // Guardar sesión simulada
            const usuario = {
                nombre: "Luis Ernesto", // En una app real vendría del backend
                email: email,
                fechaLogin: new Date().toISOString()
            };

            Store.guardarUsuario(usuario);
            window.location.href = 'semana.html';
        } else {
            alert("Por favor ingresa credenciales válidas");
        }
    });
}

function configurarRegistro(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (nombre && email && password.length >= 8) {
            const nuevoUsuario = {
                nombre: nombre,
                email: email,
                fechaRegistro: new Date().toISOString()
            };

            Store.guardarUsuario(nuevoUsuario);
            window.location.href = 'onboarding.html';
        } else {
            alert("Completa todos los campos correctamente (Contraseña min. 8 caracteres)");
        }
    });
}
