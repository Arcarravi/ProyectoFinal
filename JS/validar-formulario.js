function validarFormulario() {
    const nombre = document.getElementById('nombre').value.trim();
    const motivo = document.getElementById('motivo').value;
    const direccion = document.getElementById('direccion').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    if (!nombre || !motivo || !direccion || !correo || !mensaje) {
        alert("Por favor, completa todos los campos obligatorios.");
        return false;
    }

    if (telefono && !/^\d{10}$/.test(telefono)) {
        alert("El número de teléfono debe tener exactamente 10 dígitos.");
        return false;
    }

    alert("¡Mensaje enviado correctamente!");
    return true;
}
