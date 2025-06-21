let blogModule = null;

function cargarSeccion(nombre, agregarHistorial = true) {
  fetch(`/Sections/${nombre}.html`)
    .then(response => {
      if (!response.ok) throw new Error('No se pudo cargar la sección.');
      return response.text();
    })
    .then(html => {
      document.getElementById('contenido-dinamico').innerHTML = html;
      window.scrollTo(0, 0);

      // Actualizar URL en el historial del navegador
      if (agregarHistorial) {
        const url = nombre === 'home' ? '/' : `/${nombre}`;
        history.pushState({ seccion: nombre }, '', url);
      }

      // Función específica de la galería
      if (nombre === 'home') {
        inicializarGaleria();
      }

      // Inicializa módulo del blog solo en sección proyectos
      if (nombre === 'proyectos') {
        if (blogModule) {
          blogModule.inicializarBlog();
        } else {
          import('./ctrl_blog.js')
            .then(module => {
              blogModule = module;
              blogModule.inicializarBlog();
            })
            .catch(err => console.error('Error cargando ctrl_blog.js:', err));
        }
      }
    })
    .catch(error => {
      console.error('Error cargando la sección:', error);
      cargarSeccion('error');
    });
}

// Galería de imágenes (inicio)
function inicializarGaleria() {
  const imagenes = document.querySelectorAll('.galeria img');
  const prev = document.querySelector('.prev');
  const next = document.querySelector('.next');
  const contenedorIndicadores = document.querySelector('.indicadores');
  let indice = 0;
  let intervaloAutoplay;

  if (!imagenes.length) return;

  function mostrarImagen(i) {
    imagenes.forEach((img, idx) => {
      img.classList.remove('mostrar');
      if (i === idx) img.classList.add('mostrar');
    });
    actualizarIndicadores();
  }

  function actualizarIndicadores() {
    const puntos = document.querySelectorAll('.indicadores span');
    puntos.forEach((punto, idx) => {
      punto.classList.toggle('activo', idx === indice);
    });
  }

  function siguienteImagen() {
    indice = (indice + 1) % imagenes.length;
    mostrarImagen(indice);
  }

  function anteriorImagen() {
    indice = (indice - 1 + imagenes.length) % imagenes.length;
    mostrarImagen(indice);
  }

  function reiniciarAutoplay() {
    clearInterval(intervaloAutoplay);
    intervaloAutoplay = setInterval(siguienteImagen, 5000);
  }

  prev?.addEventListener('click', () => {
    anteriorImagen();
    reiniciarAutoplay();
  });

  next?.addEventListener('click', () => {
    siguienteImagen();
    reiniciarAutoplay();
  });

  contenedorIndicadores.innerHTML = '';
  imagenes.forEach((_, idx) => {
    const punto = document.createElement('span');
    if (idx === 0) punto.classList.add('activo');
    punto.addEventListener('click', () => {
      indice = idx;
      mostrarImagen(indice);
      reiniciarAutoplay();
    });
    contenedorIndicadores.appendChild(punto);
  });

  mostrarImagen(0);
  intervaloAutoplay = setInterval(siguienteImagen, 5000);
}

// Inicialización del sitio
document.addEventListener('DOMContentLoaded', () => {
  // Carga la sección según la URL al abrir el sitio
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'home';
  cargarSeccion(path, false);

  // Interceptar clics en enlaces del menú
  document.querySelectorAll('.menu-items a[data-seccion]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const seccion = e.currentTarget.getAttribute('data-seccion');
      cargarSeccion(seccion);
    });
  });

  // Detectar navegación por el historial del navegador
  window.addEventListener('popstate', e => {
    const seccion = (e.state && e.state.seccion) || 'home';
    cargarSeccion(seccion, false);
  });
});
