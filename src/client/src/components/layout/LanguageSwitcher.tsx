import React from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';

type AppLanguage = 'en' | 'hi';

interface GoogleTranslateWindow extends Window {
  google?: {
    translate?: {
      TranslateElement: new (
        options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
        elementId: string
      ) => unknown;
    };
  };
  googleTranslateElementInit?: () => void;
}

const getSavedLanguage = (): AppLanguage => {
  if (typeof document === 'undefined') return 'en';
  return document.cookie.split('; ').some((cookie) => cookie === 'googtrans=/en/hi') ? 'hi' : 'en';
};

export const LanguageSwitcher: React.FC = () => {
  const [language, setLanguage] = React.useState<AppLanguage>(getSavedLanguage);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const translateWindow = window as GoogleTranslateWindow;
    const initializeTranslator = () => {
      const TranslateElement = translateWindow.google?.translate?.TranslateElement;
      if (TranslateElement && document.getElementById('google_translate_element')) {
        new TranslateElement(
          { pageLanguage: 'en', includedLanguages: 'en,hi', autoDisplay: false },
          'google_translate_element'
        );
      }
    };

    translateWindow.googleTranslateElementInit = initializeTranslator;
    if (translateWindow.google?.translate?.TranslateElement) {
      initializeTranslator();
    } else if (!document.querySelector('script[data-addon-google-translate]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.dataset.addonGoogleTranslate = 'true';
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const selectLanguage = (nextLanguage: AppLanguage) => {
    setIsOpen(false);
    if (nextLanguage === language) return;

    if (nextLanguage === 'hi') {
      document.cookie = 'googtrans=/en/hi; path=/; max-age=31536000; SameSite=Lax';
    } else {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    document.documentElement.lang = nextLanguage;
    window.location.reload();
  };

  return (
    <>
      <div id="google_translate_element" className="google-translate-host" aria-hidden="true" />
      <div ref={menuRef} className="fixed right-3 top-3 z-[10000] sm:right-5 sm:top-4">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Page language: ${language === 'en' ? 'English' : 'Hindi'}`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-lg backdrop-blur transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <Languages className="h-4 w-4 text-indigo-600" />
          <span>{language === 'en' ? 'English' : 'हिन्दी'}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            role="menu"
            aria-label="Choose page language"
            className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Translate page
            </p>
            {([
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिन्दी (Hindi)' },
            ] as const).map((option) => (
              <button
                key={option.code}
                type="button"
                role="menuitem"
                onClick={() => selectLanguage(option.code)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>{option.label}</span>
                {language === option.code && <Check className="h-4 w-4 text-indigo-600" />}
              </button>
            ))}
            <p className={`px-2.5 pb-1 pt-1 text-[10px] ${loadError ? 'text-rose-600' : 'text-slate-400'}`}>
              {loadError ? 'Translation service could not load. Check your internet connection.' : 'Translation by Google Translate'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
