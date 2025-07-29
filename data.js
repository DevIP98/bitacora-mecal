// ===== DATOS CENTRALIZADOS PARA GITHUB PAGES =====
// Este archivo contiene los registros compartidos entre todos los usuarios
// Se actualiza automáticamente cuando alguien hace un nuevo registro

const DATOS_BITACORA = {
    "version": "1.0.0",
    "ultimaActualizacion": "2025-07-29T00:00:00.000Z",
    "configuracion": {
        "repositorio": {
            "owner": "tu-usuario-github", // CAMBIAR por tu usuario de GitHub
            "repo": "bitacora-mecal",     // CAMBIAR por el nombre de tu repositorio
            "branch": "main"
        },
        "autoSync": true,
        "syncInterval": 30000 // 30 segundos
    },
    "registros": [
        // Registros de ejemplo - se reemplazarán con datos reales
        {
            "id": "ejemplo-2025072901",
            "fecha": "2025-07-29T09:00:00.000Z",
            "tipoServicio": "Servicio Domingo AM",
            "fechaServicio": "2025-07-29",
            "horaInicio": "09:00",
            "horaFinalizacion": "11:00",
            "nombreResponsable": "Juan Pérez",
            "rolResponsable": "Técnico Audio",
            "observacionesGenerales": "Servicio normal, sin incidencias",
            "equipos": {
                "audio": {
                    "microfonos-inalambricos": {
                        "estado": "bueno",
                        "observaciones": "Funcionando correctamente"
                    },
                    "microfonos-instalaciones": {
                        "estado": "regular",
                        "observaciones": "Uno con ruido intermitente"
                    },
                    "piano-senda": {
                        "estado": "bueno",
                        "observaciones": ""
                    }
                },
                "computadoras": {
                    "cpu-principal": {
                        "estado": "bueno",
                        "observaciones": ""
                    },
                    "monitor-principal": {
                        "estado": "bueno",
                        "observaciones": ""
                    }
                },
                "conectividad": {
                    "cables-hdmi": {
                        "estado": "regular",
                        "observaciones": "Cable 2 con conexión intermitente"
                    },
                    "cajas-audio": {
                        "estado": "bueno",
                        "observaciones": ""
                    }
                },
                "internet": {
                    "router-wifi": {
                        "estado": "bueno",
                        "observaciones": ""
                    }
                },
                "video": {
                    "camara-captura": {
                        "estado": "bueno",
                        "observaciones": ""
                    },
                    "tv-1": {
                        "estado": "bueno",
                        "observaciones": ""
                    },
                    "tv-2": {
                        "estado": "malo",
                        "observaciones": "No enciende, revisar fuente"
                    }
                }
            }
        }
    ]
};

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
}
