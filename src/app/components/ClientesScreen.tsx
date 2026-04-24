import { useState } from 'react';
import { User, Phone, Mail, MapPin, Plus, Search } from 'lucide-react';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalWorks: number;
  totalSpent: number;
}

interface ClientesScreenProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'totalWorks' | 'totalSpent'>) => void;
}

export default function ClientesScreen({ clients, onAddClient }: ClientesScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    onAddClient({
      name,
      phone,
      email: email || undefined,
      address: address || undefined
    });

    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShowModal(false);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-white text-2xl mb-1">Clientes</h1>
            <p className="text-slate-400 text-sm">{clients.length} clientes registrados</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full p-3 shadow-lg transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e293b] text-white rounded-xl p-3 pl-11 border border-slate-700 focus:border-[#3b82f6] outline-none"
            placeholder="Buscar por nombre o teléfono..."
          />
        </div>

        <div className="space-y-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-[#1e293b] rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-[#3b82f6] rounded-full p-3">
                  <User className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-1">{client.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                      <Mail size={14} />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <MapPin size={14} />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-700/50">
                <div className="flex-1 bg-[#0f172a] rounded-lg p-2 text-center">
                  <p className="text-slate-400 text-xs mb-1">Trabajos</p>
                  <p className="text-white">{client.totalWorks}</p>
                </div>
                <div className="flex-1 bg-[#0f172a] rounded-lg p-2 text-center">
                  <p className="text-slate-400 text-xs mb-1">Total Gastado</p>
                  <p className="text-[#10b981]">${client.totalSpent.toLocaleString('es-MX')}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-[#1e293b] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <User className="text-slate-500" size={28} />
              </div>
              <p className="text-slate-400 mb-2">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
              {!searchTerm && (
                <p className="text-slate-500 text-sm">Agrega tu primer cliente para comenzar</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50">
          <div className="bg-[#1e293b] w-full rounded-t-3xl p-6 max-w-md mx-auto border-t border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-xl mb-4">Nuevo Cliente</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Nombre completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Teléfono *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="5512345678"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Dirección</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#0f172a] text-white rounded-lg p-3 border border-slate-700 focus:border-[#3b82f6] outline-none"
                  placeholder="Calle, número, colonia"
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
