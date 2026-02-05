import React from 'react';

interface TimeSelectorProps {
  hourlyMode: boolean;
  onToggle: (hourly: boolean) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ hourlyMode, onToggle }) => {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => onToggle(true)}
        className={`px-4 py-2 text-sm ${
          hourlyMode
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        Saatlik
      </button>
      <button
        onClick={() => onToggle(false)}
        className={`px-4 py-2 text-sm ${
          !hourlyMode
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        Günlük
      </button>
    </div>
  );
};

export default TimeSelector;
