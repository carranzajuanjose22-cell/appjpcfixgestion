import { useState } from 'react';
import { Cloud, Calendar, DollarSign, CheckCircle, AlertCircle, Plus, Building } from 'lucide-react';

export interface SaaSApp {
  id: string;
  appName: string;
  client: string;
  monthlyFee: number;
  nextPayment: Date;
  status: 'active' | 'pending' | 'overdue';
  lastPayment?: Date;
}

interface SaaSScreenProps {
  apps: SaaSApp[];
  onAddApp: (app: Omit<SaaSApp, 'id'>) => void;
  onMarkPaid: (id: string) => void;
}

export default function SaaSScreen({ apps, onAddApp, onMarkPaid }: SaaSScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [appName, setAppName] = useState('');
  const [client, setClient] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !client || !monthlyFee) return;

    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    onAddApp({
      appName,
      client,
      monthlyFee: parseFloat(monthlyFee),
      nextPayment: nextMonth,
      status: 'active',
      lastPayment: today
    });

    setAppName('');
    setClient('');
    setMonthlyFee('');
    setShowModal(false);
  };

  const totalMonthlyRevenue = apps.reduce((sum, app) => sum + app.monthlyFee, 0);
  const activeApps = apps.filter(app => app.status === 'active').length;
  const pendingPayments = apps.filter(app => app.status === 'pending').length;
  const overduePayments = apps.filter(app => app.status === 'overdue').length;

  const getDaysUntilPayment = (date: Date) => {
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = (status: SaaSApp['status']) => {
    switch (status) {
      case 'active':
        return { color: 'bg-[#10b981]', text: 'Activo', icon: CheckCircle };
      case 'pending':
        return { color: 'bg-[#f59e0b]', text: 'Pendiente', icon: AlertCircle };
      case 'overdue':
        return { color: 'bg-[#ef4444]', text: 'Vencido', icon: AlertCircle };
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-white text-2xl mb-1">Apps SaaS</h1>
            <p className="text-slate-400 text-sm">Mantenimientos mensuales</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full p-3 shadow-lg transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="text-[#10b981]" size={18} />
              <p className="text-slate-400 text-xs">Ingreso Mensual</p>
            </div>
            <p className="text-[#10b981] text-2xl">${totalMonthlyRevenue.toLocaleString('es-MX')}</p>
          </div>

          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="text-[#3b82f6]" size={18} />
              <p className="text-slate-400 text-xs">Apps Activas</p>
            </div>
            <p className="text-white text-2xl">{activeApps}</p>
          </div>
        </div>

        {(pendingPayments > 0 || overduePayments > 0) && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-4 border border-slate-700/50">
            <h3 className="text-white text-sm mb-2">Alertas de Pago</h3>
            <div className="space-y-2">
              {pendingPayments > 0 && (
                <div className="flex items-center gap-2 text-[#f59e0b] text-sm">
                  <AlertCircle size={16} />
                  <span>{pendingPayments} pago(s) próximo(s) a vencer</span>
                </div>
              )}
              {overduePayments > 0 && (
                <div className="flex items-center gap-2 text-[#ef4444] text-sm">
                  <AlertCircle size={16} />
                  <span>{overduePayments} pago(s) vencido(s)</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {apps.map((app) => {
            const daysUntil = getDaysUntilPayment(app.nextPayment);
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={app.id}
                className="bg-[#1e293b] rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Cloud className="text-[#3b82f6]" size={18} />
                      <h3 className="text-white">{app.appName}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Building size={14} />
                      <span>{app.client}</span>
                    </div>
                  </div>
                  <span className={`${statusConfig.color} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1`}>
                    <StatusIcon size={12} />
                    {statusConfig.text}
                  </span>
                </div>

                <div className="bg-[#0f172a] rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Monto Mensual</span>
                    <span className="text-[#10b981]">${app.monthlyFee.toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Próximo Cobro</span>
                    <div className="text-right">
                      <span className="text-white text-sm block">
                        {app.nextPayment.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`text-xs ${
                        daysUntil <= 7 ? 'text-[#f59e0b]' : 'text-slate-500'
                      }`}>
                        {daysUntil > 0 ? `en ${daysUntil} días` : 'Hoy'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {app.lastPayment && (
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Calendar size={12} />
                      <span>Último pago: {app.lastPayment.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  )}

                  {app.status !== 'active' && (
                    <button
                      onClick={() => onMarkPaid(app.id)}
                      className="bg-[#10b981] hover:bg-[#059669] text-white text-xs px-4 py-2 rounded-lg transition-colors ml-auto"
                    >
                      Marcar como Pagado
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {apps.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-[#1e293b] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Cloud className="text-slate-500" size={28} />
              </div>
              <p className="text-slate-400 mb-2">No hay apps registradas</p>
              <p className="text-slate-500 text-sm">Agrega tus aplicaciones para gestionar los cobros mensuales</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50">
          <div className="bg-[#1e293b] w-full rounded-t-3xl p-6 max-w-md mx-auto border-t border-slate-700">
            <h3 className="text-white text-xl mb-4">Nueva App SaaS</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Nombre de la App</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="Ej: Club 22, Sistema POS, etc."
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Cliente</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="Nombre del cliente o empresa"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Tarifa Mensual</label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-[#475569] hover:bg-[#334155] text-white rounded-lg p-3 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg p-3 transition-colors"
                >
                  Agregar App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
