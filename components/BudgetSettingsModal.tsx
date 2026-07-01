import React, { useState } from 'react';
import { X, Save, DollarSign, Target, CreditCard, CalendarRange, Zap, Download, Upload, Plus, Trash2, Link, Layers, Edit2 } from 'lucide-react';
import { UNIT_DISPLAY_ORDER, getStoredUnits, CustomUnit } from '../types';

interface BudgetSettingsModalProps {
  currentBudgets: Record<string, number>;
  currentPeriods: Record<string, { start: number; end: number }>;
  currentRealBalances: Record<string, number>;
  currentManualDailyValues: Record<string, number>;
  onSave: (budgets: Record<string, number>, realBalances: Record<string, number>, periods: Record<string, { start: number; end: number }>, manualDailyValues: Record<string, number>) => void;
  onClose: () => void;
}

type TabType = 'BUDGET' | 'REAL_BALANCE' | 'UNITS';

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({ currentBudgets, currentPeriods, currentRealBalances, currentManualDailyValues, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('BUDGET');
  const [tempBudgets, setTempBudgets] = useState<Record<string, number>>({ ...currentBudgets });
  const [tempPeriods, setTempPeriods] = useState<Record<string, { start: number; end: number }>>({ ...currentPeriods });
  const [tempRealBalances, setTempRealBalances] = useState<Record<string, number>>({ ...currentRealBalances });
  const [tempManualDailyValues, setTempManualDailyValues] = useState<Record<string, number>>({ ...currentManualDailyValues });

  // Custom units management
  const [customUnits, setCustomUnits] = useState<CustomUnit[]>(() => getStoredUnits());
  const [newName, setNewName] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');

  // Edit unit state
  const [editingPrefix, setEditingPrefix] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrefix, setEditPrefix] = useState('');
  const [editSheetUrl, setEditSheetUrl] = useState('');

  const handleStartEdit = (unit: CustomUnit) => {
    setEditingPrefix(unit.prefix);
    setEditName(unit.name);
    setEditPrefix(unit.prefix);
    setEditSheetUrl(unit.sheetUrl || '');
  };

  const handleCancelEdit = () => {
    setEditingPrefix(null);
  };

  const handleSaveEdit = (oldPrefix: string) => {
    if (!editName.trim() || !editPrefix.trim()) {
      alert('Por favor, preencha o nome e o prefixo.');
      return;
    }

    const updatedPrefix = editPrefix.trim().toUpperCase();
    if (updatedPrefix !== oldPrefix && customUnits.some(u => u.prefix.toUpperCase() === updatedPrefix)) {
      alert('Já existe uma unidade com este prefixo!');
      return;
    }

    const updatedUnits = customUnits.map(u => {
      if (u.prefix === oldPrefix) {
        return {
          name: editName.trim(),
          prefix: updatedPrefix,
          sheetUrl: editSheetUrl.trim() !== '' ? editSheetUrl.trim() : undefined
        };
      }
      return u;
    });

    setCustomUnits(updatedUnits);

    // If unit name changed, migrate the settings to the new name key
    const matchedUnit = customUnits.find(u => u.prefix === oldPrefix);
    if (matchedUnit && matchedUnit.name !== editName.trim()) {
      const oldName = matchedUnit.name;
      const newNameStr = editName.trim();

      setTempBudgets(prev => {
        const copy = { ...prev };
        if (copy[oldName] !== undefined) {
          copy[newNameStr] = copy[oldName];
          delete copy[oldName];
        }
        return copy;
      });

      setTempPeriods(prev => {
        const copy = { ...prev };
        if (copy[oldName] !== undefined) {
          copy[newNameStr] = copy[oldName];
          delete copy[oldName];
        }
        return copy;
      });

      setTempManualDailyValues(prev => {
        const copy = { ...prev };
        if (copy[oldName] !== undefined) {
          copy[newNameStr] = copy[oldName];
          delete copy[oldName];
        }
        return copy;
      });

      setTempRealBalances(prev => {
        const copy = { ...prev };
        if (copy[oldName] !== undefined) {
          copy[newNameStr] = copy[oldName];
          delete copy[oldName];
        }
        return copy;
      });
    }

    setEditingPrefix(null);
  };

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

  const handleAddUnit = () => {
    if (!newName.trim() || !newPrefix.trim()) {
      alert('Por favor, preencha o nome e o prefixo da unidade.');
      return;
    }
    
    const prefixUpper = newPrefix.trim().toUpperCase();
    if (customUnits.some(u => u.prefix.toUpperCase() === prefixUpper)) {
      alert('Já existe uma unidade com este prefixo!');
      return;
    }

    const newUnit: CustomUnit = {
      name: newName.trim(),
      prefix: prefixUpper,
      sheetUrl: newSheetUrl.trim() !== '' ? newSheetUrl.trim() : undefined
    };

    setCustomUnits(prev => [...prev, newUnit]);
    
    // Auto-initialize budgets for new unit
    setTempBudgets(prev => ({ ...prev, [newUnit.name]: 800 }));
    setTempPeriods(prev => ({ ...prev, [newUnit.name]: { start: 1, end: 30 } }));
    setTempManualDailyValues(prev => ({ ...prev, [newUnit.name]: 0 }));
    setTempRealBalances(prev => ({ ...prev, [newUnit.name]: 0 }));

    setNewName('');
    setNewPrefix('');
    setNewSheetUrl('');
  };

  const handleRemoveUnit = (prefix: string) => {
    if (confirm('Tem certeza que deseja remover esta unidade?')) {
      const matchedUnit = customUnits.find(u => u.prefix === prefix);
      if (matchedUnit) {
        const updatedBudgets = { ...tempBudgets };
        delete updatedBudgets[matchedUnit.name];
        setTempBudgets(updatedBudgets);

        const updatedPeriods = { ...tempPeriods };
        delete updatedPeriods[matchedUnit.name];
        setTempPeriods(updatedPeriods);

        const updatedManualValues = { ...tempManualDailyValues };
        delete updatedManualValues[matchedUnit.name];
        setTempManualDailyValues(updatedManualValues);

        const updatedBalances = { ...tempRealBalances };
        delete updatedBalances[matchedUnit.name];
        setTempRealBalances(updatedBalances);
      }
      setCustomUnits(prev => prev.filter(u => u.prefix !== prefix));
    }
  };

  const handleSave = () => {
    const originalUnits = getStoredUnits();
    const unitsChanged = JSON.stringify(originalUnits) !== JSON.stringify(customUnits);
    
    if (unitsChanged) {
      localStorage.setItem('ads_monitor_custom_units', JSON.stringify(customUnits));
    }
    
    onSave(tempBudgets, tempRealBalances, tempPeriods, tempManualDailyValues);
    
    if (unitsChanged) {
      alert('Configurações salvas e unidades atualizadas! O aplicativo será recarregado.');
      window.location.reload();
    }
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
      'ads_monitor_unlocked_history_months',
      'ads_monitor_custom_units'
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
                {activeTab === 'BUDGET' ? 'Defina o objetivo mensal, período e valor diário' : activeTab === 'REAL_BALANCE' ? 'Saldo acumulado que sobrou do mês anterior' : 'Cadastre e remova filiais e seus links de planilhas'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pt-6 flex gap-2 flex-wrap">
          <button 
            onClick={() => setActiveTab('BUDGET')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'BUDGET' ? 'bg-sky-500/10 border-sky-500/50 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
          >
            <Target className="w-3.5 h-3.5" /> Aporte e Período
          </button>
          <button 
            onClick={() => setActiveTab('REAL_BALANCE')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'REAL_BALANCE' ? 'bg-sky-500/10 border-sky-500/50 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Saldo restante
          </button>
          <button 
            onClick={() => setActiveTab('UNITS')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'UNITS' ? 'bg-sky-500/10 border-sky-500/50 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
          >
            <Layers className="w-3.5 h-3.5" /> Unidades
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
          {activeTab === 'UNITS' ? (
            <div className="space-y-6">
              {/* Formulario para Adicionar Unidade */}
              <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-[1.5rem] space-y-4">
                <h3 className="text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Adicionar Nova Unidade
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome da Unidade (ex: Quixadá / CE)</label>
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: Quixadá / CE"
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Prefixo Meta/Anúncio (ex: EL - QUIX)</label>
                    <input 
                      type="text" 
                      value={newPrefix} 
                      onChange={(e) => setNewPrefix(e.target.value)}
                      placeholder="Ex: EL - QUIX"
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Link do Sheets Individual (Opcional)</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-slate-500">
                      <Link className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text" 
                      value={newSheetUrl} 
                      onChange={(e) => setNewSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                    />
                  </div>
                  <p className="text-[8px] text-slate-500 pl-1">Deixe vazio para herdar a planilha padrão do monitor.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddUnit}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-[9px] font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Unidade
                </button>
              </div>

              {/* Lista de Unidades */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest pl-1">Unidades Cadastradas ({customUnits.length})</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {customUnits.map((unit) => (
                    <div key={unit.prefix} className="bg-slate-950/40 border border-slate-800/50 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {editingPrefix === unit.prefix ? (
                        <div className="flex-1 space-y-3 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome da Unidade</label>
                              <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Prefixo</label>
                              <input 
                                type="text"
                                value={editPrefix}
                                onChange={(e) => setEditPrefix(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Link da Planilha (Opcional)</label>
                            <input 
                              type="text"
                              value={editSheetUrl}
                              onChange={(e) => setEditSheetUrl(e.target.value)}
                              placeholder="https://docs.google.com/spreadsheets/d/..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] font-bold text-slate-200 focus:outline-none focus:border-sky-500/50"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(unit.prefix)}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest transition-all"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-white">{unit.name}</span>
                              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[8px] font-bold uppercase tracking-wider">{unit.prefix}</span>
                            </div>
                            <p className="text-[8px] text-slate-500 mt-1 truncate flex items-center gap-1">
                              <Link className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                              {unit.sheetUrl ? (
                                <span className="text-sky-500/80 underline truncate">{unit.sheetUrl}</span>
                              ) : (
                                <span className="italic text-slate-600">Planilha padrão</span>
                              )}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(unit)}
                              className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-all"
                              title="Editar Unidade"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(unit.prefix)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                              title="Remover Unidade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
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
          )}
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
  if (tab === 'REAL_BALANCE') return <CreditCard className="w-6 h-6 text-white" />;
  return <Layers className="w-6 h-6 text-white" />;
};