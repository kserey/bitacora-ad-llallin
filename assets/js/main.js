document.addEventListener("DOMContentLoaded", function() {
    // 1. Cargar componentes comunes (Navbar y Footer)
    loadComponent("navbar-container", "assets/components/navbar.html");
    loadComponent("footer-container", "assets/components/footer.html");

    // 2. Inicializar módulos según la página en la que estemos
    inicializarModuloDinamico({
        contenedorId: 'contenedor-tarjetas',
        listaRutas: [
            "sesiones/sesion-01.html",
            "sesiones/sesion-02.html",
            "sesiones/sesion-03.html",
            "sesiones/sesion-04.html",
            "sesiones/sesion-05.html",
            "sesiones/sesion-06-07.html",
            "sesiones/sesion-08.html"
        ],
        modalContentId: 'modalContent',
        modalElementId: 'sesionModal',
        tipo: 'sesion'
    });

    inicializarModuloDinamico({
        contenedorId: 'contenedor-tarjetas-tintes',
        listaRutas: [
            "tintes/ficha-01.html"
        ],
        modalContentId: 'modalContentTintes',
        modalElementId: 'fichaModal',
        tipo: 'tinte'
    });
});

function marcarPaginaActiva() {
    const rutaActual = window.location.pathname;
    
    // Si estamos en la página de tintes
    if (rutaActual.includes("tintes.html")) {
        const linkTintes = document.getElementById("nav-tintes");
        if (linkTintes) linkTintes.classList.add("active", "fw-bold");
    } else {
        // Por defecto estamos en el inicio
        const linkInicio = document.getElementById("nav-inicio");
        if (linkInicio) linkInicio.classList.add("active", "fw-bold");
    }
}

function loadComponent(id, file) {
    const element = document.getElementById(id);
    if (element) {
        fetch(file)
            .then(response => {
                if (!response.ok) throw new Error(`No se pudo cargar ${file}`);
                return response.text();
            })
            .then(data => { 
                element.innerHTML = data; 
                // Llamamos a marcar la página activa justo después de inyectar el navbar
                if (id === "navbar-container") {
                    marcarPaginaActiva();
                }
            })
            .catch(error => console.error(error));
    }
}

// Función unificada y genérica para cualquier listado modular (Sesiones o Fichas)
function inicializarModuloDinamico(config) {
    const contenedor = document.getElementById(config.contenedorId);
    if (!contenedor) return; // Si no existe el contenedor en esta página, no hace nada

    contenedor.innerHTML = '';

    const promesas = config.listaRutas.map(url => {
        return fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const meta = doc.querySelector('.card-metadata');

                if (meta) {
                    const numAttr = meta.getAttribute('data-numero');
                    return {
                        numStr: numAttr, 
                        numSort: parseInt(numAttr), 
                        fecha: meta.getAttribute('data-fecha'),
                        titulo: meta.getAttribute('data-titulo'),
                        desc: meta.getAttribute('data-descripcion'),
                        url: url
                    };
                }
                return null;
            })
            .catch(err => {
                console.error("Error al cargar el archivo:", err);
                return null;
            });
    });

    Promise.all(promesas).then(elementos => {
        const validos = elementos.filter(e => e !== null);
        validos.sort((a, b) => b.numSort - a.numSort); // Más nuevo primero

        validos.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            
            const badgeTexto = config.tipo === 'sesion' ? item.numStr : `Ficha N° ${item.numStr}`;
            const botonTexto = config.tipo === 'sesion' ? 'Leer sesión' : 'Ver ficha completa';

            col.innerHTML = `
                <article class="session-card h-100 rounded-3 p-4 d-flex flex-column">
                    <span class="session-number">${badgeTexto}</span>
                    <p class="text-muted mt-3 mb-2">${item.fecha}</p>
                    <h3 class="h4">${item.titulo}</h3>
                    <p class="text-muted small mb-4">${item.desc}</p>
                    <div class="mt-auto">
                        <button class="btn btn-outline-secondary btn-leer w-100 btn-accion">
                            ${botonTexto}
                        </button>
                    </div>
                </article>
            `;

            const btn = col.querySelector('.btn-accion');
            btn.addEventListener('click', () => abrirModalDinamico(item.url, config.modalContentId, config.modalElementId));

            contenedor.appendChild(col);
        });
    });
}

function abrirModalDinamico(url, modalContentId, modalElementId) {
    const modalContent = document.getElementById(modalContentId);
    const modalElement = document.getElementById(modalElementId);
    
    if (!modalContent || !modalElement) return;

    const myModal = new bootstrap.Modal(modalElement);

    modalContent.innerHTML = '<div class="p-5 text-center text-muted">Cargando contenido...</div>';
    myModal.show();
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el archivo");
            return response.text();
        })
        .then(html => {
            modalContent.innerHTML = html;
        })
        .catch(err => {
            modalContent.innerHTML = '<div class="p-5 text-center text-danger">Error al cargar el contenido.</div>';
        });
}