import React from 'react';
import { Tenant, UserProfile } from '../types';
import { User, LogOut } from 'lucide-react';

interface NavbarProps {
  tenants: Tenant[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  user: UserProfile;
  onLogout: () => void;
  onOpenAddTenant?: () => void;
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
    <nav className="h-[46px] sm:h-[48px] bg-white border-b border-stone-200/80 px-2.5 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 shadow-2xs">
      
      {/* LEFT: Logo + Compact Brand Name */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <img
          src={TRINITY_LOGO}
          alt="Trinity Universe"
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <span className="font-bold text-[11px] sm:text-xs md:text-sm tracking-wider text-slate-800 uppercase font-sans truncate">
          <span className="hidden xs:inline sm:inline">TRINITY UNIVERSE</span>
          <span className="inline xs:hidden sm:hidden">TRINITY</span>
        </span>
      </div>

      {/* CENTER: Slim Responsive AI Switcher (Fits mobile without touching profile) */}
      <div className="flex items-center bg-stone-100 p-0.5 rounded-full border border-stone-200/70 shadow-inner mx-1.5 shrink-0">
        {tenants.map((t) => {
          const isActive = t.id === activeTenantId;
          const isYada = t.id === 'yada';
          const shortName = t.id === 'gnosis' ? 'Gnosis' : 'Yada';

          return (
            <button
              key={t.id}
              onClick={() => onSelectTenant(t.id)}
              className={`px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? isYada
                    ? 'bg-[#A36224] text-white shadow-xs'
                    : 'bg-[#0070f3] text-white shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              <span className="hidden sm:inline">{t.name}</span>
              <span className="inline sm:hidden">{shortName}</span>
            </button>
          );
        })}
      </div>

      {/* RIGHT: User Profile & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {user.signedIn ? (
          <div className="flex items-center gap-1.5">
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
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        ) : (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

    </nav>
  );
};
