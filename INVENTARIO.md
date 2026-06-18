# Inventario de Equipos - Bitácora MECAL

## Descripción
Nueva funcionalidad agregada al sistema de bitácora que permite gestionar un inventario completo de equipos audiovisuales de la iglesia.

## Características

### ✨ Funcionalidades Principales
- **Visualización de Inventario**: Tabla con todos los equipos organizados por ID, nombre, categoría, cantidad y descripción
- **Gestión CRUD**: Crear, editar y eliminar equipos
- **Filtros**: Por categoría y búsqueda por texto
- **Exportación**: Descargar inventario en formato JSON
- **Persistencia**: Datos guardados en localStorage del navegador

### 📋 Equipos Predefinidos
El sistema viene con los siguientes equipos configurados por defecto:

#### Audio
- #1 Micrófonos Alámbricos
- #2 Micrófonos Inalámbricos  
- #3 Planta de Sonido

#### Computadoras
- #7 CPU Principal
- #8 Monitor Principal

#### Conectividad
- #9 Cables HDMI
- #10 Cables de Audio

#### Internet
- #11 Router WiFi

#### Video
- #4 Cámara de Celular
- #5 TV 1 (Pantalla izquierda del altar)
- #6 TV 2 (Pantalla derecha del altar)

### 🎨 Interfaz de Usuario
- **Diseño Responsive**: Se adapta a móviles y escritorio
- **Badges de Categoría**: Colores distintivos para cada categoría
- **Modal Intuitivo**: Formulario limpio para agregar/editar equipos
- **Filtros en Tiempo Real**: Búsqueda instantánea sin recargar página

### 🔧 Acciones Disponibles
- **Agregar Equipo**: Botón "Agregar Equipo" abre modal con formulario
- **Editar Equipo**: Botón de edición en cada fila de la tabla
- **Eliminar Equipo**: Botón de eliminación con confirmación
- **Filtrar por Categoría**: Dropdown con todas las categorías
- **Buscar**: Campo de texto para buscar por nombre o descripción
- **Exportar**: Descarga archivo JSON con todo el inventario

## Integración con Sistema Existente

### Navegación
Se agregó un nuevo botón "Inventario" en la barra de navegación principal.

### Consistencia de Diseño  
- Utiliza las mismas variables CSS del sistema
- Mantiene la paleta de colores azul/morado
- Iconos de Font Awesome consistentes
- Estilos de botones y formularios unificados

### Almacenamiento
- Los datos se guardan en `localStorage` con la clave `bitacora-inventario`
- Compatible con el sistema de notificaciones existente
- Integrado con el namespace `BitacoraApp`

## Archivos Modificados

### `index.html`
- Agregado botón de navegación "Inventario"
- Nueva página `page-inventario` con tabla y filtros
- Modal `modal-equipo` para gestión de equipos

### `styles.css`  
- Estilos específicos para inventario (`.inventario-*`)
- Badges de categorías con colores distintivos
- Tabla responsive con hover effects
- Modal específico para equipos

### `script.js`
- Namespace `BitacoraApp.inventario` con datos iniciales
- Funciones CRUD completas para equipos
- Sistema de filtros y búsqueda
- Exportación a JSON
- Event listeners para modal y formularios

## Uso

1. **Acceder al Inventario**: Click en botón "Inventario" en la navegación
2. **Ver Equipos**: Se muestra tabla con todos los equipos registrados
3. **Filtrar**: Usar dropdown de categorías o campo de búsqueda
4. **Agregar Equipo**: Click "Agregar Equipo" → llenar formulario → "Guardar"
5. **Editar Equipo**: Click botón editar en la fila → modificar → "Guardar"  
6. **Eliminar Equipo**: Click botón eliminar → confirmar eliminación
7. **Exportar**: Click "Exportar" para descargar archivo JSON

## Futuras Mejoras Sugeridas
- Importar equipos desde archivo JSON
- Campos adicionales (marca, modelo, fecha de compra, estado físico)
- Fotos de equipos
- Historial de mantenimiento
- Integración con el sistema de registros de bitácora
- Reportes de equipos más usados/problemáticos
- Códigos QR para identificación rápida
