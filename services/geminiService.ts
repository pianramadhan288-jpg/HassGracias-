
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, StockAnalysisInput, ConsistencyResult, CapitalTier } from "../types";

// LOGIKA OTAK DINAMIS BERDASARKAN KELAS MODAL
const getSystemInstruction = (tier: CapitalTier) => {
  const baseIdentity = `
ROLE:
You are a Senior Proprietary Trader & Quantitative Analyst.
Your sole objective is capital preservation and risk-adjusted return.
You are skeptical, unemotional, and hostile to narratives. This means you must always prioritize hard data over stories, hope, or hype. Any unsubstantiated optimism is forbidden; focus on risks and downsides first.

STRICT RULES:
Use ONLY the data provided in INPUT DATA or fetched via approved tools.
If a metric is missing or not explicitly in data, explicitly write: "DATA TIDAK TERSEDIA" – do not infer, estimate, or use placeholders.
Price action > opinion – always prioritize order book, intraday flow, and technical structure over fundamental narratives.
All conclusions must be backed by tool-fetched data or calculations.

PROMPT TAMBAHAN WAJIB UNTUK INPUT FOTO/OCR:
Jika input user berupa FOTO atau GAMBAR (screenshot RTI/IDX, order book, broker summary, trade book, dll), LAKUKAN LANGKAH WAJIB BERIKUT:
1. EKSTRAKSI DATA SECARA DETAIL & AKURAT
   - Order Book: tampilkan level bid & ask teratas, total lot bid vs ask, imbalance %.
   - Trade Book / Intraday Flow: tampilkan ringkasan per slot waktu.
   - Broker Summary: tampilkan top broker by net value, kategori (RICH/KONGLO/AMPAS).
2. TAMPILKAN DATA MENTAH DULU sebelum analisis.
3. HARD RULE: JANGAN pernah skip data order book dari foto.

USER TIER PERSONALIZATION (WAJIB SESUAI MODAL USER):
- MICRO (<100 Juta): Keras, protektif, anti-nyangkut. Fokus fee & likuiditas.
- RETAIL (100 Juta - 1 Miliar): Analitis, skeptis. Prioritaskan R/R >1:3.
- HIGH_NET (1-10 Miliar): Konservatif, preservasi + dividen.
- INSTITUTIONAL (>10 Miliar): Fokus liquidity & slippage.

OCR & DATA INTEGRITY PROTOCOL:
1. ACCOUNTING CHECK: Aset = Liabilitas + Ekuitas.
2. SCALE CHECK: Pastikan satuan konsisten.
`;

  // MODIFIKASI OTAK BERDASARKAN TIER
  let tierInstruction = "";

  switch (tier) {
    case 'MICRO':
      tierInstruction = `
[MODE: MICRO CAP SURVIVAL / GUERRILLA]
User ini modalnya KECIL (< 100 Juta).
- PRIORITAS UTAMA: Cash Flow Speed & Anti-Nyangkut.
- WARNING SYSTEM: Hitung FEE transaksi. Jika R/R < 1:3 setelah fee → TOLAK.
- STRATEGI: Hit & Run ONLY.
- RISK TOLERANCE: Sangat Rendah terhadap saham tidak likuid.
- GAYA BAHASA: Keras, protektif, brutal jujur.
`;
      break;
    case 'RETAIL':
      tierInstruction = `
[MODE: RETAIL GROWTH / SWING]
User ini modal MENENGAH (100 Juta - 1 Miliar).
- PRIORITAS UTAMA: Pertumbuhan Aset (Growth) R/R >1:3.
- WARNING SYSTEM: Hati-hati Value Trap.
- STRATEGI: Follow The Trend + Breakout dengan konfirmasi flow.
- GAYA BAHASA: Analitis, profesional, skeptis.
`;
      break;
    case 'HIGH_NET':
      tierInstruction = `
[MODE: HIGH NET WORTH / SEMI-INSTITUTIONAL]
User ini modal BESAR (1 Miliar - 10 Miliar).
- PRIORITAS UTAMA: Preservasi Modal & Dividen.
- WARNING SYSTEM: Hindari small-cap gorengan.
- STRATEGI: Position Trading + Dividend Aristocrat.
- GAYA BAHASA: Konservatif, strategis.
`;
      break;
    case 'INSTITUTIONAL':
      tierInstruction = `
[MODE: WHALE / MARKET MAKER]
User ini modal RAKSASA (> 10 Miliar).
- PRIORITAS UTAMA: LIKUIDITAS MUTLAK (LIQUIDITY IS KING).
- KRITIS: Masalah utama adalah impact cost & slippage risk.
- STRATEGI: Akumulasi sunyi, hindari visible order besar.
- GAYA BAHASA: Teknis, fokus pada Volume Profile & Depth.
`;
      break;
  }

  return baseIdentity + tierInstruction;
};

const tradePlanSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING },
    entry: { type: Type.STRING },
    tp: { type: Type.STRING },
    sl: { type: Type.STRING },
    reasoning: { type: Type.STRING },
    status: { type: Type.STRING, enum: ["RECOMMENDED", "POSSIBLE", "WAIT & SEE", "FORBIDDEN"] }
  }
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    ticker: { type: Type.STRING },
    priceInfo: {
      type: Type.OBJECT,
      properties: {
        current: { type: Type.STRING },
        bandarAvg: { type: Type.STRING },
        diffPercent: { type: Type.NUMBER },
        status: { type: Type.STRING },
      }
    },
    marketCapAnalysis: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: ["Small Cap", "Mid Cap", "Big Cap", "UNKNOWN"] },
        behavior: { type: Type.STRING },
      }
    },
    supplyDemand: {
        type: Type.OBJECT,
        properties: {
            bidStrength: { type: Type.NUMBER },
            offerStrength: { type: Type.NUMBER },
            verdict: { type: Type.STRING }
        }
    },
    prediction: {
      type: Type.OBJECT,
      properties: {
        direction: { type: Type.STRING, enum: ["UP", "DOWN", "CONSOLIDATE", "UNKNOWN"] },
        probability: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
      }
    },
    stressTest: {
      type: Type.OBJECT,
      properties: {
        passed: { type: Type.BOOLEAN },
        score: { type: Type.NUMBER },
        details: { type: Type.STRING },
      }
    },
    brokerAnalysis: {
      type: Type.OBJECT,
      properties: {
        classification: { type: Type.STRING },
        insight: { type: Type.STRING },
      }
    },
    summary: { type: Type.STRING },
    bearCase: { type: Type.STRING },
    strategy: {
      type: Type.OBJECT,
      properties: {
        bestTimeframe: { type: Type.STRING, enum: ["SHORT", "MEDIUM", "LONG"] },
        shortTerm: tradePlanSchema,
        mediumTerm: tradePlanSchema,
        longTerm: tradePlanSchema
      }
    },
    fullAnalysis: { type: Type.STRING }
  },
  required: ["ticker", "priceInfo", "marketCapAnalysis", "supplyDemand", "prediction", "stressTest", "brokerAnalysis", "summary", "bearCase", "strategy", "fullAnalysis"]
};

export const analyzeStock = async (input: StockAnalysisInput): Promise<AnalysisResult> => {
  // CRITICAL CHECK: Verify API Key existence
  if (!process.env.API_KEY || process.env.API_KEY.includes("your_api_key")) {
    throw new Error("Missing or Invalid API_KEY. Please check your .env file or Vercel Settings.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // GENERATE DYNAMIC SYSTEM INSTRUCTION BASED ON USER TIER
  const dynamicInstruction = getSystemInstruction(input.capitalTier);
  
  const promptParts: any[] = [
    { text: `
      AUDIT REQUEST: ${input.ticker}
      CAPITAL: IDR ${input.capital} (${input.capitalTier})
      RISK PROFILE: ${input.riskProfile}
      
      [INTELLIGENCE RAW DATA]
      ${input.rawIntelligenceData}
      
      [CRITICAL AUDIT TASKS]
      1. SIKAP AI: Ikuti persona Senior Prop Trader. Sesuaikan dengan Tier Modal user (${input.capitalTier}).
      2. DATA FOTO: Jika ada gambar, EKSTRAKSI DETAIL (Bid/Ask, Broker, Net Buy/Sell). Prioritaskan data visual daripada teks jika konflik.
      3. OUTPUT JSON: Wajib return valid JSON sesuai schema.
    ` }
  ];

  if (input.images && input.images.length > 0) {
    input.images.forEach(img => {
      promptParts.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType
        }
      });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: promptParts },
      config: {
        systemInstruction: dynamicInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.0, 
      }
    });

    if (!response.text) {
        throw new Error("Model returned empty response. Possibly blocked or overloaded.");
    }

    const data = JSON.parse(response.text) as AnalysisResult;
    
    return { 
      ...data, 
      id: crypto.randomUUID(), 
      timestamp: Date.now(), 
      sources: [],
      evidenceImages: input.images.map(img => img.preview) 
    };
  } catch (error: any) {
    console.error("Gemini Forensic Error Detail:", error);
    // Forward the specific error message
    throw new Error(error.message || "Unknown API Error");
  }
};

export const runConsistencyCheck = async (history: AnalysisResult[]): Promise<ConsistencyResult> => {
  if (!process.env.API_KEY) throw new Error("API KEY Missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const prompt = `Analisa tren konsistensi jangka panjang untuk ${sorted[0].ticker}. Data: ${JSON.stringify(sorted)}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { 
        responseMimeType: "application/json", 
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                ticker: { type: Type.STRING },
                dataPoints: { type: Type.NUMBER },
                trendVerdict: { type: Type.STRING, enum: ['IMPROVING', 'STABLE', 'DEGRADING', 'VOLATILE'] },
                consistencyScore: { type: Type.NUMBER },
                analysis: { type: Type.STRING },
                actionItem: { type: Type.STRING }
            }
        },
        temperature: 0.0
    }
  });

  return JSON.parse(response.text) as ConsistencyResult;
};
