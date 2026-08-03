import React from 'react';
import { Home, BookOpen, Menu } from 'lucide-react';

interface LibraryPageProps {
  onGoHome: () => void;
  onToggleSidebar?: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onGoHome,
  onToggleSidebar,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#FAF7F2] select-none">
      {/* Top Bar with Home Icon */}
      <header className="w-full h-14 border-b border-stone-200/60 bg-[#FAF7F2] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-200/50 transition-colors cursor-pointer lg:hidden"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onGoHome}
            className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 border border-stone-200/80 bg-white shadow-2xs transition-all cursor-pointer"
            title="Return to Chat"
          >
            <Home className="w-5 h-5 text-[#A36224]" />
            <span className="text-xs sm:text-sm font-medium">Home</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#A36224]" />
          <h1 className="text-base sm:text-lg font-serif tracking-wider font-semibold text-slate-800">
            Ebook Library
          </h1>
        </div>

        <div className="w-20" /> {/* Spacer to balance header */}
      </header>

      {/* Main Creamy Background Page Content Area */}
      <main className="flex-1 w-full bg-[#FAF7F2] flex items-center justify-center p-6">
        {/* Intentionally blank creamy canvas for future ebook collection */}
      </main>
    </div>
  );
};
