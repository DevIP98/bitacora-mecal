const fs = require('fs');

const originalHtml = fs.readFileSync('index.html', 'utf8');

const registroStart = originalHtml.indexOf('<div id="page-registro"');
const dashboardStart = originalHtml.indexOf('<div id="page-dashboard"');
const historialStart = originalHtml.indexOf('<div id="page-historial"');
const inventarioStart = originalHtml.indexOf('<div id="page-inventario"');
const mainEnd = originalHtml.indexOf('</main>');

if (registroStart === -1 || dashboardStart === -1 || historialStart === -1 || inventarioStart === -1) {
    console.error("Could not find all div wrappers!");
    process.exit(1);
}

// Extract HTML for each view by taking the chunk until the next view starts (or </main> for the last one)
const registroHtml = originalHtml.substring(registroStart, dashboardStart);
const dashboardHtml = originalHtml.substring(dashboardStart, historialStart);
const historialHtml = originalHtml.substring(historialStart, inventarioStart);
const inventarioHtml = originalHtml.substring(inventarioStart, mainEnd);

const cleanSection = (html) => html.replace(/style="display:\s*none;?"/g, '').replace(/class="page"/g, 'class="page active"');

const getNav = (activePage) => `
            <!-- Navegación -->
            <nav class="nav-menu" id="navMenu">
                <a href="index.html" class="btn-nav ${activePage === 'registro' ? 'active' : ''}" style="text-decoration: none;">
                    <i class="fas fa-plus"></i> Nuevo Registro
                </a>
                <a href="dashboard.html" class="btn-nav ${activePage === 'dashboard' ? 'active' : ''}" style="text-decoration: none;">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
                <a href="historial.html" class="btn-nav ${activePage === 'historial' ? 'active' : ''}" style="text-decoration: none;">
                    <i class="fas fa-history"></i> Historial
                </a>
                <a href="inventario.html" class="btn-nav ${activePage === 'inventario' ? 'active' : ''}" style="text-decoration: none;">
                    <i class="fas fa-boxes"></i> Inventario
                </a>
            </nav>`;

const createPage = (mainContent, activePage) => {
    let pageHtml = originalHtml;
    
    // Replace the entire <main> block
    const mainStartIdx = originalHtml.indexOf('<main class="main-content">');
    const newMain = `<main class="main-content">\n        ${cleanSection(mainContent)}    </main>`;
    pageHtml = originalHtml.substring(0, mainStartIdx) + newMain + originalHtml.substring(mainEnd + 7);
    
    // Replace nav
    pageHtml = pageHtml.replace(/<!-- Navegación -->[\s\S]*?<\/nav>/, getNav(activePage));
    
    // Fix title
    const titles = {
        'registro': 'Nuevo Registro',
        'dashboard': 'Dashboard',
        'historial': 'Historial',
        'inventario': 'Inventario'
    };
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/, `<title>${titles[activePage]} - Bitácora MECAL</title>`);
    
    return pageHtml;
};

fs.writeFileSync('index.html', createPage(registroHtml, 'registro'));
fs.writeFileSync('dashboard.html', createPage(dashboardHtml, 'dashboard'));
fs.writeFileSync('historial.html', createPage(historialHtml, 'historial'));
fs.writeFileSync('inventario.html', createPage(inventarioHtml, 'inventario'));

console.log("Pages generated successfully!");
