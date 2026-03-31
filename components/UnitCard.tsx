
import React from 'react';
import { AdSet, ESPACOLASER_UNITS, OperationalStatus } from '../types';
import { Check, CalendarRange, ExternalLink, Zap } from 'lucide-react';

interface UnitCardProps {
  name: string;
  budget: number;
  unitPeriod: { start: number; end: number };
  realBalance: number;
  manualDailyValue: number;
  deposits: boolean[];
  onToggleWeek: (index: number) => void;
  isCompleted?: boolean;
  onToggleCompleted?: () => void;
  campaigns: AdSet[];
  onClick: () => void;
  onShowDetails?: () => void;
  isSelected: boolean;
  dismissedIds: Set<string>;
  readOnly?: boolean;
}

const TAX_RATE = 0.1215;

export const UnitCard: React.FC<UnitCardProps> = ({ 
  name, 
  budget, 
  unitPeriod,
  realBalance,
  manualDailyValue,
  deposits, 
  onToggleWeek, 
  isCompleted = false,
  onToggleCompleted,
  campaigns, 
  onClick,
  onShowDetails,
  isSelected, 
  dismissedIds,
  readOnly = false
}) => {
  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const estimatedTax = totalSpend * TAX_RATE;
  const totalCost = totalSpend + estimatedTax;
  
  const weeklyValue = budget / 4;
  
  // Cálculo de Aportes Acumulados: Carryover (realBalance) + Semanas Selecionadas
  const selectedWeeksCount = deposits.filter(d => d === true).length;
  const totalAportesFromWeeks = selectedWeeksCount * weeklyValue;
  
  // Saldo = (Carryover + Aportes de Semanas marcadas) - Gasto total (Investimento + Impostos)
  const remainingBudget = (realBalance + totalAportesFromWeeks) - totalCost;

  const totalSpendPercentage = budget > 0 ? (totalSpend / budget) * 100 : 0;
  const taxPercentage = budget > 0 ? (estimatedTax / budget) * 100 : 0;
  
  const isTrafficCompleted = (budget > 0 && totalCost >= budget);
  const isNearLimit = !isTrafficCompleted && budget > 0 && (budget - totalCost) <= 100;

  // Lógica de Alerta: Quando o Saldo (remainingBudget) for menor que o Valor Diário (manualDailyValue)
  const isLowBalance = manualDailyValue > 0 && remainingBudget < manualDailyValue && !isTrafficCompleted && !isCompleted;

  // Verifica se todas as 4 semanas estão selecionadas
  const allWeeksSelected = deposits.every(d => d === true);

  // Identifica a próxima semana não selecionada
  const nextWeekIndex = deposits.indexOf(false);

  // Cálculos de Tempo e Previsão
  const today = new Date();
  const currentDayOfMonth = today.getDate();
  
  // Cálculo da Previsão de Saldo Final baseado no consumo do valor diário manual
  const daysOfBudgetLeft = manualDailyValue > 0 ? Math.floor(remainingBudget / manualDailyValue) : 0;
  const predictionDate = new Date(today);
  predictionDate.setDate(today.getDate() + daysOfBudgetLeft);
  const predictionDay = predictionDate.getDate();

  // NOVA FÓRMULA SOLICITADA: Saldo / quantidade de dias restantes = Sugestão diária
  // Usando o período definido
  const startDay = unitPeriod?.start || 1;
  const endDay = unitPeriod?.end || 30;
  
  let daysRemaining = 0;
  if (currentDayOfMonth < startDay) {
    daysRemaining = endDay - startDay + 1;
  } else if (currentDayOfMonth <= endDay) {
    daysRemaining = endDay - currentDayOfMonth + 1;
  } else {
    daysRemaining = 0;
  }
  
  const dynamicSuggestedDaily = daysRemaining > 0 ? Math.max(0, remainingBudget / daysRemaining) : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val);

  const prefix = Object.entries(ESPACOLASER_UNITS).find(([_, val]) => val === name)?.[0] || 'EL';

  const activeAlerts = campaigns.filter(c => !dismissedIds.has(c.id));
  
  let unitStatus: OperationalStatus = 'VERDE';
  const hasRed = activeAlerts.some(c => c.operationalStatus === 'VERMELHO');
  const hasYellow = activeAlerts.some(c => c.operationalStatus === 'AMARELO');

  if (hasRed) unitStatus = 'VERMELHO';
  else if (hasYellow) unitStatus = 'AMARELO';
  else unitStatus = 'VERDE';

  const statusColors = {
    'VERDE': 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    'AMARELO': 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
    'VERMELHO': 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse',
    'NAO_INFORMADO': 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
  };

  const statusLabel = {
    'VERDE': 'Status',
    'AMARELO': 'Atenção',
    'VERMELHO': 'Crítico',
    'NAO_INFORMADO': 'Status'
  };

  const handleWeekClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (readOnly) return;
    onToggleWeek(idx);
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    onToggleCompleted?.();
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails?.();
  };

  // Define a cor do quadro de Valor Diário baseado no estado das semanas e do saldo
  const dailyValueBoxClass = isLowBalance 
    ? allWeeksSelected 
      ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' // Amarelo: Fim de mês
      : 'bg-red-500/10 border-red-500/40 text-red-500'       // Vermelho: Precisa de aporte
    : 'bg-slate-950/60 border-slate-800/80 group-hover:bg-slate-950';

  const dailyValueIconClass = isLowBalance 
    ? allWeeksSelected 
      ? 'text-amber-500' 
      : 'text-red-500' 
    : 'text-amber-500';

  const dailyValueTextClass = isLowBalance 
    ? allWeeksSelected 
      ? 'text-amber-500' 
      : 'text-red-500 animate-pulse' 
    : manualDailyValue > 0 ? 'text-sky-400' : 'text-slate-600';

  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer rounded-[2.5rem] p-8 border transition-all duration-500 relative overflow-hidden group shadow-sm hover:shadow-xl
        ${isSelected 
          ? 'border-sky-500 bg-sky-950/20 ring-4 ring-sky-500/10 scale-[1.01]' 
          : isTrafficCompleted || isCompleted
            ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/50' 
            : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/80'}`}
    >
      {/* Header Expandido */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 tracking-[0.2em] w-fit uppercase">
                {prefix.replace('EL-', '') || 'UNIDADE'}
            </span>
            <button 
              onClick={handleDetailsClick}
              className="text-[9px] font-black text-sky-400 bg-sky-950/30 px-3 py-1.5 rounded-xl border border-sky-500/20 uppercase hover:bg-sky-500 hover:text-white transition-all tracking-widest flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" /> Ver mais
            </button>
          </div>
          <h4 className={`text-xl font-black truncate max-w-[300px] uppercase tracking-tighter transition-colors ${isSelected ? 'text-sky-400' : (isTrafficCompleted || isCompleted) ? 'text-emerald-400' : 'text-slate-200'}`}>
            {name.split('/')[0].trim()}
          </h4>
          
          {/* Frase de Previsão de Saldo Final - Regra 1 */}
          {!isTrafficCompleted && !isCompleted && manualDailyValue > 0 && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 italic flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isLowBalance ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
              Previsão de Saldo Final: dia {predictionDay} | Faltam {daysOfBudgetLeft} Dias
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
              <div className={`w-4 h-4 rounded-full ${statusColors[unitStatus]}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase mt-1.5 tracking-widest">{statusLabel[unitStatus]}</span>
          </div>
          <button 
            onClick={handleCompleteClick}
            disabled={readOnly}
            className={`p-3 rounded-2xl border transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-950 border-slate-800 text-slate-700 hover:text-emerald-500 hover:border-emerald-500/30'} ${readOnly ? 'opacity-50 cursor-default' : ''}`}
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Coluna 1: Planejamento e Aportes */}
        <div className="space-y-6">
          {/* Blocos de Orçamento Diário */}
          <div className="grid grid-cols-2 gap-4">
             <div className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-colors border ${dailyValueBoxClass}`}>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5 ${isLowBalance ? (allWeeksSelected ? 'text-amber-400' : 'text-red-400') : 'text-slate-500'}`}>
                  <Zap className={`w-3.5 h-3.5 ${dailyValueIconClass}`} /> Valor Diário
                </span>
                <span className={`text-sm font-black ${isTrafficCompleted || isCompleted ? 'text-emerald-400' : dailyValueTextClass}`}>
                  {isTrafficCompleted || isCompleted ? 'Finalizado' : manualDailyValue > 0 ? formatCurrency(manualDailyValue) : 'Sem dados'}
                </span>
             </div>
             <div className="bg-slate-950/60 border border-emerald-500/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center group-hover:bg-slate-950 transition-colors">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <CalendarRange className="w-3.5 h-3.5" /> Sugestão Diária
                </span>
                <span className={`text-sm font-black ${isTrafficCompleted || isCompleted ? 'text-emerald-400' : dynamicSuggestedDaily > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {isTrafficCompleted || isCompleted ? 'Finalizado' : dynamicSuggestedDaily > 0 ? formatCurrency(dynamicSuggestedDaily) : 'Sem dados'}
                </span>
             </div>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Aportes Semanais ({formatCurrency(weeklyValue)})</p>
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((idx) => {
                // O alerta da semana só ocorre se o saldo estiver baixo E ainda houver semanas para aportar
                const isNextAlertWeek = isLowBalance && !allWeeksSelected && idx === nextWeekIndex;
                return (
                  <button
                    key={idx}
                    onClick={(e) => handleWeekClick(e, idx)}
                    disabled={readOnly}
                    className={`flex-1 h-12 rounded-xl border transition-all flex items-center justify-center group/week 
                      ${deposits[idx] 
                        ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' 
                        : isNextAlertWeek 
                          ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse shadow-lg shadow-red-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-600'} 
                      ${readOnly ? 'cursor-default' : ''}`}
                  >
                    {deposits[idx] ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className={`text-[10px] font-black ${isNextAlertWeek ? 'opacity-100' : 'opacity-40 group-hover/week:opacity-100'}`}>SEM {idx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna 2: Progresso e Finanças */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-slate-500">Investimento Total</span>
              <span className={isTrafficCompleted ? 'text-emerald-400' : isNearLimit ? 'text-amber-500' : 'text-slate-400'}>
                {totalSpendPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded-full flex overflow-hidden border-2 border-slate-800 p-0.5">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-l-full ${isTrafficCompleted ? 'bg-emerald-500' : 'bg-sky-500'}`} 
                style={{ width: `${Math.min(totalSpendPercentage, 100)}%` }} 
              />
              <div 
                className="h-full bg-amber-500 transition-all duration-1000 ease-out border-l border-slate-900/50" 
                style={{ width: `${Math.min(taxPercentage, 100 - totalSpendPercentage)}%` }} 
              />
            </div>
            <div className="flex justify-between items-end pt-1">
               <span className={`text-xl font-black leading-none ${isTrafficCompleted ? 'text-emerald-400' : 'text-slate-100'}`}>
                 {formatCurrency(totalCost)}
               </span>
               <span className="text-[10px] text-slate-500 font-bold">Meta: {formatCurrency(budget)}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex justify-between items-center">
              <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Imposto Estimado</span>
                  <span className="text-sm font-black text-amber-500">{formatCurrency(estimatedTax)}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isTrafficCompleted ? 'text-emerald-400' : isLowBalance ? (allWeeksSelected ? 'text-amber-500' : 'text-red-500') : isNearLimit ? 'text-amber-500' : 'text-slate-500'}`}>
                    {isTrafficCompleted ? 'Finalizado' : 'Saldo'}
                  </span>
                  <span className={`text-lg font-black ${isTrafficCompleted ? 'text-emerald-400' : remainingBudget < 0 ? 'text-red-500' : isLowBalance ? (allWeeksSelected ? 'text-amber-500' : 'text-red-500 animate-pulse') : isNearLimit ? 'text-amber-500' : 'text-emerald-400'}`}>
                    {isTrafficCompleted ? <Check className="w-6 h-6" /> : formatCurrency(remainingBudget)}
                  </span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
