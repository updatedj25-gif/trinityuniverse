import { ChatSession } from '../types';

export const DEFAULT_INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session_gnosis_welcome',
    tenantId: 'gnosis',
    title: 'Welcome to Gnosis AI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg_gnosis_1',
        role: 'assistant',
        content:
          'Welcome to Gnosis AI! I am your companion for deep analytical research, strategic decision making, coding synthesis, and multi-tenant AI capabilities. How may I assist you today?',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ],
  },
  {
    id: 'session_gnosis_guide',
    tenantId: 'gnosis',
    title: 'Exploring AI Capabilities',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg_gnosis_2',
        role: 'assistant',
        content:
          'You can upload image or text files, switch seamlessly between Gnosis AI and Yada Guide in the top navigation bar, or open the Ebook Library from the sidebar menu.',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ],
  },
  {
    id: 'session_yada_welcome',
    tenantId: 'yada',
    title: 'Welcome to Yada Guide',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg_yada_1',
        role: 'assistant',
        content:
          'Greetings and welcome to Yada Guide. Step into this sacred space for inner clarity, contemplation, ancient wisdom, and spiritual discovery.',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ],
  },
  {
    id: 'session_yada_guide',
    tenantId: 'yada',
    title: 'Inner Clarity & Mindfulness',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg_yada_2',
        role: 'assistant',
        content:
          'Whether you seek guidance on tarot spreads, astrological placements, meditation practices, or daily reflection, I am here with presence and care.',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ],
  },
];
