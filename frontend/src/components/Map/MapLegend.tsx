import React from 'react';
import { Thermometer } from 'lucide-react';
import { TEMP_RANGES } from '../../utils/colors';

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 text-xs min-w-[200px] z-[1000]">
      <div className="font-bold mb-3 text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
        <Thermometer className="w-4 h-4 text-red-500" />
        Sıcaklık Skalası
      </div>
      <div className="space-y-2.5">
        {TEMP_RANGES.map((item) => (
          <div key={item.label} className="flex items-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1.5 rounded transition-colors">
            <span
              className="inline-block w-6 h-5 rounded shadow-md border-2 border-white dark:border-slate-700"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLegend;
