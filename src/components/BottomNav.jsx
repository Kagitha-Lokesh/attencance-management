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
    <nav className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-white border-t border-slate-100 flex justify-around items-center h-16 z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`
              flex flex-col items-center justify-center gap-1 transition-all duration-300 relative flex-1 h-full
              ${isActive ? 'text-teal-600' : 'text-slate-400'}
            `}
          >
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
              {tab.icon}
            </div>
            <span className="text-[10px] font-bold tracking-tight">
              {tab.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="activeTab"
                className="absolute top-0 w-8 h-1 bg-teal-600 rounded-b-full" 
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
