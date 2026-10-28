import React, { useState } from 'react';
import { AlertCircle, Download, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { ApiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';

const inspirationPrompts = [
  { label: 'Cute kitten photo', prompt: 'A close-up photo of a cute fluffy kitten looking at the camera' },
  { label: 'Sunset beach', prompt: 'A peaceful sunset over a tropical beach with soft golden light' },
  { label: 'Futuristic city', prompt: 'A futuristic city at night with glowing lights and flying cars' },
];

export const OnePromptCreator: React.FC = () => {
  const { business } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateImage = async (promptToGenerate = prompt) => {
    const cleanPrompt = promptToGenerate.trim();
    if (!cleanPrompt || isGenerating) return;

    setPrompt(cleanPrompt);
    setError('');
    setIsGenerating(true);
    try {
      const result = await ApiClient.generatePoster({
        prompt: cleanPrompt,
        businessId: business?.id,
        aspectRatio: '1:1',
        imageMode: 'ai_photo',
        engine: 'auto',
      });
      if (typeof result?.aiImageUrl !== 'string' || !result.aiImageUrl) {
        throw new Error('The image generator did not return an image. Please try again.');
      }
      setImageUrl(result.aiImageUrl);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Image generation failed. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-8 text-white sm:px-8 lg:min-h-[calc(100vh-76px)] lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
      <section>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          AI Image Studio
        </div>
        <h1 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          Type it.
          <br />
          Get an image.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-violet-200 sm:text-base">
          Describe anything you imagine. AI turns it into an image in seconds.
        </p>

        <form
          className="mt-7 max-w-lg rounded-2xl border border-violet-400/20 bg-[#171432] p-3 shadow-xl shadow-violet-950/30"
          onSubmit={(event) => {
            event.preventDefault();
            void generateImage();
          }}
        >
          <label htmlFor="one-prompt-input" className="sr-only">
            Describe the image you want to create
          </label>
          <textarea
            id="one-prompt-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Type anything... e.g. a close-up photo of a cute kitten"
            rows={3}
            maxLength={1000}
            className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-relaxed text-white outline-none placeholder:text-violet-300/50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Generating…' : 'Generate Image'}
          </button>
        </form>

        {error && (
          <div role="alert" className="mt-4 flex max-w-lg items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex max-w-lg flex-wrap gap-2">
          {inspirationPrompts.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => setPrompt(suggestion.prompt)}
              className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-100 transition hover:border-violet-300/50 hover:bg-violet-400/20"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[420px]">
        <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/10 bg-[#171432] shadow-2xl shadow-violet-950/40">
          {imageUrl ? (
            <img src={imageUrl} alt={prompt || 'AI-generated image'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_35%_20%,rgba(99,64,200,0.28),transparent_58%),linear-gradient(145deg,#191635,#10101e)] px-8 text-center">
              {isGenerating ? (
                <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
              ) : (
                <ImageIcon className="h-9 w-9 text-violet-300/70" />
              )}
              <p className="text-sm font-medium text-violet-100/80">
                {isGenerating ? 'Creating your image…' : 'Your image will appear here'}
              </p>
            </div>
          )}
        </div>
        {imageUrl && (
          <div className="mt-4 flex justify-center gap-3">
            <a
              href={imageUrl}
              download="ai-generated-image.png"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-violet-100"
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </span>
            </a>
            <button
              type="button"
              onClick={() => void generateImage()}
              disabled={!prompt.trim() || isGenerating}
              className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-2.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
