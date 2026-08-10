const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

// Normalize newlines
content = content.replace(/\r\n/g, '\n');

// 1. Update updateDashboard
content = content.replace(/function updateDashboard\(\) {/, `function updateDashboard() {
    if (!document.getElementById('total-registros')) return;`);

// 2. Update updateHistorial
content = content.replace(/function updateHistorial\(\) {/, `function updateHistorial() {
    if (!document.getElementById('historial-content')) return;`);

// 3. Update renderizarInventario
content = content.replace(/function renderizarInventario\(\) {/, `function renderizarInventario() {
    if (!document.getElementById('inventario-list')) return;`);

// 4. Update actualizarSelectTiposServicio
content = content.replace(/function actualizarSelectTiposServicio\(\) {/, `function actualizarSelectTiposServicio() {
    const select = document.getElementById('tipoServicio');
    if (select) {`);
content = content.replace(/    \/\/ Si estamos en edición y el tipo actual no está en la lista activa, lo añadimos temporalmente[\s\S]*?    select.innerHTML = html;\n}/, `    // Si estamos en edición y el tipo actual no está en la lista activa, lo añadimos temporalmente
    if (BitacoraApp.currentEdit && !tiposActivos.includes(BitacoraApp.currentEdit.tipoServicio)) {
        html += \`<option value="\${BitacoraApp.currentEdit.tipoServicio}">\${BitacoraApp.currentEdit.tipoServicio} (Inactivo)</option>\`;
    }
    select.innerHTML = html;
    } // end if(select)
}`);

// 5. Update setDefaultValues
content = content.replace(/function setDefaultValues\(\) {/, `function setDefaultValues() {
    const fechaInput = document.getElementById('fechaServicio');
    if (!fechaInput) return;`);

// 6. Remove showPage completely or empty it (it's safe to just empty it to avoid any lingering calls breaking)
content = content.replace(/const originalShowPage = showPage;\nshowPage = function\(pageId\) {[\s\S]*?};\n/, '');
content = content.replace(/function showPage\(pageId\) {[\s\S]*?}\n/, `function showPage(pageId) {
    // Nav handled by HTML links now
    BitacoraApp.currentPage = pageId;
}\n`);

// 7. Update DOMContentLoaded if showPage('registro') is called explicitly
content = content.replace(/showPage\('registro'\);/g, '');

fs.writeFileSync('script.js', content, 'utf8');
console.log('script.js patched for MPA!');
