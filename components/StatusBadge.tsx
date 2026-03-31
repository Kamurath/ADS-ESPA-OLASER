
import React from 'react';
import { CampaignStatus } from '../types';
import { CheckCircle2, AlertCircle, PauseCircle, XCircle, AlertTriangle, CreditCard } from 'lucide-react';

interface StatusBadgeProps {
  status: CampaignStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case CampaignStatus.ACTIVE:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
        </span>
      );
    case CampaignStatus.PAUSED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <PauseCircle className="w-3 h-3 mr-1" /> Pausado
        </span>
      );
    case CampaignStatus.ERROR:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-3 h-3 mr-1" /> Erro
        </span>
      );
    case CampaignStatus.REJECTED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" /> Rejeitado
        </span>
      );
    case CampaignStatus.PAYMENT_ISSUE:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
          <CreditCard className="w-3 h-3 mr-1" /> Pagamento
        </span>
      );
    case CampaignStatus.LEARNING_LIMITED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" /> Aprendizado Limitado
        </span>
      );
    default:
      return null;
  }
};
