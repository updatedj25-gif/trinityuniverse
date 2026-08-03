import React from 'react';
import { Menu, SquarePen } from 'lucide-react';
import { Tenant } from '../types';

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
  return (
    <header className="w-full h-12 border-b border-stone-200/60 bg-[#FAF7F2] px-4 flex items-center justify-between select-none">
      {/* Left: Hamburger Menu Button */}
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-200/50 transition-colors cursor-pointer"
        title="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: Tenant Title */}
      <h1
        className={`text-base sm:text-lg font-semibold tracking-wide ${
          tenant.fontStyle === 'serif'
            ? 'font-serif tracking-[0.25em] text-[#A36224]'
            : 'font-sans text-slate-800'
        }`}
      >
        {tenant.headerTitle}
      </h1>

      {/* Right: New Chat / Compose Button */}
      <button
        onClick={onNewChat}
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-200/50 transition-colors cursor-pointer"
        title={tenant.newChatBtnText}
      >
        <SquarePen className="w-5 h-5" />
      </button>
    </header>
  );
};
