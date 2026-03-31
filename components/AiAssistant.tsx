import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Monitor, Zap, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { ChatMessage, AdSet } from '../types';

interface AiAssistantProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  userInput: string;
  setUserInput: (val: string) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
  history, 
  onSendMessage, 
  isLoading, 
  userInput, 
  setUserInput 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(userInput);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[500px] relative group">
      {/* Header do Quadro de IA */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-50 uppercase tracking-widest">Insight Assistant</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> IA de Performance Ativa
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="px-3 py-1 bg-slate-950 rounded-full border border-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-500" /> Consultoria em Tempo Real
            </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`p-2.5 rounded-xl shrink-0 h-fit ${msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-sky-400 border border-slate-700'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`max-w-[80%] space-y-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'}`}>
                {msg.content}
              </div>

              {/* Grid de Criativos Relacionados (Thumbnails) */}
              {msg.relatedAds && msg.relatedAds.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {msg.relatedAds.map(ad => (
                    <div key={ad.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group/ad relative transition-all hover:border-sky-500/50">
                        <div className="aspect-square bg-slate-950 relative">
                            {ad.thumbnailUrl ? (
                                <img src={ad.thumbnailUrl} alt={ad.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20"><Monitor className="w-6 h-6" /></div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/ad:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="text-[8px] font-black text-white uppercase bg-sky-500 px-2 py-1 rounded-md">Ver Performance</span>
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            <p className="text-[9px] font-black text-slate-200 uppercase truncate">{ad.name}</p>
                            <div className="flex justify-between items-center text-[8px] font-bold">
                                <span className="text-slate-500">Gasto: <span className="text-slate-300">{formatCurrency(ad.spend)}</span></span>
                                <span className="text-emerald-400">{ad.ctr.toFixed(2)}% CTR</span>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="p-2.5 bg-slate-800 rounded-xl h-fit border border-slate-700">
              <Bot className="w-4 h-4 text-sky-400" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none w-48 space-y-2">
               <div className="h-2 w-full bg-slate-800 rounded-full" />
               <div className="h-2 w-2/3 bg-slate-800 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <div className="p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Pergunte sobre desempenho, criativos ou melhorias..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-5 pr-14 text-xs font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 transition-all"
          />
          <button 
            onClick={() => onSendMessage(userInput)}
            disabled={isLoading || !userInput.trim()}
            className="absolute right-2 p-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-500 disabled:opacity-30 disabled:hover:bg-sky-600 transition-all shadow-lg shadow-sky-950"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-4 overflow-x-auto pb-1 no-scrollbar">
            <QuickAction label="Melhores criativos?" icon={TrendingUp} onClick={() => onSendMessage("Quais são os criativos com melhor desempenho visual agora?")} />
            <QuickAction label="Dicas de otimização" icon={Zap} onClick={() => onSendMessage("Analise os dados e me dê 3 dicas de otimização imediatas.")} />
            <QuickAction label="CTR em alerta" icon={AlertCircle} onClick={() => onSendMessage("Quais anúncios estão com CTR abaixo da média?")} />
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ label, icon: Icon, onClick }: { label: string, icon: any, onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-2 whitespace-nowrap bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest hover:border-sky-500/40 hover:text-sky-400 transition-all">
        <Icon className="w-3 h-3 text-sky-500" /> {label}
    </button>
);