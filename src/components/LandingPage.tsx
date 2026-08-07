import React, { useState, useEffect, useCallback, useRef } from 'react';

// Extend Window to include the Google Identity Services SDK loaded from CDN
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          prompt: (cb: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
      };
    };
  }
}
import { UserProfile } from '../types';
import { ArrowLeft, ArrowRight, Sparkles, Code2, Cpu, Brain, Flame, Zap, ShieldCheck, Compass, BarChart3, LineChart, BookOpen, Download, ShoppingCart, X } from 'lucide-react';

const TRINITY_LOGO =
  'https://image2url.com/r2/default/images/1767183581317-68102f31-454b-45f6-9d39-025ce8604ac3.png';

export interface GnosisCard {
  id: string;
  badge: string;
  title: string;
  promptText: string;
  icon?: React.ReactNode;
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
  // 1. Gnosis 1
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
  // 2. Yada 1
  {
    id: 'tarot-archetypes',
    badge: '✦ Yada Guide • Archetypal Tarot',
    title: 'Tarot Spread & Archetypal Guidance',
    promptText: 'Draw a 3-card spread exploring current life transitions and hidden opportunities',
    bgGradient: 'radial-gradient(ellipse at top left, #78350f 0%, #451a03 70%, #020617 100%)',
    accentColor: '#f59e0b',
    chatUserMsg: 'Draw a 3-card spread exploring current life transitions and hidden opportunities',
    chatAiResponse: {
      heading: 'The Star, The Chariot & The High Priestess',
      body: 'Your journey reveals a transition from deep internal reflection toward bold creative action:',
      bullets: [
        'The Star (Past): Renewed hope & spiritual clarity guiding your foundation',
        'The Chariot (Present): Harnessing opposing forces with focused momentum',
        'High Priestess (Future): Trusting intuitive wisdom over outer noise',
      ],
    },
  },
  // 3. Gnosis 2
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
  // 4. Yada 2
  {
    id: 'astrology-transits',
    badge: '✦ Yada Guide • Celestial Astrology',
    title: 'Astrology & Natal Transit Reading',
    promptText: 'Analyze the upcoming Saturn-Neptune alignment for personal growth and alignment',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #581c87 0%, #3b0764 70%, #020617 100%)',
    accentColor: '#d8b4fe',
    chatUserMsg: 'Analyze the upcoming Saturn-Neptune alignment for personal growth and alignment',
    chatAiResponse: {
      heading: 'Bridging Dreams (Neptune) with Structure (Saturn)',
      body: 'This rare cosmic transit invites grounding spiritual visions into tangible real-world creations:',
      bullets: [
        'Saturn demands disciplined practice and clear boundaries',
        'Neptune dissolves outdated illusions to unlock creative inspiration',
        'Focus on building sustainable habits for long-term vision',
      ],
    },
  },
  // 5. Gnosis 3
  {
    id: 'philosophical-synthesis',
    badge: 'Gnosis AI • Philosophy',
    title: 'Epistemological Synthesis',
    promptText: 'Explain constructivist epistemology and its implications on synthetic minds',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #4c1d95 0%, #2e1065 70%, #020617 100%)',
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
  // 6. Yada 3
  {
    id: 'somatic-meditation',
    badge: '✦ Yada Guide • Mindfulness & Breathwork',
    title: 'Somatic Breathwork & Calm Engine',
    promptText: 'Guide me through a 5-minute grounding breathwork session for anxiety relief',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    bgGradient: 'radial-gradient(ellipse at top left, #064e3b 0%, #022c22 70%, #020617 100%)',
    accentColor: '#6ee7b7',
    chatUserMsg: 'Guide me through a 5-minute grounding breathwork session for anxiety relief',
    chatAiResponse: {
      heading: 'Box Breathing Cadence (4-4-4-4)',
      body: 'Inhale peace for 4s • Hold in stillness for 4s • Exhale tension for 4s • Rest in clarity for 4s',
      bullets: [
        'Calms parasympathetic nervous system within 90 seconds',
        'Lowers physiological stress responses & mental chatter',
        'Restores center of presence and somatic calm',
      ],
    },
  },
  // 7. Gnosis 4
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
      codeSnippet: '// Vector Clock guard implementation\nif (incomingClock.isConcurrent(localClock)) {\n  return resolveCRDTConflict(localState, incomingState);\n}',
      bullets: ['Applied State-based CRDTs for seamless convergence', 'Eliminated mutex lock bottlenecks'],
    },
  },
  // 8. Yada 4
  {
    id: 'stoic-wisdom',
    badge: '✦ Yada Guide • Ancient Philosophy',
    title: 'Stoic Wisdom & Inner Resilience',
    promptText: 'How can Marcus Aurelius teachings on control bring clarity to modern burnout?',
    icon: <Sparkles className="w-4 h-4 text-amber-300" />,
    bgGradient: 'radial-gradient(ellipse at top left, #854d0e 0%, #3f2305 70%, #020617 100%)',
    accentColor: '#fde047',
    chatUserMsg: 'How can Marcus Aurelius teachings on control bring clarity to modern burnout?',
    chatAiResponse: {
      heading: 'Dichotomy of Control & Inner Citadel',
      body: '"You have power over your mind - not outside events. Realize this, and you will find strength."',
      bullets: [
        'Focus strictly on effort, reaction, and personal integrity',
        'Release attachment to external outcomes & perceived expectations',
        'Cultivate inner quietude amidst daily chaos',
      ],
    },
  },
  // 9. Gnosis 5
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
  // 10. Yada 5
  {
    id: 'dream-symbolism',
    badge: '✦ Yada Guide • Dream Wisdom',
    title: 'Symbolic Dream Interpretation',
    promptText: 'Interpret a recurring dream about walking through water-filled ancient corridors',
    icon: <Sparkles className="w-4 h-4 text-indigo-300" />,
    bgGradient: 'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
    accentColor: '#818cf8',
    chatUserMsg: 'Interpret a recurring dream about walking through water-filled ancient corridors',
    chatAiResponse: {
      heading: 'Navigating the Subconscious Waters',
      body: 'Water represents emotional depth and intuition, while ancient corridors represent innate wisdom:',
      bullets: [
        'Submerged pathways signal unprocessed emotional shifts longing for expression',
        'Ancient stone pillars reflect enduring personal resilience',
        'Encourages navigating unfamiliar feelings with curiosity and grace',
      ],
    },
  },
  // 11. Gnosis 6
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
  // 12. Yada 6
  {
    id: 'shadow-work',
    badge: '✦ Yada Guide • Shadow Integration',
    title: 'Emotional Alchemy & Healing',
    promptText: 'How do I recognize and gently integrate unacknowledged parts of myself?',
    icon: <Sparkles className="w-4 h-4 text-rose-300" />,
    bgGradient: 'radial-gradient(ellipse at top left, #831843 0%, #4c0519 70%, #020617 100%)',
    accentColor: '#fda4af',
    chatUserMsg: 'How do I recognize and gently integrate unacknowledged parts of myself?',
    chatAiResponse: {
      heading: 'Transforming Disowned Aspects into Strength',
      body: 'Shadow work transforms hidden resistance into wholeness by bringing compassionate awareness:',
      bullets: [
        'Notice strong emotional triggers as mirrors of unmet needs',
        'Replace self-judgment with warm, non-evaluative curiosity',
        'Reclaim repressed vitality and creative self-expression',
      ],
    },
  },
  // 13. Gnosis 7
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
  // 14. Yada 7
  {
    id: 'iching-guidance',
    badge: '✦ Yada Guide • I Ching Divination',
    title: 'I Ching Hexagram Guidance',
    promptText: 'Cast an I Ching reading for guidance on taking a creative career leap',
    icon: <Sparkles className="w-4 h-4 text-teal-300" />,
    bgGradient: 'radial-gradient(ellipse at top left, #115e59 0%, #042f2e 70%, #020617 100%)',
    accentColor: '#2dd4bf',
    chatUserMsg: 'Cast an I Ching reading for guidance on taking a creative career leap',
    chatAiResponse: {
      heading: 'Hexagram 11: Peace (Tai) → Hexagram 42: Increase (Yi)',
      body: 'Harmonious alignment between inner purpose and external opportunity:',
      bullets: [
        'Tai (Peace): Sky and Earth meet; ideal conditions for initiation',
        'Yi (Increase): Generous action yields exponential returns',
        'Move forward with sincerity and steady dedication',
      ],
    },
  },
  // 15. Gnosis 8
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
  // 16. Yada 8
  {
    id: 'chakra-alignment',
    badge: '✦ Yada Guide • Energy Harmony',
    title: 'Chakra Energy & Vitality Alignment',
    promptText: 'Provide a daily chakra balancing routine to harmonize focus and intuition',
    icon: <Sparkles className="w-4 h-4 text-fuchsia-300" />,
    bgGradient: 'radial-gradient(ellipse at top left, #701a75 0%, #4a044e 70%, #020617 100%)',
    accentColor: '#f0abfc',
    chatUserMsg: 'Provide a daily chakra balancing routine to harmonize focus and intuition',
    chatAiResponse: {
      heading: 'Root-to-Crown Alignment Flow',
      body: 'Sequencing somatic breath and intention to align mental clarity with grounded vitality:',
      bullets: [
        'Root (Muladhara): Grounding contact with physical earth',
        'Heart (Anahata): Open posture releasing chest constriction',
        'Third Eye (Ajna): Visualizing indigo light for sharp intuitive focus',
      ],
    },
  },
  // 17. Gnosis 9
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
  // 18. Yada 9
  {
    id: 'soul-journaling',
    badge: '✦ Yada Guide • Contemplation',
    title: 'Gratitude & Soul Purpose Journaling',
    promptText: 'Prompt me with 3 contemplative reflections to align with my authentic core',
    icon: <Sparkles className="w-4 h-4 text-amber-300" />,
    bgGradient: 'radial-gradient(ellipse at top left, #92400e 0%, #451a03 70%, #020617 100%)',
    accentColor: '#fbbf24',
    chatUserMsg: 'Prompt me with 3 contemplative reflections to align with my authentic core',
    chatAiResponse: {
      heading: '3 Soul Inquiry Prompts',
      body: 'Reflect deeply on these questions in your quiet morning stillness:',
      bullets: [
        '1. What truth am I ready to honor without needing external validation?',
        '2. Where in my life can I replace force with magnetic ease?',
        '3. What small act of beauty can I offer the world today?',
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

interface LandingBook {
  id: number;
  title: string;
  author: string;
  niche: string;
  cover_filename: string | null;
  file_key: string | null;
  price: number;
  tag: string | null;
  publication_year: number | null;
}

interface LandingPageProps {
  onSignIn: (profile: UserProfile) => void;
  onVisitLibrary: () => void;
  authError?: string | null;
}

// Human-readable messages for OAuth error codes
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied:        'Google sign-in was cancelled. Please try again.',
  invalid_state:        'Session expired during sign-in. Please try again.',
  missing_params:       'Sign-in incomplete — please try again.',
  token_exchange_failed:'Could not complete sign-in. Please try again.',
  profile_fetch_failed: 'Could not load your Google profile. Please try again.',
  incomplete_profile:   'Your Google account is missing required info.',
};

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onVisitLibrary, authError }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [animating, setAnimating] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const wasDragged = useRef(false);
  const libraryTrackRef = useRef<HTMLDivElement | null>(null);
  const libraryDragStartX = useRef<number | null>(null);
  const libraryDragStartScroll = useRef(0);

  // Typewriter effect state for stationary floating input box
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [libraryBooks, setLibraryBooks] = useState<LandingBook[]>([]);
  const [activeLibraryIndex, setActiveLibraryIndex] = useState(0);
  const [selectedBook, setSelectedBook] = useState<LandingBook | null>(null);
  const [bookAddedToCart, setBookAddedToCart] = useState(false);

  const totalCards = GNOSIS_CARDS.length;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/library/catalog')
      .then(response => response.ok ? response.json() : [])
      .then((books: LandingBook[]) => {
        if (!cancelled) setLibraryBooks(books.slice(0, 20));
      })
      .catch(() => {
        if (!cancelled) setLibraryBooks([]);
      });
    return () => { cancelled = true; };
  }, []);

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
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  // Auto-advance slide 8.5s after slide activation (allows full prompt typing + reading response)
  useEffect(() => {
    const t = setTimeout(goNext, 8500);
    return () => clearTimeout(t);
  }, [activeSlide, goNext]);

  // Pointer swipe handling works for touch phones, tablets, iPads, trackpads, and mice.
  const handlePointerStart = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
    wasDragged.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    if (Math.abs(dx) > 35) {
      wasDragged.current = true;
      if (dx < 0) goNext();
      else goPrev();
    }
    pointerStartX.current = null;
  };

  const scrollToLibraryIndex = useCallback((index: number) => {
    const track = libraryTrackRef.current;
    if (!track || libraryBooks.length === 0) return;
    const nextIndex = (index + libraryBooks.length) % libraryBooks.length;
    const card = track.children[nextIndex] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    setActiveLibraryIndex(nextIndex);
  }, [libraryBooks.length]);

  const handleLibraryPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    libraryDragStartX.current = e.clientX;
    libraryDragStartScroll.current = e.currentTarget.scrollLeft;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleLibraryPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (libraryDragStartX.current === null) return;
    e.currentTarget.scrollLeft = libraryDragStartScroll.current - (e.clientX - libraryDragStartX.current);
  };

  const handleLibraryPointerEnd = () => {
    libraryDragStartX.current = null;
  };

  const handleGoogleSignIn = () => {
    const clientId = (import.meta as { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID;
    // Try GIS one-tap popup first; fall back to server-side redirect
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          try {
            const payload = JSON.parse(
              atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            onSignIn({
              name: payload.name || payload.email,
              email: payload.email,
              avatarUrl: payload.picture,
              signedIn: true,
            });
          } catch { /* */ }
        },
      });
      window.google.accounts.id.prompt((n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
        if (n.isNotDisplayed() || n.isSkippedMoment()) {
          window.location.href = '/api/auth/google';
        }
      });
    } else {
      window.location.href = '/api/auth/google';
    }
  };

  const handleGuestEntry = () => {
    onSignIn({ name: 'Guest', signedIn: false });
  };

  const handleBookSelect = (book: LandingBook) => {
    setSelectedBook(book);
    setBookAddedToCart(false);
  };

  const handleBookCart = (book: LandingBook) => {
    if (book.price === 0) return;
    try {
      const saved = localStorage.getItem('trinity_library_cart');
      const cart = saved ? JSON.parse(saved) as LandingBook[] : [];
      if (!cart.some(item => item.id === book.id)) {
        localStorage.setItem('trinity_library_cart', JSON.stringify([...cart, book]));
      }
    } catch {
      localStorage.setItem('trinity_library_cart', JSON.stringify([book]));
    }
    setBookAddedToCart(true);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#FAF7F2] text-slate-800 overflow-x-hidden overflow-y-auto select-none font-sans lg:min-h-[1120px]">
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
      <header className="w-full px-5 sm:px-6 pt-3.5 sm:pt-6 pb-1.5 sm:pb-3 flex items-center justify-between z-20 relative shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={TRINITY_LOGO}
            alt="Trinity Universe"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-md transition-transform hover:scale-105 animate-breathe"
          />
          <span className="text-base sm:text-lg font-black tracking-[0.22em] text-slate-800 uppercase">
            TRINITY UNIVERSE
          </span>
        </div>
      </header>

      {/* ── Auth Error Banner ── shown when Google OAuth returns an error code */}
      {authError && !errorDismissed && (
        <div className="mx-5 sm:mx-8 mb-1 z-20 relative shrink-0">
          <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-xs font-medium shadow-sm">
            <span>
              {AUTH_ERROR_MESSAGES[authError] ?? `Sign-in failed (${authError}). Please try again.`}
            </span>
            <button
              onClick={() => setErrorDismissed(true)}
              className="shrink-0 text-red-400 hover:text-red-600 transition-colors cursor-pointer ml-2"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Section Header & Subtitle (Positioned right above slider cards) ── */}
      <div className="text-center px-4 mt-3 sm:mt-11 mb-0 sm:-mb-1 z-10 relative shrink-0">
        <h2 className="text-[10.5px] sm:text-sm font-extrabold tracking-[0.18em] text-slate-800 uppercase mb-0.5">
          Gnosis Multi-Tenant AI
        </h2>
        <p className="text-[10px] sm:text-xs font-medium text-slate-600 tracking-wide max-w-xl mx-auto">
          Explore multi-agent reasoning, archetypal wisdom, deep research, and spiritual synthesis.
        </p>
      </div>

      {/* ── Slider Motion Section with 18 Alternating Gnosis & Yada Cards ── */}
      <div
        className="relative w-full h-[330px] sm:h-[445px] lg:h-[545px] shrink-0 flex items-center justify-center overflow-hidden z-10 sm:my-2 lg:my-7 touch-pan-y"
        onPointerDown={handlePointerStart}
        onPointerUp={handlePointerEnd}
        onPointerCancel={() => { pointerStartX.current = null; }}
      >
        {GNOSIS_CARDS.map((card, i) => {
          const d = wrapOffset(i - activeSlide, totalCards);
          const isActive = d === 0;

          // Display offsets up to 2 cards left and 2 cards right (-2, -1, 0, 1, 2)
          const isVisible = Math.abs(d) <= 2;

          if (!isVisible) return null;

          // X translation calculation:
          // Center card at 0%, 1-step at +-54%, 2-step at +-100%
          let stepX = 0;
          if (d === 1) stepX = 54;
          else if (d === -1) stepX = -54;
          else if (d === 2) stepX = 100;
          else if (d === -2) stepX = -100;

          const scale = isActive ? 1 : Math.abs(d) === 1 ? 0.8 : 0.65;
          const opacity = isActive ? 1 : Math.abs(d) === 1 ? 0.55 : 0.2;
          const blur = isActive ? 0 : Math.abs(d) === 1 ? 4 : 8;
          const zIndex = isActive ? 10 : 5 - Math.abs(d);

          return (
            <div
              key={card.id}
              onClick={() => !isActive && !wasDragged.current && goToSlide(i)}
              style={{
                position: 'absolute',
                left: '50%',
                 top: isMobile ? '38%' : '42%',
                transform: `translate(calc(-50% + ${stepX}%), -50%) scale(${scale})`,
                opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                transition:
                  'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.55s ease, filter 0.55s ease',
                zIndex,
                cursor: isActive ? 'default' : 'pointer',
                borderRadius: '16px',
                background: card.bgGradient,
                border: isActive
                  ? `1px solid ${card.accentColor}60`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isActive
                  ? `0 14px 36px rgba(15, 23, 42, 0.35), 0 0 20px ${card.accentColor}30`
                  : '0 8px 20px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
              className="gnosis-slide-card group select-none"
            >
              {/* Card Header Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] sm:text-[10.5px] font-semibold text-slate-200 tracking-wider truncate">
                    {card.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] sm:text-[9.5px] text-slate-300 font-mono">LIVE</span>
                </div>
              </div>

              {/* Card Content Area (Simulated AI Response Box) */}
              <div className="flex-1 overflow-hidden flex flex-col justify-start space-y-1">
                <h3 className="text-[10px] sm:text-sm font-bold text-white tracking-tight leading-snug truncate">
                  {card.title}
                </h3>

                {/* Simulated AI Chat Response Display (reveals smoothly ONLY after prompt finishes typing) */}
                <div
                  className={`bg-slate-950/75 border border-white/10 rounded-xl p-1.5 sm:p-2.5 text-[9px] sm:text-[11px] text-slate-300 space-y-1 sm:space-y-1.5 backdrop-blur-sm transition-all duration-500 overflow-hidden ${
                    isActive && showAnswer
                      ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                      : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center gap-1 font-semibold text-white">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: card.accentColor }}
                    />
                    <span className="truncate text-[9px] sm:text-[10.5px]">{card.chatAiResponse.heading}</span>
                  </div>

                  <p className="text-slate-300/90 text-[8.5px] sm:text-[10.5px] leading-relaxed line-clamp-2">
                    {card.chatAiResponse.body}
                  </p>

                  {/* Code snippet if available */}
                  {card.chatAiResponse.codeSnippet && (
                    <pre className="bg-black/70 border border-slate-800 text-[8px] sm:text-[9.5px] text-sky-300 p-1 sm:p-1.5 rounded-lg font-mono overflow-x-auto whitespace-pre-wrap leading-tight max-h-[38px] sm:max-h-[46px]">
                      {card.chatAiResponse.codeSnippet}
                    </pre>
                  )}

                  {/* Bullet insights if available */}
                  {card.chatAiResponse.bullets && (
                    <ul className="space-y-0.5 pl-0.5">
                      {card.chatAiResponse.bullets.slice(0, 2).map((b, idx) => (
                        <li key={idx} className="flex items-start gap-1 text-[8.5px] sm:text-[10px] text-slate-300 truncate">
                          <span className="text-sky-400">•</span>
                          <span className="truncate">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {/* ── Stationary Floating Input Box (3-line capacity for mobile & desktop) ── */}
        <div className="absolute bottom-4 sm:bottom-8 lg:bottom-10 left-1/2 -translate-x-1/2 w-[82%] sm:w-[64%] lg:w-[58%] max-w-md z-30 pointer-events-auto">
          <div className="bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-2 sm:p-2.5 shadow-xl backdrop-blur-xl flex items-start justify-between gap-2 transition-all min-h-[60px]">
            <div className="flex items-start gap-2 flex-1 min-w-0 pt-0.5">
              <div className="flex-1 min-w-0 text-[11px] sm:text-xs text-slate-200 font-mono leading-relaxed line-clamp-3 min-h-[48px]">
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

        <div className="absolute bottom-[68px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-1 backdrop-blur-sm">
          {GNOSIS_CARDS.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Show slide ${index + 1}: ${card.title}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                index === activeSlide ? 'w-6 bg-slate-800' : 'w-1.5 bg-slate-400/60 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Primary Action Call-to-Action (Positioned close to input box) ── */}
      <div className="flex flex-col items-center gap-2 px-6 mb-1 sm:mb-4 lg:mb-7 -mt-2 sm:-mt-4 lg:-mt-6 z-10 relative shrink-0">
        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full max-w-xs sm:max-w-sm py-3 sm:py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]"
        >
          {GOOGLE_SVG}
          <span>Continue with Google</span>
        </button>
      </div>

      {/* The same first-page catalog covers are showcased as the library preview. */}
      {libraryBooks.length > 0 && (
        <section className="relative z-10 shrink-0 w-full overflow-hidden mt-8 sm:mt-10 lg:mt-14 pb-4 sm:pb-6 lg:pb-10" aria-label="Trinity Universe Library preview">
          <div className="flex items-end justify-between gap-4 px-5 sm:px-8 lg:px-12 mb-3 sm:mb-4">
            <div className="text-left">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.28em] uppercase text-[#A36224]">
                Live
              </p>
              <h2 className="text-sm sm:text-base lg:text-lg font-black tracking-[0.16em] uppercase text-slate-800">
                Trinity Universe Library
              </h2>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Curated reading room
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => scrollToLibraryIndex(activeLibraryIndex - 1)}
              aria-label="Previous library cover"
              className="absolute left-2 sm:left-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg transition hover:bg-slate-900 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              ref={libraryTrackRef}
              className="landing-cover-scroller flex items-center gap-3 sm:gap-4 lg:gap-5 overflow-x-auto px-12 sm:px-16 lg:px-20 pb-2 snap-x snap-mandatory"
              onPointerDown={handleLibraryPointerDown}
              onPointerMove={handleLibraryPointerMove}
              onPointerUp={handleLibraryPointerEnd}
              onPointerCancel={handleLibraryPointerEnd}
              onScroll={(event) => {
                const target = event.currentTarget;
                const cards = Array.from(target.children) as HTMLElement[];
                const center = target.scrollLeft + target.clientWidth / 2;
                let closest = 0;
                let distance = Number.POSITIVE_INFINITY;
                cards.forEach((card, index) => {
                  const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                  if (Math.abs(cardCenter - center) < distance) {
                    distance = Math.abs(cardCenter - center);
                    closest = index;
                  }
                });
                setActiveLibraryIndex(closest);
              }}
            >
            {libraryBooks.map((book, index) => (
              <div
                key={book.id}
                onClick={() => handleBookSelect(book)}
                className="landing-cover-card w-[96px] h-[144px] sm:w-32 sm:h-48 md:w-36 md:h-[216px] lg:w-40 lg:h-60 shrink-0 snap-center overflow-hidden rounded-xl border border-white/70 bg-white/70 shadow-md cursor-grab active:cursor-grabbing transition-[box-shadow,filter] hover:brightness-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A36224] relative z-0"
                title={book.title}
                role="button"
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') handleBookSelect(book);
                }}
              >
                <div className="relative w-full h-full">
                  {book.cover_filename ? (
                    <img
                      src={`/api/r2/${book.cover_filename}`}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-700 to-slate-950 p-2 text-center">
                      <BookOpen className="w-6 h-6 text-amber-200" />
                    </div>
                  )}
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[9px] sm:text-[10px] font-black tracking-wide shadow-md ${
                    book.price === 0 ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'
                  }`}>
                    {book.price === 0 ? 'FREE' : `$${book.price.toFixed(2)}`}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent px-2 pt-8 pb-2">
                    <p className="text-[10px] sm:text-xs font-semibold leading-tight text-white line-clamp-3 drop-shadow-md">
                      {book.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <button
              type="button"
              onClick={() => scrollToLibraryIndex(activeLibraryIndex + 1)}
              aria-label="Next library cover"
              className="absolute right-2 sm:right-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg transition hover:bg-slate-900 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 px-5" aria-label="Library cover indicators">
            {libraryBooks.map((book, index) => (
              <button
                key={book.id}
                type="button"
                onClick={() => scrollToLibraryIndex(index)}
                aria-label={`Show book ${index + 1}: ${book.title}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  index === activeLibraryIndex ? 'w-5 bg-[#A36224]' : 'w-1.5 bg-slate-300 hover:bg-[#A36224]/60'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-end px-5 sm:px-8 lg:px-12 mt-2 sm:mt-3">
            <button
              type="button"
              onClick={onVisitLibrary}
              className="inline-flex items-center gap-2 rounded-xl bg-[#A36224] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#8a511f] hover:shadow-lg active:translate-y-0 cursor-pointer"
            >
              Visit Library
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          onClick={() => setSelectedBook(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={event => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selectedBook.title}
          >
            <div className="relative h-44 sm:h-52 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-950">
              {selectedBook.cover_filename ? (
                <img
                  src={`/api/r2/${selectedBook.cover_filename}`}
                  alt={selectedBook.title}
                  className="w-full h-full object-cover opacity-75"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="w-14 h-14 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-serif font-bold text-lg leading-tight line-clamp-2">{selectedBook.title}</p>
                <p className="text-slate-200 text-sm mt-1">{selectedBook.author}</p>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65 cursor-pointer"
                aria-label="Close ebook details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="max-w-[75%] rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 truncate">
                  {selectedBook.niche}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {selectedBook.price === 0 ? 'FREE' : `$${selectedBook.price.toFixed(2)}`}
                </span>
              </div>
              {selectedBook.publication_year && (
                <p className="text-xs text-slate-500">Published: {selectedBook.publication_year}</p>
              )}
              {selectedBook.tag && (
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  #{selectedBook.tag}
                </span>
              )}
              {selectedBook.price === 0 && selectedBook.file_key ? (
                <a
                  href={`/api/r2/${selectedBook.file_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#A36224] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8a511f]"
                >
                  <Download className="w-4 h-4" />
                  Download Free
                </a>
              ) : selectedBook.price > 0 ? (
                <button
                  onClick={() => handleBookCart(selectedBook)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors ${
                    bookAddedToCart ? 'bg-emerald-600' : 'bg-[#A36224] hover:bg-[#8a511f]'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {bookAddedToCart ? 'Added to Cart' : 'Add to Cart'}
                </button>
              ) : (
                <div className="flex w-full items-center justify-center rounded-xl bg-slate-100 py-3 text-sm text-slate-400">
                  File not available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
