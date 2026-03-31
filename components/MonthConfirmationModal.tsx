
import React from 'react';
import { X, CalendarPlus, CheckCircle2, ChevronRight } from 'lucide-react';

interface MonthConfirmationModalProps {
  monthLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const MonthConfirmationModal: React.FC<MonthConfirmationModalProps> = ({ monthLabel, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-600 rounded-2xl shadow-lg">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Novo Mês</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Atualização de Dashboard
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/20">
            <ChevronRight className="w-8 h-8 text-sky-500" />
          </div>
          <p className="text-slate-200 font-black text-lg uppercase tracking-tight leading-relaxed">
            Deseja iniciar o monitoramento de <br/>
            <span className="text-sky-400">{monthLabel}</span>?
          </p>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            O dashboard de Janeiro 2026 será arquivado no histórico.
          </p>
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-900/30 flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black rounded-2xl uppercase tracking-widest transition-all border border-slate-700"
          >
            Não
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-4 bg-sky-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-sky-500 transition-all shadow-xl shadow-sky-500/20 border border-sky-400/20"
          >
            <CheckCircle2 className="w-4 h-4" /> Sim
          </button>
        </div>
      </div>
    </div>
  );
};
