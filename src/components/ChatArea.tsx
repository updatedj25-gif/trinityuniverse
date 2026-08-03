import React, { useState, useRef, useEffect } from 'react';
import { Tenant, ChatMessage, Attachment } from '../types';
import {
  ArrowUp,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Sparkles,
  Zap,
  Gem,
  Eye,
  Plus,
  BookOpen,
  Atom,
} from 'lucide-react';

interface ChatAreaProps {
  tenant: Tenant;
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
  onRegenerate?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  tenant,
  messages,
  onSendMessage,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // DeepSeek Style Toggle States
  const [knowledgeActive, setKnowledgeActive] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'instant' | 'expert' | 'vision'>('instant');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    let finalPrompt = input.trim();
    if (knowledgeActive) {
      finalPrompt = `[Knowledge Mode Enabled] ${finalPrompt}`;
    }

    onSendMessage(finalPrompt, attachments);
    setInput('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        setSelectedMode('vision');
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newAttach: Attachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
          name: file.name,
          type: isImage ? 'image' : 'file',
          url: URL.createObjectURL(file),
          dataUrl: isImage ? result : undefined,
          content: !isImage ? result : undefined,
        };
        setAttachments((prev) => [...prev, newAttach]);
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, msgId: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = tenant.id === 'yada' ? 0.9 : 1.0;

      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      setSpeakingId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col justify-between h-full relative overflow-hidden ${tenant.canvasBg}`}
    >
      {/* Hidden File Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Messages or Landing Page Center */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 z-10 scroll-smooth">
        {messages.length === 0 ? (
          /* Empty Landing State matching DeepSeek Screenshot */
          <div className="h-full min-h-[440px] flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto">
            {/* Logo Emblem & Title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                {tenant.id === 'yada' ? (
                  <Sparkles className="w-5 h-5 text-amber-600" />
                ) : (
                  <Atom className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
                Start chatting with {tenant.name}
              </h1>
            </div>

            {/* Mode Switcher Pill Bar (Instant, Expert, Vision) */}
            <div className="inline-flex items-center p-1 bg-stone-100/90 border border-stone-200/90 rounded-full mb-8 text-xs sm:text-sm font-medium">
              <button
                onClick={() => setSelectedMode('instant')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  selectedMode === 'instant'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold border border-blue-100'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span>Instant</span>
              </button>

              <button
                onClick={() => setSelectedMode('expert')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  selectedMode === 'expert'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold border border-blue-100'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
              >
                <Gem className="w-3.5 h-3.5 text-slate-600" />
                <span>Expert</span>
              </button>

              <button
                onClick={() => setSelectedMode('vision')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  selectedMode === 'vision'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold border border-blue-100'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Vision</span>
              </button>
            </div>

            {/* Chat Input Box on Landing Page */}
            <div className="w-full relative text-left">
              {/* Attachment Preview Strip */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 mb-2 bg-white/90 border border-stone-200 rounded-xl shadow-2xs">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700"
                    >
                      {att.type === 'image' ? (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span className="truncate max-w-[120px]">{att.name}</span>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="text-stone-400 hover:text-red-500 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Exact DeepSeek Chat Input Container */}
              <div className="bg-white border border-stone-200/90 rounded-[24px] shadow-sm p-4 hover:border-stone-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100/50 transition-all flex flex-col justify-between min-h-[130px]">
                {/* Textarea Field */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${tenant.name}`}
                  rows={2}
                  className="w-full resize-none border-none outline-none text-sm sm:text-base text-slate-800 placeholder-stone-400 bg-transparent font-sans"
                />

                {/* Bottom Controls Bar inside Box */}
                <div className="flex items-center justify-between pt-3 border-t border-transparent">
                  {/* Left Controls: Add Image Plus Icon & Knowledge Toggle Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-stone-600 hover:text-slate-900 hover:bg-stone-200/70 border border-stone-200/90 bg-stone-100/60 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Add image or attachment"
                    >
                      <Plus className="w-4 h-4 text-stone-600" />
                    </button>

                    <button
                      onClick={() => setKnowledgeActive((prev) => !prev)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                        knowledgeActive
                          ? 'bg-blue-50 text-blue-600 border-blue-200 font-semibold shadow-2xs'
                          : 'bg-stone-50/80 text-stone-600 border-stone-200/80 hover:bg-stone-100'
                      }`}
                    >
                      <BookOpen className={`w-3.5 h-3.5 ${knowledgeActive ? 'text-blue-600' : 'text-stone-500'}`} />
                      <span>Knowledge</span>
                    </button>
                  </div>

                  {/* Right Action: Circular Send Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSend}
                      disabled={(!input.trim() && attachments.length === 0) || isLoading}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        input.trim() || attachments.length > 0
                          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-2xs'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <ArrowUp className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Prompts beneath input */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-xl">
              {tenant.suggestedPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(promptText)}
                  className="px-3 py-1.5 rounded-full text-xs bg-white/80 border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Messages Stream */
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender Name */}
                  <span className="text-[11px] font-medium text-stone-400 mb-1 px-1">
                    {isUser ? 'You' : tenant.name}
                  </span>

                  {/* Message Bubble Container */}
                  <div
                    className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs transition-all ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-xs'
                        : tenant.id === 'yada'
                        ? 'bg-[#FFF9F2] text-slate-800 border border-[#F3E3D1] rounded-tl-xs font-serif'
                        : 'bg-white text-slate-800 border border-stone-200/90 rounded-tl-xs font-sans'
                    }`}
                  >
                    {/* Attachments if any */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.attachments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-1.5 text-xs bg-black/10 px-2 py-1 rounded-md"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">
                              {a.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content Text */}
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    {/* Action Bar for Assistant Messages */}
                    {!isUser && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-200/40 text-stone-400 text-xs">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-slate-700 transition-colors p-1 rounded cursor-pointer"
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          className={`hover:text-slate-700 transition-colors p-1 rounded cursor-pointer ${
                            speakingId === msg.id ? 'text-amber-600 animate-pulse' : ''
                          }`}
                          title="Listen to voice reply"
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-medium text-stone-400 mb-1 px-1">
                  {tenant.name}
                </span>
                <div className="bg-white border border-stone-200/90 rounded-2xl rounded-tl-xs p-4 shadow-2xs flex items-center gap-2 text-stone-500 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box Bar at Bottom when conversation is ACTIVE */}
      {messages.length > 0 && (
        <div className="p-4 sm:p-6 z-20">
          <div className="max-w-3xl mx-auto w-full relative">
            {/* Attachment Preview Strip */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 mb-2 bg-white/90 border border-stone-200 rounded-xl shadow-2xs">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700"
                  >
                    {att.type === 'image' ? (
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="text-stone-400 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Exact DeepSeek Chat Input Box */}
            <div className="bg-white border border-stone-200/90 rounded-[24px] shadow-sm p-4 hover:border-stone-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100/50 transition-all flex flex-col justify-between min-h-[120px]">
              {/* Textarea Field */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${tenant.name}`}
                rows={2}
                className="w-full resize-none border-none outline-none text-sm sm:text-base text-slate-800 placeholder-stone-400 bg-transparent font-sans"
              />

              {/* Bottom Controls Bar inside Box */}
              <div className="flex items-center justify-between pt-3">
                {/* Left Controls: Add Image Plus Icon & Knowledge Toggle Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-stone-600 hover:text-slate-900 hover:bg-stone-200/70 border border-stone-200/90 bg-stone-100/60 transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Add image or attachment"
                  >
                    <Plus className="w-4 h-4 text-stone-600" />
                  </button>

                  <button
                    onClick={() => setKnowledgeActive((prev) => !prev)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                      knowledgeActive
                        ? 'bg-blue-50 text-blue-600 border-blue-200 font-semibold shadow-2xs'
                        : 'bg-stone-50/80 text-stone-600 border-stone-200/80 hover:bg-stone-100'
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${knowledgeActive ? 'text-blue-600' : 'text-stone-500'}`} />
                    <span>Knowledge</span>
                  </button>
                </div>

                {/* Right Action: Circular Send Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      input.trim() || attachments.length > 0
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-2xs'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
