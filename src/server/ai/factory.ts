import { IAIProvider } from './provider.interface';
import { GeminiProvider } from './gemini.provider';
import { SmartMockProvider } from './smart-mock.provider';

let cachedProvider: IAIProvider | null = null;

export function getAIProvider(): IAIProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const selected = process.env.AI_PROVIDER || 'auto';
  const geminiKey = process.env.GEMINI_API_KEY;

  if ((selected === 'gemini' || selected === 'auto') && geminiKey && geminiKey.trim() !== '') {
    try {
      cachedProvider = new GeminiProvider(geminiKey);
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      console.log(`🤖 AI Provider initialized: Google Gemini AI (${modelName})`);
      return cachedProvider;
    } catch (e) {
      console.warn('⚠️ Failed initializing Gemini Provider, falling back to SmartMock:', e);
    }
  }

  cachedProvider = new SmartMockProvider();
  console.log('🤖 AI Provider initialized: MarketMind Neural Heuristic Engine (Sandbox / Smart Contextual)');
  return cachedProvider;
}
