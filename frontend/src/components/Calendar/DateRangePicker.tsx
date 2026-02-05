import React from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  minDate?: string;
  maxDate?: string;
  onChange: (startDate: string, endDate: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  minDate,
  maxDate,
  onChange,
}) => {
  const clampDate = (value: string): string => {
    if (minDate && value < minDate) return minDate;
    if (maxDate && value > maxDate) return maxDate;
    return value;
  };

  const handleStartChange = (value: string) => {
    const nextStart = clampDate(value);
    const nextEnd = clampDate(endDate < nextStart ? nextStart : endDate);
    onChange(nextStart, nextEnd);
  };

  const handleEndChange = (value: string) => {
    const nextEnd = clampDate(value);
    const nextStart = clampDate(startDate > nextEnd ? nextEnd : startDate);
    onChange(nextStart, nextEnd);
  };

  const isInvalidRange = endDate < startDate;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 dark:text-gray-400">Baslangic</label>
        <input
          type="date"
          value={startDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => handleStartChange(e.target.value)}
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 dark:text-gray-400">Bitis</label>
        <input
          type="date"
          value={endDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => handleEndChange(e.target.value)}
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        />
      </div>
      {isInvalidRange && (
        <div className="text-xs text-red-600 dark:text-red-400 self-end">
          Bitis tarihi baslangictan once olamaz.
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
