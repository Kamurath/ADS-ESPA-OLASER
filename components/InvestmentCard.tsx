
import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface InvestmentCardProps {
  spend: number;
  budget: number;
}

// Taxa de imposto: R$ 121,50 a cada R$ 1.000,00 = 12.15%
const TAX_RATE = 0.1215;

export const InvestmentCard: React.FC<InvestmentCardProps> = ({ spend, budget }) => {
  const estimatedTax = spend * TAX_RATE;
  const totalCost = spend + estimatedTax;
  
  // Porcentagens baseadas no custo total (investimento + imposto)
  const spendPercentage = budget > 0 ? (spend / budget) * 100 : 0;
  const taxPercentage = budget > 0 ? (estimatedTax / budget) * 100 : 0;
  const totalPercentage = budget > 0 ? (totalCost / budget) * 100 : 0;
  const remaining = Math.max(0, budget - totalCost);

  const formatCurrency = (val: number, notation: "compact" | "standard" = "standard") => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL', 
      notation: notation,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    } as any).format(val);

  // Regra de atingimento
  const isCompleted = totalCost >= budget;
  const isNear = !isCompleted && budget > 0 && (budget - totalCost) <= 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-5 text-sky-400 pointer-events-none">
        <DollarSign className="w-48 h-48" />
      </div>

      {/* Seção 1: Valor Principal */}
      <div className="flex flex-col gap-2 min-w-[200px] border-r border-slate-800/50 pr-8 w-full md:w-auto">
        <span className="text-xs font-black text-slate-300 uppercase tracking-[0.4em] mb-2">FINANCEIRO</span>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-sky-950/50 rounded-xl text-sky-500 border border-sky-900/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-black text-sky-400 uppercase tracking-[0.2em]">Anúncios + Impostos</h3>
        </div>
        <div className="flex flex-col">
          <span className="text-4xl font-black text-slate-50 tracking-tighter leading-none group-hover:text-sky-400 transition-colors">
            {formatCurrency(spend)}
          </span>
          <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> + {formatCurrency(estimatedTax)} impostos (est.)
          </span>
        </div>
      </div>

      {/* Seção 2: Barra de Progresso e Meta */}
      <div className="flex-1 w-full space-y-4">
        <div className="flex justify-between items-end mb-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Investimento Total</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-lg font-black ${isCompleted ? 'text-emerald-400' : 'text-slate-300'}`}>{formatCurrency(totalCost)}</span>
              <span className="text-xs text-slate-500 font-bold">de {formatCurrency(budget)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-black ${isCompleted ? 'text-emerald-400' : isNear ? 'text-amber-500' : 'text-sky-400'}`}>
              {totalPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Barra de Progresso Combinada com Breakdown de Imposto */}
        <div className="h-5 w-full bg-slate-950 rounded-full flex overflow-hidden border-2 border-slate-800 p-0.5">
          {/* Segmento de Anúncios */}
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-l-full ${isCompleted ? 'bg-emerald-500' : 'bg-sky-500'} ${totalPercentage >= 100 ? 'rounded-r-full' : ''}`} 
            style={{ width: `${Math.min(spendPercentage, 100)}%` }}
          />
          {/* Segmento de Impostos (Amarelo) */}
          <div 
            className="h-full bg-amber-500 transition-all duration-1000 ease-out border-l border-slate-900/40" 
            style={{ width: `${Math.min(taxPercentage, 100 - spendPercentage)}%` }}
          />
        </div>

        {/* Linha de Resumo Detalhado */}
        <div className="text-[10px] font-black uppercase tracking-widest pt-2 text-slate-500 border-t border-slate-800/50 mt-2 flex flex-wrap gap-y-2">
          <span>Aporte: <span className="text-slate-300">{formatCurrency(budget)}</span></span>
          <span className="mx-2 text-slate-800">|</span>
          <span>Anúncios: <span className="text-sky-400">{formatCurrency(spend)}</span></span>
          <span className="mx-2 text-slate-800">|</span>
          <span className="flex items-center gap-1">Impostos: <span className="text-amber-500">{formatCurrency(estimatedTax)}</span> <span className="text-[8px] opacity-40">(12,15%)</span></span>
          <span className="mx-2 text-slate-800">|</span>
          <div className="w-full sm:w-auto">
             <span>Total Investido: <span className={isCompleted ? 'text-emerald-400' : 'text-slate-100'}>{formatCurrency(totalCost)}</span></span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest pt-1">
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-slate-600">
              <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-sky-500'}`} /> Anúncios
            </span>
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Impostos
            </span>
          </div>
          {isCompleted ? (
            <span className="text-emerald-400 font-black animate-pulse">INVESTIMENTO TOTAL ATINGIDO</span>
          ) : isNear ? (
            <span className="text-amber-500 font-black">QUASE ATINGIDO (R$ {remaining.toFixed(2)} restantes)</span>
          ) : (
            <span className="text-emerald-500">Valor restante: {formatCurrency(remaining)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
