
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatDetail {
  label: string;
  value: string;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  subValue?: string;
  details?: StatDetail[];
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp, color = "text-sky-600", subValue, details }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between overflow-hidden">
      <div className="p-3 sm:p-6 pb-2 sm:pb-4">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="text-[10px] sm:text-sm font-bold text-slate-400 truncate pr-1 uppercase tracking-wider">{title}</h3>
          <div className={`p-1.5 sm:p-2 bg-slate-950 rounded-lg ${color} shrink-0 border border-slate-800`}>
            <Icon className="w-3 h-3 sm:w-5 h-5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-base sm:text-2xl font-black text-slate-100 leading-none tracking-tight">{value}</p>
            {subValue && (
              <p className="text-[10px] sm:text-xs mt-1.5 text-slate-500 font-medium font-mono">
                {subValue}
              </p>
            )}
            {trend && (
              <p className={`text-[8px] sm:text-xs mt-0.5 sm:mt-1 font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {details && details.length > 0 && (
        <div className="bg-slate-950/50 border-t border-slate-800 p-2 sm:p-3 grid grid-cols-2 gap-2">
          {details.map((detail, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-bold tracking-wider">{detail.label}</span>
              <span className="text-[10px] sm:text-xs text-slate-300 font-mono font-medium">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
