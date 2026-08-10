-- Tabla de registros (información del servicio)
CREATE TABLE registros (
  id BIGINT PRIMARY KEY,
  fecha TIMESTAMPTZ NOT NULL,
  tipo_servicio TEXT NOT NULL,
  fecha_servicio DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_finalizacion TIME,
  observaciones_generales TEXT,
  nombre_responsable TEXT NOT NULL,
  rol_responsable TEXT NOT NULL DEFAULT 'Servidor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de estados de equipos (relación 1:N con registros)
CREATE TABLE equipos_estado (
  id SERIAL PRIMARY KEY,
  registro_id BIGINT NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  equipo TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('bueno', 'regular', 'malo')),
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de inventario
CREATE TABLE inventario (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  categoria TEXT NOT NULL,
  cantidad INTEGER DEFAULT 1,
  descripcion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tipos de servicio
CREATE TABLE tipos_servicio (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS (Row Level Security)
-- Habilitamos lectura y escritura pública para simplificar inicialmente
-- (Recomendable restringir si se añade autenticación en el futuro)
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a todos en registros" ON registros FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos en equipos_estado" ON equipos_estado FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos en inventario" ON inventario FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos en tipos_servicio" ON tipos_servicio FOR ALL USING (true);
