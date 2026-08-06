import React from 'react';
import { Tenant, ChatSession, UserProfile } from '../types';
import { Plus, Trash2, MessageSquare, BookOpen, X } from 'lucide-react';

interface SidebarProps {
  tenant: Tenant;
  sessions: ChatSession[];
  activeSessionId: string | null;
  currentView: 'chat' | 'library';
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onOpenLibrary: () => void;
  onClearHistory: () => void;
  onDeleteSession: (sessionId: string) => void;
  user: UserProfile;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tenant,
  sessions,
  activeSessionId,
  currentView,
  onSelectSession,
  onNewSession,
  onOpenLibrary,
  onClearHistory,
  onDeleteSession,
  user,
  isOpen,
  onCloseMobile,
}) => {
  // Filter sessions strictly by tenant.id
  const currentTenantSessions = sessions.filter(
    (s) => s.tenantId === tenant.id
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container — no profile footer; profile is in the top Navbar */}
      <aside
        className={`fixed lg:relative top-0 bottom-0 left-0 z-50 h-full bg-[#F6F3EE] flex flex-col transition-all duration-300 ease-in-out select-none shrink-0 overflow-hidden ${
          isOpen
            ? 'w-64 sm:w-72 translate-x-0 opacity-100 border-r border-stone-200/80'
            : 'w-0 -translate-x-full opacity-0 pointer-events-none border-r-0'
        }`}
      >
        <div className="w-64 sm:w-72 h-full flex flex-col">
          {/* All scrollable content area */}
          <div className="p-4 flex-1 flex flex-col overflow-y-auto">

            {/* Tenant Header & Mobile Close */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h2
                className={`text-lg font-bold tracking-tight ${
                  tenant.fontStyle === 'serif'
                    ? 'font-serif tracking-[0.2em] text-[#A36224]'
                    : 'text-slate-800'
                }`}
              >
                {tenant.name}
              </h2>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-500 hover:bg-stone-200 transition-colors cursor-pointer"
                title="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons: 1. Ebook Library Menu -> 2. New Chat Button */}
            <div className="space-y-2 mb-4">
              {/* Ebook Library Button */}
              <button
                onClick={() => {
                  onOpenLibrary();
                  onCloseMobile();
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs border transition-all cursor-pointer ${
                  currentView === 'library'
                    ? 'bg-[#A36224] text-white border-[#8a511d] shadow-md'
                    : tenant.id === 'yada'
                    ? 'bg-white text-[#A36224] border-[#E5C9A8] hover:bg-[#FFF9F2] hover:border-[#A36224]'
                    : 'bg-white text-slate-800 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Ebook Library</span>
              </button>

              {/* New Chat / Consultation Button */}
              <button
                onClick={() => {
                  onNewSession();
                  onCloseMobile();
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs border transition-all cursor-pointer ${
                  tenant.id === 'yada'
                    ? 'bg-white text-[#A36224] border-[#E5C9A8] hover:bg-[#FFF9F2] hover:border-[#A36224]'
                    : 'bg-white text-slate-800 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{tenant.newChatBtnText}</span>
              </button>
            </div>

            {/* Subtitle for Yada */}
            {tenant.subtitle && (
              <p className="text-xs italic text-stone-500 mb-3 px-1 font-serif">
                {tenant.subtitle}
              </p>
            )}

            {/* 3. Section Header & Chat History */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                {tenant.id === 'yada' ? 'CONSULTATIONS HISTORY' : 'CHAT HISTORY'}
              </span>
              {currentTenantSessions.length > 0 && (
                <button
                  onClick={onClearHistory}
                  title="Clear all history"
                  className="text-[10px] text-stone-400 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {currentTenantSessions.length === 0 ? (
                <p className="text-xs italic text-stone-400 py-3 px-1">
                  No previous conversations
                </p>
              ) : (
                currentTenantSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`group relative flex items-center justify-between py-2 px-2.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-stone-200/70 text-slate-900 font-medium shadow-2xs'
                          : 'text-slate-600 hover:bg-stone-200/40 hover:text-slate-900'
                      }`}
                      onClick={() => {
                        onSelectSession(session.id);
                        onCloseMobile();
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        <span className="truncate">{session.title}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        title="Delete session"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-red-500 hover:bg-stone-200/80 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>{/* end p-4 flex-1 content area */}
        </div>{/* end w-64 inner wrapper */}
      </aside>
    </>
  );
};
