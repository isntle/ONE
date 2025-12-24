/*
 * ui.js
 * Funciones de utilidad para la interfaz de usuario
 */

const UI = {
    actualizarTitulo: (titulo) => {
        document.title = `${titulo} | ONE`;
    },

    mostrarNotificacion: (mensaje, tipo = 'info') => {
        // Implementación futura de toast/notificaciones
        console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    },

    alternarMenuLateral: () => {
        const sidebar = document.querySelector('.menu-lateral');
        if (sidebar) {
            sidebar.classList.toggle('oculto');
        }
    }
};
