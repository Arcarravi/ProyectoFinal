import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://vdobejocioevmjzfbhkk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkb2Jlam9jaW9ldm1qemZiaGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMDYzMDMsImV4cCI6MjA2MTg4MjMwM30.5ptlvFzDxJbRJmwrq4RQ2Gx1vZH99ZNHxaWdTeMcyGg'
);

async function cargarEntradas() {
  const blogListado = document.getElementById('blog-listado');
  const blogContenido = document.getElementById('blog-contenido');

  if (!blogListado || !blogContenido) {
    console.warn('⌛ Elementos del blog no disponibles. Reintentando...');
    setTimeout(cargarEntradas, 100);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('entradas_blog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    blogListado.innerHTML = '';

    if (!data || data.length === 0) {
      blogListado.innerHTML = '<p>No hay entradas disponibles.</p>';
      return;
    }

    data.forEach(entry => {
      const preview = document.createElement('div');
      preview.className = 'entrada-preview';

      const fecha = entry.created_at
        ? new Date(entry.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Fecha no disponible';

      preview.innerHTML = `
        <h3>${entry.titulo || 'Sin título'}</h3>
        <small>${fecha}</small>
        <p>${entry.resumen || (entry.contenido ? entry.contenido.substring(0, 120) + '...' : '')}</p>
        ${entry.imagen_url ? `<img src="${entry.imagen_url}" alt="Imagen de ${entry.titulo}" class="preview-img"/>` : ''}
        <div style="text-align: right; margin-top: 10px;">
          <button class="leer-btn" data-id="${entry.id}" style="
            padding: 8px 16px;
            background-color: #004aad;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.3s ease;
          ">Leer más</button>
        </div>
      `;

      blogListado.appendChild(preview);
    });

    document.querySelectorAll('.leer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        // Actualizar URL con query param sin recargar
        history.pushState({ entradaId: id }, '', `?entrada=${id}`);
        mostrarEntrada(id);
      });
    });

  } catch (err) {
    console.error('❌ Error cargando entradas:', err);
    blogListado.innerHTML = '<p>Error al cargar el contenido.</p>';
  }
}

async function mostrarEntrada(id) {
  const blogContenido = document.getElementById('blog-contenido');

  try {
    const { data, error } = await supabase
      .from('entradas_blog')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      blogContenido.innerHTML = '<p>Error al cargar la entrada.</p>';
      return;
    }

    const fecha = data.created_at
      ? new Date(data.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Fecha no disponible';

    blogContenido.innerHTML = `
      <h2>${data.titulo}</h2>
      <small>${fecha}</small>
      ${data.imagen_url ? `<img src="${data.imagen_url}" alt="Imagen" class="contenido-img"/>` : ''}
      <p>${data.contenido}</p>
      <button id="volver-btn" style="
        padding: 8px 16px;
        background-color: #666;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 15px;
      ">Volver al listado</button>
    `;

    document.getElementById('volver-btn').addEventListener('click', () => {
      // Limpiar query param al volver
      history.pushState({}, '', window.location.pathname);
      cargarEntradas();
      // También restablecer contenido inicial del blogContenido
      blogContenido.innerHTML = `
        <h2>Explora nuestros proyectos e ideas</h2>
        <p>Bienvenido a nuestro blog <strong>SIEG</strong>. Aquí compartimos experiencias, avances técnicos y reflexiones sobre el diseño estructural, la ingeniería y los proyectos que marcan nuestra trayectoria.</p>
        <p>Selecciona una entrada en el panel izquierdo para leerla completa. Esperamos que cada publicación te inspire y te brinde una nueva perspectiva.</p>
        <p style="color:#999; font-style:italic;">Gracias por visitarnos.</p>
        <img src="/Assets/Images/Mesa_de_trabajo_color.png" height="300px" width="300px" style="display: block; margin: 20px auto;">
      `;
    });

  } catch (err) {
    console.error('❌ Error al mostrar la entrada:', err);
    blogContenido.innerHTML = '<p>Error inesperado al mostrar la entrada.</p>';
  }
}

export function inicializarBlog() {
  const esperarElementos = () => {
    const blogListado = document.getElementById('blog-listado');
    const blogContenido = document.getElementById('blog-contenido');

    if (blogListado && blogContenido) {
      console.log('✅ Blog cargado. Iniciando...');
      
      // Revisa si hay ?entrada=ID en la URL y carga esa entrada directo
      const params = new URLSearchParams(window.location.search);
      const entradaId = params.get('entrada');
      if (entradaId) {
        mostrarEntrada(entradaId);
      } else {
        cargarEntradas();
      }

    } else {
      console.log('⌛ Esperando elementos del DOM...');
      setTimeout(esperarElementos, 100);
    }
  };

  esperarElementos();

  // Manejar navegación hacia atrás y adelante del navegador
  window.addEventListener('popstate', (event) => {
    const params = new URLSearchParams(window.location.search);
    const entradaId = params.get('entrada');
    if (entradaId) {
      mostrarEntrada(entradaId);
    } else {
      cargarEntradas();
    }
  });
}
