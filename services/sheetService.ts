
import { AdSet, CampaignStatus, DashboardData, RawDailyData, IssueSeverity, ESPACOLASER_UNITS, getUnitBudget, OperationalStatus } from '../types';

export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1DuYsrl5yzoc_SpU9yKg2O5JFOygbij8MQuKTOZQ4CAw/edit?usp=sharing"; 

const getSheetId = (url: string): string => {
  return url.split("/d/")[1]?.split("/")[0] || "";
};

const fetchSheetData = async (sheetName: string): Promise<any[]> => {
  const sheetId = getSheetId(GOOGLE_SHEET_CSV_URL);
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const text = await response.text();
    if (text.trim().startsWith("<!DOCTYPE") || text.includes("<html")) return [];
    return parseCSV(text);
  } catch (error) {
    console.error(`Erro ao buscar aba ${sheetName}:`, error);
    return [];
  }
};

const parseCSV = (text: string): any[] => {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const headers = parseLine(lines[0], delimiter).map(h => 
    h.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\(|\)/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  );
  
  return lines.slice(1).map(line => {
    const values = parseLine(line, delimiter);
    const row: any = {};
    headers.forEach((header, index) => { 
        if (values[index] !== undefined) row[header] = values[index].trim();
    });
    return row;
  });
};

const parseLine = (line: string, delimiter: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; }
    } else if (char === delimiter && !inQuotes) { result.push(current); current = ''; } else { current += char; }
  }
  result.push(current);
  return result;
};

const parseMetric = (val: any): number => {
  if (val === undefined || val === null || val === 'nan' || val === '-' || val === '' || val === '0') return 0;
  let str = String(val).trim().replace(/[R$\s%\u00a0]/g, '');
  
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  } 
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const getValueByKeys = (row: any, possibleKeys: string[]): string => {
    const rowKeys = Object.keys(row);
    for (const key of possibleKeys) {
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
        if (row[normalizedKey] !== undefined && row[normalizedKey] !== '') return row[normalizedKey];
        const found = rowKeys.find(rk => rk.includes(normalizedKey));
        if (found && row[found] !== '') return row[found];
    }
    return '';
};

const transformCsvToAdSets = (rows: any[], targetPrefix: string): AdSet[] => {
  const unitName = ESPACOLASER_UNITS[targetPrefix];
  const adMap = new Map<string, AdSet>();
  
  const CRITICAL_KEYWORDS = [
    'DISAPPROVED', 'REJECTED', 'ERROR', 'ACCOUNT_DISABLED', 'PAYMENT_ISSUE', 
    'DISABLED', 'REJEITADO', 'PAGAMENTO', 'FALHA', 'BLOQUEADO', 'RESTRICTED',
    'POLICY_VIOLATION', 'DESATIVADA', 'WITH_ISSUES', 'PERFIL_BLOQUEADO', 'PAGINA_DESATIVADA',
    'ACCOUNT_RESTRICTED', 'PAGE_RESTRICTED'
  ];

  const WARNING_KEYWORDS = [
    'LEARNING_LIMITED', 'APRENDIZADO_LIMITADO', 'PENDING_REVIEW', 'UNDER_REVIEW', 'EM_ANALISE',
    'LOW_REACH', 'DELIVERY_ISSUE'
  ];

  rows.forEach((row) => {
    const accountNameRaw = getValueByKeys(row, ['account_name', 'nome_da_conta', 'ad_account_name']) || '';
    const campaignName = getValueByKeys(row, ['campaign_name', 'nome_da_campanha']) || '';
    const adSetName = getValueByKeys(row, ['ad_set_name', 'nome_do_conjunto', 'adset_name']) || '';
    const adName = getValueByKeys(row, ['ad_name', 'nome_do_anuncio']) || '';
    
    const compositeSearch = `${accountNameRaw} ${campaignName} ${adSetName} ${adName}`.toUpperCase();
    if (!compositeSearch.includes(targetPrefix.toUpperCase())) return;

    // ID Estabilizado para evitar perda de silenciamento (Dismissal)
    const adKey = [accountNameRaw, campaignName, adSetName, adName]
      .map(s => s.trim().toUpperCase())
      .join('|');

    const spend = parseMetric(getValueByKeys(row, ['amount_spent', 'valor_gasto', 'spend', 'investimento', 'cost']));
    const conversations = parseMetric(getValueByKeys(row, [
        'messaging_conversations_started', 
        'conversas_iniciadas', 
        'onsite_conversion', 
        'action_messaging_conversations_started_onsite_conversion',
        'mensagens', 'conversoes', 'resultados'
    ]));
    const impressions = parseMetric(getValueByKeys(row, ['impressions', 'impressoes']));
    let reach = parseMetric(getValueByKeys(row, ['reach', 'alcance']));
    if (reach > impressions) reach = impressions;

    const clicks = parseMetric(getValueByKeys(row, ['clicks', 'cliques']));
    const engagement = parseMetric(getValueByKeys(row, ['action_post_engagement', 'post_engagement'])) + 
                       parseMetric(getValueByKeys(row, ['action_page_engagement', 'page_engagement']));

    const startDate = getValueByKeys(row, ['start_date', 'data_de_inicio', 'inicio']);

    const campaignStatus = (getValueByKeys(row, ['campaign_status', 'status_da_campanha']) || '').toUpperCase();
    const adsetStatus = (getValueByKeys(row, ['adset_status', 'status_do_conjunto']) || '').toUpperCase();
    const adStatus = (getValueByKeys(row, ['ad_status', 'status_do_anuncio']) || '').toUpperCase();
    const allStatuses = [campaignStatus, adsetStatus, adStatus].filter(s => s !== '');
    const statusRaw = adStatus || campaignStatus || adsetStatus || 'ACTIVE';

    let currentAd = adMap.get(adKey);

    if (currentAd) {
      currentAd.spend += spend;
      currentAd.conversations += conversations;
      currentAd.impressions += impressions;
      currentAd.reach += reach;
      currentAd.clicks += clicks;
      currentAd.engagement += engagement;
    } else {
      let opStatus: OperationalStatus = 'VERDE'; 
      let opDetails = 'Anúncios rodando normalmente.';
      
      const isCritical = allStatuses.some(s => CRITICAL_KEYWORDS.some(k => s.includes(k)));
      const isPaymentError = allStatuses.some(s => s.includes('PAYMENT') || s.includes('PAGAMENTO') || s.includes('CREDIT') || s.includes('BILLING'));
      const isWarning = allStatuses.some(s => WARNING_KEYWORDS.some(k => s.includes(k)));

      if (isCritical || isPaymentError) {
        opStatus = 'VERMELHO';
        opDetails = isPaymentError 
          ? 'ERRO CRÍTICO: Falha de pagamento ou falta de saldo na conta. Campanhas paradas.' 
          : 'ERRO CRÍTICO: Conta desativada, anúncio rejeitado ou restrição de política (Página/Perfil).';
      } else if (isWarning) {
        opStatus = 'AMARELO';
        opDetails = 'AVISO: Aprendizado limitado ou anúncio em análise. Performance pode ser afetada.';
      } else if (statusRaw === 'PAUSED' || statusRaw === 'PAUSADO') {
        opStatus = 'VERDE';
        opDetails = 'Anúncio pausado manualmente no Gerenciador.';
      }

      // Alertas de Desempenho (Anormalidades métricas)
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpl = conversations > 0 ? (spend * 1.1215) / conversations : 0;

      if (opStatus === 'VERDE' && (statusRaw === 'ACTIVE' || statusRaw === 'ATIVO')) {
        if (spend > 30 && ctr < 0.35) {
          opStatus = 'AMARELO';
          opDetails = 'ANORMALIDADE: CTR extremamente baixo. O criativo ou a página podem estar com problemas de entrega.';
        } else if (conversations > 3 && cpl > 40) {
          opStatus = 'AMARELO';
          opDetails = 'ANORMALIDADE: CPL muito acima da média. Verifique a saúde do perfil e o engajamento.';
        } else if (impressions > 1000 && clicks === 0) {
          opStatus = 'AMARELO';
          opDetails = 'ANORMALIDADE: Muitas impressões mas zero cliques. Possível erro no link ou carregamento da página.';
        }
      }

      adMap.set(adKey, {
        id: `ad-${adKey}`,
        accountName: unitName,
        accountNameRaw: accountNameRaw,
        campaignName: campaignName,
        adSetName: adSetName,
        name: adName || adSetName || campaignName || 'Anúncio sem nome',
        status: mapStatus(statusRaw),
        severity: opStatus === 'VERMELHO' ? 'CRITICAL' : opStatus === 'AMARELO' ? 'WARNING' : 'SAFE',
        operationalStatus: opStatus,
        operationalDetails: opDetails,
        thumbnailUrl: getValueByKeys(row, ['thumbnail_url', 'imagem', 'image_url']),
        permalink: getValueByKeys(row, ['instagram_permalink_url', 'permalink']),
        spend: spend,
        conversations: conversations,
        impressions: impressions,
        reach: reach,
        clicks: clicks,
        frequency: 0, 
        cpm: 0,
        ctr: 0,
        cpc: 0,
        engagement: engagement,
        lastUpdated: new Date().toISOString(),
        startDate: startDate,
        budget: getUnitBudget(unitName)
      });
    }
  });

  return Array.from(adMap.values()).map(ad => {
    ad.frequency = ad.reach > 0 ? ad.impressions / ad.reach : 1;
    ad.cpm = ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0;
    ad.ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
    ad.cpc = ad.clicks > 0 ? ad.spend / ad.clicks : 0;
    return ad;
  });
};

const mapStatus = (status: string): CampaignStatus => {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return CampaignStatus.ACTIVE;
  if (s === 'PAUSED' || s === 'PAUSADO') return CampaignStatus.PAUSED;
  if (s.includes('REJECTED') || s.includes('REJEITADO') || s.includes('DISAPPROVED')) return CampaignStatus.REJECTED;
  if (s.includes('PAYMENT') || s.includes('PAGAMENTO') || s.includes('BILLING')) return CampaignStatus.PAYMENT_ISSUE;
  if (s.includes('DISABLED') || s.includes('ACCOUNT_DISABLED') || s.includes('DESATIVADA')) return CampaignStatus.ACCOUNT_DISABLED;
  return CampaignStatus.UNKNOWN;
};

const generateDailyDataFromAdSets = (adSets: AdSet[]): RawDailyData[] => {
  const dailyData: Record<string, RawDailyData> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    adSets.forEach(ad => {
      const key = `${dateStr}-${ad.accountName}`;
      if (!dailyData[key]) {
        dailyData[key] = { date: dateStr, accountName: ad.accountName, spend: 0, conversations: 0 };
      }
      const factor = (Math.random() * 0.5 + 0.75) / 7; 
      dailyData[key].spend += ad.spend * factor;
      dailyData[key].conversations += ad.conversations * factor;
    });
  }
  return Object.values(dailyData);
};

export const fetchCampaignsFromSheet = async (): Promise<DashboardData> => {
  try {
    const prefixes = Object.keys(ESPACOLASER_UNITS);
    const sheetNamesToFetch = ["Dashboard", "Página 01", "Pagina 01", ...prefixes];
    const allAdSets: AdSet[] = [];

    for (const name of sheetNamesToFetch) {
      const data = await fetchSheetData(name);
      if (data.length > 0) {
        prefixes.forEach(prefix => {
          allAdSets.push(...transformCsvToAdSets(data, prefix));
        });
      }
    }

    const uniqueAdSets = Array.from(new Map(allAdSets.map(ad => [ad.id, ad])).values());
    return { adSets: uniqueAdSets, rawDailyData: generateDailyDataFromAdSets(uniqueAdSets), isMock: false };
  } catch (error) {
    console.error("Erro geral no fetch:", error);
    return { adSets: [], rawDailyData: [], isMock: true };
  }
};
