// Configuración de Supabase
const SUPABASE_URL = 'https://faghdxupjcbykyiczxam.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HiwmXX3UlJIblqxOW0MTxw_mx0bg4_m';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SupabaseDB = {
    // ----------------------
    // REGISTROS DE BITÁCORA
    // ----------------------
    async cargarRegistros() {
        try {
            // Usamos un JOIN para obtener registros con sus equipos en una sola query
            // Esto evita el límite de 1000 filas en la tabla equipos_estado
            const { data: registros, error: errorRegistros } = await supabaseClient
                .from('registros')
                .select(`
                    *,
                    equipos_estado (
                        categoria,
                        equipo,
                        estado,
                        observaciones
                    )
                `)
                .order('created_at', { ascending: false });

            if (errorRegistros) throw errorRegistros;

            // Transformamos los datos al formato esperado por el frontend
            const registrosCompletos = registros.map(registro => {
                // Agrupar equipos por categoría
                const equiposPorCategoria = {};
                (registro.equipos_estado || []).forEach(eq => {
                    if (!equiposPorCategoria[eq.categoria]) {
                        equiposPorCategoria[eq.categoria] = {};
                    }
                    equiposPorCategoria[eq.categoria][eq.equipo] = {
                        estado: eq.estado,
                        observaciones: eq.observaciones
                    };
                });

                return {
                    id: registro.id,
                    fecha: registro.fecha,
                    tipoServicio: registro.tipo_servicio,
                    fechaServicio: registro.fecha_servicio,
                    horaInicio: registro.hora_inicio,
                    horaFinalizacion: registro.hora_finalizacion,
                    observacionesGenerales: registro.observaciones_generales,
                    nombreResponsable: registro.nombre_responsable,
                    rolResponsable: registro.rol_responsable,
                    equipos: equiposPorCategoria
                };
            });

            return registrosCompletos;
        } catch (error) {
            console.error('Error cargando registros desde Supabase:', error);
            showNotification('Error al cargar datos del servidor', 'error');
            return [];
        }
    },

    async guardarRegistro(registro) {
        try {
            // 1. Insertar el registro principal
            const registroData = {
                id: registro.id,
                fecha: registro.fecha,
                tipo_servicio: registro.tipoServicio,
                fecha_servicio: registro.fechaServicio,
                hora_inicio: registro.horaInicio,
                hora_finalizacion: registro.horaFinalizacion || null,
                observaciones_generales: registro.observacionesGenerales || null,
                nombre_responsable: registro.nombreResponsable,
                rol_responsable: registro.rolResponsable
            };

            const { error: errorRegistro } = await supabaseClient
                .from('registros')
                .upsert(registroData);

            if (errorRegistro) throw errorRegistro;

            // 2. Insertar los equipos
            if (registro.equipos) {
                const equiposAInsertar = [];
                for (const [categoria, equipos] of Object.entries(registro.equipos)) {
                    for (const [equipoId, equipoData] of Object.entries(equipos)) {
                        equiposAInsertar.push({
                            registro_id: registro.id,
                            categoria: categoria,
                            equipo: equipoId,
                            estado: equipoData.estado,
                            observaciones: equipoData.observaciones || ''
                        });
                    }
                }

                if (equiposAInsertar.length > 0) {
                    // Borramos los equipos existentes si es una actualización
                    await supabaseClient.from('equipos_estado').delete().eq('registro_id', registro.id);
                    
                    const { error: errorEquipos } = await supabaseClient
                        .from('equipos_estado')
                        .insert(equiposAInsertar);
                        
                    if (errorEquipos) throw errorEquipos;
                }
            }

            return true;
        } catch (error) {
            console.error('Error guardando registro en Supabase:', error);
            return false;
        }
    },

    // ----------------------
    // INVENTARIO
    // ----------------------
    async cargarInventario() {
        try {
            const { data, error } = await supabaseClient
                .from('inventario')
                .select('*')
                .order('id', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error cargando inventario:', error);
            return null;
        }
    },

    async guardarEquipoInventario(equipo) {
        try {
            // Upsert permite crear o actualizar si ya existe
            const { data, error } = await supabaseClient
                .from('inventario')
                .upsert({
                    id: equipo.id > 1000 ? undefined : equipo.id, // Si es nuevo (ID temporal) dejamos que Supabase asigne el ID serial
                    nombre: equipo.nombre,
                    categoria: equipo.categoria,
                    cantidad: equipo.cantidad,
                    descripcion: equipo.descripcion
                }, { onConflict: 'nombre' })
                .select();
                
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error guardando equipo:', error);
            return null;
        }
    },

    async eliminarEquipoInventario(id) {
        try {
            const { error } = await supabaseClient
                .from('inventario')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error eliminando equipo:', error);
            return false;
        }
    },

    // ----------------------
    // TIPOS DE SERVICIO
    // ----------------------
    async cargarTiposServicio() {
        try {
            const { data, error } = await supabaseClient
                .from('tipos_servicio')
                .select('*')
                .eq('activo', true)
                .order('nombre', { ascending: true });
                
            if (error) throw error;
            return data.map(item => item.nombre);
        } catch (error) {
            console.error('Error cargando tipos de servicio:', error);
            return null;
        }
    },

    async agregarTipoServicio(nombre) {
        try {
            const { error } = await supabaseClient
                .from('tipos_servicio')
                .upsert({ nombre: nombre, activo: true }, { onConflict: 'nombre' });
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error agregando tipo de servicio:', error);
            return false;
        }
    },

    async eliminarTipoServicio(nombre) {
        try {
            // Solo lo marcamos como inactivo para no perder referencias históricas
            const { error } = await supabaseClient
                .from('tipos_servicio')
                .update({ activo: false })
                .eq('nombre', nombre);
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error eliminando tipo de servicio:', error);
            return false;
        }
    },

    // ----------------------
    // CATEGORÍAS DE INVENTARIO
    // ----------------------
    async cargarCategorias() {
        try {
            const { data, error } = await supabaseClient
                .from('categorias_inventario')
                .select('*')
                .order('nombre', { ascending: true });
            if (error) throw error;
            return data.map(c => c.nombre);
        } catch (error) {
            console.error('Error cargando categorías:', error);
            // Fallback a categorías predeterminadas si la tabla no existe aún
            return ['Audio', 'Computadoras', 'Conectividad', 'Internet', 'Video'];
        }
    },

    async agregarCategoria(nombre) {
        try {
            const { error } = await supabaseClient
                .from('categorias_inventario')
                .insert({ nombre });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error agregando categoría:', error);
            return false;
        }
    },

    async eliminarCategoria(nombre) {
        try {
            const { error } = await supabaseClient
                .from('categorias_inventario')
                .delete()
                .eq('nombre', nombre);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            return false;
        }
    }
};
