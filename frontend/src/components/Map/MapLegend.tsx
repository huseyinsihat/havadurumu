import React from 'react';
import { Thermometer } from 'lucide-react';
import { TEMP_RANGES } from '../../utils/colors';

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-2 left-2 right-2 sm:top-20 sm:left-3 sm:right-auto sm:bottom-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-4 text-xs min-w-0 sm:min-w-[200px] z-[1000]">
      <div className="font-bold mb-2 sm:mb-3 text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
        <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
        Sıcaklık Skalası
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:block sm:space-y-2.5">
        {TEMP_RANGES.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 sm:gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded transition-colors"
          >
            <span
              className="inline-block w-4 h-4 sm:w-6 sm:h-5 rounded shadow-md border-2 border-white dark:border-slate-700 shrink-0"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-[11px] sm:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors leading-tight">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLegend;
