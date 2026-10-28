import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react';
import { ApiClient } from '../services/api';
import type { LocalCompetitorSearchResult } from '../services/api';
import { useAuth } from '../store/AuthContext';

const getDefaultLocation = (locations: string[] | undefined): string =>
  locations?.find((location) =>
    !/^(india|global|online|local market|regional market)$/i.test(location.trim())
  ) || '';

export const CompetitorView: React.FC = () => {
  const { business } = useAuth();
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [provider, setProvider] = useState('OpenStreetMap');
  const [searchResult, setSearchResult] = useState<LocalCompetitorSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!businessType && business?.industry) setBusinessType(business.industry);
    if (!location && business?.targetLocations?.length) {
      setLocation(getDefaultLocation(business.targetLocations));
    }
  }, [business, businessType, location]);

  useEffect(() => {
    let cancelled = false;
    ApiClient.getLocalCompetitorConfig()
      .then((config) => {
        if (!cancelled) setProvider(config.provider);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Could not check the competitor search service.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSearchResult(null);
    setLoading(true);
    try {
      const result = await ApiClient.searchLocalCompetitors({
        businessType: businessType.trim(),
        location: location.trim(),
      });
      setSearchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Competitor search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Competitor Intel</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Competitor Analysis
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          {provider === 'Serper.dev'
            ? 'Find businesses in your market using live Google Search results.'
            : 'Find nearby businesses listed on OpenStreetMap and compare their mapped business type, address and distance.'}
        </p>
      </header>

      <form onSubmit={handleSearch} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-700">Business or service</span>
          <input
            required
            maxLength={100}
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            placeholder="e.g. dentist, lawyer, truck transport"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-700">City or area</span>
          <input
            required
            maxLength={100}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. Mumbai, Andheri"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Searching…' : 'Find competitors'}
        </button>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-12 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          {provider === 'Serper.dev'
            ? 'Searching live Google results…'
            : 'Looking up the area and nearby mapped businesses…'}
        </div>
      )}

      {!loading && searchResult && (
        <section aria-live="polite" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {searchResult.results.length}{' '}
                {searchResult.source === 'OpenStreetMap' ? 'mapped businesses found' : 'search results found'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {searchResult.businessType} · Search area: {searchResult.location}
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              Live {provider} data
            </span>
          </div>

          {searchResult.source === 'Serper.dev'
            ? searchResult.results.map((competitor) => (
                <article key={`${competitor.position}-${competitor.url}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      #{competitor.position}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-extrabold text-slate-900">{competitor.name}</h3>
                      {competitor.snippet && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{competitor.snippet}</p>
                      )}
                      <a href={competitor.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 break-all text-xs font-bold text-brand-700 hover:underline">
                        Visit result <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                </article>
              ))
            : searchResult.results.map((competitor) => (
                <article key={competitor.osmId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <h3 className="text-lg font-extrabold text-slate-900">{competitor.name}</h3>
                      <p className="mt-1 text-xs font-semibold capitalize text-brand-700">{competitor.category}</p>
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        {competitor.address}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:min-w-32 sm:text-center">
                      <p className="text-lg font-extrabold text-slate-900">{competitor.distanceKm} km</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">from search location</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
                    {competitor.website && (
                      <a href={competitor.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline">
                        Website <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <a href={competitor.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline">
                      View OpenStreetMap record <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="text-[11px] text-slate-500">Ratings, reviews and photos: not provided by this source</span>
                  </div>
                </article>
              ))}

          {searchResult.results.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 font-bold text-slate-800">
                {searchResult.source === 'OpenStreetMap'
                  ? 'No matching mapped businesses found'
                  : 'No search results found'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchResult.source === 'OpenStreetMap'
                  ? 'Try a mapped category such as dentist, lawyer, restaurant, cafe, pharmacy, logistics or transport.'
                  : 'Try a different business type or location.'}
              </p>
            </div>
          )}

          {searchResult.source === 'OpenStreetMap' ? (
            <>
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                Search results are not stored. OpenStreetMap is community-maintained and may not include every business. The public geocoder and query service are shared resources, rate-limited and provided without an uptime guarantee. The distance shown is approximate from the selected area's map center.
              </p>
              <p className="text-xs text-slate-500">
                Data source: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2" translate="no">{searchResult.attribution}</a>
              </p>
            </>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
              Search results are not stored. Results reflect the search provider's ranking and may change over time.
            </p>
          )}
        </section>
      )}
    </main>
  );
};
