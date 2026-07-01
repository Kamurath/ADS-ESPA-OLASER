
export enum CampaignStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  REJECTED = 'REJECTED',
  LEARNING_LIMITED = 'LEARNING_LIMITED',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  WARNING = 'WARNING',
  UNKNOWN = 'UNKNOWN'
}

export type IssueSeverity = 'CRITICAL' | 'WARNING' | 'SAFE';

export type OperationalStatus = 'VERDE' | 'AMARELO' | 'VERMELHO' | 'NAO_INFORMADO';

export interface AdSet {
  id: string;
  accountName: string; // Nome da Unidade (ex: Araripina / PE)
  accountNameRaw: string; // Nome real da conta no Meta
  campaignName: string;
  adSetName: string;
  name: string; // Nome do anúncio ou identificador principal
  status: CampaignStatus;
  severity: IssueSeverity;
  
  operationalStatus: OperationalStatus;
  operationalDetails: string;

  errorMessage?: string;
  thumbnailUrl?: string;
  permalink?: string;
  adBody?: string;
  adTitle?: string;
  budget?: number;
  impressions: number;
  reach: number;
  frequency: number;
  cpm: number;
  ctr: number;
  cpc: number;
  clicks: number;
  engagement: number;
  conversations: number;
  spend: number;
  lastUpdated: string;
  startDate?: string;

  // Métricas de Vídeo
  videoP25?: number;
  videoP50?: number;
  videoP75?: number;
  videoP95?: number;
}

export interface RawDailyData {
  date: string;
  accountName: string;
  spend: number;
  conversations: number;
  clicks?: number;
  impressions?: number;
}

export interface DashboardData {
  adSets: AdSet[];
  rawDailyData: RawDailyData[];
  isMock: boolean;
}

export interface ChatResponse {
  answer: string;
  relatedAdIds: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  relatedAds?: AdSet[];
  timestamp: Date;
}

export interface CustomUnit {
  prefix: string;
  name: string;
  sheetUrl?: string;
}

export const getStoredUnits = (): CustomUnit[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ads_monitor_custom_units');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing custom units:", e);
      }
    }
  }
  return [
    { prefix: "EL - ARA", name: "Araripina / PE" },
    { prefix: "EL - ST", name: "Serra Talhada / PE" },
    { prefix: "EL - GUS", name: "Garanhuns / PE" },
    { prefix: "EL - CZ", name: "Cajazeiras / PB" },
    { prefix: "EL - VSA", name: "Vitória de Santo Antão / PE" },
    { prefix: "EL - LIV", name: "Santana do Livramento / RS" },
    { prefix: "EL - MUR", name: "Muriaé / MG" },
    { prefix: "EL - VIL", name: "Vilhena / RO" },
    { prefix: "EL - COR", name: "Corumbá / MS" },
    { prefix: "EL - FOR", name: "Fortaleza / CE" },
    { prefix: "EL - MACS", name: "Macaé Shopping Plaza / RJ" },
    { prefix: "EL - MACE", name: "Macaé Centro (Silva Jardim) / RJ" },
    { prefix: "EL - QUIX", name: "Quixadá / CE" },
    { prefix: "EL - TIN", name: "Tinhanguá / CE" }
  ];
};

const customUnitsList = getStoredUnits();

export const UNIT_DISPLAY_ORDER = customUnitsList.map(u => u.name);

export const ESPACOLASER_UNITS: Record<string, string> = customUnitsList.reduce((acc, u) => {
  acc[u.prefix] = u.name;
  return acc;
}, {} as Record<string, string>);

export const getUnitBudget = (unitName: string): number => {
  if (unitName === "Corumbá / MS") return 1200;
  if (unitName === "Serra Talhada / PE" || unitName === "Vitória de Santo Antão / PE") return 1000;
  return 800;
};

export const UNIT_BUDGETS: Record<string, number> = UNIT_DISPLAY_ORDER.reduce((acc, unit) => {
  acc[unit] = getUnitBudget(unit);
  return acc;
}, {} as Record<string, number>);
