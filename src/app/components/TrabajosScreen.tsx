import { useState } from 'react';
import { Wrench, Clock, Package, CheckCircle, Plus, User, Smartphone } from 'lucide-react';

export type WorkStatus = 'in_progress' | 'waiting_parts' | 'ready';

export interface Work {
  id: string;
  client: string;
  device: string;
  status: WorkStatus;
  description: string;
  createdAt: Date;
}

interface TrabajosScreenProps {
  works: Work[];
  onAddWork: (work: Omit<Work, 'id' | 'createdAt'>) => void;
  onUpdateStatus: (id: string, status: WorkStatus) => void;
}

const statusConfig = {
  in_progress: {
    label: 'En Proceso',
    color: 'bg-[#3b82f6]',
    icon: Wrench
  },
  waiting_parts: {
    label: 'Esperando Repuesto',
    color: 'bg-[#f59e0b]',
    icon: Package
  },
  ready: {
    label: 'Listo para Entregar',
    color: 'bg-[#10b981]',
    icon: CheckCircle
  }
};

export default function TrabajosScreen({ works, onAddWork, onUpdateStatus }: TrabajosScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [client, setClient] = useState('');
  const [device, setDevice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<WorkStatus>('in_progress');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !device) return;

    onAddWork({
      client,
      device,
      description,
      status: 'in_progress'
    });

    setClient('');
    setDevice('');
    setDescription('');
    setShowModal(false);
  };

  const worksByStatus = {
    in_progress: works.filter(w => w.status === 'in_progress'),
    waiting_parts: works.filter(w => w.status === 'waiting_parts'),
    ready: works.filter(w => w.status === 'ready')
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-white text-2xl mb-1">Trabajos</h1>
            <p className="text-slate-400 text-sm">{works.length} servicios activos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full p-3 shadow-lg transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 bg-[#1e293b] p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setSelectedStatus('in_progress')}
            className={`py-2 px-3 rounded-lg text-sm transition-colors ${
              selectedStatus === 'in_progress'
                ? 'bg-[#3b82f6] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            En Proceso
          </button>
          <button
            onClick={() => setSelectedStatus('waiting_parts')}
            className={`py-2 px-3 rounded-lg text-sm transition-colors ${
              selectedStatus === 'waiting_parts'
                ? 'bg-[#f59e0b] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Esperando
          </button>
          <button
            onClick={() => setSelectedStatus('ready')}
            className={`py-2 px-3 rounded-lg text-sm transition-colors ${
              selectedStatus === 'ready'
                ? 'bg-[#10b981] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Listos
          </button>
        </div>

        <div className="space-y-3">
          {worksByStatus[selectedStatus].map((work) => {
            const config = statusConfig[work.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={work.id}
                className="bg-[#1e293b] rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="text-slate-400" size={16} />
                      <h3 className="text-white">{work.client}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Smartphone size={14} />
                      <span>{work.device}</span>
                    </div>
                  </div>
                  <span className={`${config.color} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap`}>
                    <StatusIcon size={12} />
                    {config.label}
                  </span>
                </div>

                {work.description && (
                  <p className="text-slate-400 text-sm mb-3">{work.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Clock size={12} />
                    <span>{work.createdAt.toLocaleDateString('es-MX')}</span>
                  </div>

                  <div className="flex gap-2">
                    {work.status === 'in_progress' && (
                      <button
                        onClick={() => onUpdateStatus(work.id, 'waiting_parts')}
                        className="bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs px-3 py-1 rounded-lg transition-colors"
                      >
                        Esperar Repuesto
                      </button>
                    )}
                    {(work.status === 'in_progress' || work.status === 'waiting_parts') && (
                      <button
                        onClick={() => onUpdateStatus(work.id, 'ready')}
                        className="bg-[#10b981] hover:bg-[#059669] text-white text-xs px-3 py-1 rounded-lg transition-colors"
                      >
                        Marcar Listo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {worksByStatus[selectedStatus].length === 0 && (
            <div className="text-center py-12">
              <div className="bg-[#1e293b] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Wrench className="text-slate-500" size={28} />
              </div>
              <p className="text-slate-400">No hay trabajos en esta categoría</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50">
          <div className="bg-[#1e293b] w-full rounded-t-3xl p-6 max-w-md mx-auto border-t border-slate-700">
            <h3 className="text-white text-xl mb-4">Nuevo Trabajo</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Cliente</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Equipo</label>
                <input
                  type="text"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="Laptop, PC, Celular, etc."
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Descripción del Problema</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none resize-none"
                  placeholder="Detalles del servicio a realizar"
                  rows={3}
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
                  Crear Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
