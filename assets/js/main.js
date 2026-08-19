document.addEventListener("DOMContentLoaded", function() {
    // 1. Cargar componentes (Navbar y Footer) desde assets/components/
    loadComponent("navbar-container", "assets/components/navbar.html");
    loadComponent("footer-container", "assets/components/footer.html");

    // 2. Generar las tarjetas del índice automáticamente
    cargarIndiceSesiones();
});

function loadComponent(id, file) {
    const element = document.getElementById(id);
    if (element) {
        fetch(file)
            .then(response => {
                if (!response.ok) throw new Error(`No se pudo cargar ${file}`);
                return response.text();
            })
            .then(data => { element.innerHTML = data; })
            .catch(error => console.error(error));
    }
}

// Lista de archivos de sesión
const listaSesiones = [
    "sesiones/sesion-01.html",
    "sesiones/sesion-02.html",
    "sesiones/sesion-03.html",
    "sesiones/sesion-04.html",
    "sesiones/sesion-05.html",
    "sesiones/sesion-06-07.html"
];

function cargarIndiceSesiones() {
    const contenedor = document.getElementById('contenedor-tarjetas');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    const promesas = listaSesiones.map(url => {
        return fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const meta = doc.querySelector('.card-metadata');

                if (meta) {
                    const numAttr = meta.getAttribute('data-numero');
                    return {
                        numStr: numAttr, // Texto exacto para mostrar (ej: "06 y 07" o "01")
                        numSort: parseInt(numAttr), // Valor numérico para ordenar correctamente
                        fecha: meta.getAttribute('data-fecha'),
                        titulo: meta.getAttribute('data-titulo'),
                        desc: meta.getAttribute('data-descripcion'),
                        url: url
                    };
                }
                return null;
            })
            .catch(err => {
                console.error("Error al cargar la sesión:", err);
                return null;
            });
    });

    Promise.all(promesas).then(sesiones => {
        const sesionesValidas = sesiones.filter(s => s !== null);
        sesionesValidas.sort((a, b) => b.numSort - a.numSort); // Más nueva primero de forma descendente

        sesionesValidas.forEach(s => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            
            col.innerHTML = `
                            <article class="session-card h-100 rounded-3 p-4 d-flex flex-column">
                                <span class="session-number">${s.numStr}</span>
                                <p class="text-muted mt-3 mb-2">${s.fecha}</p>
                                <h3 class="h4">${s.titulo}</h3>
                                <p class="text-muted small mb-4">${s.desc}</p>
                                <div class="mt-auto">
                                    <button class="btn btn-outline-secondary btn-leer w-100">
                                        Leer sesión
                                    </button>
                                </div>
                            </article>
                        `;

            // Enlazar correctamente el evento click al botón de forma segura
            const btn = col.querySelector('.btn-leer');
            btn.addEventListener('click', () => cargarSesion(s.url));

            contenedor.appendChild(col);
        });
    });
}

// Función global para abrir el modal cargando la sesión por fetch
function cargarSesion(url) {
    const modalContent = document.getElementById('modalContent');
    const modalElement = document.getElementById('sesionModal');
    
    if (!modalContent || !modalElement) return;

    const myModal = new bootstrap.Modal(modalElement);

    modalContent.innerHTML = '<div class="p-5 text-center text-muted">Cargando bitácora...</div>';
    myModal.show();
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar la sesión");
            return response.text();
        })
        .then(html => {
            modalContent.innerHTML = html;
        })
        .catch(err => {
            modalContent.innerHTML = '<div class="p-5 text-center text-danger">Error al cargar la sesión.</div>';
        });
}