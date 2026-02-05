import { Info, MapPin, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const applyTheme = (nextTheme: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', nextTheme);
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  document.documentElement.style.colorScheme = nextTheme;
};

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <>
      <header className="sticky top-0 z-[5000] glass-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-fuchsia-600 rounded-xl blur-lg opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-r from-blue-500 to-fuchsia-600 p-3 rounded-xl shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Türkiye Hava Durumu Haritası
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  İl bazlı seçim, tarih-saat analizi ve karşılaştırmalı görünüm
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInfo((prev) => !prev)}
                className="p-2.5 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Bilgi"
              >
                <Info className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              <button
                onClick={toggleTheme}
                className="relative p-2.5 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden group"
                aria-label="Tema Değiştir"
              >
                <div className="relative z-10">
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300 transition-transform duration-300 group-hover:rotate-12" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-300 group-hover:rotate-45" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500" />
      </header>

      {showInfo && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          <div className="glass-card max-w-md w-full p-6 scale-in" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-fuchsia-600 rounded-lg">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hakkında</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <strong className="text-slate-900 dark:text-white">Türkiye Hava Durumu Haritası</strong>,
                Türkiye&apos;nin 81 ili için saatlik ve karşılaştırmalı hava durumu verilerini görselleştirir.
              </p>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white">Özellikler</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>İnteraktif Türkiye haritası</li>
                  <li>Tarih-saat seçimine göre dinamik veri</li>
                  <li>Sıcaklık, yağış ve karşılaştırma sıralamaları</li>
                  <li>Gelişmiş meteorolojik metrikler</li>
                  <li>Dark/Light tema desteği</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Veri Kaynağı:</strong> Open-Meteo API
                  <br />
                  <strong>Versiyon:</strong> 2.1.0
                  <br />
                  <strong>© 2026</strong> Türkiye Hava Durumu Haritası
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
