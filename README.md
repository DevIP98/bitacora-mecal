# 📋 Bitácora Producción MECAL

Sistema web de bitácora para registrar y monitorear el estado de equipos audiovisuales en servicios religiosos.
- 📊 **Dashboard** - Vista en tiempo real del estado de equipos
- 📈 **Historial** - Registro completo de todos los servicios
- 🎨 **Interfaz moderna** - Diseño profesional y fácil de usar
- ⚡ **GitHub Pages** - Hospedaje gratuito y accesible desde cualquier lugar
- 🔐 **Sincronización segura** - Datos respaldados en GitHub con versionado

## 🛠️ Categorías de Equipos

### 🔊 Audio
- Micrófonos Inalámbricos
- Micrófonos de Instalaciones
- Piano de Senda

### 💻 Computadoras
- CPU Principal
- Monitor Principal

### 🌐 Conectividad
- Cables HDMI
- Cajas de Audio

### 📡 Internet
- Router WiFi

### 📹 Video
- Cámara de Captura
- TV 1
- TV 2

## 🎯 Estados de Equipos

- 🟢 **Bueno** - Funcionando perfectamente
- 🟡 **Regular** - Funciona pero con problemas menores
- 🔴 **Malo** - No funciona o requiere reparación urgente

## 📖 Cómo Usar

### 1. Registro de Estado
1. Selecciona el tipo de servicio y fecha
2. Marca el estado de cada equipo
3. Agrega observaciones específicas si es necesario
4. Registra tu nombre y rol
5. Guarda el registro

### 2. Dashboard
- Ve el estado actual de todos los equipos
- Revisa estadísticas rápidas
- Información del último servicio registrado

### 3. Historial
- Consulta todos los registros anteriores
- Filtra por fecha o tipo de servicio
- Ve detalles completos de cada registro
- Exporta datos en formato JSON

## 🌐 Instalación y Despliegue

### ⭐ GitHub Pages (Recomendado)
1. Sube los archivos a un repositorio de GitHub
2. Activa GitHub Pages en la configuración del repositorio
3. Configura la sincronización desde la aplicación
4. Comparte la URL con tu equipo
5. **Colaboración automática** - todos ven los mismos datos

**📋 [Ver guía detallada de configuración](CONFIGURACION.md)**

### Otras opciones:
- **Netlify/Vercel**: Conecta tu repositorio para despliegue automático
- **Uso Local**: Descarga y abre `index.html` en tu navegador

## 💾 Almacenamiento y Sincronización

### 🔄 **Modo Colaborativo (con GitHub)**
- **Sincronización automática** cada 5 minutos
- **Registros en tiempo real** - todos ven los mismos datos
- **Respaldo automático** en GitHub con historial completo
- **Sin conflictos** - sistema inteligente de combinación de datos

### 💻 **Modo Local (sin configurar GitHub)**
- Datos guardados en el navegador
- **Exportar/Importar** archivos JSON para compartir
- **Backup manual** descargando data.js
- Ideal para uso individual o equipos pequeños

### 🔧 **Configuración**
1. Click en **"Configurar GitHub"** en el historial
2. Ingresa tu usuario y repositorio de GitHub
3. (Opcional) Agrega token para escritura automática
4. ¡Sincronización activada!

**📋 [Ver guía completa de configuración](CONFIGURACION.md)**

## 🔧 Estructura del Proyecto

```
bitacoraRapida/
├── index.html          # Página principal
├── styles.css          # Estilos y diseño
├── script.js           # Lógica de la aplicación
└── README.md           # Documentación
```

## 🎨 Personalización

### Agregar Nuevos Equipos
1. Edita el objeto `equipos` en `script.js`
2. Agrega el nombre amigable en `equiposNombres`
3. Actualiza el HTML en `index.html` si es necesario

### Cambiar Colores
1. Modifica las variables CSS en `styles.css`
2. Cambia los valores en `:root`

### Nuevos Tipos de Servicio
1. Agrega opciones en el `<select>` de tipo de servicio
2. Actualiza los filtros del historial

## 🔮 Próximas Características

- [ ] Exportación a PDF
- [ ] Sincronización con Google Sheets
- [ ] Notificaciones por email
- [ ] Análisis de tendencias
- [ ] Modo offline
- [ ] Múltiples ubicaciones
- [ ] Roles de usuario

## 🤝 Contribuir

¿Tienes ideas o mejoras? 

1. Haz un fork del proyecto
2. Crea una rama para tu feature
3. Envía un pull request

## 📞 Soporte

Si necesitas ayuda o tienes sugerencias:

- Abre un issue en GitHub
- Contacta al administrador del sistema
- Revisa la documentación en el código

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente.

---

**Desarrollado con ❤️ para la comunidad MECAL**

*"Mejor que Google Sheets porque está diseñado específicamente para vuestras necesidades"*
