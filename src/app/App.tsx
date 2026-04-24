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
      // 1. Transacciones
      const resCaja = await client.execute("SELECT * FROM caja ORDER BY fecha DESC");
      setTransactions(resCaja.rows.map(row => ({
        id: row.id!.toString(),
        type: row.tipo as 'income' | 'expense',
        amount: row.monto as number,
        paymentMethod: row.metodo as 'cash' | 'transfer',
        description: row.detalle as string,
        date: new Date(row.fecha as string)
      })));

      // 2. Servicios
      const resServicios = await client.execute("SELECT * FROM servicios");
      setWorks(resServicios.rows.filter(r => !r.es_suscripcion).map(row => ({
        id: row.id!.toString(),
        client: row.cliente as string,
        device: row.equipo_o_app as string,
        status: row.estado as WorkStatus,
        description: row.descripcion as string,
        createdAt: new Date(row.fecha_ingreso as string)
      })));

      setSaasApps(resServicios.rows.filter(r => r.es_suscripcion).map(row => ({
        id: row.id!.toString(),
        appName: row.equipo_o_app as string,
        client: row.cliente as string,
        monthlyFee: row.monto_presupuesto as number,
        nextPayment: new Date(), 
        status: row.estado === 'LISTO' ? 'active' : 'pending',
        lastPayment: new Date(row.fecha_ingreso as string)
      })));

      // 3. Gastos Fijos
      const resFijos = await client.execute("SELECT * FROM gastos_fijos");
      setGastosFijos(resFijos.rows.map(row => ({
        id: row.id!.toString(),
        nombre: row.nombre as string,
        monto: row.monto as number,
        dia_vencimiento: row.dia_vencimiento as number
      })));

    } catch (error) {
      console.error("Error en Turso:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    try {
      await client.execute({
        sql: "INSERT INTO caja (monto, tipo, metodo, detalle) VALUES (?, ?, ?, ?)",
        args: [transaction.amount, transaction.type, transaction.paymentMethod || null, transaction.description]
      });
      fetchData();
    } catch (e) { alert("Error al guardar transacción"); }
  };

  const addGastoFijo = async (gasto: Omit<GastoFijo, 'id'>) => {
    try {
      await client.execute({
        sql: "INSERT INTO gastos_fijos (nombre, monto, dia_vencimiento) VALUES (?, ?, ?)",
        args: [gasto.nombre, gasto.monto, gasto.dia_vencimiento]
      });
      fetchData();
    } catch (e) { alert("Error al guardar gasto fijo"); }
  };

  // --- LÓGICA DE BALANCE ---
  const cashBalance = transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const transferBalance = transactions
    .filter(t => t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + g.monto, 0);
  
  // Balance real descontando los gastos fijos mensuales
  const balanceFinal = (cashBalance + transferBalance) - totalGastosFijos;

  if (loading) return <div className="size-full bg-[#0f172a] flex items-center justify-center text-white">Iniciando JPCFIX...</div>;

  return (
    <div className="size-full bg-[#0f172a] font-sans">
      {activeScreen === 'dashboard' && (
        <Dashboard
          balance={balanceFinal}
          todayIncome={cashBalance} 
          todayExpenses={transferBalance} 
          onNewWork={() => setActiveScreen('trabajos')}
          onNewExpense={() => setActiveScreen('caja')}
          onNavigateToSaaS={() => setActiveScreen('saas')}
        />
      )}

      {activeScreen === 'saas' && (
        <SaaSScreen apps={saasApps} onAddApp={() => {}} onMarkPaid={() => {}} />
      )}

      {activeScreen === 'trabajos' && (
        <TrabajosScreen works={works} onAddWork={async (w) => {
            await client.execute({
                sql: "INSERT INTO servicios (cliente, equipo_o_app, descripcion, estado, es_suscripcion) VALUES (?, ?, ?, ?, 0)",
                args: [w.client, w.device, w.description, w.status]
            });
            fetchData();
        }} onUpdateStatus={async (id, status) => {
            await client.execute({
                sql: "UPDATE servicios SET estado = ? WHERE id = ?",
                args: [status, id]
            });
            fetchData();
        }} />
      )}

      {activeScreen === 'caja' && (
        <CajaScreen 
          transactions={transactions} 
          onAddTransaction={addTransaction}
          // Pasamos la función para que CajaScreen pueda usarla si agregas el form ahí
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