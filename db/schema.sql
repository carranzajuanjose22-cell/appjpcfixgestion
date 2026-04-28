PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monto REAL NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('income', 'expense')),
  metodo TEXT CHECK (metodo IN ('cash', 'transfer') OR metodo IS NULL),
  detalle TEXT NOT NULL,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS caja_descuentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caja_id INTEGER NOT NULL UNIQUE,
  porcentaje_descuento REAL NOT NULL DEFAULT 30,
  monto_descontado REAL NOT NULL,
  monto_neto REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caja_id) REFERENCES caja(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_caja_fecha ON caja(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_caja_descuentos_caja_id ON caja_descuentos(caja_id);

CREATE TABLE IF NOT EXISTS servicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  equipo_o_app TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL,
  es_suscripcion INTEGER NOT NULL DEFAULT 0,
  monto_presupuesto REAL DEFAULT 0,
  fecha_ingreso TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gastos_fijos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  monto REAL NOT NULL,
  dia_vencimiento INTEGER NOT NULL CHECK (dia_vencimiento BETWEEN 1 AND 28)
);
