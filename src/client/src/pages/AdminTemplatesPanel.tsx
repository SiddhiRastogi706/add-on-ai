import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EyeOff, Eye, Loader2, Trash2, Upload } from 'lucide-react';
import { ApiClient, PosterTemplate } from '../services/api';

type AdminTemplate = PosterTemplate & { active: boolean };


export const AdminTemplatesPanel: React.FC = () => {
  const [items, setItems] = useState<AdminTemplate[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (cursor: string | null) => {
    setLoading(true);
    try {
      const page = await ApiClient.adminListTemplates(cursor);
      setItems((prev) => (cursor ? [...prev, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Could not load templates.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(null);
  }, [load]);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setMessage(null);
    let uploaded = 0;
    const failed: string[] = [];
    for (const file of files) {
      try {
        const form = new FormData();
        form.append('image', file);
        form.append('category', 'General');
        const created = await ApiClient.adminUploadTemplate(form);
        setItems((prev) => [created, ...prev]);
        uploaded += 1;
      } catch (err: any) {
        failed.push(`${file.name}: ${err?.message || 'failed'}`);
      }
    }
    setUploading(false);
    setMessage({
      type: failed.length ? 'error' : 'ok',
      text: failed.length ? `${uploaded} uploaded, ${failed.length} failed. ${failed[0]}` : `${uploaded} template(s) uploaded.`,
    });
  };

  const toggleActive = async (template: AdminTemplate) => {
    try {
      const updated = await ApiClient.adminUpdateTemplate(template.id, { active: !template.active });
      setItems((prev) => prev.map((item) => (item.id === template.id ? updated : item)));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Update failed.' });
    }
  };

  const remove = async (template: AdminTemplate) => {
    if (!window.confirm('Hide this template from users?')) return;
    try {
      await ApiClient.adminDeleteTemplate(template.id);
      setItems((prev) => prev.map((item) => (item.id === template.id ? { ...item, active: false } : item)));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Delete failed.' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-900">
          <span>Upload poster templates</span>
        </h3>
        <p className="text-xs text-slate-500">
          <span>Square images work best (JPEG, PNG or WebP, up to 10 MB each). You can select many files at once.</span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFiles} />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{uploading ? 'Uploading...' : 'Choose images'}</span>
          </button>
        </div>
        {message && (
          <p role="status" className={`text-xs font-semibold ${message.type === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>
            <span>{message.text}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((template) => (
          <div key={template.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-square bg-slate-100">
              <img src={template.imageUrl} alt={`${template.category} template`} loading="lazy" className={`h-full w-full object-cover ${template.active ? '' : 'opacity-40'}`} />
              {!template.active && (
                <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white">Hidden</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-1 p-2">
              <span className="truncate text-[11px] font-bold text-slate-600">{template.category}</span>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => toggleActive(template)} aria-label={template.active ? 'Hide template' : 'Show template'} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                  {template.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                {template.active && (
                  <button type="button" onClick={() => remove(template)} aria-label="Delete template" className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </p>
      )}
      {!loading && nextCursor && (
        <button type="button" onClick={() => load(nextCursor)} className="mx-auto block rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <span>Load more</span>
        </button>
      )}
      {!loading && items.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          <span>No templates yet. Upload your first one above.</span>
        </p>
      )}
    </div>
  );
};
