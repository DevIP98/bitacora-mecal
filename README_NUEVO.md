# 📋 Bitácora Producción MECAL - Sistema Centralizado

Sistema web de bitácora para registrar y monitorear el estado de equipos audiovisuales en servicios religiosos con **configuración centralizada** - ¡configura una vez y funciona en todos los dispositivos!

## ✨ Nueva Funcionalidad: Configuración Única

### 🎯 **Configuración una sola vez**
- Un administrador configura el sistema
- Todos los demás dispositivos se configuran automáticamente
- No más configuración repetitiva en cada móvil/computadora

### 🔄 **Sincronización Automática**
- Los registros aparecen inmediatamente en todos los dispositivos
- Sin necesidad de recargar la página
- Funciona en tiempo real

## 🚀 Configuración Inicial (Solo Administrador)

### Paso 1: Activar GitHub Pages
1. Ve a Settings → Pages en tu repositorio
2. Source: Deploy from a branch → main
3. ¡Listo! Tu aplicación estará en: `https://tu-usuario.github.io/bitacora-mecal`

### Paso 2: Configuración del Token (Una sola vez)
1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Selecciona scope: `repo` (acceso completo)
4. Copia el token
5. Abre la aplicación web
6. Configura el token cuando aparezca el modal
7. **¡El token se guarda automáticamente para todos los usuarios!**

## 📱 Para todos los demás usuarios

1. **Abre la URL de GitHub Pages**
2. **¡Y listo!** - El sistema se configura automáticamente
3. Puedes ver todos los registros del equipo
4. Puedes agregar nuevos registros
5. Todo se sincroniza en tiempo real

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

## 📱 Uso Diario

### 1. Registro de Estado
1. Selecciona el tipo de servicio y fecha
2. Marca el estado de cada equipo (Bueno/Regular/Malo)
3. Agrega observaciones específicas si es necesario
4. Registra tu nombre y rol
5. Guarda el registro
6. **Se sincroniza automáticamente con todos los dispositivos**

### 2. Dashboard
- Ve el estado actual de todos los equipos
- Revisa estadísticas rápidas
- **Se actualiza automáticamente con nuevos registros**

### 3. Historial
- Consulta registros anteriores
- Filtra por fecha y categoría
- **Incluye registros de todo el equipo**

## 🔧 Características Técnicas

### Sistema GitHubDB
- **Configuración automática**: Detecta configuración desde el repositorio
- **Token compartido**: Una vez configurado, todos lo usan
- **Sincronización inteligente**: Solo sube registros nuevos
- **Cache local**: Funciona offline, sincroniza cuando hay internet

### Tecnologías
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Almacenamiento**: GitHub API + localStorage
- **Hosting**: GitHub Pages (gratuito)
- **Diseño**: Responsive, móvil-first

## 🔄 Flujo de Datos

```
Dispositivo A → GitHub (repositorio) → Dispositivo B
     ↓                                      ↑
localStorage  ←→  Sincronización automática cada 5 min
```

## 👥 Colaboración en Equipo

- **Administrador**: Configura una vez el token de GitHub
- **Miembros del equipo**: Solo abren la URL y empiezan a usar
- **Sincronización**: Automática cada 5 minutos
- **Tiempo real**: Los cambios aparecen inmediatamente

## 📁 Estructura del Proyecto

```
bitacora-mecal/
├── index.html          # Interfaz principal
├── styles.css          # Estilos modernos
├── script.js           # Lógica + GitHubDB
├── data.js             # Configuración central
├── test.html           # Pruebas del sistema
└── README.md           # Esta documentación
```

## 🎉 Beneficios del Nuevo Sistema

### ✅ Para el Administrador
- Configura el token una sola vez
- No necesita ayudar a configurar cada dispositivo
- Control centralizado de los datos

### ✅ Para el Equipo
- Abre la URL y empieza a usar inmediatamente
- Ve todos los registros del equipo
- Sus registros aparecen en todos los dispositivos
- No necesita conocimientos técnicos

### ✅ Para la Organización
- Datos centralizados y seguros en GitHub
- Historial completo y versionado
- Accesible desde cualquier lugar
- Sin costos de servidores

## 🚨 Resolución de Problemas

### Si no aparecen registros de otros usuarios:
1. Verifica que estés usando la URL de GitHub Pages
2. Espera 5 minutos para la sincronización automática
3. O presiona el botón de sincronización manual

### Si no puedes agregar registros:
1. Verifica que el administrador haya configurado el token
2. Verifica tu conexión a internet
3. Los registros se guardan localmente y se sincronizan después

## 📞 Soporte

Para problemas técnicos:
- Contacta al administrador del sistema
- Revisa la configuración en GitHub
- Verifica que GitHub Pages esté activo

---

**🎵 Desarrollado con amor para MECAL**  
*Sistema de bitácora colaborativo - Una configuración, múltiples usuarios*
