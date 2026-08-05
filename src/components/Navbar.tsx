import React, { useState, useRef, useEffect } from 'react';
import { Tenant, UserProfile } from '../types';
import { LogOut } from 'lucide-react';

const TRINITY_LOGO = 'https://image2url.com/r2/default/images/1767183581317-68102f31-454b-45f6-9d39-025ce8604ac3.png';

interface NavbarProps {
  tenants: Tenant[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onOpenAddTenant: () => void;
  user: UserProfile;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  tenants,
  activeTenantId,
  onSelectTenant,
  onOpenAddTenant,
  user,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="w-full bg-[#FAF7F2] border-b border-stone-200/60 px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 z-50 fixed top-0 left-0 right-0 select-none">

      {/* ── Left: Logo ── */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <img
          src={TRINITY_LOGO}
          alt="Trinity Universe"
          className="w-6 h-6 sm:w-7 sm:h-7 object-contain animate-breathe shrink-0"
        />
        {/* Hide full text on very small screens, show abbreviated */}
        <span className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-slate-800 uppercase whitespace-nowrap">
          TRINITY UNIVERSE
        </span>
      </div>

      {/* ── Center: Tenant Switcher Pills — flex-1 so it fills available space ── */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <div className="flex items-center gap-0.5 sm:gap-1 bg-stone-200/40 p-0.5 sm:p-1 rounded-full border border-stone-200/80 overflow-hidden">
          {tenants.map((tenant) => {
            const isActive = tenant.id === activeTenantId;
            const label = tenant.id === 'yada' ? 'Yada Guide' : tenant.name;
            return (
              <button
                key={tenant.id}
                onClick={() => onSelectTenant(tenant.id)}
                className={`
                  px-2 sm:px-3 py-0.5 sm:py-1 rounded-full
                  text-[10px] sm:text-xs font-medium
                  transition-all cursor-pointer whitespace-nowrap shrink-0
                  ${isActive
                    ? `${tenant.activePillBg} ${tenant.activePillText} ${tenant.activePillBorder} border shadow-sm font-semibold`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Profile Avatar ── */}
      {user.signedIn ? (
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 p-0.5 sm:p-1 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
            title={user.name}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-2 ring-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold ring-2 ring-white shadow-sm">
                {initials}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 sm:w-64 bg-white rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3.5 flex items-center gap-3 border-b border-stone-100">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-stone-400 truncate mt-0.5">{user.email}</p>
                  )}
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Signed in
                  </span>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </nav>
  );
};
