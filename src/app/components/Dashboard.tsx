import { DollarSign, TrendingUp, TrendingDown, Plus, Wallet, Cloud } from 'lucide-react';

interface DashboardProps {
  balance: number;
  todayIncome: number;
  todayExpenses: number;
  // NUEVA PROP: Recibimos los números reales de la DB
  stats: {
    activos: number;
    pendientes: number;
    repuestos: number;
  };
  onNewWork: () => void;
  onNewExpense: () => void;
  onNavigateToSaaS: () => void;
}

export default function Dashboard({ 
  balance, 
  todayIncome, 
  todayExpenses, 
  stats, // Usamos la prop aquí
  onNewWork, 
  onNewExpense, 
  onNavigateToSaaS 
}: DashboardProps) {
  return (
    <div className="min-h-screen bg-[#0f172a] p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-white text-2xl mb-1 font-bold">JPCFIX</h1>
          <p className="text-slate-400 text-sm">Gestión Técnica & Financiera</p>
        </div>

        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="text-slate-400" size={20} />
            <p className="text-slate-400 text-sm">Balance Operativo</p>
          </div>
          <h2 className={`text-4xl mb-4 font-bold ${balance >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
            ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f172a]/50 rounded-xl p-3 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="text-[#10b981]" size={16} />
                <p className="text-slate-400 text-xs">Caja (Efectivo)</p>
              </div>
              <p className="text-[#10b981] text-lg font-semibold">${todayIncome.toLocaleString('es-AR')}</p>
            </div>

            <div className="bg-[#0f172a]/50 rounded-xl p-3 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="text-[#3b82f6]" size={16} />
                <p className="text-slate-400 text-xs">Transferencias</p>
              </div>
              <p className="text-[#3b82f6] text-lg font-semibold">${todayExpenses.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={onNewWork}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Nuevo Trabajo</span>
          </button>

          <button
            onClick={onNewExpense}
            className="bg-[#475569] hover:bg-[#334155] text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <DollarSign size={24} />
            <span className="text-sm font-medium">Registrar Gasto</span>
          </button>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700/50 mb-4">
          <h3 className="text-white font-semibold mb-3">Resumen Rápido</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Trabajos Activos</span>
              {/* USAMOS EL VALOR REAL DE LA DB */}
              <span className="text-white bg-[#3b82f6] px-3 py-1 rounded-full text-xs font-bold">{stats.activos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Pendientes de Entrega</span>
              {/* USAMOS EL VALOR REAL DE LA DB */}
              <span className="text-white bg-[#10b981] px-3 py-1 rounded-full text-xs font-bold">{stats.pendientes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Esperando Repuesto</span>
              {/* USAMOS EL VALOR REAL DE LA DB */}
              <span className="text-white bg-[#f59e0b] px-3 py-1 rounded-full text-xs font-bold">{stats.repuestos}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToSaaS}
          className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white rounded-xl p-4 flex items-center justify-between transition-all shadow-lg active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <Cloud size={24} />
            </div>
            <div className="text-left">
              <p className="font-medium">Apps SaaS</p>
              <p className="text-sm text-blue-100">Gestionar mantenimientos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl">→</p>
          </div>
        </button>
      </div>
    </div>
  );
}