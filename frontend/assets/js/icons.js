/*
 * icons.js
 * Utilidad personal para renderizar los nuevos iconos minimalistas.
 * Se especializa en la SHELL de la aplicación (Sidebar y Header).
 */

const IconMapping = {
    'user': 'user-4.svg',
    'graduation-cap': 'graduation-cap-1.svg',
    'briefcase': 'briefcase-1.svg',
    'calendar': 'calendar-days.svg',
    'layout-grid': 'layout-9.svg',
    'check-circle': 'check-circle-1.svg',
    'bar-chart-3': 'pie-chart-2.svg',
    'zap': 'bolt-2.svg',
    'gauge': 'gauge-1.svg',
    'sparkles': 'bulb-2.svg',
    'alert-circle': 'xmark-circle.svg',
    'minus-circle': 'minus-circle.svg',
    'plus': 'plus.svg',
    'calendar-days': 'calendar-days.svg',
    'arrow-left': 'arrow-left.svg',
    'play': 'play.svg',
    'pause': 'pause.svg',
    'square': 'hand-stop.svg',
    'columns-3': 'layout-26.svg',
    'target': 'target-user.svg',
    'brain': 'bulb-2.svg',
    'flame': 'bolt-2.svg',
    'heading': 'pencil-1.svg',
    'bold': 'bold.svg',
    'list': 'menu-hamburger-1.svg',
    'align-center': 'align-text-center.svg',
    'link': 'link-2-angular-right.svg'
};

const Icons = {
    async init() {
        // Buscar elementos con el atributo data-app-icon para los iconos nuevos
        const iconElements = document.querySelectorAll('i[data-app-icon]');
        for (const el of iconElements) {
            const iconName = el.getAttribute('data-app-icon');
            const newIconFile = IconMapping[iconName];

            if (newIconFile) {
                await this.replaceIcon(el, newIconFile);
            }
        }
    },

    async replaceIcon(element, filename) {
        try {
            // Ajustar ruta según la ubicación o usar ruta absoluta relativa a la raíz
            const response = await fetch(`../assets/icons/new icons/regular-free-icon-svgs/${filename}`);
            if (!response.ok) throw new Error(`Error cargando ${filename}`);

            let svgText = await response.text();

            // Forzar currentColor para que herede estilos CSS
            svgText = svgText.replace(/fill="#[a-zA-Z0-9]+"/g, 'fill="currentColor"');
            svgText = svgText.replace(/stroke="#[a-zA-Z0-9]+"/g, 'stroke="currentColor"');

            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svg = doc.querySelector('svg');

            if (svg) {
                if (element.className) {
                    svg.setAttribute('class', element.className);
                }

                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.style.display = 'block';

                element.innerHTML = '';
                element.appendChild(svg);
            }
        } catch (error) {
            console.error(`Error procesando icono ${filename}:`, error);
        }
    }
};

// Exportar globalmente
window.Icons = Icons;
