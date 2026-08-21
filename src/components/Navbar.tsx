import React from 'react';
import { Tenant, UserProfile } from '../types';
import { User, LogOut } from 'lucide-react';

interface NavbarProps {
  tenants: Tenant[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onOpenAddTenant: () => void;
  user: UserProfile;
  onLogout: () => void;
}

const TRINITY_LOGO =
  'https://image2url.com/r2/default/images/1767183581317-68102f31-454b-45f6-9d39-025ce8604ac3.png';

export const Navbar: React.FC<NavbarProps> = ({
  tenants,
  activeTenantId,
  onSelectTenant,
  user,
  onLogout,
}) => {
  return (
    <nav className="h-[48px] bg-white border-b border-stone-200/80 px-4 flex items-center justify-between shrink-0 select-none z-30 shadow-xs">
      
      {/* LEFT: Clean Logo + Brand Title (No duplicate hamburger) */}
      <div className="flex items-center gap-2.5">
        <img
          src={TRINITY_LOGO}
          alt="Trinity Universe"
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <span className="font-bold text-xs sm:text-sm tracking-wider text-slate-800 uppercase font-sans">
          TRINITY UNIVERSE
        </span>
      </div>

      {/* CENTER: Gnosis AI / Yada Guide Switcher */}
      <div className="flex items-center bg-stone-100/90 p-0.5 rounded-full border border-stone-200/60 shadow-inner">
        {tenants.map((t) => {
          const isActive = t.id === activeTenantId;
          const isYada = t.id === 'yada';

          return (
            <button
              key={t.id}
              onClick={() => onSelectTenant(t.id)}
              className={`px-3.5 sm:px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? isYada
                    ? 'bg-[#A36224] text-white shadow-sm'
                    : 'bg-[#0070f3] text-white shadow-sm'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {/* RIGHT: User Profile & Logout */}
      <div className="flex items-center gap-2">
        {user.signedIn ? (
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-stone-300"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={onLogout}
              className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

    </nav>
  );
};
