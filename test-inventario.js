// Test básico para verificar funcionamiento del inventario
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== TEST DE INVENTARIO ===');
    
    // Verificar que BitacoraApp existe
    if (typeof BitacoraApp !== 'undefined') {
        console.log('✓ BitacoraApp definido');
        
        // Verificar inventario inicial
        if (BitacoraApp.inventario && BitacoraApp.inventario.length > 0) {
            console.log('✓ Inventario inicial cargado:', BitacoraApp.inventario.length, 'equipos');
        } else {
            console.log('✗ Inventario no encontrado');
        }
        
        // Verificar funciones clave
        const funciones = [
            'renderizarInventario',
            'abrirModalEquipo', 
            'guardarEquipo',
            'eliminarEquipo',
            'filtrarInventario'
        ];
        
        funciones.forEach(funcion => {
            if (typeof window[funcion] === 'function') {
                console.log('✓ Función', funcion, 'disponible');
            } else {
                console.log('✗ Función', funcion, 'no encontrada');
            }
        });
        
    } else {
        console.log('✗ BitacoraApp no está definido');
    }
    
    console.log('=== FIN TEST ===');
});
