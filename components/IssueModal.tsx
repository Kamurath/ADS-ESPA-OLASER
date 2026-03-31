import React, { useState, useMemo } from 'react';
import { AdSet, CampaignStatus } from '../types';
import { X, AlertCircle, AlertTriangle, ShieldCheck, Monitor, ChevronRight, ExternalLink, Instagram, Info, Layers, Target, Box, UserCheck, Filter, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface IssueModalProps {
  issues: AdSet[];
  onDismiss: (idOrIds: string | string[]) => void;
  onClose: () => void;
}

type FilterType = 'ALL' | 'CRITICAL' | 'WARNING' | 'PAUSED';

export const IssueModal: React.FC<IssueModalProps> = ({ issues, onDismiss, onClose }) => {
  const [selectedAd, setSelectedAd] = useState<AdSet | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());

  const counts = useMemo(() => ({
    all: issues.length,
    critical: issues.filter(i => i.operationalStatus === 'VERMELHO').length,
    warning: issues.filter(i => i.operationalStatus === 'AMARELO').length,
    paused: issues.filter(i => i.status === CampaignStatus.PAUSED).length,
  }), [issues]);

  const filteredIssues = useMemo(() => {
    switch (activeFilter) {
      case 'CRITICAL': return issues.filter(i => i.operationalStatus === 'VERMELHO');
      case 'WARNING': return issues.filter(i => i.operationalStatus === 'AMARELO');
      case 'PAUSED': return issues.filter(i => i.status === CampaignStatus.PAUSED);
      default: return issues;
    }
  }, [issues, activeFilter]);

  const toggleBatchSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o detalhe ao clicar no checkbox
    setBatchSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (batchSelectedIds.size === filteredIssues.length && filteredIssues.length > 0) {
      setBatchSelectedIds(new Set());
    } else {
      setBatchSelectedIds(new Set(filteredIssues.map(i => i.id)));
    }
  };

  const handleBatchDismiss = () => {
    if (batchSelectedIds.size === 0) return;
    onDismiss(Array.from(batchSelectedIds));
    setBatchSelectedIds(new Set());
    setSelectedAd(null);
  };

  const handleConfirmSingleAction = (id: string) => {
    onDismiss(id);
    setSelectedAd(null);
  };

  const hasCritical = counts.critical > 0;
  const hasWarning = counts.warning > 0;
  
  let themeColor = 'emerald';
  let mainTitle = 'Status Operacional: Saudável';
  let MainIcon = ShieldCheck;

  if (hasCritical) {
    themeColor = 'red';
    mainTitle = 'Status Operacional: Crítico';
    MainIcon = AlertCircle;
  } else if (hasWarning) {
    themeColor = 'amber';
    mainTitle = 'Status Operacional: Atenção';
    MainIcon = AlertTriangle;
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    red: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/5',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-300">
        
        {/* Lado Esquerdo: Lista de Alertas e Filtros */}
        <div className={`w-full ${selectedAd ? 'hidden lg:flex' : 'flex'} lg:w-[400px] flex-col border-r border-slate-800 bg-slate-900/50`}>
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${colors[themeColor as keyof typeof colors]}`}>
                  <MainIcon className="w-5 h-5" />
                </div>
                <h2 className={`text-[10px] font-black uppercase tracking-widest ${colors[themeColor as keyof typeof colors].split(' ')[0]}`}>{mainTitle.replace('Status Operacional: ', '')}</h2>
              </div>
              <button 
                onClick={handleSelectAllVisible}
                className="text-[9px] font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5"
              >
                {batchSelectedIds.size === filteredIssues.length && filteredIssues.length > 0 ? 'Desmarcar' : 'Selecionar Tudo'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <FilterChip label="Todos" count={counts.all} active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} />
              <FilterChip label="Críticos" count={counts.critical} active={activeFilter === 'CRITICAL'} variant="red" onClick={() => setActiveFilter('CRITICAL')} />
              <FilterChip label="Inconsistentes" count={counts.warning} active={activeFilter === 'WARNING'} variant="amber" onClick={() => setActiveFilter('WARNING')} />
              <FilterChip label="Pausados" count={counts.paused} active={activeFilter === 'PAUSED'} variant="slate" onClick={() => setActiveFilter('PAUSED')} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {filteredIssues.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Tudo limpo!<br/>Nenhuma pendência encontrada.</p>
                </div>
            ) : (
                filteredIssues.map((ad) => (
                  <button 
                    key={ad.id} 
                    onClick={() => setSelectedAd(ad)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all group relative overflow-hidden flex items-center gap-3 ${selectedAd?.id === ad.id ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/20' : 'bg-slate-900/30 border-slate-800/50 hover:border-slate-700 hover:bg-slate-800/40'}`}
                  >
                    <div 
                        onClick={(e) => toggleBatchSelection(ad.id, e)}
                        className={`p-1.5 rounded-lg transition-colors border ${batchSelectedIds.has(ad.id) ? 'bg-sky-500 border-sky-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-700 group-hover:border-slate-600'}`}
                    >
                        {batchSelectedIds.has(ad.id) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800/50 flex items-center justify-center">
                        {ad.thumbnailUrl ? (
                          <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Monitor className="w-5 h-5 text-slate-800" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.15em] truncate pr-2">{ad.accountName}</span>
                          <StatusBadge status={ad.status} />
                        </div>
                        <h3 className="text-[10px] font-bold text-slate-200 line-clamp-1 leading-tight group-hover:text-sky-400 transition-colors uppercase">{ad.name}</h3>
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>

          {batchSelectedIds.size > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
                <button 
                    onClick={handleBatchDismiss}
                    className="w-full py-3.5 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-sky-500 transition-all shadow-xl shadow-sky-500/10 border border-sky-400/20"
                >
                    <CheckCircle2 className="w-4 h-4" /> OK (ENTENDIDO) EM {batchSelectedIds.size} {batchSelectedIds.size === 1 ? 'CAMPO' : 'CAMPOS'}
                </button>
            </div>
          )}
        </div>

        {/* Lado Direito: Detalhamento do Item Selecionado */}
        <div className={`flex-1 flex flex-col bg-slate-950/20 ${!selectedAd ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
            {selectedAd ? (
              <>
                <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedAd(null)} className="lg:hidden p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white mb-2">
                       <X className="w-4 h-4" />
                    </button>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">{selectedAd.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">{selectedAd.accountName}</span>
                            <span className="text-[10px] font-bold text-slate-500">ID: {selectedAd.id}</span>
                        </div>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all hidden lg:block">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sky-400 mb-4">
                            <Layers className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Estrutura de Campanha</h4>
                        </div>
                        
                        <div className="space-y-3">
                            <HierarchyItem icon={UserCheck} label="Conta de Anúncios" value={selectedAd.accountNameRaw} />
                            <HierarchyItem icon={Target} label="Campanha" value={selectedAd.campaignName} />
                            <HierarchyItem icon={Box} label="Conjunto de Anúncios" value={selectedAd.adSetName} />
                            <HierarchyItem icon={Monitor} label="Anúncio (Criativo)" value={selectedAd.name} />
                        </div>

                        <div className="pt-6 border-t border-slate-800/50">
                            <div className="flex items-center gap-2 text-amber-400 mb-4">
                                <Info className="w-4 h-4" />
                                <h4 className="text-xs font-black uppercase tracking-widest">Status e Diagnóstico</h4>
                            </div>
                            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <StatusBadge status={selectedAd.status} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizado via Stract Feed</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    {selectedAd.operationalDetails}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-pink-500 mb-4">
                            <Instagram className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Visualização do Criativo</h4>
                        </div>

                        <div className="relative aspect-square bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden group">
                           {selectedAd.thumbnailUrl ? (
                             <img src={selectedAd.thumbnailUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                                <Monitor className="w-12 h-12 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Preview Indisponível</span>
                             </div>
                           )}
                           
                           {selectedAd.permalink && (
                             <a 
                               href={selectedAd.permalink} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
                             >
                               <div className="p-4 bg-white rounded-full text-slate-950 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                                  <ExternalLink className="w-6 h-6" />
                               </div>
                               <span className="text-xs font-black text-white uppercase tracking-widest">Abrir no Instagram</span>
                             </a>
                           )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <MiniStat label="Gasto" value={formatCurrency(selectedAd.spend)} />
                            <MiniStat label="CTR" value={`${selectedAd.ctr.toFixed(2)}%`} />
                            <MiniStat label="Conversas" value={selectedAd.conversations.toString()} />
                        </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex justify-end gap-4">
                  <button onClick={() => setSelectedAd(null)} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Voltar para lista</button>
                  <button 
                    onClick={() => handleConfirmSingleAction(selectedAd.id)}
                    className="px-10 py-3 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 border border-emerald-400/20"
                  >
                    <CheckCircle2 className="w-4 h-4" /> OK [Entendido]
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-6 opacity-40">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                    <Info className="w-8 h-8 text-slate-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Selecione um alerta</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase">Para visualizar detalhes técnicos e preview do criativo</p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  variant?: 'red' | 'amber' | 'slate' | 'default';
}

const FilterChip = ({ label, count, active, onClick, variant = 'default' }: FilterChipProps) => {
  const getColors = () => {
    if (!active) return 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700';
    switch (variant) {
      case 'red': return 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20';
      case 'amber': return 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20';
      case 'slate': return 'bg-slate-700 text-white border-slate-600 shadow-lg shadow-slate-950/20';
      default: return 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/20';
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${getColors()}`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${active ? 'bg-white/20' : 'bg-slate-800'}`}>
        {count}
      </span>
    </button>
  );
};

const HierarchyItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4 group hover:border-slate-700 transition-colors">
    <div className="p-2 bg-slate-950 rounded-lg text-slate-500 group-hover:text-sky-400 transition-colors border border-slate-800">
        <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-[11px] font-bold text-slate-300 truncate">{value || 'Não identificado'}</p>
    </div>
  </div>
);

const MiniStat = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3 text-center">
        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[11px] font-mono font-black text-slate-300">{value}</p>
    </div>
);