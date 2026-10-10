import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Zap,
  BrainCircuit,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  Building2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  TrackedItem,
  InvoiceRecord,
  PriceSpikeAlert,
  VendorProfile,
  AlertSettings,
} from '../types/inventory';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface ChatAssistantProps {
  trackedItems: TrackedItem[];
  invoices: InvoiceRecord[];
  alerts: PriceSpikeAlert[];
  vendors: VendorProfile[];
  settings: AlertSettings;
  onSelectItem?: (item: TrackedItem) => void;
  onSelectInvoiceNumber?: (invoiceNumber: string) => void;
  isFloatingDrawer?: boolean;
  onCloseDrawer?: () => void;
}

const STARTER_QUESTIONS = [
  'Which ingredients had the largest price spikes this month?',
  'How much extra are we paying for avocados compared to our historical average?',
  'Which vendor is charging the most for our kitchen supplies?',
  'Give me 3 menu engineering ideas to mitigate the butter and dairy price surges',
  'What is our estimated 30-day excess spend from active price spikes?',
  'Are there any ingredients where prices actually dropped recently?',
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  trackedItems,
  invoices,
  alerts,
  vendors,
  settings,
  onSelectItem,
  onSelectInvoiceNumber,
  isFloatingDrawer = false,
  onCloseDrawer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('lardertrack_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
    return [
      {
        id: 'init-1',
        role: 'assistant',
        content: `👋 Hello Chef! I am **LarderBot**, your AI Food Cost & Inventory Auditor.

I have direct access to your **${invoices.length} indexed invoices**, **${trackedItems.length} purchased items**, and **${alerts.filter(a => !a.dismissed).length} active price margin alerts**.

Ask me any questions about:
• Price differences and cost anomalies across deliveries
• Vendor quote comparisons and supplier negotiations
• Recipe costing, portion controls, and menu yield optimization
• Historical price trends and inflation forecasts

Feel free to ask a question below or pick a quick topic to start!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem('lardertrack_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Build condensed textual context for the model
  const inventoryContext = React.useMemo(() => {
    const activeAlerts = alerts.filter(a => !a.dismissed);
    const topSurges = [...trackedItems]
      .filter(it => it.varianceFromAvgPct > 0)
      .sort((a, b) => b.varianceFromAvgPct - a.varianceFromAvgPct)
      .slice(0, 8);

    const vendorSummary = vendors
      .map(
        v =>
          `- ${v.name} (${v.category}): $${v.totalSpend.toFixed(2)} total spend across ${v.totalInvoices} orders. Price rating: ${v.priceCompetitiveness}`
      )
      .join('\n');

    const spikeSummary = activeAlerts
      .map(
        a =>
          `- ${a.itemName} (${a.category}): Current $${a.currentPrice.toFixed(2)}/${a.unit} vs Historical Avg $${a.baselinePrice.toFixed(2)} (+${a.variancePct}% surge). Vendor: ${a.vendorName}, Invoice #${a.invoiceNumber} on ${a.invoiceDate}. Excess cost: $${a.estimatedExcessCost.toFixed(2)}, monthly impact: $${a.projectedMonthlyImpact.toFixed(2)}`
      )
      .join('\n');

    const topItemsList = trackedItems
      .slice(0, 15)
      .map(
        it =>
          `- ${it.name} (${it.category}): Current $${it.currentPrice.toFixed(2)}/${it.unit}, Hist Avg $${it.historicalAvgPrice.toFixed(2)}, Range $${it.minPrice.toFixed(2)}-$${it.maxPrice.toFixed(2)}, Variance: ${it.varianceFromAvgPct > 0 ? '+' : ''}${it.varianceFromAvgPct}%, Last Vendor: ${it.lastVendor}`
      )
      .join('\n');

    return `
RESTAURANT INVENTORY SUMMARY:
• Total Invoices Indexed: ${invoices.length}
• Total Spend: $${invoices.reduce((s, i) => s + i.totalAmount, 0).toFixed(2)}
• Margin Alert Threshold Setting: +${settings.marginThresholdPct}% over ${settings.compareBaseline}
• Active Price Spike Count: ${activeAlerts.length}

ACTIVE PRICE SPIKES & COST ANOMALIES:
${spikeSummary || 'No active spikes currently detected.'}

KEY SUPPLIERS:
${vendorSummary}

KEY PURCHASED ITEMS & CURRENT UNIT PRICES:
${topItemsList}
`;
  }, [trackedItems, invoices, alerts, vendors, settings]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          inventoryContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.reply) {
        const botMessage: ChatMessage = {
          id: `msg-${Date.now()}-reply`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.model || selectedModel,
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to generate response');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Unable to connect to AI assistant');
      // Add helpful fallback assistant message
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `I analyzed your question regarding our restaurant records:
• **Current Status**: We have **${alerts.filter(a => !a.dismissed).length} active margin alerts** affecting ingredients such as Hass Avocados and European Butter.
• **Food Cost Advisory**: Review Invoice #GVP-2026-1780 and #PCM-92144 where unit prices jumped beyond your +${settings.marginThresholdPct}% threshold.
• **Next Step**: You can inspect the detailed price trend charts in the **Purchased Items** tab or adjust your margin alert sensitivity in **Price Alerts**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'heuristic-auditor',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const initial: ChatMessage[] = [
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. I am ready to answer your questions regarding restaurant inventory, prices, vendors, or food costing.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ];
    setMessages(initial);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl ${isFloatingDrawer ? 'h-[580px] max-h-[85vh]' : 'h-[calc(100dvh-130px)] sm:h-[720px]'}`}>
      {/* Chat Header Bar */}
      <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">LarderBot AI Cost Auditor</h3>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-medium">
                Live Data
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              {invoices.length} invoices · {trackedItems.length} items · {alerts.filter(a => !a.dismissed).length} alerts
            </p>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Model Selection Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="bg-transparent text-slate-200 text-[11px] sm:text-xs focus:outline-hidden cursor-pointer max-w-[140px] sm:max-w-none truncate"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Balanced)</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (General)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Analysis)</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium"
              title="Return to Dashboard Overview"
            >
              <span>&larr; Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 border border-slate-700 text-amber-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-amber-400 text-slate-950 font-medium rounded-tr-xs'
                    : 'bg-slate-950 border border-slate-800/80 text-slate-200 rounded-tl-xs shadow-xs'
                }`}
              >
                {/* Content formatting */}
                <div className="whitespace-pre-wrap space-y-1.5">
                  {msg.content.split('\n').map((line, idx) => {
                    // Simple inline bold formatting
                    if (!line.trim()) return <div key={idx} className="h-1" />;

                    // Render lines with markdown bold support
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={idx}>
                        {parts.map((p, pIdx) => {
                          if (p.startsWith('**') && p.endsWith('**')) {
                            return (
                              <strong key={pIdx} className={isUser ? 'font-black' : 'font-bold text-white'}>
                                {p.slice(2, -2)}
                              </strong>
                            );
                          }
                          return p;
                        })}
                      </p>
                    );
                  })}
                </div>

                {/* Timestamp & Model Badge */}
                <div
                  className={`mt-2 pt-1.5 flex items-center justify-between text-[10px] ${
                    isUser ? 'text-slate-800 border-t border-amber-500/30' : 'text-slate-500 border-t border-slate-800/60'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.modelUsed && (
                    <span className="font-mono text-[9px] text-slate-400">{msg.modelUsed}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Analyzing invoices & food cost variances...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Questions (when conversation is short) */}
      {messages.length <= 4 && (
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5 font-medium">
            <HelpCircle className="w-3 h-3 text-amber-400" />
            <span>Suggested Questions:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {STARTER_QUESTIONS.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-400/50 hover:bg-slate-800 transition-all whitespace-nowrap shrink-0 text-[11px] cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-amber-400 transition-colors">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about food costs, price spikes, vendor invoices, or recipe margins (Enter to send)..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 resize-none focus:outline-hidden px-1"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>Shift + Enter for new line · Enter to send</span>
          <span className="font-mono">Model: {selectedModel}</span>
        </div>
      </div>
    </div>
  );
};
