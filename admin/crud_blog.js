import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vdobejocioevmjzfbhkk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkb2Jlam9jaW9ldm1qemZiaGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMDYzMDMsImV4cCI6MjA2MTg4MjMwM30.5ptlvFzDxJbRJmwrq4RQ2Gx1vZH99ZNHxaWdTeMcyGg';
const supabase = createClient(supabaseUrl, supabaseKey);

const form = document.getElementById('entrada-form');
const entradasContainer = document.getElementById('entradas-container');

let currentUserId = null;
let editingEntryId = null;

// Función para cargar usuario actual
async function cargarUsuario() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    alert('No hay usuario autenticado');
    window.location.href = 'login.html';
    return;
  }
  currentUserId = user.id;

  // Aquí actualizamos el texto de bienvenida
  const welcomeSpan = document.getElementById('welcome-text');
  if (welcomeSpan) {
    welcomeSpan.textContent = `Bienvenido: ${user.email}`;  // o user.user_metadata?.full_name si tienes nombre
  }
}

// Función para listar entradas
async function listarEntradas() {
  const { data, error } = await supabase
    .from('entradas_blog')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando entradas:', error);
    return;
  }

  entradasContainer.innerHTML = '';

  if (data.length === 0) {
    entradasContainer.textContent = 'No hay entradas aún.';
    return;
  }

  data.forEach(entry => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${entry.titulo}</h3>
      <p><em>${entry.resumen || ''}</em></p>
      <p>${entry.contenido.substring(0, 100)}...</p>
      ${entry.imagen_url ? `<img src="${entry.imagen_url}" alt="Imagen de ${entry.titulo}" width="150"/>` : ''}
      <button data-id="${entry.id}" class="editar-btn">Editar</button>
      <button data-id="${entry.id}" class="eliminar-btn">Eliminar</button>
      <hr/>
    `;
    entradasContainer.appendChild(div);
  });

  // Asociar eventos a botones de editar y eliminar
  document.querySelectorAll('.editar-btn').forEach(btn => {
    btn.onclick = () => editarEntrada(btn.dataset.id);
  });
  document.querySelectorAll('.eliminar-btn').forEach(btn => {
    btn.onclick = () => eliminarEntrada(btn.dataset.id);
  });
}

// Función para limpiar formulario
function limpiarFormulario() {
  form.reset();
  editingEntryId = null;
  document.getElementById('entrada-id').value = '';
  document.getElementById('imagen-nombre').textContent = '';
}

// Función para editar entrada
async function editarEntrada(id) {
  const { data, error } = await supabase
    .from('entradas_blog')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    alert('Error al cargar la entrada para editar');
    console.error(error);
    return;
  }

  editingEntryId = id;
  document.getElementById('entrada-id').value = data.id;
  document.getElementById('titulo').value = data.titulo;
  document.getElementById('resumen').value = data.resumen || '';
  document.getElementById('contenido').value = data.contenido || '';
  document.getElementById('imagen-nombre').textContent = data.imagen_url ? 'Imagen actual cargada' : '';
}

// Función para eliminar entrada
async function eliminarEntrada(id) {
  if (!confirm('¿Seguro que quieres eliminar esta entrada?')) return;

  const { error } = await supabase
    .from('entradas_blog')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Error eliminando la entrada');
    console.error(error);
  } else {
    alert('Entrada eliminada');
    listarEntradas();
    limpiarFormulario();
  }
}

// Función para subir imagen y retornar URL pública
async function subirImagen(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${currentUserId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('imagenes-blog') // ✅ nombre correcto del bucket
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      alert('Error subiendo imagen');
      return null;
    }

    // ✅ Obtener URL pública correctamente
    const { data: publicUrlData, error: urlError } = supabase.storage
      .from('imagenes-blog')
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('Error obteniendo URL pública:', urlError);
      alert('Error obteniendo URL de la imagen');
      return null;
    }

    return publicUrlData.publicUrl;
  } catch (e) {
    console.error('Error inesperado al subir imagen:', e);
    alert('Error inesperado al subir imagen');
    return null;
  }
}

// Manejo envío formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = form.titulo.value.trim();
  const resumen = form.resumen.value.trim();
  const contenido = form.contenido.value.trim();
  const imagenFile = form.imagen.files[0];
  let imagen_url = null;

  if (imagenFile) {
    imagen_url = await subirImagen(imagenFile);
    if (!imagen_url) return;
  }

  if (!titulo || !contenido) {
    alert('El título y contenido son obligatorios');
    return;
  }

  if (editingEntryId) {
    // Actualizar
    const { error } = await supabase
      .from('entradas_blog')
      .update({
        titulo,
        resumen,
        contenido,
        ...(imagen_url && { imagen_url })
      })
      .eq('id', editingEntryId);

    if (error) {
      alert('Error actualizando entrada');
      console.error(error);
      return;
    }

    alert('Entrada actualizada');
  } else {
    // Crear nueva
    const { error } = await supabase
      .from('entradas_blog')
      .insert({
        titulo,
        resumen,
        contenido,
        imagen_url,
        user_id: currentUserId
      });

    if (error) {
      alert('Error creando entrada');
      console.error(error);
      return;
    }

    alert('Entrada creada');
  }

  limpiarFormulario();
  listarEntradas();
});

// Cancelar edición
document.getElementById('cancelar').addEventListener('click', () => {
  limpiarFormulario();
});

// Inicialización
(async () => {
  await cargarUsuario();
  await listarEntradas();
})();

document.getElementById('logout-btn').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('Error al cerrar sesión');
    console.error(error);
  } else {
    window.location.href = 'login.html';
  }
});