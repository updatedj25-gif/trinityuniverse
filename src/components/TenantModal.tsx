import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Tenant } from '../types';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (tenant: Tenant) => void;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  onAddTenant,
}) => {
  const [name, setName] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [theme, setTheme] = useState<'blue' | 'purple' | 'amber' | 'emerald'>('emerald');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    let activePillBg = 'bg-emerald-50';
    let activePillText = 'text-emerald-700';
    let activePillBorder = 'border-emerald-200';
    let accentColor = '#059669';

    if (theme === 'blue') {
      activePillBg = 'bg-blue-50';
      activePillText = 'text-blue-700';
      activePillBorder = 'border-blue-200';
      accentColor = '#2563eb';
    } else if (theme === 'purple') {
      activePillBg = 'bg-purple-50';
      activePillText = 'text-purple-700';
      activePillBorder = 'border-purple-200';
      accentColor = '#7c3aed';
    } else if (theme === 'amber') {
      activePillBg = 'bg-amber-50';
      activePillText = 'text-amber-700';
      activePillBorder = 'border-amber-200';
      accentColor = '#d97706';
    }

    const newTenant: Tenant = {
      id,
      name: name.trim(),
      headerTitle: name.trim(),
      pillLabel: `✦ ${name.trim()}`,
      activePillBg,
      activePillText,
      activePillBorder,
      newChatBtnText: '+ New Chat',
      clearHistoryBtnText: 'Clear All History',
      emptyStateTitle: `How can ${name.trim()} assist you today?`,
      placeholderText: `Message ${name.trim()}...`,
      systemInstruction: systemInstruction.trim() || `You are ${name.trim()}, a specialized AI agent in Trinity Universe.`,
      fontStyle: 'sans',
      canvasBg: 'bg-[#FAF7F2]',
      accentColor,
      avatarBg: `${activePillBg} ${activePillText}`,
      activityCategory: 'Custom AI Tenant Agent',
      suggestedPrompts: [
        `What are your key capabilities, ${name.trim()}?`,
        'Help me analyze a complex scenario step-by-step',
        'Draft an insightful overview for my team',
      ],
    };

    onAddTenant(newTenant);
    setName('');
    setSystemInstruction('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Add Custom Tenant Bot
            </h3>
            <p className="text-xs text-stone-500">
              Provision a new AI model persona in Trinity Universe
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tenant AI Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hermes Strategist or Sophia Analytics"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              System Persona / Instructions
            </label>
            <textarea
              rows={3}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="Describe how this AI should behave, speak, or advise..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-stone-500 resize-none font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Theme Accent
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['blue', 'purple', 'amber', 'emerald'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`py-2 text-xs font-medium rounded-xl border capitalize cursor-pointer transition-all ${
                    theme === t
                      ? 'border-slate-800 bg-slate-900 text-white shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-2xs transition-all cursor-pointer mt-2"
          >
            Provision Tenant
          </button>
        </form>
      </div>
    </div>
  );
};
