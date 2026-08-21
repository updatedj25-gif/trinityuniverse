import React from 'react';
import { Tenant } from '../types';
import { Menu, Plus } from 'lucide-react';

interface HeaderProps {
  tenant: Tenant;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenant,
  onToggleSidebar,
  onNewChat,
}) => {
  const isYada = tenant.id === 'yada';

  return (
    <header className="h-[44px] border-b border-stone-200/80 bg-[#FDFBF7] px-4 flex items-center justify-between shrink-0 select-none z-10">
      {/* Left: Sub-header Sidebar Toggle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-700 hover:bg-stone-200/60 transition-colors cursor-pointer flex items-center gap-1.5"
          title="Toggle Sidebar Navigation"
        >
          <Menu className="w-4 h-4 text-slate-800" />
        </button>

        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
          isYada ? 'bg-[#FFF3E6] text-[#A36224] border border-[#E5C9A8]' : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {tenant.headerTitle || tenant.name}
        </span>
      </div>

      {/* Right: New Chat Action */}
      <button
        onClick={onNewChat}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          isYada
            ? 'bg-[#A36224] text-white hover:bg-[#8a511d]'
            : 'bg-slate-800 text-white hover:bg-slate-900'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New</span>
      </button>
    </header>
  );
};
