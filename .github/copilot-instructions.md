<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instrucciones de Copilot para Bitácora Producción MECAL

## Contexto del Proyecto
Este es un sistema web de bitácora para registrar el estado de equipos audiovisuales en una iglesia (MECAL). 

## Características Principales
- **Aplicación web simple**: HTML, CSS y JavaScript vanilla
- **Sin base de datos**: Utiliza localStorage para persistencia
- **Diseño responsive**: Funciona en móviles y escritorio
- **Categorías de equipos**: Audio, Computadoras, Conectividad, Internet, Video
- **Estados**: Bueno, Regular, Malo
- **Funcionalidades**: Registro, Dashboard, Historial

## Estructura del Código
- `index.html`: Interfaz principal con formulario y páginas
- `styles.css`: Estilos modernos con variables CSS y diseño responsive  
- `script.js`: Lógica de la aplicación, manejo de datos y eventos

## Patrones de Código
- Uso de namespace `BitacoraApp` para organizar el estado global
- Funciones modulares y reutilizables
- Event delegation para eventos dinámicos
- Validación de formularios antes de guardar
- Notificaciones user-friendly

## Tecnologías Utilizadas
- HTML5 semántico
- CSS3 con variables personalizadas y Grid/Flexbox
- JavaScript ES6+ (sin frameworks)
- Font Awesome para iconos
- LocalStorage para persistencia

## Consideraciones de Diseño
- Interfaz intuitiva inspirada en el diseño original del usuario
- Colores profesionales con esquema azul/morado
- Accesibilidad y usabilidad priorizadas
- Feedback visual inmediato para acciones del usuario

## Futuras Mejoras Sugeridas
- Exportación a PDF
- Sincronización con servicios en la nube
- Notificaciones push
- Análisis de tendencias de equipos
