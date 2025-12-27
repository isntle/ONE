/*
 * ui.js
 * Sistema de Interfaz de Usuario (Modales, Toasts, Helpers)
 */

const UI = {
    // --- TOASTS ---
    toastContainer: null,

    initToasts: () => {
        if (!document.querySelector('.toast-container-ui')) {
            const container = document.createElement('div');
            container.className = 'toast-container-ui';
            document.body.appendChild(container);
            UI.toastContainer = container;
        } else {
            UI.toastContainer = document.querySelector('.toast-container-ui');
        }
    },

    toast: (mensaje, tipo = 'info') => {
        UI.initToasts();

        const toast = document.createElement('div');
        toast.className = `toast-ui toast-${tipo}`;

        // Iconos SVG simples inline
        let iconSvg = '';
        if (tipo === 'success') iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        if (tipo === 'error') iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        if (tipo === 'info') iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-content">${mensaje}</div>
        `;

        UI.toastContainer.appendChild(toast);

        // Auto eliminar
        setTimeout(() => {
            toast.style.animation = 'fadeOutRight 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // --- MODALES ---
    confirm: ({ titulo, mensaje, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", onConfirm }) => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay-ui';

            overlay.innerHTML = `
                <div class="modal-content-ui">
                    <h3>${titulo}</h3>
                    <p>${mensaje}</p>
                    <div class="modal-actions-ui">
                        <button class="btn-cancel-ui">${textoCancelar}</button>
                        <button class="btn-confirm-ui">${textoConfirmar}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Manejadores (Handlers)
            const btnCancel = overlay.querySelector('.btn-cancel-ui');
            const btnConfirm = overlay.querySelector('.btn-confirm-ui');

            const cerrar = (resultado) => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 200);
                resolve(resultado);
                if (resultado && onConfirm) onConfirm();
            };

            btnCancel.addEventListener('click', () => cerrar(false));
            btnConfirm.addEventListener('click', () => cerrar(true));

            // Cerrar al click fuera? (Opcional, por ahora estricto)
            // overlay.addEventListener('click', (e) => { if(e.target === overlay) cerrar(false); });
        });
    },

    alert: ({ titulo, mensaje }) => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay-ui';

            overlay.innerHTML = `
                <div class="modal-content-ui">
                    <h3>${titulo}</h3>
                    <p>${mensaje}</p>
                    <div class="modal-actions-ui">
                        <button class="btn-confirm-ui" style="width:100%">Entendido</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const btnOk = overlay.querySelector('.btn-confirm-ui');
            btnOk.addEventListener('click', () => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 200);
                resolve(true);
            });
        });
    },

    // --- UTILIDADES EXISTENTES ---
    actualizarTitulo: (titulo) => {
        document.title = `${titulo} | ONE`;
    },

    alternarMenuLateral: () => {
        const sidebar = document.querySelector('.menu-lateral');
        if (sidebar) sidebar.classList.toggle('oculto');
    }
};
