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
document.addEventListener('DOMContentLoaded', async function() {
    initializeApp();
    
    // Mostrar indicador de carga
    showNotification('Conectando a Supabase...', 'info');
    
    // Cargar registros
    const registros = await SupabaseDB.cargarRegistros();
    if (registros) BitacoraApp.registros = registros;
    
    updateDashboard();
    updateHistorial();
    setDefaultValues();
    
    // Cargar inventario
    const inv = await SupabaseDB.cargarInventario();
    if (inv) BitacoraApp.inventario = inv;
    renderizarInventario();
    
    // Cargar tipos de servicio
    const tipos = await SupabaseDB.cargarTiposServicio();
    if (tipos && tipos.length > 0) BitacoraApp.tiposServicio = tipos;
    actualizarSelectTiposServicio();
    
    showNotification('Datos cargados correctamente', 'success');
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
    if (!document.getElementById('total-registros')) return;
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
async function cargarTiposServicio() {
    const tipos = await SupabaseDB.cargarTiposServicio();
    if(tipos) {
        BitacoraApp.tiposServicio = tipos;
        actualizarSelectTiposServicio();
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
    if (!document.getElementById('inventario-list')) return;
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
