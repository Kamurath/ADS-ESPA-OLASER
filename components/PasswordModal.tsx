
import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PasswordModalProps {
  onConfirm: (password: string) => void;
  onClose: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1346') {
      onConfirm(password);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className={`relative bg-slate-900 border ${error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-800'} w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 transition-all`}>
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg transition-colors ${error ? 'bg-red-500' : 'bg-sky-600'}`}>
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Acesso Restrito</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Reabilitar Mês Histórico
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800">
            <KeyRound className={`w-8 h-8 ${error ? 'text-red-500 animate-bounce' : 'text-slate-600'}`} />
          </div>
          
          <div className="w-full space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <input 
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className={`w-full bg-slate-950 border rounded-2xl py-4 text-center text-xl font-black tracking-[0.5em] text-white focus:outline-none transition-all ${error ? 'border-red-500 text-red-500' : 'border-slate-800 focus:border-sky-500/50'}`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 animate-in fade-in duration-300">
               <ShieldAlert className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Senha Incorreta</span>
            </div>
          )}
        </form>

        <div className="p-8 border-t border-slate-800 bg-slate-900/30">
          <button 
            onClick={handleSubmit}
            className="w-full py-4 bg-sky-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-sky-500 transition-all shadow-xl shadow-sky-500/20 border border-sky-400/20"
          >
            <CheckCircle2 className="w-4 h-4" /> Validar Senha
          </button>
        </div>
      </div>
    </div>
  );
};
