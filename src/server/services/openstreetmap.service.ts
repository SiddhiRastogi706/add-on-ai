import axios from 'axios';

interface NominatimLocation {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox?: [string, string, string, string];
  osm_type?: 'node' | 'way' | 'relation';
  osm_id?: number;
  type?: string;
  class?: string;
  name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OpenStreetMapCompetitor {
  osmId: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  website: string | null;
  mapUrl: string;
}

export class OpenStreetMapError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'OpenStreetMapError';
  }
}

const tagBySearchTerm: Record<string, Array<[string, string]>> = {
  accountant: [['office', 'accountant']],
  accounting: [['office', 'accountant']],
  bakery: [['shop', 'bakery']],
  bank: [['amenity', 'bank']],
  cafe: [['amenity', 'cafe']],
  'car repair': [['shop', 'car_repair']],
  clinic: [['amenity', 'clinic'], ['amenity', 'doctors']],
  dentist: [['amenity', 'dentist']],
  doctor: [['amenity', 'doctors']],
  doctors: [['amenity', 'doctors']],
  gym: [['leisure', 'fitness_centre']],
  hotel: [['tourism', 'hotel']],
  lawyer: [['office', 'lawyer']],
  legal: [['office', 'lawyer']],
  logistics: [['office', 'logistics']],
  pharmacy: [['amenity', 'pharmacy']],
  restaurant: [['amenity', 'restaurant']],
  school: [['amenity', 'school']],
  supermarket: [['shop', 'supermarket']],
  transport: [['office', 'logistics'], ['office', 'transport']],
  transportation: [['office', 'logistics'], ['office', 'transport']],
  'transportation & logistics': [['office', 'logistics'], ['office', 'transport']],
  'transportation logistics': [['office', 'logistics'], ['office', 'transport']],
  freight: [['office', 'logistics'], ['office', 'transport']],
  truck: [['office', 'logistics'], ['office', 'transport']],
  trucking: [['office', 'logistics'], ['office', 'transport']],
  'truck mitra': [['office', 'logistics'], ['office', 'transport']],
  'freight transport': [['office', 'logistics'], ['office', 'transport']],
  'truck transport': [['office', 'logistics'], ['office', 'transport']],
  'truck booking': [['office', 'logistics'], ['office', 'transport']],
  'truck logistics': [['office', 'logistics'], ['office', 'transport']],
  'vehicle repair': [['shop', 'car_repair']],
};

const normalizeSearchTerm = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const escapeOverpassString = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

const distanceBetweenKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function mapElementToCompetitor(
  element: OverpassElement,
  centerLat: number,
  centerLon: number
): OpenStreetMapCompetitor | null {
  const tags = element.tags || {};
  const name = tags.name || tags.brand;
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!name || latitude === undefined || longitude === undefined) return null;

  const address = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'],
  ].filter(Boolean).join(', ');
  const category =
    tags.amenity ||
    tags.shop ||
    tags.office ||
    tags.tourism ||
    tags.leisure ||
    tags.craft ||
    'Business';
  const website = tags.website || tags['contact:website'] || null;

  return {
    osmId: `${element.type}/${element.id}`,
    name,
    category: category.replace(/_/g, ' '),
    address: address || 'Address not listed in OpenStreetMap',
    latitude,
    longitude,
    distanceKm: Math.round(distanceBetweenKm(centerLat, centerLon, latitude, longitude) * 10) / 10,
    website: website && /^https?:\/\//i.test(website) ? website : null,
    mapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
}

export function mapNominatimResultToCompetitor(
  result: NominatimLocation,
  centerLat: number,
  centerLon: number
): OpenStreetMapCompetitor | null {
  const name = result.name || result.namedetails?.name;
  if (
    !name ||
    !result.osm_type ||
    !result.osm_id ||
    !Number.isFinite(Number(result.lat)) ||
    !Number.isFinite(Number(result.lon))
  ) {
    return null;
  }

  const address = result.address || {};
  const addressParts = [
    address.house_number,
    address.road || address.pedestrian,
    address.suburb || address.neighbourhood,
    address.city || address.town || address.village,
  ].filter(Boolean);
  const website = result.extratags?.website || result.extratags?.['contact:website'] || null;

  return {
    osmId: `${result.osm_type}/${result.osm_id}`,
    name,
    category: (result.type || result.class || 'Business').replace(/_/g, ' '),
    address: addressParts.join(', ') || 'Address not listed in OpenStreetMap',
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    distanceKm:
      Math.round(
        distanceBetweenKm(centerLat, centerLon, Number(result.lat), Number(result.lon)) * 10
      ) / 10,
    website: website && /^https?:\/\//i.test(website) ? website : null,
    mapUrl: `https://www.openstreetmap.org/${result.osm_type}/${result.osm_id}`,
  };
}

export function buildOverpassQuery(
  businessType: string,
  centerLat: number,
  centerLon: number
): string {
  const tags = tagBySearchTerm[normalizeSearchTerm(businessType)];
  const elementsQuery = tags?.length
    ? tags.map(([key, value]) =>
        `nwr(around:8000,${centerLat},${centerLon})["${key}"="${value}"];`
      ).join('\n')
    : `nwr(around:8000,${centerLat},${centerLon})["name"~"${escapeOverpassString(businessType)}",i];`;
  return `[out:json][timeout:20];(${elementsQuery});out center 60;`;
}

function getOverpassEndpoints(): string[] {
  return [
    process.env.OSM_OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ].filter((endpoint, index, endpoints) => endpoints.indexOf(endpoint) === index);
}

function isRetryableOverpassError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return !status || [429, 502, 503, 504].includes(status);
}

export class OpenStreetMapService {
  private static readonly defaultNominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private static lastNominatimRequestAt = 0;
  private static nominatimQueue: Promise<void> = Promise.resolve();
  private static lastOverpassRequestAt = 0;
  private static overpassQueue: Promise<void> = Promise.resolve();
  private static overpassUnavailableUntil = 0;
  private static readonly geocodingCache = new Map<string, {
    result: NominatimLocation;
    expiresAt: number;
  }>();

  static isConfigured(): boolean {
    return true;
  }

  private static async withNominatimThrottle<T>(request: () => Promise<T>): Promise<T> {
    let releaseQueue: (() => void) | undefined;
    const previousRequest = this.nominatimQueue;
    this.nominatimQueue = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });
    await previousRequest;

    try {
      const waitMs = Math.max(0, 1100 - (Date.now() - this.lastNominatimRequestAt));
      if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.lastNominatimRequestAt = Date.now();
      return await request();
    } finally {
      releaseQueue?.();
    }
  }

  private static async geocodeLocation(location: string): Promise<NominatimLocation> {
    const cacheKey = normalizeSearchTerm(location);
    const cached = this.geocodingCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    try {
      return await this.withNominatimThrottle(async () => {
        const refreshedCache = this.geocodingCache.get(cacheKey);
        if (refreshedCache && refreshedCache.expiresAt > Date.now()) return refreshedCache.result;

        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const contactEmail = process.env.OSM_CONTACT_EMAIL;
        const userAgent = `AddonAICompetitorAnalysis/1.0 (${appUrl}${contactEmail ? `; ${contactEmail}` : ''})`;
        const response = await axios.get<NominatimLocation[]>(
          process.env.OSM_NOMINATIM_URL || this.defaultNominatimUrl,
          {
            params: { q: location, format: 'jsonv2', limit: 1, addressdetails: 1 },
            headers: {
              'User-Agent': userAgent,
            },
            timeout: 10000,
          }
        );
        const result = response.data[0];
        if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lon))) {
          throw new OpenStreetMapError(
            'Could not find that location. Try a more specific city or area.',
            404
          );
        }

        this.geocodingCache.set(cacheKey, {
          result,
          expiresAt: Date.now() + 60 * 60 * 1000,
        });
        return result;
      });
    } catch (error) {
      if (error instanceof OpenStreetMapError) throw error;
      if (axios.isAxiosError(error)) {
        console.error('[OpenStreetMapService] Location lookup failed:', {
          status: error.response?.status,
          message: error.message,
        });
        if (error.response?.status === 429) {
          throw new OpenStreetMapError(
            'The free OpenStreetMap location service is busy. Wait a moment and retry.',
            429
          );
        }
      } else {
        console.error('[OpenStreetMapService] Unexpected location lookup error:', error);
      }
      throw new OpenStreetMapError(
        'Could not look up that location right now. Please try again later.',
        502
      );
    }
  }

  private static async queryOverpass(query: string): Promise<OverpassElement[]> {
    let releaseQueue: (() => void) | undefined;
    const previousRequest = this.overpassQueue;
    this.overpassQueue = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });
    await previousRequest;

    try {
      if (this.overpassUnavailableUntil > Date.now()) {
        throw new OpenStreetMapError(
          'OpenStreetMap search is temporarily busy. Please wait a minute and try again.',
          503
        );
      }

      const failedEndpoints: Array<{ endpointNumber: number; status?: number; message: string }> = [];
      const endpoints = getOverpassEndpoints();
      for (const [index, endpoint] of endpoints.entries()) {
        const waitMs = Math.max(0, 1100 - (Date.now() - this.lastOverpassRequestAt));
        if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
        this.lastOverpassRequestAt = Date.now();
        try {
          const response = await axios.post<{ elements?: OverpassElement[] }>(
            endpoint,
            new URLSearchParams({ data: query }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': `AddonAICompetitorAnalysis/1.0 (${process.env.APP_URL || 'http://localhost:5173'}${process.env.OSM_CONTACT_EMAIL ? `; ${process.env.OSM_CONTACT_EMAIL}` : ''})`,
              },
              timeout: 5000,
            }
          );
          if (Array.isArray(response.data?.elements)) {
            this.overpassUnavailableUntil = 0;
            return response.data.elements;
          }
          failedEndpoints.push({
            endpointNumber: index + 1,
            status: response.status,
            message: 'Unexpected response payload',
          });
        } catch (error) {
          if (!isRetryableOverpassError(error)) throw error;
          failedEndpoints.push({
            endpointNumber: index + 1,
            status: axios.isAxiosError(error) ? error.response?.status : undefined,
            message: error instanceof Error ? error.message : 'Unknown upstream error',
          });
        }
      }
      console.warn('[OpenStreetMapService] All Overpass endpoints failed:', failedEndpoints);
      this.overpassUnavailableUntil = Date.now() + 60 * 1000;
      throw new OpenStreetMapError(
        'OpenStreetMap search is temporarily busy. Please wait a minute and try again.',
        503
      );
    } finally {
      releaseQueue?.();
    }
  }

  private static async queryNominatimCompetitors(
    businessType: string,
    location: string,
    centerLat: number,
    centerLon: number
  ): Promise<OpenStreetMapCompetitor[]> {
    const mappedTags = tagBySearchTerm[normalizeSearchTerm(businessType)];
    const searchTerm = mappedTags?.[0]?.[1].replace(/_/g, ' ') || businessType;
    const response = await this.withNominatimThrottle(() =>
      axios.get<NominatimLocation[]>(
        process.env.OSM_NOMINATIM_URL || this.defaultNominatimUrl,
        {
          params: {
            q: `${searchTerm} ${location}`,
            format: 'jsonv2',
            limit: 30,
            addressdetails: 1,
            extratags: 1,
            namedetails: 1,
          },
          headers: {
            'User-Agent': `AddonAICompetitorAnalysis/1.0 (${process.env.APP_URL || 'http://localhost:5173'}${process.env.OSM_CONTACT_EMAIL ? `; ${process.env.OSM_CONTACT_EMAIL}` : ''})`,
          },
          timeout: 10000,
        }
      )
    );

    if (!Array.isArray(response.data)) {
      throw new Error('Unexpected Nominatim search response');
    }

    return response.data
      .map((result) => mapNominatimResultToCompetitor(result, centerLat, centerLon))
      .filter((result): result is OpenStreetMapCompetitor => result !== null)
      .sort((left, right) => left.distanceKm - right.distanceKm)
      .slice(0, 30);
  }

  static async searchCompetitors(
    businessType: string,
    location: string
  ): Promise<{
    businessType: string;
    location: string;
    searchedAt: string;
    source: string;
    attribution: string;
    results: OpenStreetMapCompetitor[];
  }> {
    const locationResult = await this.geocodeLocation(location);
    const centerLat = Number(locationResult.lat);
    const centerLon = Number(locationResult.lon);
    const query = buildOverpassQuery(businessType, centerLat, centerLon);

    try {
      let overpassUnavailable = false;
      let elements: OverpassElement[] = [];
      try {
        elements = await this.queryOverpass(query);
      } catch (error) {
        if (!(error instanceof OpenStreetMapError) || error.statusCode !== 503) throw error;
        overpassUnavailable = true;
      }

      let results = elements
        .map((element) => mapElementToCompetitor(element, centerLat, centerLon))
        .filter((item): item is OpenStreetMapCompetitor => item !== null)
        .sort((left, right) => left.distanceKm - right.distanceKm)
        .slice(0, 30);

      if (!results.length) {
        try {
          results = await this.queryNominatimCompetitors(
            businessType,
            location,
            centerLat,
            centerLon
          );
        } catch (error) {
          console.error('[OpenStreetMapService] Nominatim places fallback failed:', {
            status: axios.isAxiosError(error) ? error.response?.status : undefined,
            message: error instanceof Error ? error.message : 'Unknown upstream error',
          });
          throw new OpenStreetMapError(
            'OpenStreetMap search is temporarily busy. Please wait a minute and try again.',
            503
          );
        }
      }
      if (overpassUnavailable && !results.length) {
        throw new OpenStreetMapError(
          'OpenStreetMap search is temporarily busy. Please wait a minute and try again.',
          503
        );
      }

      return {
        businessType,
        location: locationResult.display_name,
        searchedAt: new Date().toISOString(),
        source: 'OpenStreetMap',
        attribution: '© OpenStreetMap contributors',
        results,
      };
    } catch (error) {
      if (error instanceof OpenStreetMapError) throw error;
      if (axios.isAxiosError(error)) {
        console.error('[OpenStreetMapService] Competitor search failed:', {
          status: error.response?.status,
          message: error.message,
        });
        if ([429, 502, 503, 504].includes(error.response?.status || 0) || error.code === 'ECONNABORTED') {
          throw new OpenStreetMapError(
            'OpenStreetMap search is temporarily busy. Please wait a minute and try again.',
            503
          );
        }
      } else {
        console.error('[OpenStreetMapService] Unexpected competitor search error:', error);
      }
      throw new OpenStreetMapError(
        'Could not search OpenStreetMap right now. Please try again later.',
        502
      );
    }
  }
}
