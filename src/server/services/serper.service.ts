import axios from 'axios';

export interface SerperCompetitor {
  position: number;
  name: string;
  url: string;
  snippet: string;
}

interface SerperSearchResponse {
  organic?: unknown;
}

export class SerperError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'SerperError';
  }
}

export function mapSerperOrganicResult(
  result: unknown,
  index: number
): SerperCompetitor | null {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
  const title = 'title' in result ? result.title : undefined;
  const link = 'link' in result ? result.link : undefined;
  const snippet = 'snippet' in result ? result.snippet : undefined;
  if (typeof title !== 'string' || typeof link !== 'string') return null;

  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  return {
    position: index + 1,
    name: title,
    url: url.toString(),
    snippet: typeof snippet === 'string' ? snippet : '',
  };
}

export class SerperService {
  private static readonly searchUrl = 'https://google.serper.dev/search';

  static isConfigured(): boolean {
    return Boolean(process.env.SERPER_API_KEY?.trim());
  }

  static async searchCompetitors(businessType: string, location: string): Promise<{
    businessType: string;
    location: string;
    searchedAt: string;
    source: 'Serper.dev';
    attribution: string;
    results: SerperCompetitor[];
  }> {
    const apiKey = process.env.SERPER_API_KEY?.trim();
    if (!apiKey) {
      throw new SerperError('Serper.dev is not configured.', 503);
    }

    try {
      const response = await axios.post<SerperSearchResponse>(
        this.searchUrl,
        { q: `${businessType} in ${location}` },
        {
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      if (!Array.isArray(response.data.organic)) {
        throw new SerperError('Serper.dev returned an unexpected search response.', 502);
      }

      const results = response.data.organic
        .map((result, index) => mapSerperOrganicResult(result, index))
        .filter((result): result is SerperCompetitor => result !== null)
        .slice(0, 20);

      return {
        businessType,
        location,
        searchedAt: new Date().toISOString(),
        source: 'Serper.dev',
        attribution: 'Search results provided by Serper.dev.',
        results,
      };
    } catch (error) {
      if (error instanceof SerperError) throw error;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          throw new SerperError('Serper.dev rejected its API key. Check SERPER_API_KEY.', 503);
        }
        if (status === 429) {
          throw new SerperError('Serper.dev search quota is temporarily unavailable.', 503);
        }
        console.error('[SerperService] Search request failed:', {
          status,
          code: error.code,
        });
      } else {
        console.error('[SerperService] Unexpected search error:', error);
      }
      throw new SerperError('Could not search Serper.dev right now. Please try again later.', 502);
    }
  }
}
