import React from 'react';
import { Tenant } from '../types';
import { Plus } from 'lucide-react';

const TRINITY_LOGO = 'https://image2url.com/r2/default/images/1767183581317-68102f31-454b-45f6-9d39-025ce8604ac3.png';

interface NavbarProps {
  tenants: Tenant[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onOpenAddTenant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  tenants,
  activeTenantId,
  onSelectTenant,
  onOpenAddTenant,
}) => {
  return (
    <nav className="w-full bg-[#FAF7F2] border-b border-stone-200/60 px-3 sm:px-4 py-2 flex items-center justify-between z-30 sticky top-0 select-none gap-2">
      {/* Left side: Trinity Universe Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <img
          src={TRINITY_LOGO}
          alt="Trinity Universe"
          className="w-5 h-5 object-contain animate-breathe"
        />
        <span className="text-xs sm:text-sm font-semibold tracking-wider text-slate-800 uppercase hidden sm:inline">
          TRINITY UNIVERSE
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-slate-800 uppercase inline sm:hidden">
          TRINITY
        </span>
      </div>

      {/* Right side: Tenant Switcher Pills only */}
      <div className="flex items-center gap-1 bg-stone-200/40 p-1 rounded-full border border-stone-200/80 overflow-x-auto scrollbar-none max-w-[calc(100vw-120px)] sm:max-w-none">
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

        <button
          onClick={onOpenAddTenant}
          title="Create new AI Tenant"
          className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-stone-200/80 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </nav>
  );
};
