import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Clock, Settings } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  
  const tabs = [
    { label: 'Home',     icon: <Home size={22} />,     path: '/home' },
    { label: 'Calendar', icon: <Calendar size={22} />, path: '/calendar' },
    { label: 'Hours',    icon: <Clock size={22} />,    path: '/hours' },
    { label: 'Settings', icon: <Settings size={22} />, path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-lg border border-white/20 rounded-[2rem] shadow-2xl z-50 overflow-hidden">
      <div className="flex justify-around items-center h-20 px-4">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`
                flex flex-col items-center gap-1 transition-all duration-300 relative px-4 py-2
                ${isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-0 scale-75'} transition-all`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 bg-teal-600 rounded-full shadow-[0_0_8px_rgba(13,148,136,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
