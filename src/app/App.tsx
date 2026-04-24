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

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen | 'saas'>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [saasApps, setSaasApps] = useState<SaaSApp[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Caja
      const resCaja = await client.execute("SELECT * FROM caja ORDER BY fecha DESC");
      setTransactions(resCaja.rows.map(row => ({
        id: row.id!.toString(),
        type: row.tipo as 'income' | 'expense',
        amount: Number(row.monto),
        paymentMethod: row.metodo as 'cash' | 'transfer',
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ACCIONES ---
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    try {
      await client.execute({
        sql: "INSERT INTO caja (monto, tipo, metodo, detalle) VALUES (?, ?, ?, ?)",
        args: [transaction.amount, transaction.type, transaction.paymentMethod || null, transaction.description]
      });
      fetchData();
    } catch (e) { alert("Error en Caja"); }
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

  // --- CÁLCULOS PARA DASHBOARD ---
  const cashTotal = transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const transferTotal = transactions
    .filter(t => t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

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