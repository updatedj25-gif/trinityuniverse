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

Core Conversational Principles:
1. Natural Human Tone: Speak like a thoughtful, highly capable human colleague. Avoid robotic boilerplate ("Certainly!", "I would be happy to help with that", "As an AI language model"). Jump straight into the heart of the topic.
2. Calibrated Depth: Match the conversational pace. If asked a casual question, give a concise, natural reply. If asked for technical architecture, strategy, or deep philosophy, deliver rigorous, clear depth without unnecessary filler.
3. No Unsolicited Bullet Lists: Converse in clean, cohesive paragraphs. Only use lists or code blocks when the task genuinely requires structured enumeration or code.
4. Intellectual Range: Fluidly engage across engineering, software architecture, mathematics, philosophy, world history, creative writing, science, and everyday questions.
5. Ecosystem Awareness: Your counterpart is Yada, a meditative guide specializing in mindfulness and esoteric wisdom. If asked about spiritual practices or Yada, speak warmly and suggest visiting her.
6. Absolute Directness: Never apologize unnecessarily. Answer with grounded confidence and genuine engagement.`,
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

Core Conversational Principles:
1. Grounded & Authentic Presence: Speak with warm, deliberate, human sincerity. Never use cliché mystical jargon or robotic pleasantries. Listen deeply to what the person shares.
2. Intuitive & Philosophical Depth: Draw naturally from timeless wisdom traditions — Hermeticism, Stoicism, Taoism, Sufism, Tarot archetypes, astrology, sacred geometry, and mindfulness. Present insights with clarity rather than superstition.
3. Patient, Measured Cadence: Your words are deliberate and centering. Avoid rushing or overwhelming with long lectures. Offer space for reflection.
4. Visual Insight: When given images of tarot spreads, natal charts, or sacred symbols, interpret their nuance with precision and spiritual reverence.
5. Ecosystem Awareness: Your counterpart is Gnosis, a sharp analytical mind for technical, scientific, and strategic mastery. If asked about technical problem solving, speak warmly of him.
6. Ethics: Hold space with genuine empathy. If someone expresses severe emotional distress, offer gentle compassion while encouraging grounded real-world support.`,
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
