import React, { useState } from 'react';
import { DollarSign, CreditCard, Wallet, Plus, Minus, TrendingUp, TrendingDown, Calendar, Trash2 } from 'lucide-react';

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
  nombre: string;
  monto: number;
  dia_vencimiento: number;
}

interface CajaScreenProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onAddGastoFijo: (gasto: GastoFijo) => void; // Nueva prop agregada
  onDeleteTransaction: (id: string) => void;
}

export default function CajaScreen({ transactions, onAddTransaction, onAddGastoFijo, onDeleteTransaction }: CajaScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'income' | 'expense' | 'fixed'>('income');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [description, setDescription] = useState('');
  const [dueDay, setDueDay] = useState('10');

  const getIncomeBreakdown = (transaction: Transaction) => {
    const gross = typeof transaction.grossAmount === 'number' ? transaction.grossAmount : transaction.amount;
    const discount = typeof transaction.discountAmount === 'number'
      ? transaction.discountAmount
      : Number((gross * 0.3).toFixed(2));
    const net = typeof transaction.netAmount === 'number'
      ? transaction.netAmount
      : Number((gross - discount).toFixed(2));

    return { gross, discount, net };
  };

  // Cálculos de Balance (ingresos netos con descuento de insumos)
  const totalCash = transactions
    .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + getIncomeBreakdown(t).net, 0);

  const totalTransfer = transactions
    .filter(t => t.type === 'income' && t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + getIncomeBreakdown(t).net, 0);

  const totalBrutoIngresos = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + getIncomeBreakdown(t).gross, 0);

  const totalDescuentosInsumos = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + getIncomeBreakdown(t).discount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncomeNeto = totalCash + totalTransfer;
  const balance = totalIncomeNeto - totalExpenses;

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
            <p className="text-sm">Balance Operativo (Neto)</p>
          </div>
          <h2 className={`text-4xl font-bold mb-4 ${balance >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
            ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Totales Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-1 text-[#10b981]">
              <DollarSign size={14} />
              <p className="text-xs font-medium">Efectivo Neto</p>
            </div>
            <p className="text-white font-bold text-sm">${totalCash.toLocaleString('es-AR')}</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-1 text-[#3b82f6]">
              <CreditCard size={14} />
              <p className="text-xs font-medium">Transf. Neta</p>
            </div>
            <p className="text-white font-bold text-sm">${totalTransfer.toLocaleString('es-AR')}</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50 text-purple-300">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={14} />
              <p className="text-xs font-medium">Insumos (30%)</p>
            </div>
            <p className="text-white font-bold text-sm">${totalDescuentosInsumos.toLocaleString('es-AR')}</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50 text-red-400">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={14} />
              <p className="text-xs font-medium">Gastos</p>
            </div>
            <p className="text-white font-bold text-sm">${totalExpenses.toLocaleString('es-AR')}</p>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700/50 mb-6">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Resumen de ingresos</p>
          <div className="flex flex-col gap-1 text-sm">
            <p className="text-white">Total bruto: <span className="font-bold">${totalBrutoIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></p>
            <p className="text-purple-300">Descuento insumos (30%): <span className="font-bold">${totalDescuentosInsumos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></p>
            <p className="text-[#10b981]">Ingreso neto final: <span className="font-bold">${totalIncomeNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></p>
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
            {transactions.slice().reverse().map((transaction) => {
              const breakdown = transaction.type === 'income' ? getIncomeBreakdown(transaction) : null;
              return (
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
                    {transaction.type === 'income' && breakdown ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm text-slate-200">
                          Total: ${breakdown.gross.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="font-bold text-xs text-purple-300">
                          Insumos ({Math.round(transaction.discountRate ?? 30)}%): -${breakdown.discount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="font-bold text-sm text-[#10b981]">
                          Neto: +${breakdown.net.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ) : (
                      <p className="font-bold text-sm text-red-400">
                        -${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {transaction.paymentMethod && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {transaction.paymentMethod === 'cash' ? 'Efectivo' : 'Transf.'}
                      </span>
                    )}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Seguro que querés eliminar este movimiento?')) {
                            onDeleteTransaction(transaction.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )})}
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
                  <p className="mt-2 text-[11px] text-purple-300">
                    A cada ingreso se le descuenta automáticamente un 30% para insumos.
                  </p>
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