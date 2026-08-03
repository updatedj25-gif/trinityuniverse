import React from 'react';
import { Tenant, UserProfile } from '../types';
import { Plus, User, Sparkles, Info, LogOut } from 'lucide-react';

interface NavbarProps {
  tenants: Tenant[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onOpenAddTenant: () => void;
  user: UserProfile;
  onOpenSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  tenants,
  activeTenantId,
  onSelectTenant,
  onOpenAddTenant,
  user,
  onOpenSignIn,
  onSignOut,
}) => {
  return (
    <nav className="w-full bg-[#FAF7F2] border-b border-stone-200/60 px-2.5 sm:px-4 py-2 flex items-center justify-between z-30 sticky top-0 select-none gap-2">
      {/* Left side: Trinity Universe Logo */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#C05621] inline-block shadow-xs"></span>
        <span className="text-xs sm:text-sm font-semibold tracking-wider text-slate-800 uppercase hidden sm:inline">
          TRINITY UNIVERSE
        </span>
        <span className="text-xs font-semibold tracking-wider text-slate-800 uppercase inline sm:hidden">
          TRINITY
        </span>
      </div>

      {/* Right side: Tenant Switchers & Sign in */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Tenant Switcher Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-stone-200/40 p-1 rounded-full border border-stone-200/80 max-w-[55vw] sm:max-w-none overflow-x-auto scrollbar-none shrink">
          {tenants.map((tenant) => {
            const isActive = tenant.id === activeTenantId;
            return (
              <button
                key={tenant.id}
                onClick={() => onSelectTenant(tenant.id)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? `${tenant.activePillBg} ${tenant.activePillText} ${tenant.activePillBorder} border shadow-2xs font-semibold`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                }`}
              >
                {tenant.id === 'gnosis' ? (
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : tenant.id === 'yada' ? (
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>{tenant.name === 'YADA' ? 'Yada Guide' : tenant.name}</span>
              </button>
            );
          })}

          <button
            onClick={onOpenAddTenant}
            title="Create new AI Tenant"
            className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-stone-200/80 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Google Sign In Button */}
        {user.signedIn ? (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-slate-200/80 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">{user.name}</span>
            <button
              onClick={onSignOut}
              title="Sign out"
              className="text-slate-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenSignIn}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in</span>
          </button>
        )}
      </div>
    </nav>
  );
};
