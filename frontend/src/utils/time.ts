const ISTANBUL_TIMEZONE = 'Europe/Istanbul';

const DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: ISTANBUL_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const TIME_PARTS_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: ISTANBUL_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const getPartsMap = (formatter: Intl.DateTimeFormat, date: Date) => {
  const parts = formatter.formatToParts(date);
  const map = new Map<string, string>();

  parts.forEach((part) => {
    map.set(part.type, part.value);
  });

  return map;
};

export const getIstanbulDateString = (date: Date = new Date()): string => {
  const parts = getPartsMap(DATE_PARTS_FORMATTER, date);
  const year = parts.get('year') || '1970';
  const month = parts.get('month') || '01';
  const day = parts.get('day') || '01';
  return `${year}-${month}-${day}`;
};

export const getIstanbulTimeString = (date: Date = new Date()): string => {
  const parts = getPartsMap(TIME_PARTS_FORMATTER, date);
  const hour = parts.get('hour') || '00';
  const minute = parts.get('minute') || '00';
  return `${hour}:${minute}`;
};

export const getIstanbulNow = (date: Date = new Date()) => ({
  date: getIstanbulDateString(date),
  time: getIstanbulTimeString(date),
});
