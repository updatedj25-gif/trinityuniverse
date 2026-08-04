import React, { useState, useEffect } from 'react';
import { Tenant, ChatSession, ChatMessage, UserProfile, Attachment } from './types';
import { INITIAL_TENANTS } from './data/tenants';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LibraryPage } from './components/LibraryPage';
import { LandingPage } from './components/LandingPage';
import { SignInModal } from './components/SignInModal';
import { TenantModal } from './components/TenantModal';

export const App: React.FC = () => {
  // 1. Tenants State
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('trinity_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [activeTenantId, setActiveTenantId] = useState<string>('gnosis');

  // View state: 'chat' or 'library'
  const [currentView, setCurrentView] = useState<'chat' | 'library'>('chat');

  // Landing page — show unless user has previously signed in / dismissed
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    const dismissed = localStorage.getItem('trinity_landing_dismissed');
    const userProfile = localStorage.getItem('trinity_user_profile');
    if (dismissed === 'true') return false;
    if (userProfile) {
      try {
        const parsed = JSON.parse(userProfile);
        if (parsed.signedIn) return false;
      } catch {
        // ignore
      }
    }
    return true;
  });

  // 2. Chat Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('trinity_chat_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. Per-Tenant Active Session Map (Remembers each AI tenant's open chat)
  const [activeSessionMap, setActiveSessionMap] = useState<Record<string, string | null>>(() => {
    const saved = localStorage.getItem('trinity_active_session_map');
    return saved ? JSON.parse(saved) : { gnosis: null, yada: null };
  });

  // 4. User State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('trinity_user_profile');
    return saved
      ? JSON.parse(saved)
      : { name: 'Guest User', signedIn: false };
  });

  // 5. UI & Modals State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [signInOpen, setSignInOpen] = useState<boolean>(false);
  const [tenantModalOpen, setTenantModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('trinity_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('trinity_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('trinity_active_session_map', JSON.stringify(activeSessionMap));
  }, [activeSessionMap]);

  useEffect(() => {
    localStorage.setItem('trinity_user_profile', JSON.stringify(user));
  }, [user]);

  // ── Server session check (Google OAuth callback restores state here) ──────
  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserProfile | null) => {
        if (data && data.signedIn) {
          setUser(data);
          setShowLanding(false);
          localStorage.setItem('trinity_landing_dismissed', 'true');
          localStorage.setItem('trinity_user_profile', JSON.stringify(data));
        }
      })
      .catch(() => {
        // network error or no session — stay as guest, no action needed
      });
  }, []);

  // Derived current Tenant object
  const currentTenant =
    tenants.find((t) => t.id === activeTenantId) || tenants[0];

  // Current active session for the selected tenant
  const activeSessionId = activeSessionMap[activeTenantId] || null;

  // Filter sessions strictly belonging to the active tenant
  const currentTenantSessions = sessions.filter(
    (s) => s.tenantId === currentTenant.id
  );

  const activeSession = currentTenantSessions.find(
    (s) => s.id === activeSessionId
  );

  const currentMessages = activeSession ? activeSession.messages : [];

  // ── Landing page sign-in handler ─────────────────────────────────────────
  const handleLandingSignIn = (profile: UserProfile) => {
    setUser(profile);
    setActiveTenantId('gnosis');
    setCurrentView('chat');
    setShowLanding(false);
    localStorage.setItem('trinity_landing_dismissed', 'true');
    localStorage.setItem('trinity_user_profile', JSON.stringify(profile));
  };

  // Handlers
  const handleSelectTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setCurrentView('chat');
    if (!activeSessionMap[tenantId]) {
      const tenantSessions = sessions.filter((s) => s.tenantId === tenantId);
      setActiveSessionMap((prev) => ({
        ...prev,
        [tenantId]: tenantSessions.length > 0 ? tenantSessions[0].id : null,
      }));
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentView('chat');
    setActiveSessionMap((prev) => ({
      ...prev,
      [activeTenantId]: sessionId,
    }));
  };

  const handleNewSession = () => {
    setCurrentView('chat');
    setActiveSessionMap((prev) => ({
      ...prev,
      [activeTenantId]: null,
    }));
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        `Are you sure you want to clear all history for ${currentTenant.name}?`
      )
    ) {
      setSessions((prev) => prev.filter((s) => s.tenantId !== currentTenant.id));
      setActiveSessionMap((prev) => ({
        ...prev,
        [currentTenant.id]: null,
      }));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionMap((prev) => ({
        ...prev,
        [activeTenantId]: null,
      }));
    }
  };

  const handleAddTenant = (newTenant: Tenant) => {
    setTenants((prev) => [...prev, newTenant]);
    setActiveTenantId(newTenant.id);
    setActiveSessionMap((prev) => ({
      ...prev,
      [newTenant.id]: null,
    }));
  };

  const handleSendMessage = async (
    content: string,
    attachments?: Attachment[]
  ) => {
    let sessionId = activeSessionId;
    let updatedSessions = [...sessions];

    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: now,
      attachments,
    };

    let targetSession = updatedSessions.find((s) => s.id === sessionId && s.tenantId === currentTenant.id);

    if (!targetSession) {
      const newSessionId = `session_${currentTenant.id}_${Date.now()}`;
      const title = content.length > 30 ? content.slice(0, 30) + '...' : content;
      targetSession = {
        id: newSessionId,
        tenantId: currentTenant.id,
        title: title || 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [userMessage],
      };
      updatedSessions.unshift(targetSession);
      sessionId = newSessionId;
    } else {
      targetSession = {
        ...targetSession,
        updatedAt: new Date().toISOString(),
        messages: [...targetSession.messages, userMessage],
      };
      updatedSessions = updatedSessions.map((s) =>
        s.id === sessionId ? targetSession! : s
      );
    }

    setSessions(updatedSessions);
    setActiveSessionMap((prev) => ({
      ...prev,
      [currentTenant.id]: sessionId,
    }));
    setIsLoading(true);

    try {
      const hasImages = userMessage.attachments?.some((a) => a.type === 'image');
      const selectedModel = hasImages
        ? currentTenant.visionModel || '@cf/meta/llama-3.2-11b-vision-instruct'
        : currentTenant.primaryModel || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          model: selectedModel,
          messages: targetSession.messages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          systemInstruction: currentTenant.systemInstruction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from Cloudflare AI');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
    } catch (error: any) {
      console.error('Error in chat request:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Issue communicating with ${currentTenant.name}: ${
          error.message || 'Please verify environment credentials.'
        }`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Landing page ─────────────────────────────────────────────────────────
  if (showLanding) {
    return <LandingPage onSignIn={handleLandingSignIn} />;
  }

  return (
    <div className="h-dvh w-screen flex flex-col overflow-hidden bg-[#FAF7F2] font-sans text-slate-800">
      {/* Top Navbar — fixed so it never scrolls on any screen size */}
      <Navbar
        tenants={tenants}
        activeTenantId={activeTenantId}
        onSelectTenant={handleSelectTenant}
        onOpenAddTenant={() => setTenantModalOpen(true)}
      />
      {/* Spacer matching the fixed navbar height */}
      <div className="h-[46px] shrink-0" />

      {/* Main Workspace Layout (Sidebar + Chat Area / Library Page) */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          tenant={currentTenant}
          sessions={sessions}
          activeSessionId={activeSessionId}
          currentView={currentView}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onOpenLibrary={() => setCurrentView('library')}
          onClearHistory={handleClearHistory}
          onDeleteSession={handleDeleteSession}
          user={user}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col h-full min-w-0">
          {currentView === 'library' ? (
            <LibraryPage
              onGoHome={() => setCurrentView('chat')}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            />
          ) : (
            <>
              <Header
                tenant={currentTenant}
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                onNewChat={handleNewSession}
              />

              <ChatArea
                tenant={currentTenant}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <SignInModal
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignInSuccess={(profile) => setUser(profile)}
      />

      <TenantModal
        isOpen={tenantModalOpen}
        onClose={() => setTenantModalOpen(false)}
        onAddTenant={handleAddTenant}
      />
    </div>
  );
};
