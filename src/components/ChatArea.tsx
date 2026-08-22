import React, { useState, useRef, useEffect } from 'react';
import { Tenant, ChatMessage, Attachment } from '../types';
import { 
  Plus, 
  ArrowUp, 
  BookOpen, 
  Sparkles, 
  Bot, 
  User, 
  RotateCw, 
  Paperclip,
  X
, Terminal, Zap, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

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
  const [activePill, setActivePill] = useState<string>('Instant');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isYada = tenant.id === 'yada';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: reader.result as string,
          dataUrl: reader.result as string,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const modelPills = [
    { label: 'Instant', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Expert', icon: <span>💎</span> },
    { label: 'Vision', icon: <span>👁️</span> },
  ];

  // Reusable Input Box (Same background color as page, no colored focus lines)
  const renderInputBox = (isCentered = false) => (
    <div className={`w-full ${isCentered ? 'max-w-xl mx-auto' : 'max-w-2xl mx-auto'}`}>
      <div className="bg-[#F4F0E8] border border-stone-300/80 rounded-3xl p-3 sm:p-4 shadow-sm hover:shadow transition-all">
        
        {/* Attachment preview chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-stone-300/40">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-1.5 bg-stone-200/80 px-2.5 py-1 rounded-lg text-xs text-slate-700 font-mono">
                <Paperclip className="w-3 h-3 text-stone-500" />
                <span className="max-w-[120px] truncate">{att.name}</span>
                <X onClick={() => removeAttachment(att.id)} className="w-3 h-3 text-stone-400 hover:text-red-500 cursor-pointer ml-1" />
              </div>
            ))}
          </div>
        )}

        {/* Textarea: No focus ring, No colored lines */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tenant.placeholderText || (isYada ? 'Ask Yada Guide anything...' : 'Message Gnosis AI...')}
          rows={1}
          className="w-full bg-transparent text-slate-800 placeholder-stone-400 text-xs sm:text-sm resize-none focus:outline-none focus:ring-0 outline-none border-none p-0 leading-relaxed max-h-36 overflow-y-auto block"
          style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
        />

        {/* Bottom Actions inside Input Box */}
        <div className="flex items-center justify-between mt-3 pt-1">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300/80 text-stone-700 transition-colors flex items-center justify-center cursor-pointer"
              title="Upload attachment"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-200/80 hover:bg-stone-300/80 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-600" />
              <span>Knowledge</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              (input.trim() || attachments.length > 0) && !isLoading
                ? isYada
                  ? 'bg-[#A36224] hover:bg-[#8a511d] text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FDFBF7] relative overflow-hidden select-text">
      
      {messages.length === 0 ? (
        /* ── 1. CENTERED HERO VIEW (MATCHING ORIGINAL DESIGN) ── */
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-center text-center">
          <div className="w-full max-w-xl flex flex-col items-center">
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 mb-5 font-sans">
              {tenant.id === 'yada' ? 'Consult with Yada Guide' : `Start chatting with ${tenant.name}`}
            </h1>

            {/* Model Selector Pills */}
            <div className="flex items-center gap-2 p-1 rounded-full bg-stone-100/90 border border-stone-200/80 mb-6 shadow-xs">
              {modelPills.map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => setActivePill(pill.label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activePill === pill.label
                      ? 'bg-white text-slate-800 shadow-sm border border-stone-200/60'
                      : 'text-stone-500 hover:text-slate-800'
                  }`}
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* ── CENTERED INPUT BOX ── */}
            <div className="w-full mb-6">
              {renderInputBox(true)}
            </div>

            {/* Suggested Prompts List */}
            <div className="w-full space-y-2">
              {tenant.suggestedPrompts && tenant.suggestedPrompts.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(promptText)}
                  className="w-full p-2.5 sm:p-3 rounded-full text-xs font-medium text-slate-700 bg-white border border-stone-200/80 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-2xs text-center cursor-pointer truncate"
                >
                  {promptText}
                </button>
              ))}
            </div>

          </div>
        </div>
      ) : (
        /* ── 2. ACTIVE CHAT THREAD (INPUT AT BOTTOM) ── */
        <div className="flex-1 flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 sm:gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === "assistant" && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                      isYada ? "bg-[#A36224]" : "bg-blue-600"
                    }`}>
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {m.attachments.map((att) => (
                          <div key={att.id} className="rounded-xl overflow-hidden border border-stone-200 max-w-[200px]">
                            {att.type === "image" ? (
                              <img src={att.url} alt={att.name} className="w-full h-auto object-cover max-h-40" />
                            ) : (
                              <div className="p-2 bg-stone-100 text-xs font-mono text-slate-700 flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5" />
                                <span className="truncate">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Active Status Badge (UX Requirement) */}
                    {m.status && (
                      <div className="mb-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium shadow-xs animate-pulse">
                        <Zap className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                        <span>{m.status}</span>
                      </div>
                    )}

                    {/* Sandbox Execution Terminal Block */}
                    {m.sandboxLogs && m.sandboxLogs.length > 0 && (
                      <div className="w-full space-y-2 mb-3">
                        {m.sandboxLogs.map((log, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden text-xs shadow-sm font-mono">
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
                              <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-semibold text-slate-200">
                                  E2B Sandbox ({log.language || "python"})
                                </span>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                                log.success !== false ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-rose-950 text-rose-300 border border-rose-800"
                              }`}>
                                {log.success !== false ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {log.success !== false ? "Passed" : "Runtime Error"}
                              </span>
                            </div>
                            
                            {log.code && (
                              <div className="p-3 bg-slate-950/60 border-b border-slate-800">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Executed Code</p>
                                <pre className="overflow-x-auto text-slate-300 whitespace-pre-wrap">{log.code}</pre>
                              </div>
                            )}

                            {(log.stdout || log.stderr || log.error) && (
                              <div className="p-3 bg-slate-950">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Terminal Output</p>
                                {log.stdout && <pre className="overflow-x-auto text-emerald-400 whitespace-pre-wrap">{log.stdout}</pre>}
                                {(log.stderr || log.error) && (
                                  <pre className="overflow-x-auto text-rose-400 whitespace-pre-wrap mt-1">{log.error || log.stderr}</pre>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Main Content Bubble */}
                    {m.content && (
                      <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        m.role === "user"
                          ? isYada
                            ? "bg-[#A36224] text-white rounded-br-xs"
                            : "bg-blue-600 text-white rounded-br-xs"
                          : "bg-white text-slate-800 border border-stone-200/80 rounded-bl-xs"
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 sm:gap-4 justify-start items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    isYada ? 'bg-[#A36224]' : 'bg-blue-600'
                  }`}>
                    <RotateCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white border border-stone-200/80 px-4 py-3 rounded-2xl text-xs text-stone-500 italic shadow-2xs">
                    {tenant.name} is thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent shrink-0">
            {renderInputBox(false)}
          </div>
        </div>
      )}

    </div>
  );
};
