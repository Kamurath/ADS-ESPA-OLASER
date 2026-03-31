import { GoogleGenAI, Type } from "@google/genai";
import { AdSet, ChatResponse } from '../types';

// Strict initialization using mandated pattern
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const mapCampaignsForAi = (campaigns: AdSet[]) => {
  return campaigns.map(c => ({
    id: c.id, 
    nome: c.name,
    unidade: c.accountName,
    thumbnail: c.thumbnailUrl ? "Sim" : "Não",
    mídia_investida: c.spend,
    imposto_estimado: c.spend * 0.1215,
    custo_total: c.spend * 1.1215,
    mensagens: c.conversations,
    cpm: c.cpm,
    ctr: c.ctr,
    cpc: c.cpc,
    custo_por_mensagem_real: c.conversations > 0 ? (c.spend * 1.1215) / c.conversations : 0,
    status: c.status
  }));
};

export const askAssistant = async (campaigns: AdSet[], question: string): Promise<ChatResponse> => {
    try {
        const ai = getAiClient();
        const data = mapCampaignsForAi(campaigns);

        const prompt = `
            Identidade: Consultor Sênior de Performance (Especialista Espaçolaser).
            
            Regras de Negócio:
            1. Faturamento Meta: Imposto de 12.15%.
            2. CPL ideal < R$ 15.
            3. Analise criativos baseando-se em CTR (Atratividade) e CPL (Resultado).

            Dados: ${JSON.stringify(data)}

            Pergunta: "${question}"

            Instruções CRÍTICAS:
            - OBJETIVO PRINCIPAL: Se a pergunta for sobre "Melhores Criativos", "Melhores Anúncios", "Desempenho Visual" ou pedir exemplos:
              1. VOCÊ DEVE OBRIGATORIAMENTE Identificar os IDs dos anúncios no JSON de dados.
              2. Preencher o array "relatedAdIds" com esses IDs.
              3. Na resposta de texto, seja breve e diga "Aqui estão os criativos de destaque com base nos dados analisados:".
            
            - Ao analisar "Garanhuns" ou qualquer unidade específica, filtre os dados pelo nome da unidade.
            - Responda em Português do Brasil.
            - Seja direto.

            Retorne APENAS um JSON válido.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 4000 },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        answer: { type: Type.STRING },
                        relatedAdIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["answer", "relatedAdIds"]
                }
            }
        });

        // Direct access to .text property as per extraction rules
        const text = response.text;
        if (!text) throw new Error("Response body is empty");
        return JSON.parse(text) as ChatResponse;

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return { 
            answer: "Estou tendo dificuldades técnicas para processar a planilha agora. Posso dizer que o monitoramento geral está ativo, mas para detalhes específicos, por favor tente novamente em alguns instantes.", 
            relatedAdIds: [] 
        };
    }
};