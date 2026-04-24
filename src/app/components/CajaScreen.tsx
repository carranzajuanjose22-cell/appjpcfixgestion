import { useState } from 'react';
import { DollarSign, CreditCard, Wallet, Plus, Minus, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  paymentMethod?: 'cash' | 'transfer';
  description: string;
  date: Date;
}

interface GastoFijo {
  nombre: string;
  monto: number;
  dia_vencimiento: number;
}

interface CajaScreenProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onAddGastoFijo: (gasto: GastoFijo) => void; // Nueva prop agregada
}

export default function CajaScreen({ transactions, onAddTransaction, onAddGastoFijo }: CajaScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'income' | 'expense' | 'fixed'>('income');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [description, setDescription] = useState('');
  const [dueDay, setDueDay] = useState('10');

  // Cálculos de Balance (Se mantienen igual para consistencia visual)
  const totalCash = transactions
    .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransfer = transactions
    .filter(t => t.type === 'income' && t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = totalCash + totalTransfer;
  const balance = totalIncome - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (modalMode === 'fixed') {
      onAddGastoFijo({
        nombre: description,
        monto: parseFloat(amount),
        dia_vencimiento: parseInt(dueDay)
      });
    } else {
      onAddTransaction({
        type: modalMode as 'income' | 'expense',
        amount: parseFloat(amount),
        paymentMethod: modalMode === 'income' ? paymentMethod : undefined,
        description
      });
    }

    setAmount('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 pb-24 font-sans">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">JPCFIX Caja</h1>
          <p className="text-slate-400 text-sm">Gestión de flujo y costos fijos</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Wallet size={18} />
            <p className="text-sm">Balance Operativo</p>
          </div>
          <h2 className={`text-4xl font-bold mb-4 ${balance >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
            ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Totales Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-1 text-[#10b981]">
              <DollarSign size={14} />
              <p className="text-xs font-medium">Efectivo</p>
            </div>
            <p className="text-white font-bold text-sm">${totalCash.toLocaleString('es-AR')}</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-1 text-[#3b82f6]">
              <CreditCard size={14} />
              <p className="text-xs font-medium">Transf.</p>
            </div>
            <p className="text-white font-bold text-sm">${totalTransfer.toLocaleString('es-AR')}</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50 text-red-400">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={14} />
              <p className="text-xs font-medium">Gastos</p>
            </div>
            <p className="text-white font-bold text-sm">${totalExpenses.toLocaleString('es-AR')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => { setModalMode('income'); setShowModal(true); }}
              className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl p-4 flex items-center justify-center gap-2 transition-colors shadow-lg font-bold"
            >
              <Plus size={20} /> Ingreso
            </button>
            <button
              onClick={() => { setModalMode('expense'); setShowModal(true); }}
              className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl p-4 flex items-center justify-center gap-2 transition-colors shadow-lg font-bold"
            >
              <Minus size={20} /> Egreso
            </button>
          </div>
          
          <button
            onClick={() => { setModalMode('fixed'); setShowModal(true); }}
            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl p-3 flex items-center justify-center gap-2 transition-colors font-semibold border border-purple-400/30"
          >
            <Calendar size={18} />
            <span>Configurar Gasto Fijo Mensual</span>
          </button>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700/50">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-slate-400" /> Movimientos
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {transactions.slice().reverse().map((transaction) => (
              <div key={transaction.id} className="bg-[#0f172a] rounded-xl p-3 border border-slate-700/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="text-[#10b981]" size={16} />
                      ) : (
                        <TrendingDown className="text-red-400" size={16} />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{transaction.description}</p>
                      <p className="text-[10px] text-slate-500">{transaction.date.toLocaleDateString()} • {transaction.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${transaction.type === 'income' ? 'text-[#10b981]' : 'text-red-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('es-AR')}
                    </p>
                    {transaction.paymentMethod && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {transaction.paymentMethod === 'cash' ? 'Efectivo' : 'Transf.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal - Dinámico según el modo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end z-50">
          <div className="bg-[#1e293b] w-full rounded-t-[2.5rem] p-8 max-w-md mx-auto border-t border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
            
            <h3 className="text-white text-xl font-bold mb-6 text-center">
              {modalMode === 'income' ? 'Registrar Ingreso' : 
               modalMode === 'expense' ? 'Registrar Egreso' : 'Nuevo Gasto Fijo'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0f172a] text-white rounded-xl py-4 pl-8 pr-4 border border-slate-700 focus:border-blue-500 outline-none text-xl font-bold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {modalMode === 'income' && (
                <div>
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Vía de Pago</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === 'cash' ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg' : 'bg-[#0f172a] border-slate-700 text-slate-500'
                      }`}
                    >
                      <DollarSign size={20} />
                      <span className="text-xs font-bold">Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === 'transfer' ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg' : 'bg-[#0f172a] border-slate-700 text-slate-500'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-xs font-bold">Transferencia</span>
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'fixed' && (
                <div>
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Día de Cobro (1-28)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-[#0f172a] text-white rounded-xl p-4 border border-slate-700 focus:border-purple-500 outline-none font-bold"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Concepto</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-xl p-4 border border-slate-700 focus:border-blue-500 outline-none"
                  placeholder={modalMode === 'fixed' ? "Ej: Internet, Alquiler" : "Ej: Reparación PC Osmar"}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl p-4 font-bold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className={`flex-1 text-white rounded-xl p-4 font-bold shadow-lg transition-all active:scale-95 ${
                    modalMode === 'income' ? 'bg-[#10b981]' : 
                    modalMode === 'expense' ? 'bg-[#ef4444]' : 'bg-[#8b5cf6]'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}