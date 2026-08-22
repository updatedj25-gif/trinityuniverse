import React, { useState, useEffect } from "react";
import { Tenant, ChatSession, ChatMessage, UserProfile, Attachment } from "./types";
import { INITIAL_TENANTS } from "./data/tenants";
import { DEFAULT_INITIAL_SESSIONS } from "./data/defaultSessions";
import { Navbar } from "./components/Navbar";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { LibraryPage } from "./components/LibraryPage";
import { LandingPage } from "./components/LandingPage";
import { FaceSwapStudio } from "./components/FaceSwapStudio";
import { SignInModal } from "./components/SignInModal";
import { TenantModal } from "./components/TenantModal";

const App: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const saved = localStorage.getItem("trinity_tenants");
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch { return INITIAL_TENANTS; }
  });

  const [activeTenantId, setActiveTenantId] = useState<string>("gnosis");
  const [currentView, setCurrentView] = useState<"chat" | "library" | "faceswap">("chat");

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("trinity_user_profile");
      return saved ? JSON.parse(saved) : { name: "Guest User", email: "", signedIn: false };
    } catch { return { name: "Guest User", email: "", signedIn: false }; }
  });

  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem("trinity_landing_dismissed");
      if (dismissed === "true") return false;
      const raw = localStorage.getItem("trinity_user_profile");
      if (raw) {
        const p: UserProfile = JSON.parse(raw);
        if (p.signedIn) return false;
      }
    } catch { /* */ }
    return true;
  });

  // ── Call /api/me to check active Google OAuth cookie ───────────────────────
  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (data && (data.signedIn || data.email)) {
          const profile: UserProfile = {
            name: data.name || data.email || "Trinity User",
            email: data.email || "",
            avatarUrl: data.avatarUrl || data.picture || "",
            signedIn: true,
          };
          setUser(profile);
          localStorage.setItem("trinity_user_profile", JSON.stringify(profile));
          localStorage.setItem("trinity_landing_dismissed", "true");
          setShowLanding(false);
        }
      })
      .catch(() => {});
  }, []);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const LEGACY_IDS = new Set([
      "session_gnosis_welcome",
      "session_yada_welcome",
      "session_gnosis_default",
      "session_yada_default",
    ]);
    try {
      const saved = localStorage.getItem("trinity_sessions");
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        const cleaned = parsed.filter((s) => !LEGACY_IDS.has(s.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem("trinity_sessions", JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch { /* */ }
    return DEFAULT_INITIAL_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSignInOpen, setIsSignInOpen] = useState<boolean>(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];
  const activeSession = sessions.find((s) => s.id === activeSessionId && s.tenantId === activeTenant.id);

  useEffect(() => {
    localStorage.setItem("trinity_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const handleSelectTenant = (id: string) => {
    setActiveTenantId(id);
    setActiveSessionId(null);
    setCurrentView("chat");
  };

  const handleNewSession = () => {
    const now = new Date().toISOString();
    const newSession: ChatSession = {
      id: "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      title: "New Conversation",
      tenantId: activeTenant.id,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentView("chat");
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    let targetSessionId = activeSessionId;
    const now = new Date().toISOString();

    if (!targetSessionId) {
      const newSession: ChatSession = {
        id: "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        title: text.slice(0, 30) || "New Conversation",
        tenantId: activeTenant.id,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      targetSessionId = newSession.id;
    }

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now() + "_user",
      role: "user",
      content: text,
      timestamp: now,
      attachments,
    };

    const assistantMsgId = "msg_" + Date.now() + "_assistant";
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      status: "Analyzing prompt...",
      sandboxLogs: [],
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? { ...s, messages: [...s.messages, userMsg, initialAssistantMsg], updatedAt: now }
          : s
      )
    );

    setIsLoading(true);

    try {
      const activeMessages = (sessions.find((s) => s.id === targetSessionId)?.messages || []).concat(userMsg);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: activeMessages,
          tenantId: activeTenant.id,
          systemInstruction: activeTenant.systemInstruction,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to the orchestrator.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";
      const sandboxLogs: any[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const line = block.trim();
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.replace(/^data: /, "").trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === "status") {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === targetSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, status: data.message || data.status }
                            : m
                        ),
                      }
                    : s
                )
              );
            } else if (data.type === "sandbox_result" && data.execution) {
              sandboxLogs.push(data.execution);
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === targetSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, sandboxLogs: [...sandboxLogs] }
                            : m
                        ),
                      }
                    : s
                )
              );
            } else if (data.type === "text") {
              accumulatedText = data.text || (accumulatedText + (data.chunk || ""));
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === targetSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, content: accumulatedText, status: undefined }
                            : m
                        ),
                      }
                    : s
                )
              );
            } else if (data.type === "done") {
              accumulatedText = data.text || accumulatedText;
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === targetSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, content: accumulatedText || "Execution completed.", status: undefined }
                            : m
                        ),
                      }
                    : s
                )
              );
            } else if (data.type === "error") {
              accumulatedText = accumulatedText || (data.error || "An error occurred during execution.");
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === targetSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, content: accumulatedText, status: undefined }
                            : m
                        ),
                      }
                    : s
                )
              );
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: "Sorry, I encountered an issue connecting to the sandbox engine.", status: undefined }
                    : m
                ),
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear all conversation history for this persona?")) {
      setSessions((prev) => prev.filter((s) => s.tenantId !== activeTenant.id));
      setActiveSessionId(null);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleLogout = async () => {
    try {
      await fetch("/auth/logout");
    } catch {}
    const defaultUser: UserProfile = { name: "Guest User", email: "", signedIn: false };
    setUser(defaultUser);
    localStorage.removeItem("trinity_user_profile");
    localStorage.removeItem("trinity_landing_dismissed");
    setShowLanding(true);
  };

  if (showLanding) {
    return (
      <LandingPage
        onSignIn={(profile: UserProfile) => {
          setUser(profile);
          localStorage.setItem("trinity_user_profile", JSON.stringify(profile));
          localStorage.setItem("trinity_landing_dismissed", "true");
          setShowLanding(false);
        }}
        onVisitLibrary={() => {
          localStorage.setItem("trinity_landing_dismissed", "true");
          setShowLanding(false);
          setCurrentView("library");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FDFBF7] text-slate-800 overflow-hidden font-sans">
      <Navbar
        tenants={tenants}
        activeTenantId={activeTenantId}
        onSelectTenant={handleSelectTenant}
        onOpenAddTenant={() => setIsTenantModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          tenant={activeTenant}
          sessions={sessions}
          activeSessionId={activeSessionId}
          currentView={currentView}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setCurrentView("chat");
          }}
          onNewSession={handleNewSession}
          onOpenLibrary={() => setCurrentView("library")}
          onOpenFaceSwap={() => setCurrentView("faceswap")}
          onClearHistory={handleClearHistory}
          onDeleteSession={handleDeleteSession}
          user={user}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-[#FDFBF7] overflow-hidden">
          <Header
            tenant={activeTenant}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onNewChat={handleNewSession}
          />

          {currentView === "faceswap" ? (
            <FaceSwapStudio tenant={activeTenant} />
          ) : currentView === "library" ? (
            <LibraryPage
              onGoHome={() => setCurrentView("chat")}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          ) : (
            <ChatArea
              tenant={activeTenant}
              messages={activeSession ? activeSession.messages : []}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>

      {isSignInOpen && (
        <SignInModal
          isOpen={isSignInOpen}
          onClose={() => setIsSignInOpen(false)}
          onSignInSuccess={(profile: UserProfile) => {
            setUser(profile);
            localStorage.setItem("trinity_user_profile", JSON.stringify(profile));
            localStorage.setItem("trinity_landing_dismissed", "true");
            setShowLanding(false);
            setIsSignInOpen(false);
          }}
        />
      )}

      {isTenantModalOpen && (
        <TenantModal
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
          onAddTenant={(newTenant: Tenant) => {
            const updated = [...tenants, newTenant];
            setTenants(updated);
            localStorage.setItem("trinity_tenants", JSON.stringify(updated));
            setIsTenantModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
