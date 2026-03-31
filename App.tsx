
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RefreshCw, LayoutDashboard, FilterX, AlertTriangle, ShieldCheck, AlertCircle, Monitor, Settings, Database, ChevronLeft, ChevronRight, Lock, Unlock, X, TrendingUp, Target, BarChart3, Users, MessageSquare, Zap, Layers, Eye, MousePointer2, Percent, DollarSign, Calendar, ExternalLink, CreditCard
} from 'lucide-react';
import { AdSet, UNIT_BUDGETS, UNIT_DISPLAY_ORDER, IssueSeverity, CampaignStatus, ChatMessage, RawDailyData, ESPACOLASER_UNITS } from './types';
import { askAssistant } from './services/geminiService';
import { fetchCampaignsFromSheet } from './services/sheetService';
import { UnitCard } from './components/UnitCard';
import { InvestmentCard } from './components/InvestmentCard';
import { IssueModal } from './components/IssueModal';
import { AiAssistant } from './components/AiAssistant';
import { BudgetSettingsModal } from './components/BudgetSettingsModal';
import { MonthConfirmationModal } from './components/MonthConfirmationModal';
import { PasswordModal } from './components/PasswordModal';
import { StatusBadge } from './components/StatusBadge';

const STORAGE_KEY = 'ads_monitor_dismissed_ids';
const BUDGETS_STORAGE_KEY = 'ads_monitor_unit_budgets';
const PERIODS_STORAGE_KEY = 'ads_monitor_unit_periods';
const DEPOSITS_STORAGE_KEY = 'ads_monitor_weekly_deposits';
const REAL_BALANCES_STORAGE_KEY = 'ads_monitor_real_balances';
const COMPLETED_UNITS_KEY = 'ads_monitor_completed_units_manual';
const MANUAL_DAILY_VALUES_KEY = 'ads_monitor_manual_daily_values';
const HISTORY_STORAGE_KEY = 'ads_monitor_monthly_history';
const ACTIVE_MONTH_KEY = 'ads_monitor_active_month_date';
const UNLOCKED_MONTHS_KEY = 'ads_monitor_unlocked_history_months';
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1DuYsrl5yzoc_SpU9yKg2O5JFOygbij8MQuKTOZQ4CAw/edit?usp=sharing";

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface MonthlyHistoryEntry {
  campaigns: AdSet[];
  dailyData?: RawDailyData[];
  unitBudgets: Record<string, number>;
  unitPeriods: Record<string, { start: number; end: number }>;
  realBalances: Record<string, number>;
  weeklyDeposits: Record<string, boolean[]>;
  completedUnits: string[];
  manualDailyValues?: Record<string, number>;
}

export default function App() {
  const [activeMonthDate, setActiveMonthDate] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_MONTH_KEY);
    return saved || "2026-01";
  });
  
  const [viewedMonthDate, setViewedMonthDate] = useState<string>(activeMonthDate);
  const [selectedDetailUnit, setSelectedDetailUnit] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_MONTH_KEY);
    if (saved) setViewedMonthDate(saved);
  }, []);

  // Timer para o relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = useMemo(() => {
    const day = currentTime.getDate();
    const month = MONTHS[currentTime.getMonth()];
    const year = currentTime.getFullYear();
    const time = currentTime.toLocaleTimeString('pt-BR');
    return `${day} de ${month} de ${year} | ${time}`;
  }, [currentTime]);

  const [history, setHistory] = useState<Record<string, MonthlyHistoryEntry>>(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    try {
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [unlockedMonths, setUnlockedMonths] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(UNLOCKED_MONTHS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Erro ao carregar unlockedMonths do cache:", e);
    }
    return new Set();
  });

  const [campaigns, setCampaigns] = useState<AdSet[]>([]);
  const [dailyData, setDailyData] = useState<RawDailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isMonthConfirmOpen, setIsMonthConfirmOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Inicializa sem pré-configuração (vazio) conforme solicitado
  const [unitBudgets, setUnitBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(BUDGETS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [unitPeriods, setUnitPeriods] = useState<Record<string, { start: number; end: number }>>(() => {
    const saved = localStorage.getItem(PERIODS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [manualDailyValues, setManualDailyValues] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(MANUAL_DAILY_VALUES_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [realBalances, setRealBalances] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(REAL_BALANCES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [weeklyDeposits, setWeeklyDeposits] = useState<Record<string, boolean[]>>(() => {
    const saved = localStorage.getItem(DEPOSITS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {}
    return new Set();
  });

  const [completedUnits, setCompletedUnits] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(COMPLETED_UNITS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {}
    return new Set();
  });

  const isViewingHistory = viewedMonthDate !== activeMonthDate;
  const isMonthUnlocked = (unlockedMonths instanceof Set) ? unlockedMonths.has(viewedMonthDate) : false;
  const isReadOnly = isViewingHistory && !isMonthUnlocked;

  const loadData = useCallback(async () => {
    if (isReadOnly) return;
    setLoading(true);
    try {
      const data = await fetchCampaignsFromSheet();
      const validCampaigns = data.adSets.filter(c => UNIT_DISPLAY_ORDER.includes(c.accountName));
      
      if (isViewingHistory) {
        setHistory(prev => {
          const current = prev[viewedMonthDate];
          if (!current) return prev;
          return {
            ...prev,
            [viewedMonthDate]: { ...current, campaigns: validCampaigns, dailyData: data.rawDailyData }
          };
        });
      } else {
        setCampaigns(validCampaigns);
        setDailyData(data.rawDailyData);
      }
      
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
      if (chatHistory.length === 0) {
          setChatHistory([{ role: 'assistant', content: "Olá! Sou seu Consultor de Performance. Analisei as campanhas de " + formatMonthLabel(activeMonthDate) + ". Como posso ajudar?", timestamp: new Date() }]);
      }
    } catch (err) {
      console.error("Erro na carga:", err);
    } finally {
      setLoading(false);
    }
  }, [chatHistory.length, isReadOnly, isViewingHistory, viewedMonthDate, activeMonthDate]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (loading || campaigns.length === 0) return;
    
    setDismissedIds(prev => {
      let changed = false;
      const next = new Set(prev);
      
      for (const id of prev) {
        const ad = campaigns.find(c => c.id === id);
        if (ad && ad.operationalStatus === 'VERDE' && ad.status === CampaignStatus.ACTIVE) {
          next.delete(id);
          changed = true;
        }
      }
      
      return changed ? next : prev;
    });
  }, [campaigns, loading]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissedIds))); }, [dismissedIds]);
  useEffect(() => { localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(unitBudgets)); }, [unitBudgets]);
  useEffect(() => { localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(unitPeriods)); }, [unitPeriods]);
  useEffect(() => { localStorage.setItem(MANUAL_DAILY_VALUES_KEY, JSON.stringify(manualDailyValues)); }, [manualDailyValues]);
  useEffect(() => { localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(weeklyDeposits)); }, [weeklyDeposits]);
  useEffect(() => { localStorage.setItem(REAL_BALANCES_STORAGE_KEY, JSON.stringify(realBalances)); }, [realBalances]);
  useEffect(() => { localStorage.setItem(COMPLETED_UNITS_KEY, JSON.stringify(Array.from(completedUnits))); }, [completedUnits]);
  useEffect(() => { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(ACTIVE_MONTH_KEY, activeMonthDate); }, [activeMonthDate]);
  useEffect(() => { localStorage.setItem(UNLOCKED_MONTHS_KEY, JSON.stringify(Array.from(unlockedMonths))); }, [unlockedMonths]);

  function formatMonthLabel(dateStr: string) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const monthIndex = parseInt(parts[1]) - 1;
    return `${MONTHS[monthIndex]} de ${year}`;
  }

  const handleSync = async () => {
    if (viewedMonthDate !== activeMonthDate) {
      setViewedMonthDate(activeMonthDate);
    } else {
      await loadData();
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = viewedMonthDate.split('-').map(Number);
    if (direction === 'prev') {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
      const prevDateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
      if (prevYear < 2026 || (prevYear === 2026 && prevMonth < 1)) return;
      setViewedMonthDate(prevDateStr);
    } else {
      if (viewedMonthDate === activeMonthDate) {
        if (completedUnits.size < 12) return;
        setIsMonthConfirmOpen(true);
      } else {
        let nextMonth = month + 1;
        let nextYear = year;
        if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
        const nextDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
        setViewedMonthDate(nextDateStr);
      }
    }
  };

  const handleConfirmNextMonth = () => {
    const [year, month] = activeMonthDate.split('-').map(Number);
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    const currentSnapshot: MonthlyHistoryEntry = {
      campaigns: [...campaigns],
      dailyData: [...dailyData],
      unitBudgets: { ...unitBudgets },
      unitPeriods: { ...unitPeriods },
      realBalances: { ...realBalances },
      weeklyDeposits: { ...weeklyDeposits },
      completedUnits: Array.from(completedUnits),
      manualDailyValues: { ...manualDailyValues }
    };
    setHistory(prev => ({ ...prev, [activeMonthDate]: currentSnapshot }));
    
    // Reseta configurações financeiras para o novo mês (sem pré-configuração)
    setWeeklyDeposits({});
    setCompletedUnits(new Set());
    setRealBalances({});
    setUnitBudgets({});
    setUnitPeriods({});
    setManualDailyValues({});
    
    setCampaigns([]);
    setDailyData([]);
    setChatHistory([]);
    setActiveMonthDate(nextMonthStr);
    setViewedMonthDate(nextMonthStr);
    setIsMonthConfirmOpen(false);
  };

  const displayData = useMemo(() => {
    if (isViewingHistory) {
      const hist = history[viewedMonthDate];
      if (hist) {
        return {
          campaigns: hist.campaigns,
          dailyData: hist.dailyData || [],
          budgets: hist.unitBudgets,
          periods: hist.unitPeriods || {},
          deposits: hist.weeklyDeposits,
          balances: hist.realBalances,
          manualDailyValues: hist.manualDailyValues || {},
          completed: new Set(hist.completedUnits)
        };
      }
      return null;
    }
    return {
      campaigns,
      dailyData,
      budgets: unitBudgets,
      periods: unitPeriods,
      deposits: weeklyDeposits,
      balances: realBalances,
      manualDailyValues: manualDailyValues,
      completed: completedUnits
    };
  }, [viewedMonthDate, activeMonthDate, history, campaigns, dailyData, unitBudgets, unitPeriods, weeklyDeposits, realBalances, manualDailyValues, completedUnits]);

  const activeCampaignsForAlerts = useMemo(() => 
    (displayData?.campaigns || []).filter(c => !dismissedIds.has(c.id)),
    [displayData?.campaigns, dismissedIds]
  );

  const criticalIssues = useMemo(() => activeCampaignsForAlerts.filter(c => c.operationalStatus === 'VERMELHO').sort((a, b) => b.spend - a.spend), [activeCampaignsForAlerts]);
  const warningIssues = useMemo(() => activeCampaignsForAlerts.filter(c => c.operationalStatus === 'AMARELO').sort((a, b) => b.spend - a.spend), [activeCampaignsForAlerts]);
  const pausedIssues = useMemo(() => activeCampaignsForAlerts.filter(c => c.status === CampaignStatus.PAUSED).sort((a, b) => b.spend - a.spend), [activeCampaignsForAlerts]);
  
  const systemStatus: IssueSeverity = useMemo(() => {
    if (criticalIssues.length > 0) return 'CRITICAL';
    if (warningIssues.length > 0) return 'WARNING';
    return 'SAFE';
  }, [criticalIssues, warningIssues]);

  const campaignsByUnit = useMemo(() => {
    const groups: Record<string, AdSet[]> = {};
    UNIT_DISPLAY_ORDER.forEach(u => groups[u] = []);
    (displayData?.campaigns || []).forEach(c => { if (groups[c.accountName]) groups[c.accountName].push(c); });
    return groups;
  }, [displayData?.campaigns]);

  const viewStats = useMemo(() => {
    const c = selectedUnit ? (displayData?.campaigns || []).filter(item => item.accountName === selectedUnit) : (displayData?.campaigns || []);
    return { spend: c.reduce((acc, curr) => acc + curr.spend, 0) };
  }, [displayData?.campaigns, selectedUnit]);

  const totalBudget = useMemo(() => 
    selectedUnit ? (displayData?.budgets[selectedUnit] || 0) : Object.values(displayData?.budgets || {}).reduce((a: number, b: number) => a + b, 0), 
    [selectedUnit, displayData?.budgets]
  );

  const handleSendMessage = async (msg: string) => {
      if (!msg.trim() || isChatLoading || isReadOnly) return;
      const question = msg;
      setUserQuestion('');
      setIsChatLoading(true);
      setChatHistory(prev => [...prev, { role: 'user', content: question, timestamp: new Date() }]);
      try {
          const contextCampaigns = isViewingHistory ? (history[viewedMonthDate]?.campaigns || []) : campaigns;
          const response = await askAssistant(contextCampaigns, question);
          const relatedAds = response.relatedAdIds ? response.relatedAdIds.map(id => contextCampaigns.find(c => c.id === id)).filter((c): c is AdSet => !!c) : [];
          setChatHistory(prev => [...prev, { role: 'assistant', content: response.answer, relatedAds, timestamp: new Date() }]);
      } catch (error) {
          setChatHistory(prev => [...prev, { role: 'assistant', content: "Desculpe, tive um erro ao processar. Tente novamente.", timestamp: new Date() }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const handleToggleWeek = (unit: string, weekIndex: number) => {
    if (isReadOnly) return;
    if (isViewingHistory) {
      setHistory(prev => {
        const hist = { ...prev };
        const monthData = { ...hist[viewedMonthDate] };
        const deposits = { ...monthData.weeklyDeposits };
        const unitWeeks = [...(deposits[unit] || [false, false, false, false])];
        unitWeeks[weekIndex] = !unitWeeks[weekIndex];
        deposits[unit] = unitWeeks;
        monthData.weeklyDeposits = deposits;
        hist[viewedMonthDate] = monthData;
        return hist;
      });
    } else {
      setWeeklyDeposits(prev => {
        const current = prev[unit] || [false, false, false, false];
        const next = [...current];
        next[weekIndex] = !next[weekIndex];
        return { ...prev, [unit]: next };
      });
    }
  };

  const handleToggleUnitCompleted = (unit: string) => {
    if (isReadOnly) return;
    if (isViewingHistory) {
      setHistory(prev => {
        const hist = { ...prev };
        const monthData = { ...hist[viewedMonthDate] };
        const completed = new Set(monthData.completedUnits);
        if (completed.has(unit)) completed.delete(unit);
        else completed.add(unit);
        monthData.completedUnits = Array.from(completed);
        hist[viewedMonthDate] = monthData;
        return hist;
      });
    } else {
      setCompletedUnits(prev => {
        const next = new Set(prev);
        if (next.has(unit)) next.delete(unit);
        else next.add(unit);
        return next;
      });
    }
  };

  const handleSaveBudgets = (b: Record<string, number>, r: Record<string, number>, p?: Record<string, { start: number; end: number }>, m?: Record<string, number>) => {
    if (isViewingHistory) {
      setHistory(prev => {
        const hist = { ...prev };
        const monthData = { ...hist[viewedMonthDate] };
        monthData.unitBudgets = b;
        monthData.realBalances = r;
        if (p) monthData.unitPeriods = p;
        if (m) monthData.manualDailyValues = m;
        hist[viewedMonthDate] = monthData;
        return hist;
      });
    } else {
      setUnitBudgets(b);
      setRealBalances(r);
      if (p) setUnitPeriods(p);
      if (m) setManualDailyValues(m);
    }
    setIsBudgetModalOpen(false);
  };

  const handleUnlockMonth = (password: string) => {
    if (password === '1346') {
      setUnlockedMonths(prev => new Set(prev).add(viewedMonthDate));
      setIsPasswordModalOpen(false);
    }
  };

  const handleLockMonth = () => {
    setUnlockedMonths(prev => {
      const next = new Set(prev);
      next.delete(viewedMonthDate);
      return next;
    });
  };

  const getNextMonthLabel = () => {
    const [year, month] = activeMonthDate.split('-').map(Number);
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    return formatMonthLabel(nextMonthStr);
  };

  const completedCount = displayData?.completed.size || 0;
  const totalUnitsCount = UNIT_DISPLAY_ORDER.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans pb-32">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 h-20 flex items-center px-4">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-600 rounded-xl shadow-lg"><Monitor className="w-6 h-6 text-white" /></div>
                <div>
                  <h1 className="text-xl font-black text-slate-50 uppercase tracking-tighter">ADS<span className="text-sky-500">ESPAÇOLASER</span></h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${loading && (viewedMonthDate === activeMonthDate) ? 'bg-sky-500 animate-pulse' : isMonthUnlocked ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`} />
                      {isViewingHistory ? (isMonthUnlocked ? 'Histórico Reabilitado' : 'Histórico Congelado') : (loading ? 'Sincronizando...' : `Sincronizado: ${lastUpdated}`)}
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
                <button onClick={() => navigateMonth('prev')} disabled={viewedMonthDate === '2026-01'} className="p-2 hover:bg-slate-800 disabled:opacity-20 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronLeft className="w-5 h-5" /></button>
                <div className="px-4 min-w-[140px] text-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">{formatMonthLabel(viewedMonthDate)}</span>
                </div>
                <button onClick={() => navigateMonth('next')} disabled={viewedMonthDate === activeMonthDate && (displayData?.completed?.size || 0) < 12} className={`p-2 rounded-xl transition-all ${viewedMonthDate === activeMonthDate ? 'text-slate-700 opacity-40' : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'}`}><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex flex-col items-end leading-tight pr-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800/50">
                  {formattedDateTime}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsAlertModalOpen(true)} className={`px-5 py-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${systemStatus === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : systemStatus === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800'}`}>
                  {systemStatus === 'CRITICAL' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : systemStatus === 'WARNING' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  <div className="flex flex-col items-start leading-none">
                      <span className="text-[8px] opacity-70 font-bold uppercase text-slate-500">Sistema</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{systemStatus === 'CRITICAL' ? 'ALERTA CRÍTICO' : systemStatus === 'WARNING' ? 'Atenção' : 'Operacional'}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all group" title="Abrir Planilha"><Database className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" /></a>
                  <button onClick={() => !isReadOnly && setIsBudgetModalOpen(true)} disabled={isReadOnly} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-20"><Settings className="w-5 h-5 text-slate-500" /></button>
                  <button onClick={handleSync} disabled={loading} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-20"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-sky-500' : 'text-slate-500'}`} /></button>
                </div>
              </div>
            </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <section className="space-y-6">
          <InvestmentCard spend={viewStats.spend} budget={totalBudget} />
          
          {/* Botões de Seleção de Unidade (Prefixos) */}
          <div className="flex flex-wrap justify-center gap-2 pb-4">
            {Object.entries(ESPACOLASER_UNITS).map(([prefix, fullName]) => {
              const unitCampaigns = campaignsByUnit[fullName] || [];
              const unitSpend = unitCampaigns.reduce((acc, c) => acc + c.spend, 0);
              const unitBudget = displayData?.budgets[fullName] || 0;
              const unitTotalCost = unitSpend * 1.1215;
              const isUnitTrafficCompleted = unitBudget > 0 && unitTotalCost >= unitBudget;
              const isManuallyCompleted = displayData?.completed.has(fullName);

              return (
                <button
                  key={prefix}
                  onClick={() => setSelectedUnit(selectedUnit === fullName ? null : fullName)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-sm hover:shadow-md ${
                    selectedUnit === fullName 
                      ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20 ring-2 ring-sky-500/10' 
                      : (isUnitTrafficCompleted || isManuallyCompleted)
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {prefix}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <LayoutDashboard className="w-5 h-5 text-sky-500" />
                 <h2 className="text-slate-400 font-black uppercase text-xs tracking-widest">Monitorando {totalUnitsCount} unidades {completedCount > 0 && ` | ${completedCount} concluídas`}</h2>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {UNIT_DISPLAY_ORDER.map(unit => (
               <UnitCard 
                key={unit} 
                name={unit} 
                budget={displayData?.budgets[unit] || 0} 
                unitPeriod={displayData?.periods[unit] || { start: 1, end: 30 }} 
                realBalance={displayData?.balances[unit] || 0} 
                manualDailyValue={displayData?.manualDailyValues[unit] || 0}
                deposits={displayData?.deposits[unit] || [false, false, false, false]} 
                onToggleWeek={(idx) => handleToggleWeek(unit, idx)} 
                isCompleted={displayData?.completed.has(unit)} 
                onToggleCompleted={() => handleToggleUnitCompleted(unit)} 
                campaigns={campaignsByUnit[unit] || []} 
                isSelected={selectedUnit === unit} 
                onClick={() => setSelectedUnit(selectedUnit === unit ? null : unit)} 
                onShowDetails={() => setSelectedDetailUnit(unit)}
                dismissedIds={dismissedIds} 
                readOnly={isReadOnly} 
              />
             ))}
           </div>
        </section>
        {!isReadOnly && <section className="pt-8"><AiAssistant history={chatHistory} onSendMessage={handleSendMessage} isLoading={isChatLoading} userInput={userQuestion} setUserInput={setUserQuestion} /></section>}
      </main>
      
      {/* Modais existentes */}
      {isAlertModalOpen && <IssueModal issues={[...criticalIssues, ...warningIssues, ...pausedIssues]} onDismiss={isReadOnly ? () => {} : (id) => setDismissedIds(prev => new Set([...prev, ...(Array.isArray(id) ? id : [id])]))} onClose={() => setIsAlertModalOpen(false)} />}
      {isBudgetModalOpen && <BudgetSettingsModal currentBudgets={isViewingHistory ? (history[viewedMonthDate]?.unitBudgets || {}) : unitBudgets} currentPeriods={isViewingHistory ? (history[viewedMonthDate]?.unitPeriods || {}) : unitPeriods} currentRealBalances={isViewingHistory ? (history[viewedMonthDate]?.realBalances || {}) : realBalances} currentManualDailyValues={isViewingHistory ? (history[viewedMonthDate]?.manualDailyValues || {}) : manualDailyValues} onSave={handleSaveBudgets} onClose={() => setIsBudgetModalOpen(false)} />}
      {isMonthConfirmOpen && <MonthConfirmationModal monthLabel={getNextMonthLabel()} onConfirm={handleConfirmNextMonth} onClose={() => setIsMonthConfirmOpen(false)} />}
      {isPasswordModalOpen && <PasswordModal onConfirm={handleUnlockMonth} onClose={() => setIsPasswordModalOpen(false)} />}

      {/* Modal de Detalhes da Unidade (Ver mais) */}
      {selectedDetailUnit && (
        <UnitDetailModal 
          unitName={selectedDetailUnit} 
          campaigns={campaignsByUnit[selectedDetailUnit] || []} 
          budget={displayData?.budgets[selectedDetailUnit] || 0}
          unitPeriod={displayData?.periods[selectedDetailUnit] || { start: 1, end: 30 }}
          realBalance={displayData?.balances[selectedDetailUnit] || 0}
          manualDailyValue={displayData?.manualDailyValues[selectedDetailUnit] || 0}
          deposits={displayData?.deposits[selectedDetailUnit] || [false, false, false, false]}
          onClose={() => setSelectedDetailUnit(null)} 
        />
      )}
    </div>
  );
}

// Componente Local para Detalhes Completos (Ver mais)
const UnitDetailModal = ({ 
  unitName, 
  campaigns, 
  budget, 
  unitPeriod, 
  realBalance, 
  manualDailyValue, 
  deposits,
  onClose 
}: { 
  unitName: string, 
  campaigns: AdSet[], 
  budget: number,
  unitPeriod: { start: number; end: number },
  realBalance: number,
  manualDailyValue: number,
  deposits: boolean[],
  onClose: () => void 
}) => {
  const [detailMode, setDetailMode] = useState<'CONJUNTO' | 'ANUNCIO'>('ANUNCIO');
  const [selectedAdForFullView, setSelectedAdForFullView] = useState<AdSet | null>(null);

  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const estimatedTax = totalSpend * 0.1215;
  const totalCost = totalSpend + estimatedTax;
  const totalConversations = campaigns.reduce((acc, c) => acc + c.conversations, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalReach = campaigns.reduce((acc, c) => acc + c.reach, 0);
  const avgCtr = campaigns.length > 0 ? campaigns.reduce((acc, c) => acc + c.ctr, 0) / campaigns.length : 0;
  const cpl = totalConversations > 0 ? totalCost / totalConversations : 0;
  
  const weeklyValue = budget / 4;
  const selectedWeeksCount = deposits.filter(d => d === true).length;
  const totalAportesFromWeeks = selectedWeeksCount * weeklyValue;
  
  const remainingBudget = (realBalance + totalAportesFromWeeks) - totalCost;

  // Cálculo de Sugestão Diária
  const today = new Date();
  const currentDayOfMonth = today.getDate();
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
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const adSetsGrouped = useMemo(() => {
    const groups: Record<string, { name: string, spend: number, conv: number, impressions: number, reach: number, ads: AdSet[] }> = {};
    campaigns.forEach(c => {
      if (!groups[c.adSetName]) {
        groups[c.adSetName] = { name: c.adSetName, spend: 0, conv: 0, impressions: 0, reach: 0, ads: [] };
      }
      groups[c.adSetName].spend += c.spend;
      groups[c.adSetName].conv += c.conversations;
      groups[c.adSetName].impressions += c.impressions;
      groups[c.adSetName].reach += c.reach;
      groups[c.adSetName].ads.push(c);
    });
    return Object.values(groups).sort((a, b) => b.spend - a.spend);
  }, [campaigns]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-7xl h-full md:h-[95vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Detalhado */}
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-sky-600 rounded-2xl shadow-xl shadow-sky-500/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{unitName}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-black text-sky-500 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-xl border border-sky-500/20">Monitoramento Full Detail</span>
                <span className="text-xs font-bold text-slate-500">Métricas Consolidadas e Detalhamento</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Grid de Informações Detalhadas */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          
          {/* Dashboard Financeiro Ampliado (Seção Pedida: "informações financeiras... de forma mais visível - maior") */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
             <BigStatCard 
                label="Gasto Total (+Imposto)" 
                value={formatCurrency(totalCost)} 
                subValue={`Investido: ${formatCurrency(totalSpend)}`}
                icon={DollarSign}
                color="text-sky-400"
                progress={(totalCost / budget) * 100}
             />
             <BigStatCard 
                label="Aporte Mensal (Meta)" 
                value={formatCurrency(budget)} 
                subValue={`Período: Dia ${unitPeriod.start} ao ${unitPeriod.end}`}
                icon={Target}
                color="text-slate-200"
             />
             <BigStatCard 
                label="Saldo Disponível" 
                value={formatCurrency(remainingBudget)} 
                subValue={realBalance > 0 ? 'Saldo Real + Aportes' : 'Saldo Estimado p/ Aporte'}
                icon={CreditCard}
                color={remainingBudget < 0 ? 'text-red-400' : 'text-emerald-400'}
             />
             <BigStatCard 
                label="Valor Diário (Manual)" 
                value={formatCurrency(manualDailyValue)} 
                subValue={manualDailyValue > 0 ? 'Veiculação Ativa' : 'Sem definição'}
                icon={Zap}
                color="text-amber-500"
             />
             <BigStatCard 
                label="Sugestão Diária" 
                value={formatCurrency(dynamicSuggestedDaily)} 
                subValue={daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Período encerrado'}
                icon={Calendar}
                color="text-emerald-500"
             />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-y border-slate-800/50">
            <MetricBox icon={Eye} label="Impressões" value={totalImpressions.toLocaleString('pt-BR')} />
            <MetricBox icon={Users} label="Alcance" value={totalReach.toLocaleString('pt-BR')} />
            <MetricBox icon={MessageSquare} label="Conversas" value={totalConversations.toLocaleString('pt-BR')} />
            <MetricBox icon={MousePointer2} label="CPL Médio" value={formatCurrency(cpl)} variant={cpl > 15 ? 'red' : 'emerald'} />
          </div>

          {/* Seção de Detalhamento [Conjunto | Anúncio] */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-sky-500" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Detalhamento Operacional</h3>
              </div>
              
              <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex">
                 <button 
                  onClick={() => setDetailMode('CONJUNTO')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${detailMode === 'CONJUNTO' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Conjuntos
                 </button>
                 <button 
                  onClick={() => setDetailMode('ANUNCIO')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${detailMode === 'ANUNCIO' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Anúncios
                 </button>
              </div>
            </div>

            <div className="space-y-4">
              {detailMode === 'ANUNCIO' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {campaigns.map(ad => (
                    <button 
                      key={ad.id} 
                      onClick={() => setSelectedAdForFullView(ad)}
                      className="bg-slate-950/40 border border-slate-800 rounded-3xl p-5 hover:bg-slate-800/40 transition-all group flex items-center gap-6 text-left w-full"
                    >
                      <div className="w-20 h-20 bg-slate-900 rounded-2xl overflow-hidden shrink-0 border border-slate-800 group-hover:border-sky-500/30 transition-all">
                        {ad.thumbnailUrl ? (
                          <img src={ad.thumbnailUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20"><Monitor className="w-8 h-8" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[11px] font-black text-slate-200 uppercase truncate group-hover:text-sky-400 transition-colors pr-4">{ad.name}</h4>
                          <StatusBadge status={ad.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <MiniMetric label="Gasto" value={formatCurrency(ad.spend)} />
                          <MiniMetric label="Conversas" value={ad.conversations.toString()} />
                          <MiniMetric label="CPL Real" value={formatCurrency(ad.conversations > 0 ? (ad.spend * 1.1215) / ad.conversations : 0)} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {adSetsGrouped.map(group => (
                    <div key={group.name} className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 hover:bg-slate-800/40 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight">{group.name}</h4>
                          <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">{group.ads.length} anúncios neste conjunto</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-sky-400 uppercase tracking-widest">{formatCurrency(group.spend * 1.1215)} total</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <MetricBox label="Gasto" value={formatCurrency(group.spend)} size="sm" />
                        <MetricBox label="Impressões" value={group.impressions.toLocaleString('pt-BR')} size="sm" />
                        <MetricBox label="Alcance" value={group.reach.toLocaleString('pt-BR')} size="sm" />
                        <MetricBox label="Conversas" value={group.conv.toLocaleString('pt-BR')} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Visualização Completa do Anúncio (Pedida: "Ao selecionar um anúncio, ele deve ser mostrado por completo") */}
      {selectedAdForFullView && (
        <AdFullViewModal ad={selectedAdForFullView} onClose={() => setSelectedAdForFullView(null)} />
      )}
    </div>
  );
};

// Componentes auxiliares para o modal de detalhes
const BigStatCard = ({ label, value, subValue, icon: Icon, color, progress }: { label: string, value: string, subValue: string, icon: any, color: string, progress?: number }) => (
  <div className="bg-slate-950/40 border border-slate-800 p-8 rounded-[2.5rem] space-y-4 group hover:bg-slate-900 transition-all">
    <div className="flex items-center justify-between">
      <div className={`p-3 bg-slate-900 rounded-2xl border border-slate-800 group-hover:scale-110 transition-transform ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      {progress !== undefined && (
        <span className="text-xs font-black text-slate-500">{progress.toFixed(0)}%</span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black tracking-tighter ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-600 uppercase mt-2">{subValue}</p>
    </div>
    {progress !== undefined && (
      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
        <div className={`h-full ${color.replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    )}
  </div>
);

const MetricBox = ({ icon: Icon, label, value, variant = 'default', size = 'md' }: { icon?: any, label: string, value: string, variant?: 'default' | 'emerald' | 'red', size?: 'sm' | 'md' }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <span className={`${size === 'md' ? 'text-2xl' : 'text-lg'} font-black tracking-tight ${variant === 'emerald' ? 'text-emerald-400' : variant === 'red' ? 'text-red-400' : 'text-slate-100'}`}>
      {value}
    </span>
  </div>
);

const AdFullViewModal = ({ ad, onClose }: { ad: AdSet, onClose: () => void }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Lado Esquerdo: Imagem */}
        <div className="lg:w-1/2 bg-slate-950 relative">
          {ad.thumbnailUrl ? (
            <img src={ad.thumbnailUrl} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 gap-4">
              <Monitor className="w-20 h-20" />
              <span className="text-xs font-black uppercase tracking-widest">Preview Indisponível</span>
            </div>
          )}
          {ad.permalink && (
            <a 
              href={ad.permalink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:scale-105 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Ver no Instagram
            </a>
          )}
        </div>

        {/* Lado Direito: Dados Completos */}
        <div className="lg:w-1/2 p-10 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 block">{ad.accountName}</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{ad.name}</h3>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8 flex-1">
            <div className="grid grid-cols-2 gap-6">
              <MetricBox label="Gasto Bruto" value={formatCurrency(ad.spend)} />
              <MetricBox label="Conversas" value={ad.conversations.toString()} />
              <MetricBox label="Impressões" value={ad.impressions.toLocaleString('pt-BR')} />
              <MetricBox label="Alcance" value={ad.reach.toLocaleString('pt-BR')} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <MetricBox label="CTR" value={`${ad.ctr.toFixed(2)}%`} variant={ad.ctr > 1 ? 'emerald' : 'default'} />
              <MetricBox label="CPL (+Tax)" value={formatCurrency(ad.conversations > 0 ? (ad.spend * 1.1215) / ad.conversations : 0)} variant={((ad.spend * 1.1215) / ad.conversations) > 15 ? 'red' : 'emerald'} />
            </div>

            <div className="pt-8 border-t border-slate-800 space-y-4">
              <HierarchyItem label="Campanha" value={ad.campaignName} />
              <HierarchyItem label="Conjunto" value={ad.adSetName} />
              <HierarchyItem label="Status Operacional" value={ad.operationalDetails} />
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mt-10 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};

const HierarchyItem = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-[11px] font-bold text-slate-300 leading-relaxed">{value}</p>
  </div>
);

const DetailStatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-[2rem] space-y-3">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-500" />
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

const MiniMetric = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">{label}</p>
    <p className="text-[11px] font-mono font-black text-slate-300">{value}</p>
  </div>
);
