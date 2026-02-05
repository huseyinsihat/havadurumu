import { MapPin, Moon, Sun, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

const applyTheme = (nextTheme: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', nextTheme);
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  document.documentElement.style.colorScheme = nextTheme;
};

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showInfo, setShowInfo] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-card border-b border-white/20 dark:border-slate-700/50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Türkiye İklim Haritası
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  İller bazlı seçim, tarih aralığı ve anlık analiz
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Info Button */}
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2.5 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Bilgi"
              >
                <Info className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              {/* Theme Toggle */}
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

                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Gradient bottom border */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      </header>

      {/* Info Modal */}
      {showInfo && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="glass-card max-w-md w-full p-6 scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Hakkında
                </h3>
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
                <strong className="text-slate-900 dark:text-white">Türkiye İklim Haritası</strong>,
                Türkiye'nin 81 ili için gerçek zamanlı ve geçmiş hava durumu verilerini görselleştiren
                modern bir web uygulamasıdır.
              </p>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white">Özellikler:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>İnteraktif Türkiye haritası</li>
                  <li>Gerçek zamanlı hava durumu verileri</li>
                  <li>Geçmiş veri analizi (1940'tan günümüze)</li>
                  <li>Detaylı grafikler ve görselleştirmeler</li>
                  <li>Dark/Light mode desteği</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Veri Kaynağı:</strong> Open-Meteo API<br />
                  <strong>Versiyon:</strong> 2.0.0<br />
                  <strong>© 2026</strong> Türkiye İklim Haritası
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
