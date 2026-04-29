import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Receipt, 
  PlusCircle,
  Package, 
  ArrowRightLeft,
  TrendingDown,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Users
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation based on roles
  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t('nav.dashboard'), allowed: ['admin', 'owner', 'cashier', 'staff'] },
    { to: "/sales/new", icon: PlusCircle, label: t('nav.newSale'), allowed: ['admin', 'owner', 'cashier', 'staff'] },
    { to: "/sales", icon: Receipt, label: t('nav.salesHistory'), allowed: ['admin', 'owner', 'cashier', 'staff'] },
    { to: "/menu", icon: UtensilsCrossed, label: t('nav.menu'), allowed: ['admin', 'owner'] },
    { to: "/stock", icon: Package, label: t('nav.stock'), allowed: ['admin', 'owner'] },
    { to: "/stock/movements", icon: ArrowRightLeft, label: t('nav.stockMovements'), allowed: ['admin', 'owner', 'staff', 'cashier'] },
    { to: "/expenses", icon: TrendingDown, label: t('nav.expenses'), allowed: ['admin', 'owner', 'cashier', 'staff'] },
    { to: "/reports", icon: BarChart3, label: t('nav.reports'), allowed: ['admin', 'owner'] },
    { to: "/hr", icon: Users, label: t('nav.hr'), allowed: ['admin', 'owner'] },
    { to: "/settings", icon: Settings, label: t('nav.settings'), allowed: ['admin', 'owner', 'cashier', 'staff'] },
  ];

  const userRole = profile?.role || 'staff';
  const filteredNav = navItems.filter(item => item.allowed.includes(userRole));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 mb-4">
        <h1 className="text-xl font-serif font-bold tracking-tight text-amber-500 flex items-center gap-2">
          <UtensilsCrossed className="text-amber-500 shrink-0" />
          <span className="truncate">{t('app.name')}</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">
          {profile?.full_name} • <span className="uppercase">{profile?.role}</span>
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-stone-800/50 text-amber-400 border border-amber-900/30' 
                  : 'text-stone-400 hover:bg-stone-800 transition-colors'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-800 mt-auto flex justify-between items-center">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors text-sm font-medium shrink-0"
        >
          <LogOut size={20} />
          {t('nav.signOut')}
        </button>
        
        <button 
          onClick={toggleLanguage}
          className="flex items-center justify-center p-2 rounded-full border border-stone-700 bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700 transition-colors shrink-0"
          title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
        >
          <Globe size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] md:flex text-stone-200">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0F0F0F] border-b border-stone-800 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="font-bold text-base text-amber-500 font-serif flex items-center gap-2 truncate pr-2">
          <UtensilsCrossed className="text-amber-500 shrink-0" size={20} />
          <span className="truncate">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={toggleLanguage} className="p-2 text-stone-400">
            <Globe size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-400">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm pt-16 pb-20">
          <NavContent />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0 flex-col bg-[#0F0F0F] border-r border-stone-800 fixed h-full z-10">
        <NavContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-64px)] md:min-h-screen pb-24 md:pb-8 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Navigation (Quick Actions) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F0F0F] border-t border-stone-800 flex justify-around p-2 z-30 safe-area-bottom">
        {filteredNav.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-amber-500' : 'text-stone-500'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
        <button 
          onClick={handleSignOut}
          className="flex flex-col items-center p-2 rounded-lg text-stone-500 hover:text-stone-300"
        >
          <LogOut size={20} />
          <span className="text-[10px] mt-1 font-medium">{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );
}
