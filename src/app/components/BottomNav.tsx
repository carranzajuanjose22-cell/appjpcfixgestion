import { Home, Wrench, Wallet, Users } from 'lucide-react';

export type Screen = 'dashboard' | 'trabajos' | 'caja' | 'clientes';

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard' as Screen, label: 'Inicio', icon: Home },
    { id: 'trabajos' as Screen, label: 'Trabajos', icon: Wrench },
    { id: 'caja' as Screen, label: 'Caja', icon: Wallet },
    { id: 'clientes' as Screen, label: 'Clientes', icon: Users }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-slate-700 z-40">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive
                  ? 'text-[#3b82f6]'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
