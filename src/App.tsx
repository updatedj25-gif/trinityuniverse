import React, { useState, useEffect } from 'react';
import { Tenant, ChatSession, ChatMessage, UserProfile, Attachment } from './types';
import { INITIAL_TENANTS } from './data/tenants';
import { DEFAULT_INITIAL_SESSIONS } from './data/defaultSessions';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LibraryPage } from './components/LibraryPage';
import { LandingPage } from './components/LandingPage';
import { SignInModal } from './components/SignInModal';
import { TenantModal } from './components/TenantModal';

const App: React.FC = () => {
  // ── Tenants ────────────────────────────────────────────────────────────────
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const saved = localStorage.getItem('trinity_tenants');
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch { return INITIAL_TENANTS; }
  });

  const [activeTenantId, setActiveTenantId] = useState<string>('gnosis');
  const [currentView, setCurrentView] = useState<'chat' | 'library'>('chat');

  // ── Landing ────────────────────────────────────────────────────────────────
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem('trinity_landing_dismissed');
      if (dismissed === 'true') return false;
      const raw = localStorage.getItem('trinity_user_profile');
      if (raw) {
        const p: UserProfile = JSON.parse(raw);
        if (p.signedIn) return false;
      }
    } catch { /* */ }
    return true;
  });

  // ── Sessions ───────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('trinity_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* */ }
    return DEFAULT_INITIAL_SESSIONS;
  });

  // ── Active session per tenant ──────────────────────────────────────────────
  const [activeSessionMap, setActiveSessionMap] = useState<Record<string, string | null>>(() => {
    try {
      const saved = localStorage.getItem('trinity_active_session_map');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch { /* */ }
    return { gnosis: 'session_gnosis_welcome', yada: 'session_yada_welcome' };
  });

  // ── User ───────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('trinity_user_profile');
      if (saved) return JSON.parse(saved);
    } catch { /* */ }
    return { name: 'Guest User', signedIn: false };
  });

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [signInOpen, setSignInOpen] = useState<boolean>(false);
  const [tenantModalOpen, setTenantModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Persistence ────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('trinity_tenants', JSON.stringify(tenants)); }, [tenants]);
  useEffect(() => { localStorage.setItem('trinity_chat_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('trinity_active_session_map', JSON.stringify(activeSessionMap)); }, [activeSessionMap]);
  useEffect(() => { localStorage.setItem('trinity_user_profile', JSON.stringify(user)); }, [user]);

  // ── Restore session from server cookie (Google OAuth redirect flow) ─────────
  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserProfile | null) => {
        if (data && data.signedIn) {
          setUser(data);
          localStorage.setItem('trinity_user_profile', JSON.stringify(data));
          setShowLanding(false);
        }
      })
      .catch(() => { /* api/me not available in dev; ignore */ });
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────
  const currentTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const activeSessionId = activeSessionMap[activeTenantId] ?? null;
  const currentTenantSessions = sessions.filter((s) => s.tenantId === currentTenant.id);
  const activeSession = currentTenantSessions.find((s) => s.id === activeSessionId);
  const currentMessages = activeSession?.messages ?? [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLandingEnter = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('trinity_user_profile', JSON.stringify(profile));
    localStorage.setItem('trinity_landing_dismissed', 'true');
    setActiveTenantId('gnosis');
    setShowLanding(false);
  };

  const handleLogout = () => {
    const clearedUser: UserProfile = { name: 'Guest User', signedIn: false };
    setUser(clearedUser);
    localStorage.removeItem('trinity_user_profile');
    localStorage.removeItem('trinity_landing_dismissed');
    setShowLanding(true);
    // Also hit server logout if available
    fetch('/api/auth/logout').catch(() => {});
  };

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
    setActiveSessionMap((prev) => ({ ...prev, [activeTenantId]: sessionId }));
  };

  const handleNewSession = () => {
    setCurrentView('chat');
    setActiveSessionMap((prev) => ({ ...prev, [activeTenantId]: null }));
  };

  const handleClearHistory = () => {
    if (window.confirm(`Clear all history for ${currentTenant.name}?`)) {
      setSessions((prev) => prev.filter((s) => s.tenantId !== currentTenant.id));
      setActiveSessionMap((prev) => ({ ...prev, [currentTenant.id]: null }));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionMap((prev) => ({ ...prev, [activeTenantId]: null }));
    }
  };

  const handleAddTenant = (newTenant: Tenant) => {
    setTenants((prev) => [...prev, newTenant]);
    setActiveTenantId(newTenant.id);
    setActiveSessionMap((prev) => ({ ...prev, [newTenant.id]: null }));
  };

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    let sessionId = activeSessionId;
    let updatedSessions = [...sessions];

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: now,
      attachments,
    };

    let targetSession = updatedSessions.find(
      (s) => s.id === sessionId && s.tenantId === currentTenant.id,
    );

    if (!targetSession) {
      const newSessionId = `session_${currentTenant.id}_${Date.now()}`;
      const title = content.length > 30 ? content.slice(0, 30) + '...' : content;
      targetSession = {
        id: newSessionId,
        tenantId: currentTenant.id,
        userEmail: user.email,           // ← tag session with signed-in email
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
        s.id === sessionId ? targetSession! : s,
      );
    }

    setSessions(updatedSessions);
    setActiveSessionMap((prev) => ({ ...prev, [currentTenant.id]: sessionId }));
    setIsLoading(true);

    try {
      const hasImages = userMessage.attachments?.some((a) => a.type === 'image');
      const selectedModel = hasImages
        ? currentTenant.visionModel ?? '@cf/meta/llama-3.2-11b-vision-instruct'
        : currentTenant.primaryModel ?? '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

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

      if (!response.ok) throw new Error(data.error ?? 'Failed to get AI response');

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s,
        ),
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Please verify credentials.';
      const errMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠ Issue communicating with ${currentTenant.name}: ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, messages: [...s.messages, errMessage] } : s,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (showLanding) {
    return (
      <LandingPage
        onSignIn={handleLandingEnter}
      />
    );
  }

  return (
    <div className="h-dvh w-screen flex flex-col overflow-hidden bg-[#FAF7F2] font-sans text-slate-800">
      <Navbar
        tenants={tenants}
        activeTenantId={activeTenantId}
        onSelectTenant={handleSelectTenant}
        onOpenAddTenant={() => setTenantModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      <div className="h-[46px] shrink-0" />

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
              onToggleSidebar={() => setSidebarOpen((p) => !p)}
            />
          ) : (
            <>
              <Header
                tenant={currentTenant}
                onToggleSidebar={() => setSidebarOpen((p) => !p)}
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

      <SignInModal
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignInSuccess={(profile) => {
          setUser(profile);
          setShowLanding(false);
        }}
      />

      <TenantModal
        isOpen={tenantModalOpen}
        onClose={() => setTenantModalOpen(false)}
        onAddTenant={handleAddTenant}
      />
    </div>
  );
};

export default App;
