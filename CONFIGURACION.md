# 🚀 Configuración para GitHub Pages - Bitácora MECAL

## 📋 Pasos para configurar la sincronización colaborativa

### 1. Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com) y crea una cuenta si no tienes
2. Haz clic en **"New repository"**
3. Nombra tu repositorio: `bitacora-mecal` (o el nombre que prefieras)
4. Marca **"Public"** para que funcione con GitHub Pages
5. Marca **"Add a README file"**
6. Haz clic en **"Create repository"**

### 2. Subir los archivos

1. En tu repositorio, haz clic en **"uploading an existing file"**
2. Arrastra y suelta todos estos archivos:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `data.js`
   - `README.md`
3. Escribe en el commit: "Subir aplicación de bitácora"
4. Haz clic en **"Commit changes"**

### 3. Activar GitHub Pages

1. Ve a **Settings** (en tu repositorio)
2. Baja hasta la sección **"Pages"**
3. En **"Source"** selecciona **"Deploy from a branch"**
4. En **"Branch"** selecciona **"main"**
5. Haz clic en **"Save"**
6. Espera 2-3 minutos y recarga la página
7. Verás la URL de tu aplicación: `https://tu-usuario.github.io/bitacora-mecal`

### 4. Configurar la aplicación

1. Abre tu aplicación en la URL de GitHub Pages
2. Haz clic en **"Configurar GitHub"** en el historial
3. Completa los datos:
   - **Usuario/Organización**: tu nombre de usuario de GitHub
   - **Repositorio**: `bitacora-mecal` (o el nombre que usaste)
   - **Token**: (opcional, ver paso 5 para colaboración avanzada)
4. Haz clic en **"Probar Conexión"** y luego **"Guardar"**

### 5. (Opcional) Token para escritura automática

Si quieres que la app suba registros automáticamente:

1. Ve a GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Haz clic en **"Generate new token (classic)"**
3. Nombre: `Bitacora MECAL`
4. Marca **"repo"** (Full control of private repositories)
5. Haz clic en **"Generate token"**
6. **COPIA EL TOKEN** (solo se muestra una vez)
7. Pégalo en la configuración de la app

## 🔄 Cómo funciona la colaboración

### Sin Token (Solo lectura)
- ✅ Todos pueden ver registros de otros
- ✅ Datos se guardan localmente
- ⚠️ Hay que sincronizar manualmente con "Exportar" → subir data.js

### Con Token (Automático)
- ✅ Los registros se suben automáticamente a GitHub
- ✅ Sincronización automática cada 5 minutos
- ✅ Todos ven cambios en tiempo real

## 📱 Compartir con el equipo

1. Comparte la URL: `https://tu-usuario.github.io/bitacora-mecal`
2. Cada usuario puede:
   - Crear registros
   - Ver dashboard actualizado
   - Consultar historial completo
   - Exportar datos

## 🔧 Mantenimiento

### Actualizar datos manualmente (sin token):
1. Alguien del equipo hace "Exportar"
2. Se descarga `data.js`
3. Va al repositorio en GitHub
4. Edita el archivo `data.js`
5. Pega el nuevo contenido
6. Hace commit

### Respaldos:
- Los datos están en GitHub (versionados)
- Cada usuario puede hacer "Exportar" para backup local
- GitHub mantiene historial completo

## 🎯 URLs importantes

- **Tu aplicación**: `https://tu-usuario.github.io/bitacora-mecal`
- **Repositorio**: `https://github.com/tu-usuario/bitacora-mecal`
- **Configuración**: Click en "Configurar GitHub" dentro de la app

## ⚡ Beneficios vs Google Sheets

- ✅ **Interfaz específica** para equipos AV
- ✅ **Funcionamiento offline**
- ✅ **Responsive** (móviles y tablets)
- ✅ **Dashboard visual** en tiempo real
- ✅ **Historial filtrable** y exportable
- ✅ **Control total** de los datos
- ✅ **Gratuito** para siempre
- ✅ **Sin límites** de usuarios o registros

---

**¿Necesitas ayuda?** Crea un issue en el repositorio con tu pregunta.
