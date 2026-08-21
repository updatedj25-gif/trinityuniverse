import React from 'react';
import { Tenant, ChatSession, UserProfile } from '../types';
import { Plus, Trash2, MessageSquare, BookOpen, Sparkles, X } from 'lucide-react';

interface SidebarProps {
  tenant: Tenant;
  sessions: ChatSession[];
  activeSessionId: string | null;
  currentView: 'chat' | 'library' | 'faceswap';
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onOpenLibrary: () => void;
  onOpenFaceSwap: () => void;
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
  onOpenFaceSwap,
  onClearHistory,
  onDeleteSession,
  user,
  isOpen,
  onCloseMobile,
}) => {
  const currentTenantSessions = sessions.filter(
    (s) => s.tenantId === tenant.id
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden"
        />
      )}

      <aside
        className={[
          'bg-[#F6F3EE] overflow-hidden select-none shrink-0',
          'transition-[width,opacity] duration-300 ease-in-out',
          'fixed top-[46px] bottom-0 left-0 z-50',
          'lg:relative lg:top-auto lg:bottom-auto lg:z-auto lg:h-full',
          isOpen
            ? 'w-64 sm:w-72 opacity-100 border-r border-stone-200/80'
            : 'w-0 opacity-0 pointer-events-none border-r-0',
        ].join(' ')}
      >
        <div className="absolute inset-y-0 left-0 w-64 sm:w-72 flex flex-col">
          <div className="flex flex-col h-full overflow-y-auto p-4">

            {/* Tenant name + Close button */}
            <div className="flex items-center justify-between mb-4 px-1 shrink-0">
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

            {/* Navigation Actions: 1. Face Swap Studio, 2. Ebook Library, 3. New Chat */}
            <div className="space-y-2 mb-4 shrink-0">
              {/* FACE SWAP STUDIO BUTTON */}
              <button
                onClick={() => {
                  onOpenFaceSwap();
                  onCloseMobile();
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm border transition-all cursor-pointer ${
                  currentView === 'faceswap'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-700 shadow-md'
                    : tenant.id === 'yada'
                    ? 'bg-white text-[#A36224] border-[#E5C9A8] hover:bg-[#FFF9F2] hover:border-[#A36224]'
                    : 'bg-white text-slate-800 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Face Swap Studio</span>
              </button>

              <button
                onClick={() => {
                  onOpenLibrary();
                  onCloseMobile();
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm border transition-all cursor-pointer ${
                  currentView === 'library'
                    ? 'bg-[#A36224] text-white border-[#8a511d] shadow-md'
                    : tenant.id === 'yada'
                    ? 'bg-white text-[#A36224] border-[#E5C9A8] hover:bg-[#FFF9F2] hover:border-[#A36224]'
                    : 'bg-white text-slate-800 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Ebook Library</span>
              </button>

              <button
                onClick={() => {
                  onNewSession();
                  onCloseMobile();
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm border transition-all cursor-pointer ${
                  currentView === 'chat' && !activeSessionId
                    ? tenant.id === 'yada'
                      ? 'bg-[#A36224] text-white border-[#8a511d]'
                      : 'bg-slate-800 text-white border-slate-900'
                    : tenant.id === 'yada'
                    ? 'bg-white text-[#A36224] border-[#E5C9A8] hover:bg-[#FFF9F2] hover:border-[#A36224]'
                    : 'bg-white text-slate-800 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{tenant.newChatBtnText}</span>
              </button>
            </div>

            {/* Subtitle */}
            {tenant.subtitle && (
              <p className="text-xs italic text-stone-500 mb-3 px-1 font-serif shrink-0">
                {tenant.subtitle}
              </p>
            )}

            {/* History Header */}
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
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

            {/* History list */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
              {currentTenantSessions.length === 0 ? (
                <p className="text-xs italic text-stone-400 py-3 px-1">
                  No previous conversations
                </p>
              ) : (
                currentTenantSessions.map((session) => {
                  const isActive = session.id === activeSessionId && currentView === 'chat';
                  return (
                    <div
                      key={session.id}
                      className={`group relative flex items-center justify-between py-2 px-2.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-stone-200/70 text-slate-900 font-medium shadow-sm'
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
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-red-500 hover:bg-stone-200/80 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </aside>
    </>
  );
};
