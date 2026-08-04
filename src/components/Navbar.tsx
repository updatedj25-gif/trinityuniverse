import React, { useState, useRef, useEffect } from 'react';
import { Tenant, UserProfile } from '../types';
import { LogOut, ChevronDown } from 'lucide-react';

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Derive initials from name
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <nav className="w-full bg-[#FAF7F2] border-b border-stone-200/60 px-3 sm:px-4 py-2 flex items-center justify-between z-50 fixed top-0 left-0 right-0 select-none gap-2">

      {/* Left: Trinity Universe Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <img
          src={TRINITY_LOGO}
          alt="Trinity Universe"
          className="w-7 h-7 sm:w-8 sm:h-8 object-contain animate-breathe"
        />
        <span className="text-[10px] sm:text-sm font-semibold tracking-wider text-slate-800 uppercase">
          TRINITY UNIVERSE
        </span>
      </div>

      {/* Center: Tenant Switcher Pills */}
      <div className="flex items-center gap-1 bg-stone-200/40 p-1 rounded-full border border-stone-200/80 overflow-x-auto scrollbar-none max-w-[calc(100vw-220px)] sm:max-w-none">
        {tenants.map((tenant) => {
          const isActive = tenant.id === activeTenantId;
          return (
            <button
              key={tenant.id}
              onClick={() => onSelectTenant(tenant.id)}
              className={`px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? `${tenant.activePillBg} ${tenant.activePillText} ${tenant.activePillBorder} border shadow-2xs font-semibold`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
              }`}
            >
              <span>{tenant.name === 'YADA' ? 'Yada Guide' : tenant.name}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Profile Avatar + Dropdown */}
      {user.signedIn ? (
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
            title={user.name}
          >
            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ring-2 ring-white shadow-sm">
                {initials}
              </div>
            )}
            <ChevronDown
              className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User info */}
              <div className="px-4 py-4 flex items-center gap-3 border-b border-stone-100">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-stone-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
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

              {/* Logout */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
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
