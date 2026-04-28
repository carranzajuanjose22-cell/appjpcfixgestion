import { useEffect, useState, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import CajaScreen from './components/CajaScreen';
import TrabajosScreen from './components/TrabajosScreen';
import SaaSScreen from './components/SaaSScreen';
import ClientesScreen from './components/ClientesScreen';
import BottomNav, { type Screen } from './components/BottomNav';

import { client } from '../lib/turso'; 

import type { Work, WorkStatus } from './components/TrabajosScreen';
import type { SaaSApp } from './components/SaaSScreen';
import type { Client } from './components/ClientesScreen';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  grossAmount?: number;
  discountAmount?: number;
  netAmount?: number;
  discountRate?: number;
  paymentMethod?: 'cash' | 'transfer';
  description: string;
  date: Date;
}

interface GastoFijo {
  id: string;
  nombre: string;
  monto: number;
  dia_vencimiento: number;
}

const mapDbTipoToUi = (tipo: unknown): 'income' | 'expense' => {
  const value = String(tipo ?? '').toLowerCase();
  if (value === 'ingreso' || value === 'income') return 'income';
  return 'expense';
};

const mapUiTipoToDb = (tipo: 'income' | 'expense'): string => {
  return tipo === 'income' ? 'INGRESO' : 'EGRESO';
};

const mapDbMetodoToUi = (metodo: unknown): 'cash' | 'transfer' | undefined => {
  const value = String(metodo ?? '').toLowerCase();
  if (value === 'cash' || value === 'efectivo') return 'cash';
  if (value === 'transfer' || value === 'transferencia') return 'transfer';
  return undefined;
};

const mapUiMetodoToDb = (metodo: 'cash' | 'transfer' | undefined): string | null => {
  if (!metodo) return null;
  return metodo === 'cash' ? 'EFECTIVO' : 'TRANSFERENCIA';
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen | 'saas'>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [saasApps, setSaasApps] = useState<SaaSApp[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);

  const ensureSchema = useCallback(async () => {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS caja (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monto REAL NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('income', 'expense')),
        metodo TEXT CHECK(metodo IN ('cash', 'transfer') OR metodo IS NULL),
        detalle TEXT NOT NULL,
        fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS caja_descuentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caja_id INTEGER NOT NULL UNIQUE,
        porcentaje_descuento REAL NOT NULL,
        monto_descontado REAL NOT NULL,
        monto_neto REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caja_id) REFERENCES caja(id) ON DELETE CASCADE
      );
    `);

    await client.execute(`
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
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS gastos_fijos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        monto REAL NOT NULL,
        dia_vencimiento INTEGER NOT NULL CHECK(dia_vencimiento BETWEEN 1 AND 28)
      );
    `);
  }, []);

  const getNetIncomeValue = (transaction: Transaction) => {
    if (transaction.type !== 'income') return transaction.amount;
    if (typeof transaction.netAmount === 'number') return transaction.netAmount;
    return Number((transaction.amount * 0.7).toFixed(2));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await ensureSchema();

      // 1. Caja
      const resCaja = await client.execute(`
        SELECT
          c.*,
          d.porcentaje_descuento,
          d.monto_descontado,
          d.monto_neto
        FROM caja c
        LEFT JOIN caja_descuentos d ON d.caja_id = c.id
        ORDER BY c.fecha DESC
      `);
      setTransactions(resCaja.rows.map(row => ({
        id: row.id!.toString(),
        type: mapDbTipoToUi(row.tipo),
        amount: Number(row.monto),
        grossAmount: Number(row.monto),
        discountAmount: row.monto_descontado != null
          ? Number(row.monto_descontado)
          : mapDbTipoToUi(row.tipo) === 'income'
            ? Number((Number(row.monto) * 0.3).toFixed(2))
            : 0,
        netAmount: row.monto_neto != null
          ? Number(row.monto_neto)
          : mapDbTipoToUi(row.tipo) === 'income'
            ? Number((Number(row.monto) * 0.7).toFixed(2))
            : Number(row.monto),
        discountRate: row.porcentaje_descuento != null ? Number(row.porcentaje_descuento) : 30,
        paymentMethod: mapDbMetodoToUi(row.metodo),
        description: row.detalle as string,
        date: new Date(row.fecha as string)
      })));

      // 2. Servicios
      const resServicios = await client.execute("SELECT * FROM servicios ORDER BY fecha_ingreso DESC");
      
      setWorks(resServicios.rows.filter(r => Number(r.es_suscripcion) === 0).map(row => ({
        id: row.id!.toString(),
        client: row.cliente as string,
        device: row.equipo_o_app as string,
        status: row.estado as WorkStatus,
        description: row.descripcion as string,
        createdAt: new Date(row.fecha_ingreso as string || Date.now())
      })));

      setSaasApps(resServicios.rows.filter(r => Number(r.es_suscripcion) === 1).map(row => ({
        id: row.id!.toString(),
        appName: row.equipo_o_app as string,
        client: row.cliente as string,
        monthlyFee: Number(row.monto_presupuesto),
        nextPayment: new Date(), 
        status: row.estado === 'LISTO' ? 'active' : 'pending',
        lastPayment: new Date(row.fecha_ingreso as string || Date.now())
      })));

      // 3. Gastos Fijos
      const resFijos = await client.execute("SELECT * FROM gastos_fijos");
      setGastosFijos(resFijos.rows.map(row => ({
        id: row.id!.toString(),
        nombre: row.nombre as string,
        monto: Number(row.monto),
        dia_vencimiento: Number(row.dia_vencimiento)
      })));

    } catch (error) {
      console.error("Error Turso:", error);
    } finally {
      setLoading(false);
    }
  }, [ensureSchema]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ACCIONES ---
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    try {
      const insertResult = await client.execute({
        sql: "INSERT INTO caja (monto, tipo, metodo, detalle) VALUES (?, ?, ?, ?)",
        args: [
          transaction.amount,
          mapUiTipoToDb(transaction.type),
          mapUiMetodoToDb(transaction.paymentMethod),
          transaction.description
        ]
      });
      const insertedId = insertResult.lastInsertRowid != null ? Number(insertResult.lastInsertRowid) : null;

      if (transaction.type === 'income' && insertedId != null) {
        const discountRate = 30;
        const discountAmount = Number((transaction.amount * (discountRate / 100)).toFixed(2));
        const netAmount = Number((transaction.amount - discountAmount).toFixed(2));

        await client.execute({
          sql: "INSERT INTO caja_descuentos (caja_id, porcentaje_descuento, monto_descontado, monto_neto) VALUES (?, ?, ?, ?)",
          args: [insertedId, discountRate, discountAmount, netAmount]
        });
      }

      fetchData();
    } catch (e) {
      console.error("Error al registrar en caja:", e);
      alert("Error en Caja. Revisá la consola para más detalle.");
    }
  };

  const addWork = async (work: Omit<Work, 'id' | 'createdAt'>) => {
    try {
      await client.execute({
        sql: "INSERT INTO servicios (cliente, equipo_o_app, descripcion, estado, es_suscripcion) VALUES (?, ?, ?, ?, 0)",
        args: [work.client, work.device, work.description, work.status]
      });
      fetchData();
    } catch (e) { alert("Error al guardar trabajo"); }
  };

  const updateWorkStatus = async (id: string, status: WorkStatus) => {
    await client.execute({
      sql: "UPDATE servicios SET estado = ? WHERE id = ?",
      args: [status, id]
    });
    fetchData();
  };

  const addGastoFijo = async (gasto: Omit<GastoFijo, 'id'>) => {
    await client.execute({
      sql: "INSERT INTO gastos_fijos (nombre, monto, dia_vencimiento) VALUES (?, ?, ?)",
      args: [gasto.nombre, gasto.monto, gasto.dia_vencimiento]
    });
    fetchData();
  };

  const deleteTransaction = async (id: string) => {
    try {
      await client.execute({
        sql: "DELETE FROM caja_descuentos WHERE caja_id = ?",
        args: [id]
      });
      await client.execute({
        sql: "DELETE FROM caja WHERE id = ?",
        args: [id]
      });
      fetchData();
    } catch (e) {
      console.error("Error al eliminar movimiento en caja:", e);
      alert("No se pudo eliminar el movimiento.");
    }
  };

  // --- CÁLCULOS PARA DASHBOARD ---
  const cashTotal = transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + (t.type === 'income' ? getNetIncomeValue(t) : -t.amount), 0);

  const transferTotal = transactions
    .filter(t => t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + (t.type === 'income' ? getNetIncomeValue(t) : -t.amount), 0);

  const totalFijos = gastosFijos.reduce((sum, g) => sum + g.monto, 0);
  const balanceFinal = (cashTotal + transferTotal) - totalFijos;

  // ESTADÍSTICAS PARA EL RESUMEN RÁPIDO
  const statsReales = {
    activos: works.filter(w => w.status === 'in_progress').length,
    pendientes: works.filter(w => w.status === 'ready').length,
    repuestos: works.filter(w => w.status === 'waiting_parts').length
  };

  if (loading) return <div className="size-full bg-[#0f172a] flex items-center justify-center text-white font-sans">Cargando JPCFIX...</div>;

  return (
    <div className="size-full bg-[#0f172a] font-sans">
      {activeScreen === 'dashboard' && (
        <Dashboard
          balance={balanceFinal}
          todayIncome={cashTotal} 
          todayExpenses={transferTotal} 
          stats={statsReales} // Pasamos los números calculados
          onNewWork={() => setActiveScreen('trabajos')}
          onNewExpense={() => setActiveScreen('caja')}
          onNavigateToSaaS={() => setActiveScreen('saas')}
        />
      )}

      {activeScreen === 'saas' && (
        <SaaSScreen apps={saasApps} onAddApp={() => {}} onMarkPaid={() => {}} />
      )}

      {activeScreen === 'trabajos' && (
        <TrabajosScreen works={works} onAddWork={addWork} onUpdateStatus={updateWorkStatus} />
      )}

      {activeScreen === 'caja' && (
        <CajaScreen 
          transactions={transactions} 
          onAddTransaction={addTransaction}
          onAddGastoFijo={addGastoFijo} 
          onDeleteTransaction={deleteTransaction}
        />
      )}

      {activeScreen === 'clientes' && (
        <ClientesScreen clients={clients} onAddClient={() => {}} />
      )}

      {activeScreen === 'saas' && (
        <div className="fixed top-4 left-4 z-50">
          <button onClick={() => setActiveScreen('dashboard')} className="bg-[#1e293b] text-white px-4 py-2 rounded-lg border border-slate-700 shadow-xl">
            ← Volver
          </button>
        </div>
      )}

      {activeScreen !== 'saas' && (
        <BottomNav activeScreen={activeScreen as Screen} onNavigate={setActiveScreen} />
      )}
    </div>
  );
}