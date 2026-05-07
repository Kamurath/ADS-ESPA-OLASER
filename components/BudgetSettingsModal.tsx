import React, { useState } from 'react';
import { X, Save, DollarSign, Target, CreditCard, CalendarRange, Zap, Download, Upload } from 'lucide-react';
import { UNIT_DISPLAY_ORDER } from '../types';

interface BudgetSettingsModalProps {
  currentBudgets: Record<string, number>;
  currentPeriods: Record<string, { start: number; end: number }>;
  currentRealBalances: Record<string, number>;
  currentManualDailyValues: Record<string, number>;
  onSave: (budgets: Record<string, number>, realBalances: Record<string, number>, periods: Record<string, { start: number; end: number }>, manualDailyValues: Record<string, number>) => void;
  onClose: () => void;
}

type TabType = 'BUDGET' | 'REAL_BALANCE';

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({ currentBudgets, currentPeriods, currentRealBalances, currentManualDailyValues, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('BUDGET');
  const [tempBudgets, setTempBudgets] = useState<Record<string, number>>({ ...currentBudgets });
  const [tempPeriods, setTempPeriods] = useState<Record<string, { start: number; end: number }>>({ ...currentPeriods });
  const [tempRealBalances, setTempRealBalances] = useState<Record<string, number>>({ ...currentRealBalances });
  const [tempManualDailyValues, setTempManualDailyValues] = useState<Record<string, number>>({ ...currentManualDailyValues });

  const handleBudgetChange = (unit: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setTempBudgets(prev => ({ ...prev, [unit]: numericValue }));
  };

  const handlePeriodChange = (unit: string, field: 'start' | 'end', value: string) => {
    const numericValue = parseInt(value) || 0;
    setTempPeriods(prev => ({
      ...prev,
      [unit]: {
        ...(prev[unit] || { start: 1, end: 30 }),
        [field]: numericValue
      }
    }));
  };

  const handleManualDailyValueChange = (unit: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setTempManualDailyValues(prev => ({ ...prev, [unit]: numericValue }));
  };

  const handleBalanceChange = (unit: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setTempRealBalances(prev => ({ ...prev, [unit]: numericValue }));
  };

  const handleSave = () => {
    onSave(tempBudgets, tempRealBalances, tempPeriods, tempManualDailyValues);
  };

  const handleExport = () => {
    const backupKeys = [
      'ads_monitor_dismissed_ids',
      'ads_monitor_unit_budgets',
      'ads_monitor_unit_periods',
      'ads_monitor_weekly_deposits',
      'ads_monitor_real_balances',
      'ads_monitor_completed_units_manual',
      'ads_monitor_manual_daily_values',
      'ads_monitor_monthly_history',
      'ads_monitor_active_month_date',
      'ads_monitor_unlocked_history_months'
    ];

    const backupData: Record<string, string | null> = {};
    backupKeys.forEach(key => {
      backupData[key] = localStorage.getItem(key);
    });

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ads_monitor_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as Record<string, string | null>;
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null) {
            localStorage.setItem(key, value);
          }
        });
        alert('Backup importado com sucesso! O aplicativo será recarregado.');
        window.location.reload();
      } catch (err) {
        alert('Erro ao importar backup. Verifique o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500 rounded-2xl shadow-lg">
              <SettingsIcon tab={activeTab} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Configurações</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {activeTab === 'BUDGET' ? 'Defina o objetivo mensal, período e valor diário' : 'Saldo acumulado que sobrou do mês anterior'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pt-6 flex gap-2">
          <button 
            onClick={() => setActiveTab('BUDGET')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'BUDGET' ? 'bg-sky-500/10 border-sky-500/50 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
          >
            <Target className="w-3.5 h-3.5" /> Aporte e Período
          </button>
          <button 
            onClick={() => setActiveTab('REAL_BALANCE')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'REAL_BALANCE' ? 'bg-sky-500/10 border-sky-500/50 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Saldo restante
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {UNIT_DISPLAY_ORDER.map(unit => (
              <div key={unit} className="bg-slate-950/20 p-4 rounded-[1.5rem] border border-slate-800/50 space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">{unit.split('/')[0].trim()}</label>
                
                {activeTab === 'BUDGET' ? (
                  <div className="space-y-3">
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-500">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <input 
                        type="number" 
                        value={tempBudgets[unit] || ''} 
                        onChange={(e) => handleBudgetChange(unit, e.target.value)}
                        placeholder="Aporte Mensal"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-5 text-sm font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-slate-500">
                          <CalendarRange className="w-4 h-4" />
                        </div>
                        <input 
                          type="number" 
                          value={tempPeriods[unit]?.start || ''} 
                          onChange={(e) => handlePeriodChange(unit, 'start', e.target.value)}
                          placeholder="Dia Início"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-5 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                        />
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-slate-500">
                          <CalendarRange className="w-4 h-4" />
                        </div>
                        <input 
                          type="number" 
                          value={tempPeriods[unit]?.end || ''} 
                          onChange={(e) => handlePeriodChange(unit, 'end', e.target.value)}
                          placeholder="Dia Término"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-5 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-500">
                        <Zap className="w-4 h-4" />
                      </div>
                      <input 
                        type="number" 
                        value={tempManualDailyValues[unit] || ''} 
                        onChange={(e) => handleManualDailyValueChange(unit, e.target.value)}
                        placeholder="Valor Diário (Manual)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-5 text-sm font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-slate-500">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <input 
                      type="number" 
                      value={tempRealBalances[unit] || ''} 
                      onChange={(e) => handleBalanceChange(unit, e.target.value)}
                      placeholder="Saldo restante do mês anterior"
                      className="w-full bg-slate-950 border border-emerald-500/20 rounded-2xl py-3 pl-10 pr-5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-900/30 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Backup
            </button>
            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button 
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all"
              >
                <Upload className="w-3.5 h-3.5" /> Importar Backup
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
            <button 
              onClick={handleSave}
              className="px-10 py-3 bg-sky-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2.5 hover:bg-sky-500 transition-all shadow-xl shadow-sky-500/20 border border-sky-400/20"
            >
              <Save className="w-4 h-4" /> Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = ({ tab }: { tab: TabType }) => {
  if (tab === 'BUDGET') return <Target className="w-6 h-6 text-white" />;
  return <CreditCard className="w-6 h-6 text-white" />;
};