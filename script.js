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
    ],
    
    // Categorías de inventario dinámicas
    categoriasInventario: []
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async function() {
    // Detect current page by unique container IDs
    const isRegistroPage   = !!document.getElementById('bitacoraForm');
    const isDashboardPage  = !!document.getElementById('page-dashboard');
    const isHistorialPage  = !!document.getElementById('page-historial');
    const isInventarioPage = !!document.getElementById('inventario-tbody');

    // Always initialize UI basics
    initializeApp();

    try {
        // ── REGISTRO PAGE ──────────────────────────────────────────────
        if (isRegistroPage) {
            const tipos = await SupabaseDB.cargarTiposServicio();
            if (tipos && tipos.length > 0) BitacoraApp.tiposServicio = tipos;
            actualizarSelectTiposServicio();
            setDefaultValues();
        }

        // ── DASHBOARD PAGE ─────────────────────────────────────────────
        if (isDashboardPage) {
            const registros = await SupabaseDB.cargarRegistros();
            if (registros) BitacoraApp.registros = registros;
            updateDashboard();
        }

        // ── HISTORIAL PAGE ─────────────────────────────────────────────
        if (isHistorialPage) {
            const registros = await SupabaseDB.cargarRegistros();
            if (registros) BitacoraApp.registros = registros;
            updateHistorial();
        }

        // ── INVENTARIO PAGE ────────────────────────────────────────────
        if (isInventarioPage) {
            // Cargar categorías
            const categorias = await SupabaseDB.cargarCategorias();
            if (categorias && categorias.length > 0) BitacoraApp.categoriasInventario = categorias;
            if (typeof actualizarSelectCategorias === 'function') actualizarSelectCategorias();

            const inv = await SupabaseDB.cargarInventario();
            if (inv) BitacoraApp.inventario = inv;
            renderizarInventario();
        }

        showNotification('Datos cargados correctamente', 'success');
    } catch (err) {
        console.error('Error en carga de datos:', err);
        showNotification('Error al cargar datos', 'error');
    }
});


function initializeApp() {
    // Configurar fecha por defecto
    const today = new Date().toISOString().split('T')[0];
    const fechaEl = document.getElementById('fechaServicio');
    if (fechaEl) fechaEl.value = today;
    
    // Configurar hora por defecto
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    const horaEl = document.getElementById('horaInicio');
    if (horaEl) horaEl.value = timeString;
    
    // Poblar de inmediato con tipos de servicio por defecto (evita dropdown vacío si Supabase está pausado)
    actualizarSelectTiposServicio();
    
    // Cargar tipos de servicio actualizados desde Supabase
    cargarTiposServicio();
    
    // Configurar eventos del formulario
    setupFormEvents();
    
    // Configurar eventos de navegación
    setupNavigationEvents();
    
    // Configurar eventos de estado de equipos
    setupEquipmentStatusEvents();
    
    console.log('Aplicación inicializada correctamente');
}


function setDefaultValues() {
    const fechaInput = document.getElementById('fechaServicio');
    if (!fechaInput) return;
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
    // Nav handled by HTML links now
    BitacoraApp.currentPage = pageId;
}
// ===== CONFIGURACIÓN DE EVENTOS =====
function setupFormEvents() {
    const form = document.getElementById('bitacoraForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
    
    // Eventos para guardar datos del responsable
    const nombreResp = document.getElementById('nombreResponsable');
    if (nombreResp) nombreResp.addEventListener('blur', function() {
        localStorage.setItem('ultimoResponsable', this.value);
    });
    
    const rolResp = document.getElementById('rolResponsable');
    if (rolResp) rolResp.addEventListener('change', function() {
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

// Eventos para los botones de estado de equipos
function setupEquipmentStatusEvents() {
    const statusBtns = document.querySelectorAll('.status-btn');
    if (!statusBtns.length) return;
    
    statusBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            const item = this.dataset.item;
            const status = this.dataset.status;
            
            // Remover clase active de otros botones del mismo equipo
            const equipmentItem = this.closest('.equipment-item');
            if (equipmentItem) {
                equipmentItem.querySelectorAll('.status-btn').forEach(b => {
                    b.classList.remove('active');
                });
                // Agregar clase active al botón seleccionado
                this.classList.add('active');
                // Guardar el estado en un atributo data del contenedor
                equipmentItem.setAttribute('data-status', status);
            }
            console.log(`Estado actualizado: ${item} -> ${status}`);
        });
    });
}

// ===== ACCIONES RÁPIDAS DE INTERFAZ =====
// Marcar todos los equipos del formulario como 'bueno'
function marcarTodoBueno() {
    const items = document.querySelectorAll('.equipment-item');
    if (!items.length) return;
    
    let count = 0;
    items.forEach(item => {
        const goodBtn = item.querySelector('.status-btn.good');
        if (goodBtn) {
            goodBtn.click();
            count++;
        }
    });
    showNotification(`✅ ${count} equipos marcados como "Bueno"`, 'success');
}

// Marcar equipos de una categoría como 'bueno'
function marcarCategoriaBueno(btn) {
    const category = btn.closest('.equipment-category');
    if (!category) return;
    
    const items = category.querySelectorAll('.equipment-item');
    items.forEach(item => {
        const goodBtn = item.querySelector('.status-btn.good');
        if (goodBtn) goodBtn.click();
    });
    const title = category.querySelector('h4')?.textContent.replace('Todo Bueno', '').trim() || 'Categoría';
    showNotification(`Equipos de "${title}" marcados como "Bueno"`, 'success');
}

// Sincronizar fecha y hora actual automáticamente
function setFechaHoraActual() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().slice(0, 5);
    
    const fechaEl = document.getElementById('fechaServicio');
    if (fechaEl) fechaEl.value = today;
    
    const horaEl = document.getElementById('horaInicio');
    if (horaEl) horaEl.value = timeString;
    
    showNotification('🕒 Fecha y hora sincronizadas con el momento actual', 'info');
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

async function saveRegistro(registro) {
    // Agregar el nuevo registro al array local
    BitacoraApp.registros.push(registro);
    BitacoraApp.registros.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Actualizar vistas inmediatamente para buena UX
    updateDashboard();
    updateHistorial();
    
    // Guardar en Supabase
    showNotification('Guardando en Supabase...', 'info');
    const success = await SupabaseDB.guardarRegistro(registro);
    
    if (success) {
        showNotification('Registro guardado exitosamente', 'success');
    } else {
        showNotification('Error al guardar en el servidor', 'error');
    }
}

function loadRegistros() {
    return BitacoraApp.registros;
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
    if (!document.getElementById('stat-good')) return;
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
    if (!document.getElementById('historial-content')) return;
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
    
    const dataStr = JSON.stringify(registros, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `bitacora-mecal-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Archivo JSON exportado', 'success');
}

function verDetalleRegistro(registroId) {
    const registros = loadRegistros() || [];
    const registro = registros.find(r => String(r.id) === String(registroId));
    
    if (!registro) {
        showNotification('Registro no encontrado', 'error');
        return;
    }
    
    // Guardar referencia activa para compartir y exportar
    BitacoraApp.currentRegistroDetalle = registro;
    
    // Contar estados para resumen ejecutivo
    let totalBueno = 0;
    let totalRegular = 0;
    let totalMalo = 0;
    
    Object.values(registro.equipos || {}).forEach(categoria => {
        Object.values(categoria).forEach(equipo => {
            if (equipo.estado === 'bueno') totalBueno++;
            else if (equipo.estado === 'regular') totalRegular++;
            else if (equipo.estado === 'malo') totalMalo++;
        });
    });
    
    // Crear modal con diseño minimalista compacto
    const modal = document.createElement('div');
    modal.className = 'modal modal-detalle';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content modal-detalle-content';
    
    // Generar categorías en cuadrícula de 2 columnas
    let categoriasHtml = '';
    Object.entries(registro.equipos || {}).forEach(([categoria, equipos]) => {
        const categoriaNombre = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        const iconClass = BitacoraApp.iconos[categoria] || 'fas fa-cogs';
        const listaEquipos = Object.entries(equipos);
        const totalEquiposEnCat = listaEquipos.length;
        
        let filasEquipos = '';
        listaEquipos.forEach(([equipoId, equipoData]) => {
            const equipoNombre = BitacoraApp.equiposNombres[equipoId] || equipoId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const statusClass = equipoData.estado || 'bueno';
            const statusTexto = statusClass === 'bueno' ? 'OK' : statusClass === 'regular' ? 'Alerta' : 'Falla';
            
            filasEquipos += `
                <div class="detalle-equipo-row-compact">
                    <div>
                        <div class="eq-name" title="${equipoNombre}">${equipoNombre}</div>
                        ${equipoData.observaciones ? `<span class="eq-obs"><i class="fas fa-comment-dots"></i> ${equipoData.observaciones}</span>` : ''}
                    </div>
                    <span class="detalle-status-pill-mini ${statusClass}">
                        <span class="status-dot-sm"></span> ${statusTexto}
                    </span>
                </div>
            `;
        });
        
        categoriasHtml += `
            <div class="detalle-categoria-card">
                <div class="detalle-categoria-header-compact">
                    <i class="${iconClass}"></i>
                    <h4>${categoriaNombre}</h4>
                    <span class="cat-count">${totalEquiposEnCat}</span>
                </div>
                <div class="detalle-equipos-list-compact">
                    ${filasEquipos}
                </div>
            </div>
        `;
    });
    
    modalContent.innerHTML = `
        <div id="reporte-captura-area" class="reporte-captura-area">
            <div class="modal-detalle-header">
                <div class="modal-detalle-title-wrap">
                    <div class="modal-detalle-top-meta">
                        <span class="modal-detalle-badge">${registro.tipoServicio}</span>
                        <div class="modal-detalle-summary-pills">
                            <span class="summary-chip good"><i class="fas fa-check"></i> ${totalBueno}</span>
                            ${totalRegular > 0 ? `<span class="summary-chip warning"><i class="fas fa-exclamation-triangle"></i> ${totalRegular}</span>` : ''}
                            ${totalMalo > 0 ? `<span class="summary-chip danger"><i class="fas fa-times"></i> ${totalMalo}</span>` : ''}
                        </div>
                    </div>
                    <h2 class="modal-detalle-title">Reporte del Servicio</h2>
                </div>
                <button class="modal-close" onclick="this.closest('.modal').remove()" aria-label="Cerrar">&times;</button>
            </div>
            
            <!-- Metadatos Compactos (4 Columnas) -->
            <div class="detalle-info-card-compact">
                <div class="detalle-info-item-compact">
                    <span class="detalle-info-label-compact"><i class="fas fa-calendar-alt"></i> Fecha</span>
                    <span class="detalle-info-value-compact" title="${formatDate(registro.fechaServicio)}">${formatDate(registro.fechaServicio)}</span>
                </div>
                <div class="detalle-info-item-compact">
                    <span class="detalle-info-label-compact"><i class="fas fa-clock"></i> Horario</span>
                    <span class="detalle-info-value-compact">${registro.horaInicio}${registro.horaFinalizacion ? ' - ' + registro.horaFinalizacion : ''}</span>
                </div>
                <div class="detalle-info-item-compact">
                    <span class="detalle-info-label-compact"><i class="fas fa-user-check"></i> Responsable</span>
                    <span class="detalle-info-value-compact">${registro.nombreResponsable} <small>(${registro.rolResponsable || 'Servidor'})</small></span>
                </div>
                <div class="detalle-info-item-compact">
                    <span class="detalle-info-label-compact"><i class="fas fa-history"></i> Registrado</span>
                    <span class="detalle-info-value-compact">${formatDateTime(registro.fecha)}</span>
                </div>
            </div>
            
            ${registro.observacionesGenerales ? `
                <div class="detalle-observaciones-compact">
                    <strong><i class="fas fa-sticky-note"></i> Nota:</strong>
                    <span>"${registro.observacionesGenerales}"</span>
                </div>
            ` : ''}
            
            <!-- Cuadrícula 2 Columnas de Equipos -->
            <div class="detalle-categories-grid">
                ${categoriasHtml || '<p style="color: var(--text-muted); font-size: 0.85rem; grid-column: span 2;">No hay equipos registrados.</p>'}
            </div>
        </div>
        
        <!-- Barra de Acciones: WhatsApp, Copiar Imagen, Cerrar -->
        <div class="modal-detalle-toolbar">
            <div class="modal-actions-left">
                <button type="button" class="btn btn-whatsapp" onclick="compartirWhatsApp('${registro.id}', this)">
                    <i class="fab fa-whatsapp"></i> Compartir WhatsApp
                </button>
                <button type="button" class="btn btn-copy-img" onclick="copiarImagenReporte(this)">
                    <i class="fas fa-copy"></i> Copiar Imagen
                </button>
            </div>
            <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary">Cerrar</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic en el backdrop
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ===== COMPARTIR EN WHATSAPP (CON IMAGEN Y TEXTO) =====
async function compartirWhatsApp(registroId, btn) {
    let r = BitacoraApp.currentRegistroDetalle;
    if (!r || (registroId && String(r.id) !== String(registroId))) {
        const registros = loadRegistros() || [];
        r = registros.find(x => String(x.id) === String(registroId));
    }
    
    if (!r) {
        showNotification('No se encontró la información del registro', 'error');
        return;
    }

    let originalBtnHtml = '';
    if (btn) {
        originalBtnHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...';
        btn.disabled = true;
    }
    
    let totalBueno = 0;
    let totalRegular = 0;
    let totalMalo = 0;
    let novedades = [];
    
    Object.entries(r.equipos || {}).forEach(([cat, eqs]) => {
        const catNombre = cat.charAt(0).toUpperCase() + cat.slice(1);
        Object.entries(eqs).forEach(([eqId, data]) => {
            const eqNombre = BitacoraApp.equiposNombres[eqId] || eqId;
            if (data.estado === 'bueno') {
                totalBueno++;
            } else if (data.estado === 'regular') {
                totalRegular++;
                novedades.push(`• *${eqNombre}* (${catNombre}): Regular${data.observaciones ? ' - ' + data.observaciones : ''}`);
            } else if (data.estado === 'malo') {
                totalMalo++;
                novedades.push(`• *${eqNombre}* (${catNombre}): Falla${data.observaciones ? ' - ' + data.observaciones : ''}`);
            }
        });
    });

    const totalEquipos = totalBueno + totalRegular + totalMalo;
    const estadoIcono = totalMalo > 0 ? '🔴' : totalRegular > 0 ? '🟡' : '🟢';
    const estadoTexto = totalMalo > 0 ? `${totalMalo} falla(s)` : totalRegular > 0 ? `${totalRegular} alerta(s)` : 'Todo Operativo';

    // Texto breve y conciso del reporte para WhatsApp
    let mensaje = `📋 *Reporte de Servicio - MECAL*\n` +
        `• *Servicio:* ${r.tipoServicio}\n` +
        `• *Fecha:* ${formatDate(r.fechaServicio)} (${r.horaInicio}${r.horaFinalizacion ? ' - ' + r.horaFinalizacion : ''})\n` +
        `• *Responsable:* ${r.nombreResponsable}\n` +
        `• *Estado:* ${estadoIcono} ${estadoTexto} (${totalBueno}/${totalEquipos} OK)\n`;

    if (r.observacionesGenerales) {
        mensaje += `• *Nota:* ${r.observacionesGenerales}\n`;
    }

    if (novedades.length > 0) {
        mensaje += `\n⚠️ *Novedades:*\n` + novedades.join('\n') + `\n`;
    }

    mensaje += `\n📸 _(Ver imagen adjunta con el detalle completo)_`;

    const area = document.getElementById('reporte-captura-area');
    let imageBlob = null;
    let imageFile = null;

    // Generar captura de imagen del reporte
    if (area && typeof html2canvas !== 'undefined') {
        try {
            const prevAreaOverflow = area.style.overflow;
            const prevAreaHeight = area.style.height;
            const prevAreaMaxHeight = area.style.maxHeight;

            area.style.overflow = 'visible';
            area.style.height = 'auto';
            area.style.maxHeight = 'none';

            const grid = area.querySelector('.detalle-categories-grid');
            const prevGridMaxHeight = grid ? grid.style.maxHeight : '';
            const prevGridOverflow = grid ? grid.style.overflow : '';
            if (grid) {
                grid.style.maxHeight = 'none';
                grid.style.overflow = 'visible';
            }

            const canvas = await html2canvas(area, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                windowWidth: 1000
            });

            area.style.overflow = prevAreaOverflow;
            area.style.height = prevAreaHeight;
            area.style.maxHeight = prevAreaMaxHeight;
            if (grid) {
                grid.style.maxHeight = prevGridMaxHeight;
                grid.style.overflow = prevGridOverflow;
            }

            imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (imageBlob) {
                imageFile = new File([imageBlob], `reporte-mecal-${new Date().toISOString().split('T')[0]}.png`, { type: 'image/png' });
            }
        } catch (e) {
            console.warn('Error capturando imagen:', e);
        }
    }

    if (btn) {
        btn.innerHTML = originalBtnHtml;
        btn.disabled = false;
    }

    // 1. En dispositivos con Web Share nativo (móviles/tablets): compartir imagen + texto directamente
    if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try {
            await navigator.share({
                title: 'Reporte de Servicio MECAL',
                text: mensaje,
                files: [imageFile]
            });
            showNotification('✅ Reporte e imagen enviados a WhatsApp', 'success');
            return;
        } catch (shareErr) {
            if (shareErr.name === 'AbortError') return;
            console.warn('Fallback a WhatsApp Web tras error en share:', shareErr);
        }
    }

    // 2. En PC / WhatsApp Web: copiar imagen al portapapeles y abrir WhatsApp
    let imagenEnPortapapeles = false;
    if (imageBlob && navigator.clipboard && window.ClipboardItem) {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': imageBlob })
            ]);
            imagenEnPortapapeles = true;
        } catch (e) {
            console.warn('No se pudo escribir imagen al portapapeles:', e);
        }
    }

    if (imagenEnPortapapeles) {
        showNotification('📸 ¡Imagen copiada! En WhatsApp solo presiona Ctrl + V para enviarla.', 'success');
    } else {
        showNotification('📲 Abriendo WhatsApp con el reporte...', 'info');
    }

    // Abrir WhatsApp con el texto preparado
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = url;
    }
}

// ===== COPIAR / DESCARGAR IMAGEN COMPLETA DEL REPORTE =====
async function copiarImagenReporte(btn) {
    const area = document.getElementById('reporte-captura-area');
    if (!area) return;
    
    if (typeof html2canvas === 'undefined') {
        showNotification('Cargando librería de captura, intenta nuevamente...', 'warning');
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturando...';
    btn.disabled = true;
    
    try {
        // Asegurar que cualquier contenedor con scroll o altura fija se expanda totalmente
        const prevAreaOverflow = area.style.overflow;
        const prevAreaHeight = area.style.height;
        const prevAreaMaxHeight = area.style.maxHeight;

        area.style.overflow = 'visible';
        area.style.height = 'auto';
        area.style.maxHeight = 'none';

        const grid = area.querySelector('.detalle-categories-grid');
        const prevMaxHeight = grid ? grid.style.maxHeight : '';
        const prevOverflow = grid ? grid.style.overflow : '';
        if (grid) {
            grid.style.maxHeight = 'none';
            grid.style.overflow = 'visible';
        }

        const canvas = await html2canvas(area, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: 1000
        });
        
        // Restaurar estilos
        area.style.overflow = prevAreaOverflow;
        area.style.height = prevAreaHeight;
        area.style.maxHeight = prevAreaMaxHeight;
        if (grid) {
            grid.style.maxHeight = prevMaxHeight;
            grid.style.overflow = prevOverflow;
        }
        
        // Intentar copiar al portapapeles directamente
        if (navigator.clipboard && window.ClipboardItem) {
            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        showNotification('📋 ¡Imagen COMPLETA copiada! Pégala en WhatsApp (Ctrl+V)', 'success');
                    } catch (e) {
                        descargarImagenCanvas(canvas);
                    }
                }
            }, 'image/png');
        } else {
            descargarImagenCanvas(canvas);
        }
    } catch (err) {
        console.error('Error generando imagen:', err);
        showNotification('No se pudo generar la imagen del reporte', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function descargarImagenCanvas(canvas) {
    const link = document.createElement('a');
    link.download = `reporte-mecal-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification('📸 Imagen completa guardada en tus descargas', 'success');
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

// Función para cargar tipos de servicio desde Supabase
async function cargarTiposServicio() {
    try {
        const tipos = await SupabaseDB.cargarTiposServicio();
        if(tipos && tipos.length > 0) {
            BitacoraApp.tiposServicio = tipos;
            actualizarSelectTiposServicio();
        }
    } catch (e) {
        console.warn('Error al cargar tipos de servicio de Supabase:', e);
    }
}

// Función para agregar nuevo tipo de servicio
async function agregarNuevoTipoServicio() {
    const nuevoTipo = prompt('Ingresa el nombre del nuevo tipo de servicio:');
    if (!nuevoTipo || !nuevoTipo.trim()) return;
    const tipoLimpio = nuevoTipo.trim();
    if (BitacoraApp.tiposServicio.includes(tipoLimpio)) {
        showNotification('Este tipo de servicio ya existe', 'warning');
        return;
    }
    
    BitacoraApp.tiposServicio.push(tipoLimpio);
    actualizarSelectTiposServicio();
    document.getElementById('tipoServicio').value = tipoLimpio;
    
    const success = await SupabaseDB.agregarTipoServicio(tipoLimpio);
    if(success) showNotification(`Tipo de servicio "${tipoLimpio}" agregado`, 'success');
    else showNotification('Error al guardar', 'error');
}

// Función para eliminar tipo de servicio
async function eliminarTipoServicio(tipoServicio) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${tipoServicio}"?`)) return;
    
    BitacoraApp.tiposServicio = BitacoraApp.tiposServicio.filter(tipo => tipo !== tipoServicio);
    actualizarSelectTiposServicio();
    const modal = document.getElementById('modal-tipos-servicio');
    if (modal && modal.style.display === 'flex') actualizarListaTiposServicio();
    
    await SupabaseDB.eliminarTipoServicio(tipoServicio);
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

// ===== GESTIÓN DE CATEGORÍAS DE INVENTARIO =====

// Actualizar los select de categorías en la vista
function actualizarSelectCategorias() {
    const filtroSelect = document.getElementById('filtro-categoria');
    const formSelect = document.getElementById('equipo-categoria');
    
    const categorias = BitacoraApp.categoriasInventario || [];
    
    if (filtroSelect) {
        let html = '<option value="">Todas las categorías</option>';
        categorias.forEach(cat => {
            html += `<option value="${cat}">${cat}</option>`;
        });
        filtroSelect.innerHTML = html;
    }
    
    if (formSelect) {
        let html = '<option value="">Seleccionar categoría...</option>';
        categorias.forEach(cat => {
            html += `<option value="${cat}">${cat}</option>`;
        });
        formSelect.innerHTML = html;
    }
}

// Mostrar modal de gestión
function mostrarGestionCategorias() {
    const modal = document.getElementById('modal-categorias');
    if (!modal) return;
    
    actualizarListaCategorias();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) cerrarModalCategorias();
    });
    
    setTimeout(() => {
        const input = document.getElementById('nueva-categoria');
        if (input) input.focus();
    }, 100);
}

// Cerrar modal
function cerrarModalCategorias() {
    const modal = document.getElementById('modal-categorias');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        const input = document.getElementById('nueva-categoria');
        if (input) input.value = '';
    }
}

// Renderizar la lista dentro del modal
function actualizarListaCategorias() {
    const lista = document.getElementById('categorias-list');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (BitacoraApp.categoriasInventario.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay categorías configuradas</p>';
        return;
    }
    
    BitacoraApp.categoriasInventario.forEach(cat => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; background: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;';
        
        item.innerHTML = `
            <span style="font-weight: 500;">${cat}</span>
            <button class="btn btn-danger btn-sm" onclick="eliminarCategoria('${cat.replace(/'/g, '\\\'')}')" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        lista.appendChild(item);
    });
}

// Agregar desde modal
async function agregarCategoriaDesdeModal() {
    const input = document.getElementById('nueva-categoria');
    if (!input) return;
    
    const nuevaCategoria = input.value.trim();
    if (!nuevaCategoria) {
        showNotification('Ingresa un nombre para la categoría', 'warning');
        input.focus();
        return;
    }
    
    if (BitacoraApp.categoriasInventario.includes(nuevaCategoria)) {
        showNotification('Esta categoría ya existe', 'warning');
        input.focus();
        input.select();
        return;
    }
    
    // Add optimistically
    BitacoraApp.categoriasInventario.push(nuevaCategoria);
    BitacoraApp.categoriasInventario.sort();
    actualizarSelectCategorias();
    actualizarListaCategorias();
    
    input.value = '';
    input.focus();
    
    const success = await SupabaseDB.agregarCategoria(nuevaCategoria);
    if(success) showNotification(`Categoría "${nuevaCategoria}" agregada`, 'success');
    else showNotification('Error al guardar categoría en servidor', 'error');
}

// Eliminar categoría
async function eliminarCategoria(nombre) {
    // Check if category is in use
    const enUso = BitacoraApp.inventario.some(item => item.categoria === nombre);
    if (enUso) {
        showNotification(`No se puede eliminar la categoría "${nombre}" porque hay equipos que la utilizan`, 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${nombre}"?`)) return;
    
    // Eliminar optimistically
    BitacoraApp.categoriasInventario = BitacoraApp.categoriasInventario.filter(c => c !== nombre);
    actualizarSelectCategorias();
    actualizarListaCategorias();
    
    await SupabaseDB.eliminarCategoria(nombre);
}


// ===== GESTIÓN DE INVENTARIO DE EQUIPOS =====

// El inventario se carga dinámicamente desde Supabase en DOMContentLoaded



// Función para cargar inventario desde localStorage
async function cargarInventario() {
    // Ya se carga al inicio, esto es por si se necesita recargar
    const inv = await SupabaseDB.cargarInventario();
    if (inv) {
        BitacoraApp.inventario = inv;
        renderizarInventario();
    }
}

// Función para guardar inventario en localStorage
function guardarInventario() {
    // No hace nada localmente ahora, se guarda por equipo en guardarEquipo
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
async function guardarEquipo() {
    const nombre = document.getElementById('equipo-nombre')?.value?.trim();
    const categoria = document.getElementById('equipo-categoria')?.value;
    const cantidad = parseInt(document.getElementById('equipo-cantidad')?.value || '1', 10);
    const descripcion = document.getElementById('equipo-descripcion')?.value?.trim() || '';
    
    if (!nombre || !categoria || isNaN(cantidad) || cantidad < 1) {
        showNotification('Datos inválidos', 'error');
        return;
    }
    
    const existeNombre = BitacoraApp.inventario.some(item => 
        item.nombre.toLowerCase() === nombre.toLowerCase() && 
        item.id !== BitacoraApp.equipoEnEdicion
    );
    if (existeNombre) {
        showNotification('Ya existe un equipo con ese nombre', 'error');
        return;
    }
    
    let equipoObj = {
        id: BitacoraApp.equipoEnEdicion || Date.now(), // ID temporal si es nuevo
        nombre, categoria, cantidad, descripcion
    };

    // Actualizar UI optimistamente
    if (BitacoraApp.equipoEnEdicion) {
        const index = BitacoraApp.inventario.findIndex(item => item.id === BitacoraApp.equipoEnEdicion);
        if (index !== -1) BitacoraApp.inventario[index] = equipoObj;
    } else {
        BitacoraApp.inventario.push(equipoObj);
    }
    renderizarInventario();
    cerrarModalEquipo();
    
    // Guardar en servidor
    const saved = await SupabaseDB.guardarEquipoInventario(equipoObj);
    if(saved) {
        // Actualizar con ID real de DB si es nuevo
        if(!BitacoraApp.equipoEnEdicion) {
            equipoObj.id = saved.id;
        }
        showNotification('Equipo guardado', 'success');
    } else {
        showNotification('Error al guardar equipo', 'error');
    }
}

// Función para editar equipo
function editarEquipo(id) {
    abrirModalEquipo(id);
}

// Función para eliminar equipo
async function eliminarEquipo(id) {
    const equipo = BitacoraApp.inventario.find(item => item.id === id);
    if (!equipo) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar "${equipo.nombre}"?`)) {
        // Optimistic UI
        BitacoraApp.inventario = BitacoraApp.inventario.filter(item => item.id !== id);
        renderizarInventario();
        
        const success = await SupabaseDB.eliminarEquipoInventario(id);
        if(success) {
            showNotification('Equipo eliminado', 'success');
        } else {
            showNotification('Error al eliminar', 'error');
            // Revertir en caso de error
            BitacoraApp.inventario.push(equipo);
            renderizarInventario();
        }
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


function actualizarSelectTiposServicio() {
    const select = document.getElementById('tipoServicio');
    if (!select) return;
    
    let html = '<option value="">Seleccionar...</option>';
    const tiposActivos = BitacoraApp.tiposServicio || [];
    
    tiposActivos.forEach(tipo => {
        html += `<option value="${tipo}">${tipo}</option>`;
    });
    
    // Si estamos en edición y el tipo actual no está en la lista activa, lo añadimos temporalmente
    if (BitacoraApp.currentEdit && !tiposActivos.includes(BitacoraApp.currentEdit.tipoServicio)) {
        html += `<option value="${BitacoraApp.currentEdit.tipoServicio}">${BitacoraApp.currentEdit.tipoServicio} (Inactivo)</option>`;
    }
    
    html += '<option value="__NUEVO__" class="option-nuevo">+ Añadir nuevo tipo...</option>';
    select.innerHTML = html;
}
