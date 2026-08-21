import { Tenant } from '../types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'gnosis',
    name: 'Gnosis AI',
    headerTitle: 'Gnosis AI',
    pillLabel: 'ⓘ Gnosis AI',
    activePillBg: 'bg-[#e8f0fe]',
    activePillText: 'text-[#1a73e8]',
    activePillBorder: 'border-[#d2e3fc]',
    newChatBtnText: '+ New Chat',
    clearHistoryBtnText: 'Clear All History',
    emptyStateTitle: 'Where should we start?',
    placeholderText: 'Message Gnosis...',
    systemInstruction: `You are Gnosis — a sharp, articulate, and authentic intellect within Trinity Universe.

CRITICAL CONVERSATIONAL RULES:
1. Brevity on Greetings: If the user says "Hey", "Hi", "Hello", or asks a simple casual question, respond in exactly ONE natural, warm sentence (e.g., "Hey! How can I help you today?"). NEVER write long essays, unsolicited code, or unrequested explanations for basic greetings.
2. Calibrated Depth: Only provide deep technical architecture, code, or deep philosophy when the user explicitly asks for detailed explanations.
3. Natural Human Tone: Speak like a thoughtful, capable human friend. Avoid robotic boilerplate ("Certainly!", "As an AI language model...").`,
    fontStyle: 'sans',
    canvasBg: 'bg-[#FAF7F2]',
    accentColor: '#1a73e8',
    avatarBg: 'bg-blue-100 text-blue-600',
    activityCategory: 'AI Engineering & Analytics',
    suggestedPrompts: [
      'What is something most people misunderstand about modern computing?',
      'Help me brainstorm architecture for a scalable real-time system',
      'Explain the core tension between determinism and free will',
      'Review a technical concept with me step by step',
    ],
    primaryModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    coderModel: '@cf/qwen/qwen2.5-coder-72b-instruct',
    visionModel: '@cf/meta/llama-3.2-11b-vision-instruct',
  },
  {
    id: 'yada',
    name: 'YADA',
    headerTitle: 'Y A D A',
    pillLabel: '✨ Yada Guide',
    activePillBg: 'bg-[#f3e8ff]',
    activePillText: 'text-[#7e22ce]',
    activePillBorder: 'border-[#e9d5ff]',
    newChatBtnText: '+ New Consultation',
    clearHistoryBtnText: 'Clear All',
    subtitle: 'Your spiritual journey begins here...',
    emptyStateTitle: 'Seek Wisdom & Inner Clarity',
    placeholderText: 'Ask Yada...',
    systemInstruction: `You are Yada — a calm, deeply grounded, and compassionate presence within Trinity Universe.

CRITICAL CONVERSATIONAL RULES:
1. Brevity on Greetings: If the user sends a simple greeting ("Hey", "Hello", "Hi"), reply in exactly ONE warm, gentle sentence (e.g., "Hello, friend. How is your spirit today?").
2. Measured Depth: Listen deeply. Only provide deeper philosophical reflections when the user brings up a meaningful question.`,
    fontStyle: 'serif',
    canvasBg: 'bg-[#FFFDF8]',
    accentColor: '#A36224',
    avatarBg: 'bg-amber-100 text-amber-700',
    activityCategory: 'Spiritual Guidance & Mindfulness',
    suggestedPrompts: [
      'How can I find stillness when everything feels overwhelming?',
      'Explore the archetypal meaning behind a current transition',
      'Share a reflection on releasing what is beyond my control',
      'What does ancient philosophy teach us about navigating uncertainty?',
    ],
    primaryModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    visionModel: '@cf/meta/llama-3.2-11b-vision-instruct',
  },
];
