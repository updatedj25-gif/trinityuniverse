import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Sparkles, Code2, Cpu, Brain, Flame, Zap, ShieldCheck, Compass, BarChart3, LineChart } from 'lucide-react';

const TRINITY_LOGO =
  'https://image2url.com/r2/default/images/1767183581317-68102f31-454b-45f6-9d39-025ce8604ac3.png';

export interface GnosisCard {
  id: string;
  badge: string;
  title: string;
  promptText: string;
  icon: React.ReactNode;
  bgGradient: string;
  accentColor: string;
  chatUserMsg: string;
  chatAiResponse: {
    heading: string;
    body: string;
    tag?: string;
    codeSnippet?: string;
    bullets?: string[];
  };
}

export const GNOSIS_CARDS: GnosisCard[] = [
  {
    id: 'fullstack-arch',
    badge: 'Gnosis AI • Code Architecture',
    title: 'Full-Stack Web Architect',
    promptText: 'Design a high-throughput real-time WebSocket architecture with TypeScript',
    icon: <Code2 className="w-4 h-4 text-sky-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #1e3a8a 0%, #0f172a 70%, #020617 100%)',
    accentColor: '#38bdf8',
    chatUserMsg: 'Design a high-throughput real-time WebSocket architecture with TypeScript',
    chatAiResponse: {
      heading: 'Event-Driven WebSocket Gateway Strategy',
      body: 'Utilizing a distributed pub/sub broker with persistent connection pools:',
      codeSnippet: 'const gateway = new RealtimeGateway({ poolSize: 10000, HeartbeatMs: 5000 });\ngateway.subscribe("telemetry", (payload) => processEvent(payload));',
      bullets: [
        'Zero-copy payload parsing with Protocol Buffers',
        'Automatic connection fallback & heartbeat sync',
        'Sub-millisecond broadcast latency across clusters',
      ],
    },
  },
  {
    id: 'market-intel',
    badge: 'Gnosis AI • Deep Research',
    title: 'Quantum & AI Market Intelligence',
    promptText: 'Analyze key global shifts in quantum hardware and AI acceleration for 2026',
    icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #065f46 0%, #022c22 70%, #020617 100%)',
    accentColor: '#34d399',
    chatUserMsg: 'Analyze key global shifts in quantum hardware and AI acceleration for 2026',
    chatAiResponse: {
      heading: '2026 Quantum-Classical Hybrid Analysis',
      body: 'Enterprise adoption is pivoting toward hybrid fault-tolerant processing:',
      bullets: [
        'Photonic quantum interconnects reducing latency by 42%',
        'On-device neural inference engines replacing cloud dependencies',
        'Capital allocation shifting heavily toward post-quantum encryption',
      ],
    },
  },
  {
    id: 'philosophical-synthesis',
    badge: 'Gnosis AI • Philosophy',
    title: 'Epistemological Synthesis',
    promptText: 'Explain constructivist epistemology and its implications on synthetic minds',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #581c87 0%, #3b0764 70%, #020617 100%)',
    accentColor: '#c084fc',
    chatUserMsg: 'Explain constructivist epistemology and its implications on synthetic minds',
    chatAiResponse: {
      heading: 'Knowledge Construction in Autonomous Models',
      body: 'Constructivism posits that knowledge is actively synthesized rather than passively recorded:',
      bullets: [
        'Models construct internal representations via iterative environment interaction',
        'Truth emerges from coherent constraint satisfaction rather than direct mirroring',
        'Self-correcting inference loops mirror human cognitive development',
      ],
    },
  },
  {
    id: 'code-debug',
    badge: 'Gnosis AI • Debugging Engine',
    title: 'Distributed Race Debugger',
    promptText: 'Fix concurrent mutation race condition in async distributed state synchronization',
    icon: <Cpu className="w-4 h-4 text-amber-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #78350f 0%, #451a03 70%, #020617 100%)',
    accentColor: '#fbbf24',
    chatUserMsg: 'Fix concurrent mutation race condition in async distributed state synchronization',
    chatAiResponse: {
      heading: 'Optimistic Concurrency Control Applied',
      body: 'Identified dirty read during state propagation across nodes:',
      codeSnippet: '// Implemented Vector Clock guard\nif (incomingClock.isConcurrent(localClock)) {\n  return resolveCRDTConflict(localState, incomingState);\n}',
      bullets: ['Applied State-based CRDTs for seamless convergence', 'Eliminated mutex lock bottlenecks'],
    },
  },
  {
    id: 'creative-prose',
    badge: 'Gnosis AI • Creative Thought',
    title: 'Speculative Sci-Fi Worldbuilding',
    promptText: 'Draft an evocative opening scene exploring first light on a mega-structure Dyson Swarm',
    icon: <Sparkles className="w-4 h-4 text-pink-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #831843 0%, #500724 70%, #020617 100%)',
    accentColor: '#f472b6',
    chatUserMsg: 'Draft an evocative opening scene exploring first light on a mega-structure Dyson Swarm',
    chatAiResponse: {
      heading: 'Excerpt: "The Solar Lattice"',
      body: '"A trillion mirrors caught the solar flare simultaneously, igniting the dark void in an orchestrated aurora of golden energy. Below us, the habitat ring hummed with three billion lives, shielded beneath blue vector plasma..."',
    },
  },
  {
    id: 'strategic-growth',
    badge: 'Gnosis AI • Business Strategy',
    title: 'Decentralized Protocol Scale',
    promptText: 'Formulate a 4-phase tokenomics and liquidity bootstrap strategy for an AI marketplace',
    icon: <LineChart className="w-4 h-4 text-cyan-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #164e63 0%, #083344 70%, #020617 100%)',
    accentColor: '#22d3ee',
    chatUserMsg: 'Formulate a 4-phase tokenomics and liquidity bootstrap strategy for an AI marketplace',
    chatAiResponse: {
      heading: '4-Phase Scaling & Staking Framework',
      body: 'Designed to balance initial node incentives with long-term deflationary utility:',
      bullets: [
        'Phase 1: Zero-fee liquidity seeding for compute providers',
        'Phase 2: Staking tier activation for priority model inference routing',
        'Phase 3: Governance transition & protocol revenue buyback pool',
      ],
    },
  },
  {
    id: 'math-proof',
    badge: 'Gnosis AI • Mathematics',
    title: 'Non-Linear Fluid Mechanics',
    promptText: 'Derive non-linear Navier-Stokes approximation boundary limits for turbulent flow',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #881337 0%, #4c0519 70%, #020617 100%)',
    accentColor: '#fb7185',
    chatUserMsg: 'Derive non-linear Navier-Stokes approximation boundary limits for turbulent flow',
    chatAiResponse: {
      heading: 'Turbulent Kinetic Energy Dissipation Bound',
      body: 'Assessing energy cascade at sub-grid scales using LES formulation:',
      codeSnippet: 'E(k) = C_k * ε^(2/3) * k^(-5/3)\n// Convergence verified for Re > 10^6',
      bullets: ['Rigorous energy conservation boundary confirmed', 'Sub-grid eddy viscosity calibrated'],
    },
  },
  {
    id: 'ai-governance',
    badge: 'Gnosis AI • Safety & Ethics',
    title: 'AI Governance & Guardrails',
    promptText: 'Develop a zero-latency safety moderation guardrail system for LLM streaming outputs',
    icon: <ShieldCheck className="w-4 h-4 text-teal-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #115e59 0%, #042f2e 70%, #020617 100%)',
    accentColor: '#2dd4bf',
    chatUserMsg: 'Develop a zero-latency safety moderation guardrail system for LLM streaming outputs',
    chatAiResponse: {
      heading: 'Stream-Level Token Inspector Guard',
      body: 'Pipelined regex + micro-classifier running in parallel with token generation:',
      bullets: [
        'Sub-5ms token inspection window before client stream buffer release',
        'Automated red-teaming probe generation',
        'Contextual toxicity & hallucination confidence scoring',
      ],
    },
  },
  {
    id: 'peak-performance',
    badge: 'Gnosis AI • Cognitive Science',
    title: 'Executive Focus System',
    promptText: 'Structure an optimal 12-week cognitive performance protocol for complex problem solving',
    icon: <Zap className="w-4 h-4 text-indigo-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #312e81 0%, #1e1b4b 70%, #020617 100%)',
    accentColor: '#818cf8',
    chatUserMsg: 'Structure an optimal 12-week cognitive performance protocol for complex problem solving',
    chatAiResponse: {
      heading: 'Circadian Ultradian Focus Protocol',
      body: 'Synchronizing deep work blocks with natural neurochemical cycles:',
      bullets: [
        '90-minute hyper-focus sprints aligned with dopamine baseline peaks',
        'Zone-2 aerobic recovery sessions to boost brain-derived neurotrophic factor (BDNF)',
        'Deliberate cold exposure & light exposure timing for metabolic optimization',
      ],
    },
  },
];

// Helper to normalize offset loop
function wrapOffset(raw: number, total: number): number {
  let d = raw % total;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

const GOOGLE_SVG = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

interface LandingPageProps {
  onSignIn: (profile: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Typewriter effect state for stationary floating input box
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const totalCards = GNOSIS_CARDS.length;

  const goToSlide = useCallback(
    (idx: number) => {
      if (animating || idx === activeSlide) return;
      setAnimating(true);
      setActiveSlide((idx + totalCards) % totalCards);
      setTimeout(() => setAnimating(false), 450);
    },
    [animating, activeSlide, totalCards]
  );

  const goNext = useCallback(() => {
    goToSlide((activeSlide + 1) % totalCards);
  }, [activeSlide, goToSlide, totalCards]);

  const goPrev = useCallback(() => {
    goToSlide((activeSlide - 1 + totalCards) % totalCards);
  }, [activeSlide, goToSlide, totalCards]);

  // Handle Typewriter effect whenever activeSlide changes:
  // Prompt types fully first, then answer reveals, then auto-advances
  useEffect(() => {
    const targetPrompt = GNOSIS_CARDS[activeSlide].promptText;
    setTypedText('');
    setIsTyping(true);
    setShowAnswer(false);

    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx <= targetPrompt.length) {
        setTypedText(targetPrompt.slice(0, charIdx));
        charIdx++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        // Reveal AI answer after prompt is fully written
        setTimeout(() => {
          setShowAnswer(true);
        }, 200);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [activeSlide]);

  // Auto-advance slide 6.5s after slide activation (allows full prompt typing + reading response)
  useEffect(() => {
    const t = setTimeout(goNext, 6500);
    return () => clearTimeout(t);
  }, [activeSlide, goNext]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 35) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const handleGoogleSignIn = () => {
    window.location.href = '/auth/google';
  };

  const handleGuestEntry = () => {
    onSignIn({ name: 'Guest', signedIn: false });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FAF7F2] text-slate-800 overflow-hidden select-none font-sans">
      {/* Background bright morning sky ambient lighting & soft warm glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Morning sunrise warm amber glow */}
        <div
          className="absolute top-[-15%] left-[10%] w-[600px] h-[600px] bg-amber-200/40 rounded-full blur-[140px]"
        />
        {/* Morning fresh sky blue aura */}
        <div
          className="absolute top-[-10%] right-[5%] w-[650px] h-[650px] bg-sky-200/50 rounded-full blur-[150px]"
        />
        {/* Soft dawn rose/lavender glow */}
        <div className="absolute bottom-[-10%] left-[25%] w-[500px] h-[500px] bg-indigo-100/60 rounded-full blur-[140px]" />

        {/* Subtle grid mesh pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(0, 0, 0, 0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* ── Top Bar ── */}
      <header className="w-full px-6 pt-5 pb-2 flex items-center justify-between z-20 relative shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src={TRINITY_LOGO}
            alt="Trinity Universe"
            className="w-7 h-7 object-contain animate-breathe"
          />
          <span className="text-xs font-bold tracking-[0.2em] text-slate-800 uppercase">
            TRINITY UNIVERSE
          </span>
        </div>

        <div className="text-[11px] font-medium text-slate-600 bg-white/80 border border-slate-200 px-3.5 py-1 rounded-full shadow-sm backdrop-blur-md hidden sm:block">
          Gnosis AI Studio • 9 Interactive Models
        </div>
      </header>

      {/* ── Subtitle Header (Moved down with generous spacing) ── */}
      <div className="text-center px-4 mt-2 mb-4 sm:mb-6 z-10 relative shrink-0">
        <p className="text-xs sm:text-sm font-medium text-slate-600 tracking-wide max-w-xl mx-auto">
          Explore multi-agent reasoning, deep research, and real-time synthesis.
        </p>
      </div>

      {/* ── Slider Motion Section with 9 Gnosis AI Cards (Stepped down) ── */}
      <div
        className="relative w-full flex-1 min-h-[310px] max-h-[430px] my-auto flex items-center justify-center overflow-hidden z-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {GNOSIS_CARDS.map((card, i) => {
          const d = wrapOffset(i - activeSlide, totalCards);
          const isActive = d === 0;

          // Display offsets up to 2 cards left and 2 cards right (-2, -1, 0, 1, 2)
          const isVisible = Math.abs(d) <= 2;

          if (!isVisible) return null;

          // X translation calculation:
          // Center card at 0%, 1-step at +-58%, 2-step at +-105%
          let stepX = 0;
          if (d === 1) stepX = 58;
          else if (d === -1) stepX = -58;
          else if (d === 2) stepX = 105;
          else if (d === -2) stepX = -105;

          const scale = isActive ? 1 : Math.abs(d) === 1 ? 0.82 : 0.68;
          const opacity = isActive ? 1 : Math.abs(d) === 1 ? 0.6 : 0.25;
          const blur = isActive ? 0 : Math.abs(d) === 1 ? 4 : 8;
          const zIndex = isActive ? 10 : 5 - Math.abs(d);

          return (
            <div
              key={card.id}
              onClick={() => !isActive && goToSlide(i)}
              style={{
                position: 'absolute',
                width: 'min(88%, 380px)',
                height: '84%',
                maxHeight: '340px',
                left: '50%',
                top: '48%',
                transform: `translate(calc(-50% + ${stepX}%), -50%) scale(${scale})`,
                opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                transition:
                  'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.55s ease, filter 0.55s ease',
                zIndex,
                cursor: isActive ? 'default' : 'pointer',
                borderRadius: '20px',
                background: card.bgGradient,
                border: isActive
                  ? `1px solid ${card.accentColor}60`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isActive
                  ? `0 20px 45px rgba(15, 23, 42, 0.35), 0 0 25px ${card.accentColor}30`
                  : '0 10px 25px rgba(0, 0, 0, 0.2)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
              className="group select-none"
            >
              {/* Card Header Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md shrink-0"
                    style={{ color: card.accentColor }}
                  >
                    {card.icon}
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-200 tracking-wider truncate">
                    {card.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9.5px] text-slate-300 font-mono">LIVE</span>
                </div>
              </div>

              {/* Card Content Area (Simulated AI Response Box) */}
              <div className="flex-1 overflow-hidden flex flex-col justify-start space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug truncate">
                  {card.title}
                </h3>

                {/* Simulated AI Chat Response Display (reveals smoothly after prompt finishes typing) */}
                <div
                  className={`bg-slate-950/75 border border-white/10 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1.5 backdrop-blur-sm transition-all duration-500 overflow-hidden ${
                    isActive && showAnswer
                      ? 'opacity-100 translate-y-0'
                      : isActive
                      ? 'opacity-30 translate-y-1'
                      : 'opacity-90 translate-y-0'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: card.accentColor }}
                    />
                    <span className="truncate">{card.chatAiResponse.heading}</span>
                  </div>

                  <p className="text-slate-300/90 text-[10.5px] leading-relaxed line-clamp-2">
                    {card.chatAiResponse.body}
                  </p>

                  {/* Code snippet if available */}
                  {card.chatAiResponse.codeSnippet && (
                    <pre className="bg-black/70 border border-slate-800 text-[9.5px] text-sky-300 p-1.5 rounded-lg font-mono overflow-x-auto whitespace-pre-wrap leading-tight max-h-[50px]">
                      {card.chatAiResponse.codeSnippet}
                    </pre>
                  )}

                  {/* Bullet insights if available */}
                  {card.chatAiResponse.bullets && (
                    <ul className="space-y-0.5 pl-0.5">
                      {card.chatAiResponse.bullets.slice(0, 2).map((b, idx) => (
                        <li key={idx} className="flex items-start gap-1 text-[10px] text-slate-300 truncate">
                          <span className="text-sky-400">•</span>
                          <span className="truncate">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Card Footer accent glow */}
              <div className="pt-1.5 flex items-center justify-between text-[9.5px] text-slate-400 shrink-0 border-t border-white/10 mt-1.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" style={{ color: card.accentColor }} />
                  Gnosis Engine v3.6
                </span>
                <span className="text-slate-400 font-mono">
                  {showAnswer ? '0.04s response' : 'Synthesizing...'}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── Stationary Floating Input Box (2-line capacity for mobile & desktop) ── */}
        <div className="absolute bottom-1 sm:bottom-3 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-30 pointer-events-auto">
          <div className="bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-xl flex items-start justify-between gap-2.5 transition-all min-h-[58px]">
            <div className="flex items-start gap-2 flex-1 min-w-0 pt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse mt-0.5" />
              <div className="flex-1 min-w-0 text-xs text-slate-200 font-mono leading-relaxed line-clamp-2 min-h-[34px]">
                <span>{typedText}</span>
                <span
                  className={`inline-block w-1.5 h-3.5 ml-0.5 bg-sky-400 align-middle ${
                    isTyping ? 'opacity-100' : 'animate-pulse'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dot Indicators ── */}
      <div className="flex items-center justify-center gap-1.5 mt-1 mb-2 z-10 shrink-0">
        {GNOSIS_CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className="cursor-pointer transition-all duration-300 p-1"
            title={`Slide ${i + 1}`}
          >
            <div
              style={{
                width: i === activeSlide ? '22px' : '6px',
                height: '6px',
                borderRadius: '999px',
                background:
                  i === activeSlide
                    ? GNOSIS_CARDS[i].accentColor
                    : 'rgba(0, 0, 0, 0.2)',
              }}
            />
          </button>
        ))}
      </div>

      {/* ── Primary Action Call-to-Action ── */}
      <div className="flex flex-col items-center gap-2 px-6 mb-5 mt-1 z-10 relative shrink-0">
        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full max-w-sm py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]"
        >
          {GOOGLE_SVG}
          <span>Continue with Google</span>
        </button>

        {/* Guest access option */}
        <button
          onClick={handleGuestEntry}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer underline underline-offset-2 py-0.5"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
};
