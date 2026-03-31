
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

export const UNIT_DISPLAY_ORDER = [
  "Araripina / PE",
  "Serra Talhada / PE",
  "Garanhuns / PE",
  "Cajazeiras / PB",
  "Vitória de Santo Antão / PE",
  "Santana do Livramento / RS",
  "Muriaé / MG",
  "Vilhena / RO",
  "Corumbá / MS",
  "Fortaleza / CE",
  "Macaé Shopping Plaza / RJ",
  "Macaé Centro (Silva Jardim) / RJ"
];

export const ESPACOLASER_UNITS: Record<string, string> = {
  "EL - ARA": "Araripina / PE",
  "EL - ST": "Serra Talhada / PE",
  "EL - GUS": "Garanhuns / PE",
  "EL - CZ": "Cajazeiras / PB",
  "EL - VSA": "Vitória de Santo Antão / PE",
  "EL - LIV": "Santana do Livramento / RS",
  "EL - MUR": "Muriaé / MG",
  "EL - VIL": "Vilhena / RO",
  "EL - COR": "Corumbá / MS",
  "EL - FOR": "Fortaleza / CE",
  "EL - MACS": "Macaé Shopping Plaza / RJ",
  "EL - MACE": "Macaé Centro (Silva Jardim) / RJ"
};

export const getUnitBudget = (unitName: string): number => {
  if (unitName === "Corumbá / MS") return 1200;
  if (unitName === "Serra Talhada / PE" || unitName === "Vitória de Santo Antão / PE") return 1000;
  return 800;
};

export const UNIT_BUDGETS: Record<string, number> = UNIT_DISPLAY_ORDER.reduce((acc, unit) => {
  acc[unit] = getUnitBudget(unit);
  return acc;
}, {} as Record<string, number>);
