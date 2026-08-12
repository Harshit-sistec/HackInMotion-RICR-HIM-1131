import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, Volume2, Square, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { tutorService, SUGGESTED_PROMPTS } from '@/services/tutorService';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import { api } from '@/services/api';
import type { ChatMessage } from '@/types';

export function AITutor() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topicId');
  const subjectId = searchParams.get('subjectId');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topicName, setTopicName] = useState<string>('General Studies');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize session and topic info
  useEffect(() => {
    async function initSession() {
      if (!user) return;
      try {
        setLoading(true);
        if (topicId) {
          // Fetch topic info
          const { data: topicData } = await api
            .from('topics')
            .select('name')
            .eq('id', topicId)
            .maybeSingle();

          if (topicData) {
            setTopicName(topicData.name);
          }
          
          const sessId = await tutorService.getOrCreateSession(topicId, user.id);
          setSessionId(sessId);
        } else {
          setTopicName('General Studies');
          const sessId = await tutorService.getOrCreateGeneralSession(user.id);
          setSessionId(sessId);
        }
      } catch (err) {
        console.error(err);
        showToast('Could not initialize chat session.', 'error');
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [user, topicId]);

  // Load message history when session changes
  useEffect(() => {
    async function loadHistory() {
      if (!sessionId) return;
      try {
        const history = await tutorService.loadChatHistory(sessionId);
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Initialize with welcome message
          const welcomeText = topicId
            ? `Hi! I'm Nova, your AI study tutor. Let's study the topic **"${topicName}"** together. Ask me any questions, or tap "Quiz me on this topic" to test yourself!`
            : `Hi! I'm Nova, your AI study tutor. Ask me anything about your subjects — I'll explain it at your level, give examples, or quiz you.`;
            
          setMessages([
            {
              id: 'welcome',
              role: 'ai',
              content: welcomeText,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadHistory();
  }, [sessionId, topicId, topicName]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || !sessionId) return;
    
    const userMsg: ChatMessage = { 
      id: `msg_${Date.now()}`, 
      role: 'user', 
      content: text, 
      timestamp: new Date().toISOString() 
    };
    
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await tutorService.sendMessage(messages, text, sessionId, topicName);
      setMessages((m) => [...m, reply]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { 
          id: `msg_err_${Date.now()}`, 
          role: 'ai', 
          content: err instanceof Error ? err.message : 'Something went wrong.', 
          timestamp: new Date().toISOString() 
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setInput('Voice input not supported in this browser.');
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {subjectId && (
          <div className="mb-4">
            <button onClick={() => navigate(`/app/subjects/${subjectId}`)} className="text-xs font-bold text-ink-500 hover:text-primary-600 flex items-center gap-1">
              <ArrowLeft size={14} /> Back to mind map
            </button>
          </div>
        )}

        <PageHeader
          title={topicId ? `AI Tutor: ${topicName}` : 'AI Tutor'}
          subtitle={topicId ? `Ask anything about ${topicName}` : 'Ask anything. Get explanations tuned to your level.'}
          action={<Badge tone="primary"><Sparkles size={12} /> AI-powered</Badge>}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Chat */}
          <div className="lg:col-span-2">
            <Card padding="none" className="flex h-[600px] flex-col">
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onSpeak={() => speak(msg.content)} speaking={speaking} />
                ))}
                {loading && <TypingBubble />}
              </div>

              {/* Input */}
              <div className="border-t border-ink-200 p-4 dark:border-ink-800">
                {messages.length <= 1 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-primary-900/40"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={listening ? stopListening : startListening}
                    aria-label="Voice input"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                      listening
                        ? 'bg-error-500 text-white animate-pulse'
                        : 'border border-ink-200 text-ink-500 hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-800'
                    }`}
                  >
                    {listening ? <Square size={18} /> : <Mic size={18} />}
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send(input)}
                    placeholder={listening ? 'Listening…' : 'Ask a question…'}
                    className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                  />
                  <Button onClick={() => send(input)} disabled={!input.trim() || loading || !sessionId} className="shrink-0">
                    <Send size={16} />
                  </Button>
                </div>
                {speaking && (
                  <button onClick={stopSpeaking} className="mt-2 text-xs font-medium text-error-600 hover:underline">
                    Stop speaking
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Side panel */}
          <div className="space-y-5">
            <Card padding="lg">
              <h3 className="mb-3 font-display text-base font-semibold text-ink-900 dark:text-ink-50">How to use</h3>
              <ul className="space-y-3 text-sm text-ink-600 dark:text-ink-300">
                <li className="flex gap-2"><Sparkles size={16} className="mt-0.5 shrink-0 text-primary-500" /> Type a question or tap the mic to ask out loud.</li>
                <li className="flex gap-2"><Volume2 size={16} className="mt-0.5 shrink-0 text-accent-500" /> Tap "Listen" on any reply to hear it spoken.</li>
                <li className="flex gap-2"><Send size={16} className="mt-0.5 shrink-0 text-primary-500" /> Ask for examples, quizzes, or simpler explanations.</li>
              </ul>
            </Card>
            <Card padding="lg" className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30">
              <h3 className="mb-2 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">Try asking</h3>
              <ul className="space-y-1.5 text-sm text-ink-600 dark:text-ink-300">
                <li>"Explain this simply"</li>
                <li>"Give me a practical example"</li>
                <li>"Quiz me on this concept"</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ChatBubble({ message, onSpeak, speaking }: { message: ChatMessage; onSpeak: () => void; speaking: boolean }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
        isUser ? 'bg-primary-600' : 'bg-gradient-to-br from-primary-600 to-accent-500'
      }`}>
        {isUser ? 'U' : <Sparkles size={14} />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? 'rounded-br-md bg-primary-600 text-white'
          : 'rounded-tl-md bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
      }`}>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {!isUser && (
          <button onClick={onSpeak} className="mt-2 inline-flex items-center gap-1 text-xs text-ink-400 hover:text-primary-500">
            <Volume2 size={12} /> {speaking ? 'Speaking…' : 'Listen'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-white">
        <Sparkles size={14} />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-ink-100 px-4 py-3 dark:bg-ink-800">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-ink-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
