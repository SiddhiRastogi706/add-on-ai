import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { Users, Plus, Sparkles, Mail, Phone, Building, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LeadManagementView: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Google Ads');
  const [notes, setNotes] = useState('');

  const loadLeads = async () => {
    try {
      const data = await ApiClient.getLeads();
      setLeads(data);
    } catch (e) {
      console.error('Failed loading leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createLead({
        name,
        email,
        company,
        source,
        notes: [notes || 'Lead initiated interest'],
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setCompany('');
      setNotes('');
      await loadLeads();
    } catch (e) {
      console.error('Create lead error:', e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await ApiClient.updateLeadStatus(id, newStatus);
      loadLeads();
    } catch (e) {
      console.error('Update lead status error:', e);
    }
  };

  const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lead Qualification & Inbound CRM</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated lead scoring, buying-intent classification, and recommended follow-up routing.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-all shadow-soft flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Prospect Lead
        </button>
      </div>

      {/* Kanban / Pipeline View */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statuses.map((st) => {
          const colLeads = leads.filter((l) => l.status === st);
          return (
            <div key={st} className="glass-card rounded-3xl p-4 border border-slate-200/80 shadow-soft flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{st}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {colLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colLeads.map((lead) => (
                  <div key={lead.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-sm text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{lead.name}</span>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          lead.aiPriority === 'HOT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : lead.aiPriority === 'WARM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lead.aiPriority} ({lead.leadScore})
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate">{lead.company || lead.email}</div>
                    <div className="text-[10px] text-slate-400">Source: {lead.source}</div>

                    {/* AI Suggested Action */}
                    <div className="p-2 rounded-xl bg-indigo-50/60 border border-brand-100 text-[10px] text-brand-800 leading-snug">
                      <strong className="block text-brand-900 font-bold mb-0.5">AI Next Action:</strong>
                      {lead.aiSuggestedAction}
                    </div>

                    {/* Status Changer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Move:</span>
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 font-semibold outline-none text-[10px]"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Record Prospect Lead</h3>
            <p className="text-xs text-slate-500 mb-6">
              AI will score intent, estimate deal value, and draft immediate personalized follow-up instructions.
            </p>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lead Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. m.vance@techscale.io"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. TechScale Dynamics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attribution Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400 bg-white"
                >
                  <option value="Google Ads">Google Ads (Paid Search)</option>
                  <option value="Google Organic">Google Organic (SEO)</option>
                  <option value="Meta Ads">Meta Ads (FB/IG)</option>
                  <option value="LinkedIn">LinkedIn Thought Leadership</option>
                  <option value="Direct Website">Direct Website Inbound</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inquiry Details / Message</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Inquired about enterprise 50-seat workflow automation package..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-sm"
                >
                  Save & Score Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
