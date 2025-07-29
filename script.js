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
            'microfonos-instalaciones', 
            'piano-senda'
        ],
        computadoras: [
            'cpu-principal',
            'monitor-principal'
        ],
        conectividad: [
            'cables-hdmi',
            'cajas-audio'
        ],
        internet: [
            'router-wifi'
        ],
        video: [
            'camara-captura',
            'tv-1',
            'tv-2'
        ]
    },
    
    // Nombres amigables para los equipos
    equiposNombres: {
        'microfonos-inalambricos': 'Micrófonos Inalámbricos',
        'microfonos-instalaciones': 'Micrófonos Instalaciones',
        'piano-senda': 'Piano de Senda',
        'cpu-principal': 'CPU Principal',
        'monitor-principal': 'Monitor Principal',
        'cables-hdmi': 'Cables HDMI',
        'cajas-audio': 'Cajas de Audio',
        'router-wifi': 'Router WiFi',
        'camara-captura': 'Cámara de Captura',
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
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeGitHub();
    loadRegistros();
    updateDashboard();
    updateHistorial();
    setDefaultValues();
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
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fab fa-github"></i> Configuración GitHub - Una sola vez</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="config-info">
                        <p><strong>🎯 Sistema iniciado limpio</strong></p>
                        <p>Esta configuración se sincronizará automáticamente en todos los dispositivos.</p>
                    </div>
                    
                    <div class="config-form">
                        <div class="form-group">
                            <label for="github-owner">Usuario/Organización de GitHub:</label>
                            <input type="text" id="github-owner" placeholder="DevIP98" value="${this.owner || 'DevIP98'}">
                        </div>
                        
                        <div class="form-group">
                            <label for="github-repo">Nombre del Repositorio:</label>
                            <input type="text" id="github-repo" placeholder="bitacora-mecal" value="${this.repo || 'bitacora-mecal'}">
                        </div>
                        
                        <div class="form-group">
                            <label for="github-token">Token (requerido para guardado automático):</label>
                            <input type="password" id="github-token" placeholder="Pega tu token de GitHub aquí">
                            <small><strong>⚠️ Sin token solo podrás ver datos existentes</strong></small>
                        </div>
                    </div>

                    <div id="test-result"></div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="GitHubDB.probarYGuardarConfig()">
                        <i class="fas fa-check"></i> Probar y Guardar
                    </button>
                    <button class="btn btn-secondary" onclick="GitHubDB.saltarConfiguracion()">
                        <i class="fas fa-times"></i> Solo Local
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async probarYGuardarConfig() {
        const ownerInput = document.getElementById('github-owner');
        const repoInput = document.getElementById('github-repo');
        const tokenInput = document.getElementById('github-token');
        
        const owner = ownerInput ? ownerInput.value.trim() : '';
        const repo = repoInput ? repoInput.value.trim() : '';
        const token = tokenInput ? tokenInput.value.trim() : '';
        
        console.log('Configuración a guardar:', { owner, repo, hasToken: !!token });
        
        if (!owner || !repo) {
            this.mostrarResultadoPrueba('Por favor completa usuario y repositorio', 'error');
            return;
        }

        this.mostrarResultadoPrueba('Probando conexión...', 'info');

        try {
            // Probar acceso de lectura
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            
            if (!response.ok) {
                throw new Error(`Repositorio ${owner}/${repo} no encontrado o no es público`);
            }

            // Si hay token, probar escritura
            if (token) {
                const testResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/README.md`, {
                    headers: { 'Authorization': `token ${token}` }
                });
                
                if (!testResponse.ok) {
                    throw new Error('Token inválido o sin permisos');
                }
            }

            // Guardar configuración exitosa
            const config = {
                owner,
                repo,
                token: token || null,
                lastUpdated: new Date().toISOString(),
                deviceConfigured: navigator.userAgent.substring(0, 50)
            };

            console.log('Aplicando configuración:', config);
            this.aplicarConfiguracion(config);
            
            // Guardar configuración en GitHub para otros dispositivos
            if (token) {
                await this.guardarConfiguracionEnGitHub(config);
                this.mostrarResultadoPrueba('✅ Configuración guardada exitosamente y sincronizada', 'success');
            } else {
                this.mostrarResultadoPrueba('✅ Configuración guardada (modo solo lectura)', 'success');
            }
            
            setTimeout(() => {
                const modalOverlay = document.querySelector('.modal-overlay');
                if (modalOverlay) {
                    modalOverlay.remove();
                }
                
                if (token) {
                    showNotification('GitHub configurado correctamente para todos los dispositivos', 'success');
                    startAutoSync();
                } else {
                    showNotification('GitHub configurado en modo lectura - exporta manualmente para sincronizar', 'info');
                }
                
                // Actualizar la UI
                this.actualizarEstadoConexion();
                
            }, 2000);

        } catch (error) {
            this.mostrarResultadoPrueba(`❌ Error: ${error.message}`, 'error');
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
                badge.className = 'status-badge connected';
                badge.innerHTML = this.token ? 
                    '<i class="fas fa-sync"></i> Sincronización Activa' : 
                    '<i class="fas fa-eye"></i> Solo Lectura';
            } else {
                badge.className = 'status-badge disconnected';
                badge.innerHTML = '<i class="fas fa-unlink"></i> Solo Local';
            }
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
            // Cargar desde data.js
            const dataJsUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/data.js`;
            
            const response = await fetch(dataJsUrl);
            if (response.ok) {
                const content = await response.text();
                
                // Extraer los registros del archivo data.js usando regex
                const registrosMatch = content.match(/["']registros["']\s*:\s*(\[[\s\S]*?\])/);
                if (registrosMatch) {
                    const registrosJson = registrosMatch[1];
                    return JSON.parse(registrosJson);
                }
            }
            
            return [];
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
    if (!GitHubDB.owner || !GitHubDB.repo) {
        showNotification('GitHub no configurado', 'warning');
        GitHubDB.mostrarConfiguracion();
        return;
    }
    
    showSyncIndicator('syncing', 'Sincronizando...');
    
    try {
        // 1. Cargar registros desde GitHub
        const registrosGitHub = await GitHubDB.cargarRegistros();
        
        // 2. Cargar registros locales
        const registrosLocales = JSON.parse(localStorage.getItem('bitacoraRegistros') || '[]');
        
        // 3. Combinar y eliminar duplicados
        const todosRegistros = [...registrosGitHub, ...registrosLocales];
        const registrosUnicos = todosRegistros.filter((registro, index, self) => 
            index === self.findIndex(r => r.id === registro.id)
        );
        
        // 4. Identificar registros nuevos para subir
        const registrosParaSubir = registrosLocales.filter(local => 
            !registrosGitHub.some(github => github.id === local.id)
        );
        
        // 5. Subir registros nuevos
        for (const registro of registrosParaSubir) {
            await GitHubDB.guardarRegistro(registro);
        }
        
        // 6. Actualizar localStorage con todos los registros
        localStorage.setItem('bitacoraRegistros', JSON.stringify(registrosUnicos));
        BitacoraApp.registros = registrosUnicos;
        
        // 7. Actualizar vistas
        updateDashboard();
        updateHistorial();
        
        BitacoraApp.lastSyncTime = new Date();
        showSyncIndicator('success', 'Sincronización completada');
        
        setTimeout(() => hideSyncIndicator(), 3000);
        
    } catch (error) {
        console.error('Error sincronizando:', error);
        showSyncIndicator('error', 'Error en sincronización');
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
    // Verificar si data.js está limpio
    const registrosCentrales = typeof obtenerRegistros === 'function' ? obtenerRegistros() : [];
    
    if (registrosCentrales.length === 0) {
        // Sistema limpio - limpiar también localStorage
        localStorage.removeItem('bitacoraRegistros');
        console.log('🧹 Sistema iniciado limpio - sin registros');
        return [];
    }
    
    // Combinar registros locales y centrales solo si hay datos centrales
    const registrosLocales = JSON.parse(localStorage.getItem('bitacoraRegistros') || '[]');
    
    // Combinar y eliminar duplicados
    const todosRegistros = [...registrosCentrales, ...registrosLocales];
    const registrosUnicos = todosRegistros.filter((registro, index, self) => 
        index === self.findIndex(r => r.id === registro.id)
    );
    
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
    
    // Obtener el último registro para mostrar estado actual
    const ultimoRegistro = registros[registros.length - 1];
    
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
    
    // Crear HTML del equipo
    let equiposHtml = '';
    Object.entries(registro.equipos || {}).forEach(([categoria, equipos]) => {
        Object.entries(equipos).forEach(([equipoId, equipoData]) => {
            const equipoNombre = BitacoraApp.equiposNombres[equipoId];
            const statusClass = equipoData.estado;
            const statusIcon = getStatusIcon(equipoData.estado);
            
            equiposHtml += `
                <div class="historial-equipment-item ${statusClass}">
                    <span>${statusIcon}</span>
                    <span>${equipoNombre}</span>
                </div>
            `;
        });
    });
    
    item.innerHTML = `
        <div class="historial-item-header">
            <div>
                <h3 class="historial-item-title">${registro.tipoServicio}</h3>
                <p class="historial-item-date">${formatDateTime(registro.fecha)}</p>
            </div>
            <div class="historial-actions">
                <button class="btn btn-secondary" onclick="verDetalleRegistro(${registro.id})">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
            </div>
        </div>
        
        <div class="historial-item-meta">
            <div class="meta-item">
                <i class="fas fa-calendar"></i> ${formatDate(registro.fechaServicio)}
            </div>
            <div class="meta-item">
                <i class="fas fa-clock"></i> ${registro.horaInicio}${registro.horaFinalizacion ? ' - ' + registro.horaFinalizacion : ''}
            </div>
            <div class="meta-item">
                <i class="fas fa-user"></i> ${registro.nombreResponsable}
            </div>
            <div class="meta-item">
                <i class="fas fa-check-circle" style="color: var(--success-color)"></i> ${contadores.bueno}
            </div>
            <div class="meta-item">
                <i class="fas fa-exclamation-triangle" style="color: var(--warning-color)"></i> ${contadores.regular}
            </div>
            <div class="meta-item">
                <i class="fas fa-times-circle" style="color: var(--danger-color)"></i> ${contadores.malo}
            </div>
        </div>
        
        ${registro.observacionesGenerales ? `<div class="observaciones-generales"><strong>Observaciones:</strong> ${registro.observacionesGenerales}</div>` : ''}
        
        <div class="historial-equipment">
            ${equiposHtml}
        </div>
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

console.log('Bitácora Producción MECAL - Script cargado correctamente');
