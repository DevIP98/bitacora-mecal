const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
console.log('registro:', h.indexOf('<section id="page-registro"'));
console.log('dashboard:', h.indexOf('<section id="page-dashboard"'));
console.log('historial:', h.indexOf('<section id="page-historial"'));
console.log('inventario:', h.indexOf('<section id="page-inventario"'));
