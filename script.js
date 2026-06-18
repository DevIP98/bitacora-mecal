// ===== CONFIGURACIÓN Y ESTADO GLOBAL =====
const BitacoraApp = {
    currentPage: 'registro',
    registros: [],
    currentEdit: null,
    syncInterval: null,
    lastSyncTime: null,
    
    // Configuración GitHub
    github: {
        configured: false,
        owner: '',
        repo: '',
        token: '',
        branch: 'main',
        apiUrl: 'https://api.github.com'
    },
    
    // Configuración de equipos por categoría
    equipos: {
        audio: [
            'microfonos-inalambricos',
            'microfonos-alambricos', 
            'planta-sonido'
        ],
        computadoras: [
            'cpu-principal',
            'monitor-principal'
        ],
        conectividad: [
            'cables-hdmi',
            'cables-audio'
        ],
        internet: [
            'router-wifi'
        ],
        video: [
            'camara-celular',
            'tv-1',
            'tv-2'
        ]
    },
    
    // Nombres amigables para los equipos
    equiposNombres: {
        'microfonos-inalambricos': 'Micrófonos Inalámbricos',
        'microfonos-alambricos': 'Micrófonos Alámbricos',
        'planta-sonido': 'Planta de Sonido',
        'cpu-principal': 'CPU Principal',
        'monitor-principal': 'Monitor Principal',
        'cables-hdmi': 'Cables HDMI',
        'cables-audio': 'Cables de Audio',
        'router-wifi': 'Router WiFi',
        'camara-celular': 'Cámara de Celular',
        'tv-1': 'TV 1',
        'tv-2': 'TV 2'
    },
    
    // Iconos para cada categoría
    iconos: {
        audio: 'fas fa-volume-up',
        computadoras: 'fas fa-desktop',
        conectividad: 'fas fa-wifi',
        internet: 'fas fa-globe',
        video: 'fas fa-video'
    },
    
    // Tipos de servicio por defecto
    tiposServicio: [
        'Servicio Familiar Domingo AM',
        'Servicio Familiar Domingo PM',
        'Servicio Energy Plus',
        'Servicio de Parejas',
        'Servicio de ADR',
        'Congreso la Reforma',        
        'Servicio Especial',
        'Ayuno',
        'Ensayo'
    ]
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeGitHub();
    loadRegistros();
    updateDashboard();
    updateHistorial();
    setDefaultValues();
    
    // Cargar inventario
    cargarInventario();
    renderizarInventario();
    
    // Sincronización inicial después de cargar
    setTimeout(() => {
        console.log('🔄 Iniciando sincronización automática...');
        sincronizarConGitHub();
    }, 2000); // Esperar 2 segundos para que todo se inicialice
    
    startAutoSync();
});

function initializeApp() {
    // Configurar fecha por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaServicio').value = today;
    
    // Configurar hora por defecto
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    document.getElementById('horaInicio').value = timeString;
    
    // Cargar tipos de servicio
    cargarTiposServicio();
    
    // Configurar eventos del formulario
    setupFormEvents();
    
    // Configurar eventos de navegación
    setupNavigationEvents();
    
    // Configurar eventos de estado de equipos
    setupEquipmentStatusEvents();
    
    console.log('Aplicación inicializada correctamente');
}

// ===== CONFIGURACIÓN GITHUB CENTRALIZADA =====
const GitHubDB = {
    owner: null,
    repo: null,
    token: null,
    branch: 'main',
    configFile: 'config.json',
    
    async init() {
        console.log('🚀 Iniciando GitHubDB...');
        
        await this.cargarConfiguracion();
        
        if (this.owner && this.repo) {
            console.log('✅ Configuración encontrada:', this.owner + '/' + this.repo);
            
            // Si no hay token, mostrar modal para configurarlo
            if (!this.token) {
                console.log('🔑 Token no configurado - abriendo modal');
                this.showConfigModal();
            } else {
                console.log('🔑 Token configurado - sistema listo');
                await this.sincronizarConfiguracion();
            }
        } else {
            console.log('⚙️ No hay configuración - abriendo modal inicial');
            this.showConfigModal();
        }
        
        this.actualizarEstadoConexion();
    },

    async cargarConfiguracion() {
        // 1. Intentar cargar desde localStorage
        const config = localStorage.getItem('github-config');
        if (config) {
            const parsedConfig = JSON.parse(config);
            this.owner = parsedConfig.owner;
            this.repo = parsedConfig.repo;
            this.token = parsedConfig.token;
            console.log('📱 Configuración cargada desde localStorage');
            return;
        }

        // 2. Intentar cargar desde data.js automáticamente
        try {
            const datosConfig = obtenerConfiguracion();
            if (datosConfig && datosConfig.repositorio) {
                this.owner = datosConfig.repositorio.owner;
                this.repo = datosConfig.repositorio.repo;
                console.log('🎯 Configuración automática desde data.js:', this.owner + '/' + this.repo);
                
                // Guardar en localStorage para futuras cargas
                const configToSave = {
                    owner: this.owner,
                    repo: this.repo,
                    token: null,
                    lastUpdated: new Date().toISOString(),
                    source: 'auto-detected'
                };
                localStorage.setItem('github-config', JSON.stringify(configToSave));
            }
        } catch (error) {
            console.log('ℹ️ No se pudo cargar configuración automática');
        }
    },

    async intentarCargarConfigRemota() {
        // Lista de repositorios comunes para buscar configuración
        const posiblesRepos = [
            { owner: 'DevIP98', repo: 'bitacora-mecal' },
            // Se puede expandir con otros repos conocidos
        ];

        for (const repo of posiblesRepos) {
            try {
                const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${this.configFile}`);
                if (response.ok) {
                    const fileData = await response.json();
                    const configContent = JSON.parse(atob(fileData.content));
                    return {
                        owner: repo.owner,
                        repo: repo.repo,
                        ...configContent
                    };
                }
            } catch (error) {
                console.log(`No se encontró configuración en ${repo.owner}/${repo.repo}`);
            }
        }
        return null;
    },

    async sincronizarConfiguracion() {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.configFile}`);
            if (response.ok) {
                const fileData = await response.json();
                const configRemota = JSON.parse(atob(fileData.content));
                
                // Si la configuración remota es más reciente, actualizarla
                const configLocal = JSON.parse(localStorage.getItem('github-config') || '{}');
                if (!configLocal.lastUpdated || 
                    new Date(configRemota.lastUpdated || 0) > new Date(configLocal.lastUpdated || 0)) {
                    
                    this.aplicarConfiguracion({
                        owner: this.owner,
                        repo: this.repo,
                        ...configRemota
                    });
                    showNotification('Configuración actualizada automáticamente', 'info');
                }
            }
        } catch (error) {
            console.log('No se pudo sincronizar configuración:', error.message);
        }
    },

    aplicarConfiguracion(config) {
        console.log('Aplicando configuración GitHubDB:', config);
        
        this.owner = config.owner;
        this.repo = config.repo;
        this.token = config.token || null;
        
        // Guardar localmente
        const configToSave = {
            owner: config.owner,
            repo: config.repo,
            token: config.token,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('github-config', JSON.stringify(configToSave));
        console.log('Configuración guardada en localStorage:', configToSave);
        
        this.actualizarEstadoConexion();
    },

    isConfigured() {
        return !!(this.owner && this.repo);
    },

    showConfigModal() {
        // Cerrar modal existente si hay uno
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // Diagnosticar estado actual
        const estadoActual = this.diagnosticarEstado();
        
        // Valores por defecto para los campos
        const ownerValue = this.owner || 'DevIP98';
        const repoValue = this.repo || 'bitacora-mecal';
        const tokenValue = this.token && this.token.length > 0 ? '••••••••••••••••' : '';
        const tokenStatus = this.token ? '<small style="color: #28a745;">✅ Token ya configurado - déjalo así o pega uno nuevo</small>' : '';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fab fa-github"></i> Configuración GitHub - Una sola vez</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="config-info">
                        <p><strong>🔧 Estado del Sistema:</strong></p>
                        <div class="diagnostico">
                            ${estadoActual}
                        </div>
                        <p>Esta configuración se sincronizará automáticamente en todos los dispositivos.</p>
                    </div>
                    
                    <div class="config-form">
                        <div class="form-group">
                            <label for="github-owner">Usuario/Organización de GitHub:</label>
                            <input type="text" id="github-owner" placeholder="DevIP98" value="${ownerValue}">
                        </div>
                        
                        <div class="form-group">
                            <label for="github-repo">Nombre del Repositorio:</label>
                            <input type="text" id="github-repo" placeholder="bitacora-mecal" value="${repoValue}">
                        </div>
                        
                        <div class="form-group">
                            <label for="github-token">Token (requerido para sincronización):</label>
                            <input type="password" id="github-token" placeholder="Pega tu token de GitHub aquí" value="${tokenValue}">
                            <small><strong>💡 Crea tu token en: github.com → Settings → Developer settings → Personal access tokens</strong></small>
                            ${tokenStatus}
                        </div>
                        
                        <div class="instrucciones-token">
                            <details>
                                <summary>📋 ¿Cómo crear un token de GitHub?</summary>
                                <ol>
                                    <li>Ve a <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a></li>
                                    <li>Clic en "Generate new token (classic)"</li>
                                    <li>Nombre: "Bitacora MECAL"</li>
                                    <li>Selecciona: <strong>repo</strong> (acceso completo)</li>
                                    <li>Clic en "Generate token"</li>
                                    <li>Copia el token y pégalo aquí</li>
                                </ol>
                            </details>
                        </div>
                    </div>

                    <div id="test-result"></div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="GitHubDB.probarYGuardarConfig()">
                        <i class="fas fa-check"></i> Probar y Guardar
                    </button>
                    <button class="btn btn-secondary" onclick="GitHubDB.saltarConfiguracion()">
                        <i class="fas fa-times"></i> Continuar Sin Sincronización
                    </button>
                    <button class="btn btn-info" onclick="GitHubDB.sincronizarSinToken()">
                        <i class="fas fa-download"></i> Solo Descargar Datos
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Asegurar que los campos tengan valores
        setTimeout(() => {
            const ownerInput = document.getElementById('github-owner');
            const repoInput = document.getElementById('github-repo');
            
            if (ownerInput && !ownerInput.value) {
                ownerInput.value = 'DevIP98';
            }
            if (repoInput && !repoInput.value) {
                repoInput.value = 'bitacora-mecal';
            }
            
            console.log('Modal creado con valores:', {
                owner: ownerInput ? ownerInput.value : 'no encontrado',
                repo: repoInput ? repoInput.value : 'no encontrado'
            });
        }, 100);
    },

    diagnosticarEstado() {
        const registrosLocales = JSON.parse(localStorage.getItem('bitacoraRegistros') || '[]');
        const config = JSON.parse(localStorage.getItem('github-config') || '{}');
        
        let diagnostico = '<ul>';
        
        if (this.owner && this.repo) {
            diagnostico += `<li>✅ Repositorio: ${this.owner}/${this.repo}</li>`;
        } else {
            diagnostico += '<li>❌ No hay repositorio configurado</li>';
        }
        
        if (this.token) {
            diagnostico += '<li>✅ Token configurado (sincronización activa)</li>';
        } else {
            diagnostico += '<li>⚠️ Sin token (solo lectura)</li>';
        }
        
        diagnostico += `<li>📊 Registros locales: ${registrosLocales.length}</li>`;
        
        if (config.lastUpdated) {
            const fecha = new Date(config.lastUpdated).toLocaleString();
            diagnostico += `<li>🕒 Última configuración: ${fecha}</li>`;
        }
        
        diagnostico += '</ul>';
        return diagnostico;
    },

    async sincronizarSinToken() {
        this.mostrarResultadoPrueba('Descargando datos existentes...', 'info');
        
        try {
            // Cargar solo datos desde GitHub sin token
            const registrosGitHub = await this.cargarRegistros();
            
            if (registrosGitHub.length > 0) {
                // Combinar con registros locales
                const registrosLocales = JSON.parse(localStorage.getItem('bitacoraRegistros') || '[]');
                const todosRegistros = [...registrosGitHub, ...registrosLocales];
                const registrosUnicos = todosRegistros.filter((registro, index, self) => 
                    index === self.findIndex(r => r.id === registro.id)
                );
                
                localStorage.setItem('bitacoraRegistros', JSON.stringify(registrosUnicos));
                BitacoraApp.registros = registrosUnicos;
                
                updateDashboard();
                updateHistorial();
                
                this.mostrarResultadoPrueba(`✅ ${registrosGitHub.length} registros descargados exitosamente`, 'success');
                
                setTimeout(() => {
                    const modalOverlay = document.querySelector('.modal-overlay');
                    if (modalOverlay) modalOverlay.remove();
                    showNotification('Datos descargados - Para guardar nuevos registros necesitas configurar un token', 'info');
                }, 2000);
                
            } else {
                this.mostrarResultadoPrueba('ℹ️ No se encontraron datos en GitHub', 'info');
            }
            
        } catch (error) {
            this.mostrarResultadoPrueba(`❌ Error descargando: ${error.message}`, 'error');
        }
    },

    async probarYGuardarConfig() {
        console.log('🔍 Iniciando verificación de configuración...');
        
        // Esperar un poco para asegurar que el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const ownerInput = document.getElementById('github-owner');
        const repoInput = document.getElementById('github-repo');
        const tokenInput = document.getElementById('github-token');
        
        console.log('Elementos encontrados:', {
            ownerInput: !!ownerInput,
            repoInput: !!repoInput,
            tokenInput: !!tokenInput
        });
        
        // Verificar que los elementos existan
        if (!ownerInput || !repoInput || !tokenInput) {
            console.error('❌ No se encontraron los campos del formulario');
            this.mostrarResultadoPrueba('❌ Error: No se encontraron los campos del formulario. Recargando...', 'error');
            
            // Intentar recrear el modal
            setTimeout(() => {
                this.showConfigModal();
            }, 2000);
            return;
        }
        
        let owner = ownerInput.value ? ownerInput.value.trim() : '';
        let repo = repoInput.value ? repoInput.value.trim() : '';
        let token = tokenInput.value ? tokenInput.value.trim() : '';
        
        console.log('Valores iniciales:', { owner, repo, tokenLength: token.length });
        
        // Si están vacíos, usar valores por defecto
        if (!owner) {
            owner = 'DevIP98';
            ownerInput.value = owner;
        }
        if (!repo) {
            repo = 'bitacora-mecal';
            repoInput.value = repo;
        }
        
        // Si el token son puntos (ya configurado) y no se cambió, usar el existente
        if (token === '••••••••••••••••' || token.match(/^•+$/)) {
            token = this.token || ''; // Usar el token existente
            console.log('Usando token existente');
        }
        
        console.log('Configuración final a guardar:', { 
            owner, 
            repo, 
            hasToken: !!token,
            tokenLength: token ? token.length : 0 
        });
        
        // Validar campos obligatorios (ahora con valores por defecto)
        if (!owner || !repo) {
            this.mostrarResultadoPrueba('❌ Error interno: No se pudieron establecer usuario y repositorio', 'error');
            console.error('Error: campos aún vacíos después de establecer valores por defecto');
            return;
        }

        this.mostrarResultadoPrueba('🔍 Probando conexión...', 'info');

        try {
            // 1. Probar acceso de lectura al repositorio
            console.log(`Verificando repositorio: ${owner}/${repo}`);
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`El repositorio ${owner}/${repo} no existe o no es público`);
                } else {
                    throw new Error(`Error ${response.status}: No se puede acceder al repositorio`);
                }
            }

            const repoData = await response.json();
            console.log('✅ Repositorio verificado:', repoData.full_name);

            // 2. Si hay token, probar escritura
            if (token && token.length > 10) { // Validar que sea un token real
                console.log('🔑 Verificando token...');
                
                // Probar con diferentes endpoints para verificar permisos
                const endpoints = [
                    `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
                    `https://api.github.com/repos/${owner}/${repo}/contents/data.js`,
                    `https://api.github.com/repos/${owner}/${repo}`
                ];
                
                let tokenValido = false;
                for (const endpoint of endpoints) {
                    try {
                        const testResponse = await fetch(endpoint, {
                            headers: { 'Authorization': `token ${token}` }
                        });
                        
                        if (testResponse.ok) {
                            tokenValido = true;
                            console.log('✅ Token válido para:', endpoint);
                            break;
                        }
                    } catch (e) {
                        console.log('Probando siguiente endpoint...');
                    }
                }
                
                if (!tokenValido) {
                    throw new Error('Token inválido o sin permisos para este repositorio');
                }
            }

            // 3. Guardar configuración exitosa
            const config = {
                owner,
                repo,
                token: token || null,
                lastUpdated: new Date().toISOString(),
                deviceConfigured: navigator.userAgent.substring(0, 50),
                configuredAt: new Date().toLocaleString()
            };

            console.log('💾 Aplicando configuración:', config);
            this.aplicarConfiguracion(config);
            
            // 4. Intentar guardar configuración en GitHub (solo si hay token)
            if (token) {
                console.log('☁️ Guardando configuración en GitHub...');
                try {
                    await this.guardarConfiguracionEnGitHub(config);
                    this.mostrarResultadoPrueba('✅ Configuración guardada y sincronizada en todos los dispositivos', 'success');
                } catch (error) {
                    console.log('⚠️ No se pudo guardar en GitHub, pero la configuración local está lista');
                    this.mostrarResultadoPrueba('✅ Configuración guardada localmente (sincronización manual disponible)', 'success');
                }
            } else {
                this.mostrarResultadoPrueba('✅ Configuración guardada en modo solo lectura', 'success');
            }
            
            // 5. Cerrar modal y notificar
            setTimeout(() => {
                const modalOverlay = document.querySelector('.modal-overlay');
                if (modalOverlay) {
                    modalOverlay.remove();
                }
                
                if (token) {
                    showNotification('🎉 GitHub configurado correctamente - Sincronización activa', 'success');
                    startAutoSync();
                    // Ejecutar sincronización inmediata
                    setTimeout(() => sincronizarConGitHub(), 1000);
                } else {
                    showNotification('📖 GitHub configurado en modo lectura - Podrás ver datos de otros usuarios', 'info');
                }
                
                // Actualizar la UI
                this.actualizarEstadoConexion();
                
            }, 2000);

        } catch (error) {
            console.error('❌ Error en configuración:', error);
            this.mostrarResultadoPrueba(`❌ Error: ${error.message}`, 'error');
            
            // Sugerencias específicas según el error
            if (error.message.includes('repositorio') && error.message.includes('no existe')) {
                setTimeout(() => {
                    this.mostrarResultadoPrueba(`💡 Sugerencia: Verifica que el repositorio sea público o que tengas acceso`, 'warning');
                }, 2000);
            } else if (error.message.includes('Token')) {
                setTimeout(() => {
                    this.mostrarResultadoPrueba(`💡 Sugerencia: Crea un nuevo token con permisos "repo" completos`, 'warning');
                }, 2000);
            }
        }
    },

    async guardarConfiguracionEnGitHub(config) {
        if (!config.token) return; // No se puede guardar sin token

        try {
            const configParaGuardar = {
                appName: 'Bitácora Producción MECAL',
                version: '1.0.0',
                lastUpdated: config.lastUpdated,
                configuredBy: config.deviceConfigured,
                hasToken: !!config.token, // No guardar el token real por seguridad
                syncEnabled: !!config.token
            };

            const content = btoa(JSON.stringify(configParaGuardar, null, 2));
            
            // Verificar si ya existe el archivo
            let sha = null;
            try {
                const existingFile = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${this.configFile}`, {
                    headers: { 'Authorization': `token ${config.token}` }
                });
                if (existingFile.ok) {
                    const fileData = await existingFile.json();
                    sha = fileData.sha;
                }
            } catch (e) {}

            const payload = {
                message: 'Configurar sincronización automática de bitácora',
                content: content,
                branch: this.branch
            };
            
            if (sha) payload.sha = sha;

            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${this.configFile}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

        } catch (error) {
            console.log('No se pudo guardar configuración en GitHub:', error.message);
        }
    },

    limpiarTodo() {
        // Limpiar localStorage
        localStorage.removeItem('github-config');
        localStorage.removeItem('bitacoraRegistros');
        localStorage.removeItem('registros');
        
        // Limpiar variables
        this.owner = null;
        this.repo = null;
        this.token = null;
        
        console.log('🧹 Sistema limpiado completamente');
        showNotification('Sistema limpiado - configurar de nuevo', 'info');
        
        // Mostrar modal de configuración
        this.showConfigModal();
    },

    saltarConfiguracion() {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.remove();
        }
        showNotification('Trabajando en modo local únicamente', 'info');
        this.actualizarEstadoConexion();
    },

    mostrarResultadoPrueba(mensaje, tipo) {
        const resultDiv = document.getElementById('test-result');
        resultDiv.className = `test-result ${tipo}`;
        resultDiv.innerHTML = mensaje;
    },

    actualizarEstadoConexion() {
        const badge = document.getElementById('github-status');
        if (badge) {
            if (this.owner && this.repo) {
                if (this.token) {
                    badge.className = 'status-badge connected';
                    badge.innerHTML = '<i class="fas fa-sync"></i> Sincronización Activa';
                } else {
                    badge.className = 'status-badge warning';
                    badge.innerHTML = '<i class="fas fa-download"></i> Solo Descarga';
                }
            } else {
                badge.className = 'status-badge disconnected';
                badge.innerHTML = '<i class="fas fa-unlink"></i> Solo Local';
            }
        }
        
        // Actualizar también cualquier indicador adicional
        this.actualizarIndicadoresSistema();
    },

    actualizarIndicadoresSistema() {
        // Mostrar información en consola para diagnóstico
        console.log('🔧 Estado GitHubDB:', {
            configurado: this.isConfigured(),
            owner: this.owner,
            repo: this.repo,
            tieneToken: !!this.token,
            url: this.owner && this.repo ? `https://github.com/${this.owner}/${this.repo}` : null
        });
        
        // Verificar registros locales vs remotos
        const registrosLocales = JSON.parse(localStorage.getItem('bitacoraRegistros') || '[]');
        console.log('📊 Registros locales:', registrosLocales.length);
        
        // Si no hay token pero hay registros locales, mostrar aviso
        if (!this.token && registrosLocales.length > 0 && this.isConfigured()) {
            const tiempoEspera = 5000; // 5 segundos
            setTimeout(() => {
                if (!this.token) { // Verificar de nuevo por si se configuró
                    showNotification(
                        `Tienes ${registrosLocales.length} registros locales. Configura tu token para sincronizarlos.`, 
                        'warning'
                    );
                }
            }, tiempoEspera);
        }
    },

    mostrarConfiguracion() {
        this.showConfigModal();
    },

    // Métodos de sincronización de registros
    async guardarRegistro(registro) {
        if (!this.token || !this.owner || !this.repo) {
            console.log('No hay configuración completa para guardar en GitHub');
            return false;
        }
        
        try {
            // Subir como archivo individual en carpeta registros/
            const fileName = `registros/registro-${registro.id}.json`;
            const content = btoa(JSON.stringify(registro, null, 2));
            
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${fileName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Nuevo registro: ${registro.tipoServicio} - ${registro.fechaServicio}`,
                    content: content,
                    branch: this.branch
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error subiendo registro:', error);
            return false;
        }
    },

    async cargarRegistros() {
        if (!this.owner || !this.repo) return [];

        try {
            let registros = [];
            
            // 1. Intentar cargar desde data.js (datos centralizados)
            try {
                const dataJsUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/data.js`;
                const response = await fetch(dataJsUrl);
                if (response.ok) {
                    const content = await response.text();
                    const registrosMatch = content.match(/["']registros["']\s*:\s*(\[[\s\S]*?\])/);
                    if (registrosMatch) {
                        const registrosJson = registrosMatch[1];
                        registros = JSON.parse(registrosJson);
                        console.log(`📁 Cargados ${registros.length} registros desde data.js`);
                        return registros;
                    }
                }
            } catch (e) {
                console.log('📁 data.js no disponible, intentando carpeta registros/');
            }
            
            // 2. Si no hay data.js, cargar desde carpeta registros/ individual
            try {
                const contentsUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/registros`;
                const contentsResponse = await fetch(contentsUrl);
                
                if (contentsResponse.ok) {
                    const archivos = await contentsResponse.json();
                    console.log(`📂 Encontrados ${archivos.length} archivos en carpeta registros/`);
                    
                    // Cargar cada archivo de registro
                    const promesasRegistros = archivos
                        .filter(archivo => archivo.name.endsWith('.json'))
                        .map(async (archivo) => {
                            try {
                                const archivoResponse = await fetch(archivo.download_url);
                                if (archivoResponse.ok) {
                                    return await archivoResponse.json();
                                }
                            } catch (error) {
                                console.log(`⚠️ Error cargando ${archivo.name}:`, error.message);
                            }
                            return null;
                        });
                    
                    const registrosIndividuales = await Promise.all(promesasRegistros);
                    registros = registrosIndividuales.filter(r => r !== null);
                    console.log(`📊 Cargados ${registros.length} registros desde carpeta registros/`);
                }
            } catch (e) {
                console.log('📂 No se pudo acceder a la carpeta registros/');
            }
            
            return registros;
        } catch (error) {
            console.error('Error cargando desde GitHub:', error);
            return [];
        }
    }
};

function initializeGitHub() {
    GitHubDB.init();
}

function abrirConfiguracionGitHub() {
    GitHubDB.mostrarConfiguracion();
}

function sincronizarManual() {
    sincronizarConGitHub();
}

// ===== SINCRONIZACIÓN =====
async function sincronizarConGitHub() {
    // Verificar configuración básica
    if (!GitHubDB.owner || !GitHubDB.repo) {
        showNotification('GitHub no configurado - Configurando automáticamente...', 'warning');
        await GitHubDB.init(); // Reintentar configuración automática
        
        if (!GitHubDB.owner || !GitHubDB.repo) {
            GitHubDB.mostrarConfiguracion();
            return;
        }
    }
    
    showSyncIndicator('syncing', 'Sincronizando...');
    
    try {
        // 1. Cargar registros desde GitHub (no requiere token)
        console.log('📥 Descargando registros desde GitHub...');
        const registrosGitHub = await GitHubDB.cargarRegistros();
        console.log(`📊 Encontrados ${registrosGitHub.length} registros en GitHub`);
        
        // 2. Cargar registros locales
        const registrosLocales = JSON.parse(localStorage.getItem('bitacoraRegistros') || '[]');
        console.log(`💾 Registros locales: ${registrosLocales.length}`);
        
        // 3. Combinar y eliminar duplicados
        const todosRegistros = [...registrosGitHub, ...registrosLocales];
        const registrosUnicos = todosRegistros.filter((registro, index, self) => 
            index === self.findIndex(r => r.id === registro.id)
        );
        console.log(`🔄 Total después de combinar: ${registrosUnicos.length}`);
        
        // 4. Identificar registros nuevos para subir
        const registrosParaSubir = registrosLocales.filter(local => 
            !registrosGitHub.some(github => github.id === local.id)
        );
        console.log(`⬆️ Registros para subir: ${registrosParaSubir.length}`);
        
        // 5. Subir registros nuevos (solo si hay token)
        let subidosExitosamente = 0;
        if (GitHubDB.token && registrosParaSubir.length > 0) {
            console.log('🚀 Subiendo registros nuevos...');
            for (const registro of registrosParaSubir) {
                const exito = await GitHubDB.guardarRegistro(registro);
                if (exito) {
                    subidosExitosamente++;
                    console.log(`✅ Registro ${registro.id} subido`);
                } else {
                    console.log(`❌ Error subiendo registro ${registro.id}`);
                }
            }
        } else if (!GitHubDB.token && registrosParaSubir.length > 0) {
            console.log('⚠️ Hay registros nuevos pero no hay token para subirlos');
        }
        
        // 6. Actualizar localStorage con todos los registros
        localStorage.setItem('bitacoraRegistros', JSON.stringify(registrosUnicos));
        BitacoraApp.registros = registrosUnicos;
        
        // 7. Actualizar vistas
        updateDashboard();
        updateHistorial();
        
        BitacoraApp.lastSyncTime = new Date();
        
        // 8. Mostrar resultado
        let mensaje = `Sincronización completada: ${registrosUnicos.length} registros totales`;
        if (registrosGitHub.length > 0) {
            mensaje += `, ${registrosGitHub.length} descargados`;
        }
        if (subidosExitosamente > 0) {
            mensaje += `, ${subidosExitosamente} subidos`;
        }
        if (!GitHubDB.token && registrosParaSubir.length > 0) {
            mensaje += ` (${registrosParaSubir.length} pendientes de subir - necesitas token)`;
        }
        
        showSyncIndicator('success', mensaje);
        setTimeout(() => hideSyncIndicator(), 5000);
        
    } catch (error) {
        console.error('Error sincronizando:', error);
        showSyncIndicator('error', `Error en sincronización: ${error.message}`);
        setTimeout(() => hideSyncIndicator(), 5000);
    }
}

function sincronizarManual() {
    sincronizarConGitHub();
}

function startAutoSync() {
    if (BitacoraApp.syncInterval) {
        clearInterval(BitacoraApp.syncInterval);
    }
    
    if (GitHubDB.isConfigured()) {
        // Sincronizar cada 5 minutos
        BitacoraApp.syncInterval = setInterval(() => {
            sincronizarConGitHub();
        }, 5 * 60 * 1000);
    }
}

function showSyncIndicator(status, message) {
    let indicator = document.querySelector('.sync-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'sync-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.className = `sync-indicator ${status} show`;
    
    const iconClass = status === 'syncing' ? 'fa-sync' : 
                     status === 'success' ? 'fa-check' : 'fa-exclamation-triangle';
    
    indicator.innerHTML = `
        <div class="sync-indicator-content">
            <i class="fas ${iconClass} sync-indicator-icon"></i>
            <span>${message}</span>
        </div>
    `;
}

function hideSyncIndicator() {
    const indicator = document.querySelector('.sync-indicator');
    if (indicator) {
        indicator.classList.remove('show');
        setTimeout(() => indicator.remove(), 300);
    }
}

function setDefaultValues() {
    // Establecer valores por defecto comunes
    const responsableInput = document.getElementById('nombreResponsable');
    const savedResponsable = localStorage.getItem('ultimoResponsable');
    if (savedResponsable) {
        responsableInput.value = savedResponsable;
    }
    
    const rolSelect = document.getElementById('rolResponsable');
    const savedRol = localStorage.getItem('ultimoRol');
    if (savedRol) {
        rolSelect.value = savedRol;
    }
}

// ===== NAVEGACIÓN ENTRE PÁGINAS =====
function showPage(pageId) {
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar la página seleccionada
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    // Actualizar botones de navegación
    document.querySelectorAll('.btn-nav').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Actualizar contenido según la página
    BitacoraApp.currentPage = pageId;
    
    switch(pageId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'historial':
            updateHistorial();
            break;
        case 'inventario':
            renderizarInventario();
            break;
    }
}

// ===== CONFIGURACIÓN DE EVENTOS =====
function setupFormEvents() {
    const form = document.getElementById('bitacoraForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Eventos para guardar datos del responsable
    document.getElementById('nombreResponsable').addEventListener('blur', function() {
        localStorage.setItem('ultimoResponsable', this.value);
    });
    
    document.getElementById('rolResponsable').addEventListener('change', function() {
        localStorage.setItem('ultimoRol', this.value);
    });
    
    // Event listener para crear nuevo tipo de servicio
    const tipoServicioSelect = document.getElementById('tipoServicio');
    if (tipoServicioSelect) {
        tipoServicioSelect.addEventListener('change', function() {
            if (this.value === '__NUEVO__') {
                agregarNuevoTipoServicio();
            }
        });
    }
    
    // Event listener para agregar tipo con Enter en el modal
    const inputNuevoTipo = document.getElementById('nuevo-tipo-servicio');
    if (inputNuevoTipo) {
        inputNuevoTipo.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                agregarTipoDesdeModal();
            }
        });
    }
}

function setupNavigationEvents() {
    // Los eventos de navegación se manejan directamente en el HTML con onclick
}

function setupEquipmentStatusEvents() {
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            const item = this.dataset.item;
            const status = this.dataset.status;
            
            // Remover clase active de otros botones del mismo equipo
            const equipmentItem = this.closest('.equipment-item');
            equipmentItem.querySelectorAll('.status-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Agregar clase active al botón seleccionado
            this.classList.add('active');
            
            // Guardar el estado en un atributo data del contenedor
            equipmentItem.setAttribute('data-status', status);
            
            console.log(`Estado actualizado: ${item} -> ${status}`);
        });
    });
}

// ===== MANEJO DEL FORMULARIO =====
function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const registro = collectFormData();
    saveRegistro(registro);
    
    showNotification('Registro guardado exitosamente', 'success');
    
    // Preguntar si desea limpiar el formulario
    setTimeout(() => {
        if (confirm('¿Deseas crear un nuevo registro? (Se limpiará el formulario)')) {
            resetForm();
        }
    }, 1000);
}

function validateForm() {
    const requiredFields = [
        'tipoServicio',
        'fechaServicio', 
        'horaInicio',
        'nombreResponsable',
        'rolResponsable'
    ];
    
    let isValid = true;
    const errors = [];
    
    // Validar campos requeridos
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            isValid = false;
            errors.push(`El campo ${field.previousElementSibling.textContent} es requerido`);
            field.style.borderColor = 'var(--danger-color)';
        } else {
            field.style.borderColor = 'var(--gray-300)';
        }
    });
    
    // Validar que al menos un equipo tenga estado seleccionado
    const equipmentItems = document.querySelectorAll('.equipment-item');
    let hasEquipmentStatus = false;
    
    equipmentItems.forEach(item => {
        if (item.getAttribute('data-status')) {
            hasEquipmentStatus = true;
        }
    });
    
    if (!hasEquipmentStatus) {
        isValid = false;
        errors.push('Debe seleccionar el estado de al menos un equipo');
    }
    
    // Mostrar errores si los hay
    if (!isValid) {
        showNotification(errors.join('\n'), 'error');
    }
    
    return isValid;
}

function collectFormData() {
    const registro = {
        id: Date.now(), // ID único basado en timestamp
        fecha: new Date().toISOString(),
        
        // Información del servicio
        tipoServicio: document.getElementById('tipoServicio').value,
        fechaServicio: document.getElementById('fechaServicio').value,
        horaInicio: document.getElementById('horaInicio').value,
        horaFinalizacion: document.getElementById('horaFinalizacion').value,
        observacionesGenerales: document.getElementById('observacionesGenerales').value,
        
        // Información del responsable
        nombreResponsable: document.getElementById('nombreResponsable').value,
        rolResponsable: document.getElementById('rolResponsable').value,
        
        // Estados de equipos
        equipos: {}
    };
    
    // Recopilar estados de todos los equipos
    document.querySelectorAll('.equipment-item').forEach(item => {
        const statusBtns = item.querySelectorAll('.status-btn');
        const observationsInput = item.querySelector('.observations');
        
        // Encontrar el botón activo
        const activeBtn = item.querySelector('.status-btn.active');
        if (activeBtn) {
            const category = activeBtn.dataset.category;
            const itemId = activeBtn.dataset.item;
            const status = activeBtn.dataset.status;
            
            if (!registro.equipos[category]) {
                registro.equipos[category] = {};
            }
            
            registro.equipos[category][itemId] = {
                estado: status,
                observaciones: observationsInput ? observationsInput.value : ''
            };
        }
    });
    
    return registro;
}

function saveRegistro(registro) {
    // Cargar registros existentes
    BitacoraApp.registros = loadRegistros();
    
    // Agregar el nuevo registro
    BitacoraApp.registros.push(registro);
    
    // Guardar en localStorage
    localStorage.setItem('bitacoraRegistros', JSON.stringify(BitacoraApp.registros));
    
    // Intentar sincronizar con GitHub automáticamente
    if (GitHubDB.owner && GitHubDB.repo && GitHubDB.token) {
        GitHubDB.guardarRegistro(registro).then(success => {
            if (success) {
                showNotification('Registro guardado y sincronizado', 'success');
            } else {
                showNotification('Registro guardado localmente (sincronización pendiente)', 'warning');
            }
        });
    } else {
        showNotification('Registro guardado localmente', 'success');
    }
    
    // Actualizar vistas
    updateDashboard();
    updateHistorial();
    
    console.log('Registro guardado:', registro);
}

function loadRegistros() {
    // Cargar registros locales siempre
    const registrosLocales = JSON.parse(localStorage.getItem('bitacoraRegistros') || '[]');
    
    // Intentar cargar registros centrales (data.js)
    let registrosCentrales = [];
    try {
        registrosCentrales = typeof obtenerRegistros === 'function' ? obtenerRegistros() : [];
    } catch (error) {
        console.log('No se pudieron cargar registros centrales:', error.message);
    }
    
    // Combinar todos los registros
    const todosRegistros = [...registrosCentrales, ...registrosLocales];
    
    // Eliminar duplicados por ID
    const registrosUnicos = todosRegistros.filter((registro, index, self) => 
        index === self.findIndex(r => r.id === registro.id)
    );
    
    console.log(`📊 Registros cargados: ${registrosLocales.length} locales + ${registrosCentrales.length} centrales = ${registrosUnicos.length} únicos`);
    
    return registrosUnicos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

function resetForm() {
    const form = document.getElementById('bitacoraForm');
    form.reset();
    
    // Limpiar estados de equipos
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.equipment-item').forEach(item => {
        item.removeAttribute('data-status');
    });
    
    // Restablecer valores por defecto
    setDefaultValues();
    
    // Restablecer fecha y hora
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaServicio').value = today;
    
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    document.getElementById('horaInicio').value = timeString;
    
    showNotification('Formulario limpiado', 'success');
}

// ===== DASHBOARD =====
function updateDashboard() {
    const registros = loadRegistros();
    
    if (registros.length === 0) {
        showEmptyDashboard();
        return;
    }
    
    // Obtener el registro más reciente por fecha (no por posición en array)
    const registrosCopia = [...registros]; // Hacer copia para no modificar el original
    const ultimoRegistro = registrosCopia.sort((a, b) => {
        // Crear fechas completas para comparación precisa
        const fechaHoraA = new Date(a.fechaServicio + 'T' + (a.horaInicio || '00:00') + ':00');
        const fechaHoraB = new Date(b.fechaServicio + 'T' + (b.horaInicio || '00:00') + ':00');
        
        // Si las fechas/horas del servicio son diferentes, usar esas
        if (fechaHoraA.getTime() !== fechaHoraB.getTime()) {
            return fechaHoraB.getTime() - fechaHoraA.getTime(); // Más reciente primero
        }
        
        // Si las fechas de servicio son exactamente iguales, usar fecha de creación del registro
        const fechaCreacionA = new Date(a.fecha);
        const fechaCreacionB = new Date(b.fecha);
        return fechaCreacionB.getTime() - fechaCreacionA.getTime();
    })[0];
    
    console.log('📊 Dashboard mostrando registro más reciente:', {
        servicio: ultimoRegistro.tipoServicio,
        fecha: ultimoRegistro.fechaServicio,
        hora: ultimoRegistro.horaInicio,
        responsable: ultimoRegistro.nombreResponsable,
        fechaCompleta: new Date(ultimoRegistro.fechaServicio + 'T' + (ultimoRegistro.horaInicio || '00:00') + ':00').toLocaleString()
    });
    
    // Actualizar estadísticas
    updateDashboardStats(ultimoRegistro);
    
    // Actualizar contenido del dashboard
    updateDashboardContent(ultimoRegistro);
}

function updateDashboardStats(registro) {
    let estadisticas = { bueno: 0, regular: 0, malo: 0 };
    
    // Contar estados de equipos
    Object.values(registro.equipos || {}).forEach(categoria => {
        Object.values(categoria).forEach(equipo => {
            switch(equipo.estado) {
                case 'bueno':
                    estadisticas.bueno++;
                    break;
                case 'regular':
                    estadisticas.regular++;
                    break;
                case 'malo':
                    estadisticas.malo++;
                    break;
            }
        });
    });
    
    // Actualizar elementos del DOM
    document.getElementById('stat-good').textContent = estadisticas.bueno;
    document.getElementById('stat-warning').textContent = estadisticas.regular;
    document.getElementById('stat-danger').textContent = estadisticas.malo;
}

function updateDashboardContent(registro) {
    const container = document.getElementById('dashboard-content');
    container.innerHTML = '';
    
    // Información del último servicio
    const serviceInfo = document.createElement('div');
    serviceInfo.className = 'dashboard-card';
    serviceInfo.innerHTML = `
        <h3><i class="fas fa-info-circle"></i> Último Servicio Registrado</h3>
        <div class="service-info">
            <p><strong>Tipo:</strong> ${registro.tipoServicio}</p>
            <p><strong>Fecha:</strong> ${formatDate(registro.fechaServicio)}</p>
            <p><strong>Hora:</strong> ${registro.horaInicio}${registro.horaFinalizacion ? ' - ' + registro.horaFinalizacion : ''}</p>
            <p><strong>Responsable:</strong> ${registro.nombreResponsable} (${registro.rolResponsable})</p>
            ${registro.observacionesGenerales ? `<p><strong>Observaciones:</strong> ${registro.observacionesGenerales}</p>` : ''}
        </div>
    `;
    container.appendChild(serviceInfo);
    
    // Estado de equipos por categoría
    Object.entries(BitacoraApp.equipos).forEach(([categoria, equiposIds]) => {
        const card = document.createElement('div');
        card.className = 'dashboard-card';
        
        const categoriaData = registro.equipos[categoria] || {};
        const iconClass = BitacoraApp.iconos[categoria];
        const categoriaNombre = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        
        let equiposHtml = '';
        equiposIds.forEach(equipoId => {
            const equipoData = categoriaData[equipoId];
            const equipoNombre = BitacoraApp.equiposNombres[equipoId];
            
            if (equipoData) {
                const statusClass = equipoData.estado;
                const statusIcon = getStatusIcon(equipoData.estado);
                
                equiposHtml += `
                    <div class="equipment-status ${statusClass}">
                        <span>${equipoNombre}</span>
                        <span class="status-icon">${statusIcon}</span>
                    </div>
                `;
                
                if (equipoData.observaciones) {
                    equiposHtml += `
                        <div class="equipment-observation">
                            <small><em>${equipoData.observaciones}</em></small>
                        </div>
                    `;
                }
            } else {
                equiposHtml += `
                    <div class="equipment-status" style="background: #f8f9fa; color: #6c757d;">
                        <span>${equipoNombre}</span>
                        <span class="status-icon">❓</span>
                    </div>
                `;
            }
        });
        
        card.innerHTML = `
            <h3><i class="${iconClass}"></i> ${categoriaNombre}</h3>
            ${equiposHtml}
        `;
        
        container.appendChild(card);
    });
}

function showEmptyDashboard() {
    const container = document.getElementById('dashboard-content');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>No hay registros disponibles</h3>
            <p>Crea tu primer registro para ver el estado de los equipos en el dashboard.</p>
        </div>
    `;
    
    // Limpiar estadísticas
    document.getElementById('stat-good').textContent = '0';
    document.getElementById('stat-warning').textContent = '0';
    document.getElementById('stat-danger').textContent = '0';
}

// ===== HISTORIAL =====
function updateHistorial() {
    const registros = loadRegistros();
    const container = document.getElementById('historial-content');
    
    if (registros.length === 0) {
        showEmptyHistorial();
        return;
    }
    
    // Ordenar registros por fecha (más recientes primero)
    const registrosOrdenados = registros.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    container.innerHTML = '';
    
    registrosOrdenados.forEach(registro => {
        const item = createHistorialItem(registro);
        container.appendChild(item);
    });
    
    // Configurar filtros
    setupHistorialFilters();
}

function createHistorialItem(registro) {
    const item = document.createElement('div');
    item.className = 'historial-item';
    item.setAttribute('data-servicio', registro.tipoServicio);
    item.setAttribute('data-fecha', registro.fechaServicio);
    
    // Contar equipos por estado
    let contadores = { bueno: 0, regular: 0, malo: 0 };
    Object.values(registro.equipos || {}).forEach(categoria => {
        Object.values(categoria).forEach(equipo => {
            contadores[equipo.estado]++;
        });
    });
    
    const totalEquipos = contadores.bueno + contadores.regular + contadores.malo;
    
    // Agregar clase CSS según estado general
    if (contadores.malo > 0) {
        item.classList.add('has-critical');
    } else if (contadores.regular > 0) {
        item.classList.add('has-warnings');
    } else if (contadores.bueno > 0) {
        item.classList.add('all-good');
    }
    
    // HTML simplificado - solo información esencial
    item.innerHTML = `
        <div class="historial-item-header">
            <div class="historial-item-info">
                <h3 class="historial-item-title">${registro.tipoServicio}</h3>
                <div class="historial-item-meta">
                    <span class="meta-item">
                        <i class="fas fa-calendar"></i> ${formatDate(registro.fechaServicio)}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-clock"></i> ${registro.horaInicio}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-user"></i> ${registro.nombreResponsable}
                    </span>
                </div>
            </div>
            
            <div class="historial-item-stats">
                <div class="stats-summary">
                    ${contadores.bueno > 0 ? `<span class="stat-item stat-good" title="Equipos en buen estado">
                        <i class="fas fa-check-circle"></i> ${contadores.bueno}
                    </span>` : ''}
                    ${contadores.regular > 0 ? `<span class="stat-item stat-warning" title="Equipos con problemas menores">
                        <i class="fas fa-exclamation-triangle"></i> ${contadores.regular}
                    </span>` : ''}
                    ${contadores.malo > 0 ? `<span class="stat-item stat-danger" title="Equipos con problemas graves">
                        <i class="fas fa-times-circle"></i> ${contadores.malo}
                    </span>` : ''}
                    <span class="total-equipos">${totalEquipos} equipo${totalEquipos !== 1 ? 's' : ''}</span>
                </div>
                <button class="btn btn-outline" onclick="verDetalleRegistro(${registro.id})" title="Ver información completa">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
            </div>
        </div>
        
        ${registro.observacionesGenerales ? 
            `<div class="observaciones-preview">
                <i class="fas fa-comment"></i> 
                <span>${registro.observacionesGenerales.length > 60 ? 
                    registro.observacionesGenerales.substring(0, 60) + '...' : 
                    registro.observacionesGenerales}
                </span>
            </div>` : 
            ''
        }
    `;
    
    return item;
}

function showEmptyHistorial() {
    const container = document.getElementById('historial-content');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-history"></i>
            <h3>No hay registros en el historial</h3>
            <p>Los registros que crees aparecerán aquí para que puedas consultar el historial de estados de los equipos.</p>
        </div>
    `;
}

function setupHistorialFilters() {
    const filterFecha = document.getElementById('filter-fecha');
    const filterServicio = document.getElementById('filter-servicio');
    
    function applyFilters() {
        const items = document.querySelectorAll('.historial-item');
        const selectedDate = filterFecha.value;
        const selectedService = filterServicio.value;
        
        items.forEach(item => {
            const itemDate = item.getAttribute('data-fecha');
            const itemService = item.getAttribute('data-servicio');
            
            let showItem = true;
            
            if (selectedDate && itemDate !== selectedDate) {
                showItem = false;
            }
            
            if (selectedService && itemService !== selectedService) {
                showItem = false;
            }
            
            item.style.display = showItem ? 'block' : 'none';
        });
    }
    
    filterFecha.addEventListener('change', applyFilters);
    filterServicio.addEventListener('change', applyFilters);
}

// ===== FUNCIONES AUXILIARES =====
function getStatusIcon(status) {
    switch(status) {
        case 'bueno':
            return '✅';
        case 'regular':
            return '⚠️';
        case 'malo':
            return '❌';
        default:
            return '❓';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'success') {
    // Remover notificación existente si la hay
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Ocultar después de 4 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ===== EXPORTACIÓN =====
function exportToJSON() {
    const registros = loadRegistros();
    
    if (registros.length === 0) {
        showNotification('No hay registros para exportar', 'warning');
        return;
    }
    
    // Crear estructura completa para GitHub
    const dataCompleta = {
        version: "1.0.0",
        ultimaActualizacion: new Date().toISOString(),
        configuracion: {
            repositorio: {
                owner: GitHubDB.owner || "tu-usuario-github",
                repo: GitHubDB.repo || "bitacora-mecal",
                branch: "main"
            },
            autoSync: true,
            syncInterval: 30000
        },
        registros: registros
    };
    
    // Exportar como JSON normal
    const dataStr = JSON.stringify(dataCompleta, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `bitacora-mecal-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // También crear archivo data.js para GitHub
    const dataJsContent = `// ===== DATOS CENTRALIZADOS PARA GITHUB PAGES =====
// Este archivo contiene los registros compartidos entre todos los usuarios
// Actualizado automáticamente: ${new Date().toLocaleString('es-ES')}

const DATOS_BITACORA = ${JSON.stringify(dataCompleta, null, 4)};

// Función para obtener configuración
function obtenerConfiguracion() {
    return DATOS_BITACORA.configuracion;
}

// Función para obtener todos los registros
function obtenerRegistros() {
    return DATOS_BITACORA.registros || [];
}

// Función para obtener estadísticas rápidas
function obtenerEstadisticas() {
    const registros = DATOS_BITACORA.registros || [];
    if (registros.length === 0) return { total: 0, ultimoServicio: null };
    
    const ultimoRegistro = registros[registros.length - 1];
    let contadores = { bueno: 0, regular: 0, malo: 0 };
    
    Object.values(ultimoRegistro.equipos || {}).forEach(categoria => {
        Object.values(categoria).forEach(equipo => {
            contadores[equipo.estado] = (contadores[equipo.estado] || 0) + 1;
        });
    });
    
    return {
        total: registros.length,
        ultimoServicio: ultimoRegistro,
        contadores: contadores
    };
}`;
    
    const dataJsBlob = new Blob([dataJsContent], {type: 'text/javascript'});
    const linkJs = document.createElement('a');
    linkJs.href = URL.createObjectURL(dataJsBlob);
    linkJs.download = 'data.js';
    linkJs.click();
    
    showNotification('Archivos exportados: JSON y data.js para GitHub', 'success');
}

function verDetalleRegistro(registroId) {
    const registros = loadRegistros();
    const registro = registros.find(r => r.id === registroId);
    
    if (!registro) {
        showNotification('Registro no encontrado', 'error');
        return;
    }
    
    // Crear modal con detalles
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        width: 100%;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    `;
    
    // Generar contenido detallado
    let equiposDetalle = '';
    Object.entries(registro.equipos || {}).forEach(([categoria, equipos]) => {
        const categoriaNombre = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        const iconClass = BitacoraApp.iconos[categoria];
        
        equiposDetalle += `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="color: var(--primary-color); margin-bottom: 1rem;">
                    <i class="${iconClass}"></i> ${categoriaNombre}
                </h4>
        `;
        
        Object.entries(equipos).forEach(([equipoId, equipoData]) => {
            const equipoNombre = BitacoraApp.equiposNombres[equipoId];
            const statusIcon = getStatusIcon(equipoData.estado);
            const statusClass = equipoData.estado;
            
            equiposDetalle += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 6px; background: ${statusClass === 'bueno' ? '#d4edda' : statusClass === 'regular' ? '#fff3cd' : '#f8d7da'}; color: ${statusClass === 'bueno' ? '#155724' : statusClass === 'regular' ? '#856404' : '#721c24'};">
                    <span><strong>${equipoNombre}</strong></span>
                    <span>${statusIcon}</span>
                </div>
                ${equipoData.observaciones ? `<div style="font-size: 0.9rem; color: #666; margin-bottom: 1rem; padding-left: 1rem;"><em>${equipoData.observaciones}</em></div>` : ''}
            `;
        });
        
        equiposDetalle += '</div>';
    });
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem;">
            <h2 style="color: var(--dark-color); margin: 0;">Detalle del Registro</h2>
            <button onclick="this.closest('.modal').remove()" style="background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.2rem;">×</button>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Información del Servicio</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div><strong>Tipo de Servicio:</strong><br>${registro.tipoServicio}</div>
                <div><strong>Fecha:</strong><br>${formatDate(registro.fechaServicio)}</div>
                <div><strong>Hora:</strong><br>${registro.horaInicio}${registro.horaFinalizacion ? ' - ' + registro.horaFinalizacion : ''}</div>
                <div><strong>Responsable:</strong><br>${registro.nombreResponsable}</div>
                <div><strong>Rol:</strong><br>${registro.rolResponsable}</div>
                <div><strong>Registrado:</strong><br>${formatDateTime(registro.fecha)}</div>
            </div>
            ${registro.observacionesGenerales ? `<div><strong>Observaciones Generales:</strong><br><em>${registro.observacionesGenerales}</em></div>` : ''}
        </div>
        
        <div>
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Estado de Equipos</h3>
            ${equiposDetalle}
        </div>
        
        <div style="text-align: center; margin-top: 2rem;">
            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">Cerrar</button>
        </div>
    `;
    
    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ===== FUNCIONES ADICIONALES PARA FUTURAS MEJORAS =====

// Función para importar registros desde JSON
function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                // Validar estructura básica
                const validData = importedData.filter(registro => 
                    registro.id && registro.tipoServicio && registro.fechaServicio
                );
                
                if (validData.length > 0) {
                    // Confirmar importación
                    if (confirm(`¿Deseas importar ${validData.length} registros? Esto se agregará a los registros existentes.`)) {
                        const existingRegistros = loadRegistros();
                        const mergedRegistros = [...existingRegistros, ...validData];
                        
                        localStorage.setItem('bitacoraRegistros', JSON.stringify(mergedRegistros));
                        BitacoraApp.registros = mergedRegistros;
                        
                        updateDashboard();
                        updateHistorial();
                        
                        showNotification(`${validData.length} registros importados exitosamente`, 'success');
                    }
                } else {
                    showNotification('El archivo no contiene registros válidos', 'error');
                }
            } else {
                showNotification('Formato de archivo inválido', 'error');
            }
        } catch (error) {
            showNotification('Error al leer el archivo JSON', 'error');
            console.error('Error importing JSON:', error);
        }
    };
    
    reader.readAsText(file);
}

// Función para generar reporte PDF (requeriría una librería como jsPDF)
function generatePDFReport() {
    showNotification('Función de PDF próximamente disponible', 'info');
}

// Función para enviar datos a servidor externo (GitHub, Google Sheets, etc.)
function syncToCloud() {
    showNotification('Función de sincronización próximamente disponible', 'info');
}

// ===== GESTIÓN DE TIPOS DE SERVICIO =====

// Función para cargar tipos de servicio desde localStorage
function cargarTiposServicio() {
    const tiposGuardados = localStorage.getItem('bitacora-tipos-servicio');
    if (tiposGuardados) {
        try {
            BitacoraApp.tiposServicio = JSON.parse(tiposGuardados);
        } catch (error) {
            console.error('Error al cargar tipos de servicio:', error);
            // Mantener tipos por defecto si hay error
        }
    }
    actualizarSelectTiposServicio();
}

// Función para guardar tipos de servicio en localStorage
function guardarTiposServicio() {
    localStorage.setItem('bitacora-tipos-servicio', JSON.stringify(BitacoraApp.tiposServicio));
}

// Función para actualizar los selects de tipos de servicio
function actualizarSelectTiposServicio() {
    // Actualizar select principal del formulario
    const selectPrincipal = document.getElementById('tipoServicio');
    if (selectPrincipal) {
        const valorActual = selectPrincipal.value;
        selectPrincipal.innerHTML = '<option value="">Seleccionar...</option>';
        
        BitacoraApp.tiposServicio.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            selectPrincipal.appendChild(option);
        });
        
        // Agregar opción para crear nuevo tipo
        const optionNuevo = document.createElement('option');
        optionNuevo.value = '__NUEVO__';
        optionNuevo.textContent = '+ Crear nuevo tipo de servicio...';
        optionNuevo.style.fontStyle = 'italic';
        optionNuevo.style.color = '#007bff';
        selectPrincipal.appendChild(optionNuevo);
        
        // Restaurar valor si existía
        if (valorActual && BitacoraApp.tiposServicio.includes(valorActual)) {
            selectPrincipal.value = valorActual;
        }
    }
    
    // Actualizar select del filtro de historial
    const selectFiltro = document.getElementById('filter-servicio');
    if (selectFiltro) {
        const valorFiltro = selectFiltro.value;
        selectFiltro.innerHTML = '<option value="">Todos los servicios</option>';
        
        BitacoraApp.tiposServicio.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            selectFiltro.appendChild(option);
        });
        
        // Restaurar valor del filtro si existía
        if (valorFiltro && BitacoraApp.tiposServicio.includes(valorFiltro)) {
            selectFiltro.value = valorFiltro;
        }
    }
}

// Función para agregar nuevo tipo de servicio
function agregarNuevoTipoServicio() {
    const nuevoTipo = prompt('Ingresa el nombre del nuevo tipo de servicio:');
    if (!nuevoTipo || !nuevoTipo.trim()) {
        return;
    }
    
    const tipoLimpio = nuevoTipo.trim();
    
    // Verificar que no exista ya
    if (BitacoraApp.tiposServicio.includes(tipoLimpio)) {
        showNotification('Este tipo de servicio ya existe', 'warning');
        return;
    }
    
    // Agregar el nuevo tipo
    BitacoraApp.tiposServicio.push(tipoLimpio);
    guardarTiposServicio();
    actualizarSelectTiposServicio();
    
    // Seleccionar el nuevo tipo automáticamente
    const selectPrincipal = document.getElementById('tipoServicio');
    if (selectPrincipal) {
        selectPrincipal.value = tipoLimpio;
    }
    
    showNotification(`Tipo de servicio "${tipoLimpio}" agregado correctamente`, 'success');
}

// Función para eliminar tipo de servicio
function eliminarTipoServicio(tipoServicio) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${tipoServicio}"?`)) {
        return;
    }
    
    BitacoraApp.tiposServicio = BitacoraApp.tiposServicio.filter(tipo => tipo !== tipoServicio);
    guardarTiposServicio();
    actualizarSelectTiposServicio();
    
    // Actualizar la lista del modal si está abierto
    const modal = document.getElementById('modal-tipos-servicio');
    if (modal && modal.style.display === 'flex') {
        actualizarListaTiposServicio();
    }
    
    showNotification(`Tipo de servicio "${tipoServicio}" eliminado`, 'success');
}

// Función para mostrar modal de gestión de tipos de servicio
function mostrarGestionTiposServicio() {
    const modal = document.getElementById('modal-tipos-servicio');
    if (!modal) return;
    
    actualizarListaTiposServicio();
    
    // Mostrar modal instantáneamente
    modal.style.display = 'flex';
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Event listener para cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModalTiposServicio();
        }
    });
    
    // Focus en el input para agregar nuevo tipo
    setTimeout(() => {
        const input = document.getElementById('nuevo-tipo-servicio');
        if (input) input.focus();
    }, 100);
}

// Función para cerrar modal de tipos de servicio
function cerrarModalTiposServicio() {
    const modal = document.getElementById('modal-tipos-servicio');
    if (modal) {
        // Cerrar instantáneamente
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Limpiar el input
        const input = document.getElementById('nuevo-tipo-servicio');
        if (input) input.value = '';
    }
}

// Función para actualizar la lista de tipos en el modal
function actualizarListaTiposServicio() {
    const lista = document.getElementById('tipos-servicio-list');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (BitacoraApp.tiposServicio.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay tipos de servicio configurados</p>';
        return;
    }
    
    BitacoraApp.tiposServicio.forEach(tipo => {
        const item = document.createElement('div');
        item.className = 'tipo-servicio-item';
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; background: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;';
        
        item.innerHTML = `
            <span style="font-weight: 500;">${tipo}</span>
            <button class="btn btn-danger btn-sm" onclick="eliminarTipoServicio('${tipo.replace(/'/g, '\\\'')}')" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        lista.appendChild(item);
    });
}

// Función para agregar tipo desde el modal
function agregarTipoDesdeModal() {
    const input = document.getElementById('nuevo-tipo-servicio');
    if (!input) return;
    
    const nuevoTipo = input.value.trim();
    if (!nuevoTipo) {
        showNotification('Ingresa un nombre para el tipo de servicio', 'warning');
        input.focus();
        return;
    }
    
    // Verificar que no exista ya
    if (BitacoraApp.tiposServicio.includes(nuevoTipo)) {
        showNotification('Este tipo de servicio ya existe', 'warning');
        input.focus();
        input.select();
        return;
    }
    
    // Agregar el nuevo tipo
    BitacoraApp.tiposServicio.push(nuevoTipo);
    guardarTiposServicio();
    actualizarSelectTiposServicio();
    actualizarListaTiposServicio();
    
    // Limpiar input
    input.value = '';
    input.focus();
    
    showNotification(`Tipo de servicio "${nuevoTipo}" agregado correctamente`, 'success');
}

// ===== GESTIÓN DE INVENTARIO DE EQUIPOS =====

// Estado inicial del inventario
BitacoraApp.inventario = [
    { id: 1, nombre: 'Micrófonos Alámbricos', categoria: 'Audio', cantidad: 1, descripcion: 'Micrófonos con cable' },
    { id: 2, nombre: 'Micrófonos Inalámbricos', categoria: 'Audio', cantidad: 1, descripcion: 'Set de micrófonos inalámbricos' },
    { id: 3, nombre: 'Planta de Sonido', categoria: 'Audio', cantidad: 1, descripcion: 'Sistema principal de audio' },
    { id: 4, nombre: 'CPU Principal', categoria: 'Computadoras', cantidad: 1, descripcion: 'Computadora principal de control' },
    { id: 5, nombre: 'Monitor Principal', categoria: 'Computadoras', cantidad: 1, descripcion: 'Monitor principal de la CPU' },
    { id: 6, nombre: 'Cables HDMI', categoria: 'Conectividad', cantidad: 1, descripcion: 'Cables de video HDMI' },
    { id: 7, nombre: 'Cables de Audio', categoria: 'Conectividad', cantidad: 1, descripcion: 'Cables de conexión de audio' },
    { id: 8, nombre: 'Router WiFi', categoria: 'Internet', cantidad: 1, descripcion: 'Equipo de conexión a internet' },
    { id: 9, nombre: 'Cámara de Celular', categoria: 'Video', cantidad: 1, descripcion: 'Cámara principal para transmisión' },
    { id: 10, nombre: 'TV 1', categoria: 'Video', cantidad: 1, descripcion: 'Pantalla izquierda del altar' },
    { id: 11, nombre: 'TV 2', categoria: 'Video', cantidad: 1, descripcion: 'Pantalla derecha del altar' }
];

BitacoraApp.equipoEnEdicion = null;

// Función para cargar inventario desde localStorage
function cargarInventario() {
    const inventarioGuardado = localStorage.getItem('bitacora-inventario');
    if (inventarioGuardado) {
        try {
            BitacoraApp.inventario = JSON.parse(inventarioGuardado);
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            // Mantener inventario por defecto si hay error
        }
    }
}

// Función para guardar inventario en localStorage
function guardarInventario() {
    try {
        localStorage.setItem('bitacora-inventario', JSON.stringify(BitacoraApp.inventario));
    } catch (error) {
        console.error('Error al guardar inventario:', error);
        showNotification('Error al guardar el inventario', 'error');
    }
}

// Función para generar el siguiente ID disponible
function generarNuevoId() {
    const maxId = Math.max(...BitacoraApp.inventario.map(item => item.id), 0);
    return maxId + 1;
}

// Función para renderizar la tabla de inventario
function renderizarInventario() {
    const tbody = document.getElementById('inventario-tbody');
    if (!tbody) return;

    // Aplicar filtros
    let inventarioFiltrado = [...BitacoraApp.inventario];
    
    const filtroCategoria = document.getElementById('filtro-categoria')?.value;
    const busqueda = document.getElementById('buscar-equipo')?.value?.toLowerCase();
    
    if (filtroCategoria) {
        inventarioFiltrado = inventarioFiltrado.filter(item => item.categoria === filtroCategoria);
    }
    
    if (busqueda) {
        inventarioFiltrado = inventarioFiltrado.filter(item => 
            item.nombre.toLowerCase().includes(busqueda) ||
            item.descripcion.toLowerCase().includes(busqueda)
        );
    }

    // Ordenar por ID
    inventarioFiltrado.sort((a, b) => a.id - b.id);

    if (inventarioFiltrado.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="inventario-empty">
                    <i class="fas fa-search"></i>
                    No se encontraron equipos que coincidan con los filtros
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = inventarioFiltrado.map(item => `
        <tr>
            <td class="equipo-id">#${item.id}</td>
            <td class="equipo-nombre">${item.nombre}</td>
            <td class="equipo-categoria">
                <span class="categoria-badge ${item.categoria.toLowerCase()}">${item.categoria}</span>
            </td>
            <td class="equipo-cantidad">${item.cantidad || 1}</td>
            <td class="equipo-descripcion" title="${item.descripcion}">
                ${item.descripcion}
            </td>
            <td class="equipo-acciones">
                <button class="btn-action btn-edit" onclick="editarEquipo(${item.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="eliminarEquipo(${item.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para abrir modal de crear/editar equipo
function abrirModalEquipo(id = null) {
    const modal = document.getElementById('modal-equipo');
    const titulo = document.getElementById('modal-equipo-title');
    const form = document.getElementById('form-equipo');
    
    if (!modal || !titulo || !form) return;
    
    // Limpiar formulario
    form.reset();
    BitacoraApp.equipoEnEdicion = id;
    
    if (id) {
        // Modo edición
        const equipo = BitacoraApp.inventario.find(item => item.id === id);
        if (equipo) {
            titulo.innerHTML = '<i class="fas fa-edit"></i> Editar Equipo';
            document.getElementById('equipo-nombre').value = equipo.nombre;
            document.getElementById('equipo-categoria').value = equipo.categoria;
            document.getElementById('equipo-cantidad').value = equipo.cantidad || 1;
            document.getElementById('equipo-descripcion').value = equipo.descripcion;
        }
    } else {
        // Modo creación
        titulo.innerHTML = '<i class="fas fa-plus"></i> Agregar Equipo';
        const cantidadInput = document.getElementById('equipo-cantidad');
        if (cantidadInput) cantidadInput.value = 1;
    }
    
    // Mostrar modal instantáneamente
    modal.style.display = 'flex';
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Focus en el primer campo
    const nombreInput = document.getElementById('equipo-nombre');
    if (nombreInput) nombreInput.focus();
}

// Función para cerrar modal de equipo
function cerrarModalEquipo() {
    const modal = document.getElementById('modal-equipo');
    if (modal) {
        // Cerrar instantáneamente
        modal.style.display = 'none';
        document.body.style.overflow = '';
        BitacoraApp.equipoEnEdicion = null;
    }
}

// Función para guardar equipo (crear o editar)
function guardarEquipo() {
    const nombre = document.getElementById('equipo-nombre')?.value?.trim();
    const categoria = document.getElementById('equipo-categoria')?.value;
    const cantidad = parseInt(document.getElementById('equipo-cantidad')?.value || '1', 10);
    const descripcion = document.getElementById('equipo-descripcion')?.value?.trim() || '';
    
    // Validaciones
    if (!nombre) {
        showNotification('El nombre del equipo es obligatorio', 'error');
        return;
    }
    
    if (!categoria) {
        showNotification('La categoría es obligatoria', 'error');
        return;
    }

    if (isNaN(cantidad) || cantidad < 1) {
        showNotification('La cantidad debe ser un número válido mayor o igual a 1', 'error');
        return;
    }
    
    // Verificar si ya existe un equipo con el mismo nombre (excepto el que se está editando)
    const existeNombre = BitacoraApp.inventario.some(item => 
        item.nombre.toLowerCase() === nombre.toLowerCase() && 
        item.id !== BitacoraApp.equipoEnEdicion
    );
    
    if (existeNombre) {
        showNotification('Ya existe un equipo con ese nombre', 'error');
        return;
    }
    
    if (BitacoraApp.equipoEnEdicion) {
        // Editar equipo existente
        const index = BitacoraApp.inventario.findIndex(item => item.id === BitacoraApp.equipoEnEdicion);
        if (index !== -1) {
            BitacoraApp.inventario[index] = {
                ...BitacoraApp.inventario[index],
                nombre,
                categoria,
                cantidad,
                descripcion
            };
            showNotification('Equipo actualizado correctamente', 'success');
        }
    } else {
        // Crear nuevo equipo
        const nuevoEquipo = {
            id: generarNuevoId(),
            nombre,
            categoria,
            cantidad,
            descripcion
        };
        BitacoraApp.inventario.push(nuevoEquipo);
        showNotification('Equipo agregado correctamente', 'success');
    }
    
    // Guardar en localStorage y actualizar vista
    guardarInventario();
    renderizarInventario();
    cerrarModalEquipo();
}

// Función para editar equipo
function editarEquipo(id) {
    abrirModalEquipo(id);
}

// Función para eliminar equipo
function eliminarEquipo(id) {
    const equipo = BitacoraApp.inventario.find(item => item.id === id);
    if (!equipo) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar "${equipo.nombre}"?`)) {
        BitacoraApp.inventario = BitacoraApp.inventario.filter(item => item.id !== id);
        guardarInventario();
        renderizarInventario();
        showNotification('Equipo eliminado correctamente', 'success');
    }
}

// Función para exportar el inventario de equipos a JSON
function exportarInventario() {
    if (BitacoraApp.inventario.length === 0) {
        showNotification('No hay equipos en el inventario para exportar', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(BitacoraApp.inventario, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `inventario-mecal-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Inventario exportado exitosamente', 'success');
}

/* ===== FUNCIONES PARA MENÚ MÓVIL ===== */
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const overlay = document.getElementById('mobileMenuOverlay');

    const isActive = navMenu.classList.contains('active');

    if (isActive) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const overlay = document.getElementById('mobileMenuOverlay');

    navMenu.classList.add('active');
    toggleButton.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evita scroll del fondo
}

function closeMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const overlay = document.getElementById('mobileMenuOverlay');

    navMenu.classList.remove('active');
    toggleButton.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restaura scroll
}

// Cierra el menú si se presiona la tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('navMenu').classList.contains('active')) {
            closeMobileMenu();
        }
        
        // Cerrar modal de tipos de servicio con Escape
        const modalTiposServicio = document.getElementById('modal-tipos-servicio');
        if (modalTiposServicio && modalTiposServicio.style.display === 'flex') {
            cerrarModalTiposServicio();
        }
        
        // Cerrar modal de equipos con Escape
        const modalEquipo = document.getElementById('modal-equipo');
        if (modalEquipo && modalEquipo.style.display === 'flex') {
            cerrarModalEquipo();
        }
    }
});

// Modificar showPage para cerrar el menú móvil al cambiar de página
const originalShowPage = showPage;
showPage = function(pageId) {
    originalShowPage(pageId);
    if (document.getElementById('navMenu').classList.contains('active')) {
        closeMobileMenu();
    }
};
