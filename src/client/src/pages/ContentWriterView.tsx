import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { FileText, Sparkles, CheckCircle, ShieldCheck, ExternalLink, Plus, BookOpen, Clock, Loader2, AlertCircle } from 'lucide-react';

export const ContentWriterView: React.FC = () => {
  const { business } = useAuth();
  const [contentList, setContentList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('BLOG_POST');
  const [targetKeyword, setTargetKeyword] = useState('');

  const loadContents = async () => {
    try {
      const items = await ApiClient.getContentList(business?.id);
      setContentList(items);
      if (items.length > 0 && !selectedItem) {
        setSelectedItem(items[0]);
      }
    } catch (e) {
      console.error('Failed loading content items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
  }, [business?.id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a target topic.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await ApiClient.generateContent({
        businessId: business?.id,
        topic: topic.trim(),
        contentType,
        targetKeyword: targetKeyword.trim() || topic.trim(),
      });
      if (res?.content) {
        setSelectedItem(res.content);
      }
      await loadContents();
      setIsModalOpen(false);
      setTopic('');
      setTargetKeyword('');
    } catch (err: any) {
      console.error('Content generation error:', err);
      setError(err.message || 'Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Content & SEO Studio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative, search-intent driven articles, landing pages, FAQ schemas, and internal link strategies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 transition-all shadow-soft flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Generate New Article / Page
        </button>
      </div>

      {/* Main Split: Content Sidebar + Document Reader / Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Content List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Generated Library ({contentList.length})
          </div>

          <div className="space-y-2.5">
            {contentList.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all text-xs ${
                    isSelected
                      ? 'bg-white border-brand-400 ring-2 ring-brand-100 shadow-md'
                      : 'bg-white/70 hover:bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.contentType}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {item.aiConfidenceScore}% Confidence
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-1 mb-1">{item.title}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{item.wordCount || 850} words</span>
                    <span>{item.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Document Detail Preview */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-6">
          {selectedItem ? (
            <>
              {/* Top metadata tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-brand-700 border border-brand-200">
                    {selectedItem.contentType}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Fact-Validated & Brand Safe
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Slug: /{selectedItem.slug}</span>
                </div>
              </div>

              {/* Title & SEO Meta */}
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-3">
                  {selectedItem.title}
                </h2>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div>
                    <strong className="text-slate-700">Meta Title:</strong> {selectedItem.metaTitle}
                  </div>
                  <div>
                    <strong className="text-slate-700">Meta Description:</strong> {selectedItem.metaDescription}
                  </div>
                  <div>
                    <strong className="text-slate-700">H1 Header:</strong> {selectedItem.h1}
                  </div>
                </div>
              </div>

              {/* Markdown Body preview */}
              <div className="prose prose-sm max-w-none text-slate-700 border-t border-slate-100 pt-6 space-y-4">
                <div className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                  {selectedItem.content}
                </div>
              </div>

              {/* FAQ Section */}
              {selectedItem.faqs && selectedItem.faqs.length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                    Structured FAQ Schema Markup
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.faqs.map((faq: any, fi: number) => (
                      <div key={fi} className="p-3 rounded-xl bg-indigo-50/50 border border-brand-100 text-xs">
                        <div className="font-bold text-slate-800 mb-0.5">Q: {faq.question}</div>
                        <div className="text-slate-600">A: {faq.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA and Internal Links */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <strong>Call To Action:</strong> "{selectedItem.ctaText || 'Learn More'}"
                </div>
                <button className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors">
                  Publish to CMS / WordPress
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">No document selected</div>
          )}
        </div>
      </div>

      {/* Modal: Generate Content */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Generate Search-Intent Content</h3>
            <p className="text-xs text-slate-500 mb-6">
              Our Content Agent drafts human-readable, schema-ready copy tailored to your brand voice.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Topic</label>
                <input
                  type="text"
                  required
                  disabled={generating}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 5 Signs Your Business Operations Need Automation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Content Type</label>
                <select
                  disabled={generating}
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="BLOG_POST">Long-Form SEO Blog Post</option>
                  <option value="LANDING_PAGE">Conversion Landing Page</option>
                  <option value="PRODUCT_DESCRIPTION">Product / Service Description</option>
                  <option value="FAQ">FAQ & Structured Schema</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Target Keyword</label>
                <input
                  type="text"
                  required
                  disabled={generating}
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  placeholder="e.g. online freight booking & fleet transport"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => {
                    setError(null);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm text-white transition-all ${
                    generating
                      ? 'bg-brand-400 cursor-not-allowed opacity-90'
                      : 'bg-brand-500 hover:bg-brand-600 active:scale-[0.98]'
                  }`}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Content</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
