const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8');
c += `

function actualizarSelectTiposServicio() {
    const select = document.getElementById('tipoServicio');
    if (!select) return;
    
    let html = '<option value="">Seleccionar...</option>';
    const tiposActivos = BitacoraApp.tiposServicio || [];
    
    tiposActivos.forEach(tipo => {
        html += \`<option value="\${tipo}">\${tipo}</option>\`;
    });
    
    // Si estamos en edición y el tipo actual no está en la lista activa, lo añadimos temporalmente
    if (BitacoraApp.currentEdit && !tiposActivos.includes(BitacoraApp.currentEdit.tipoServicio)) {
        html += \`<option value="\${BitacoraApp.currentEdit.tipoServicio}">\${BitacoraApp.currentEdit.tipoServicio} (Inactivo)</option>\`;
    }
    
    html += '<option value="__NUEVO__" class="option-nuevo">+ Añadir nuevo tipo...</option>';
    select.innerHTML = html;
}
`;
fs.writeFileSync('script.js', c);
