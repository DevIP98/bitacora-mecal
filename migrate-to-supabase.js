require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Obtener credenciales desde las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_ANON_KEY.');
  console.error('Por favor, configúralas en un archivo .env o exponlas en tu terminal.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const registrosDir = path.join(__dirname, 'registros');

async function migrarDatos() {
  console.log('Iniciando migración de datos a Supabase...');
  
  // 1. Insertar tipos de servicio por defecto si no existen
  const tiposServicioIniciales = [
    'Servicio Familiar Domingo AM',
    'Servicio Familiar Domingo PM',
    'Servicio Energy Plus',
    'Servicio de Parejas',
    'Servicio de ADR',
    'Congreso la Reforma',        
    'Servicio Especial',
    'Ayuno',
    'Ensayo'
  ];

  console.log('1. Migrando tipos de servicio...');
  for (const tipo of tiposServicioIniciales) {
    const { error } = await supabase
      .from('tipos_servicio')
      .upsert({ nombre: tipo, activo: true }, { onConflict: 'nombre' });
    
    if (error) {
      console.error(`Error al insertar tipo de servicio "${tipo}":`, error.message);
    }
  }

  // 2. Insertar inventario inicial si no existe
  console.log('2. Migrando inventario...');
  const inventarioInicial = [
    { nombre: 'Micrófonos Alámbricos', categoria: 'Audio', cantidad: 1, descripcion: 'Micrófonos con cable' },
    { nombre: 'Micrófonos Inalámbricos', categoria: 'Audio', cantidad: 1, descripcion: 'Set de micrófonos inalámbricos' },
    { nombre: 'Planta de Sonido', categoria: 'Audio', cantidad: 1, descripcion: 'Sistema principal de audio' },
    { nombre: 'CPU Principal', categoria: 'Computadoras', cantidad: 1, descripcion: 'Computadora principal de control' },
    { nombre: 'Monitor Principal', categoria: 'Computadoras', cantidad: 1, descripcion: 'Monitor principal de la CPU' },
    { nombre: 'Cables HDMI', categoria: 'Conectividad', cantidad: 1, descripcion: 'Cables de video HDMI' },
    { nombre: 'Cables de Audio', categoria: 'Conectividad', cantidad: 1, descripcion: 'Cables de conexión de audio' },
    { nombre: 'Router WiFi', categoria: 'Internet', cantidad: 1, descripcion: 'Equipo de conexión a internet' },
    { nombre: 'Cámara de Celular', categoria: 'Video', cantidad: 1, descripcion: 'Cámara principal para transmisión' },
    { nombre: 'TV 1', categoria: 'Video', cantidad: 1, descripcion: 'Pantalla izquierda del altar' },
    { nombre: 'TV 2', categoria: 'Video', cantidad: 1, descripcion: 'Pantalla derecha del altar' }
  ];

  for (const item of inventarioInicial) {
    const { error } = await supabase
      .from('inventario')
      .upsert(item, { onConflict: 'nombre' });
    
    if (error) {
      console.error(`Error al insertar equipo de inventario "${item.nombre}":`, error.message);
    }
  }

  // 3. Migrar registros JSON
  console.log('3. Migrando registros...');
  
  if (!fs.existsSync(registrosDir)) {
    console.error('El directorio de registros no existe.');
    return;
  }

  const files = fs.readdirSync(registrosDir).filter(file => file.endsWith('.json'));
  console.log(`Se encontraron ${files.length} registros JSON para migrar.`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(registrosDir, file);
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const registro = JSON.parse(data);

      // Preparar datos del registro
      const registroData = {
        id: registro.id,
        fecha: registro.fecha,
        tipo_servicio: registro.tipoServicio,
        fecha_servicio: registro.fechaServicio,
        hora_inicio: registro.horaInicio,
        hora_finalizacion: registro.horaFinalizacion || null,
        observaciones_generales: registro.observacionesGenerales || null,
        nombre_responsable: registro.nombreResponsable,
        rol_responsable: registro.rolResponsable || 'Servidor'
      };

      // Insertar registro
      const { error: errorRegistro } = await supabase
        .from('registros')
        .upsert(registroData);

      if (errorRegistro) {
        console.error(`[Error Registro ${registro.id}]`, errorRegistro.message);
        errorCount++;
        continue;
      }

      // Procesar equipos
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
          // Primero borramos los equipos asociados a este registro para evitar duplicados en caso de reejecución
          await supabase.from('equipos_estado').delete().eq('registro_id', registro.id);
          
          const { error: errorEquipos } = await supabase
            .from('equipos_estado')
            .insert(equiposAInsertar);
          
          if (errorEquipos) {
            console.error(`[Error Equipos ${registro.id}]`, errorEquipos.message);
          }
        }
      }

      successCount++;
    } catch (err) {
      console.error(`Error procesando archivo ${file}:`, err.message);
      errorCount++;
    }
  }

  console.log('--- Resumen de Migración ---');
  console.log(`Total archivos: ${files.length}`);
  console.log(`Exitosos: ${successCount}`);
  console.log(`Fallidos: ${errorCount}`);
}

migrarDatos().catch(console.error);
