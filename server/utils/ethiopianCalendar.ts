/**
 * Ethiopian Calendar (EC) and Gregorian Calendar (GC) conversion and date utilities.
 * Handles dual-calendar validation, Excel serial dates, and ambiguous format detection.
 */

export interface ParsedDateResult {
  isoDate: string; // YYYY-MM-DD (Gregorian canonical)
  originalString: string;
  detectedCalendar: 'GREGORIAN' | 'ETHIOPIAN' | 'EXCEL_SERIAL' | 'UNKNOWN';
  ethiopianEquivalent?: {
    year: number;
    month: number;
    day: number;
    monthNameAmharic: string;
    formatted: string;
  };
  gregorianEquivalent?: {
    year: number;
    month: number;
    day: number;
    formatted: string;
  };
  isValid: boolean;
  isAmbiguous: boolean;
  notes?: string;
}

export const ETHIOPIAN_MONTHS = [
  { index: 1, nameEn: 'Meskerem', nameAm: 'መስከረም', startGcMonth: 9, startGcDay: 11 },
  { index: 2, nameEn: 'Tikimt', nameAm: 'ጥቅምት', startGcMonth: 10, startGcDay: 11 },
  { index: 3, nameEn: 'Hidar', nameAm: 'ኅዳር', startGcMonth: 11, startGcDay: 10 },
  { index: 4, nameEn: 'Tahsas', nameAm: 'ታኅሣሥ', startGcMonth: 12, startGcDay: 10 },
  { index: 5, nameEn: 'Tir', nameAm: 'ጥር', startGcMonth: 1, startGcDay: 9 },
  { index: 6, nameEn: 'Yakatit', nameAm: 'የካቲት', startGcMonth: 2, startGcDay: 8 },
  { index: 7, nameEn: 'Megabit', nameAm: 'መጋቢት', startGcMonth: 3, startGcDay: 10 },
  { index: 8, nameEn: 'Miazia', nameAm: 'ሚያዝያ', startGcMonth: 4, startGcDay: 9 },
  { index: 9, nameEn: 'Ginbot', nameAm: 'ግንቦት', startGcMonth: 5, startGcDay: 9 },
  { index: 10, nameEn: 'Sene', nameAm: 'ሰኔ', startGcMonth: 6, startGcDay: 8 },
  { index: 11, nameEn: 'Hamle', nameAm: 'ሐምሌ', startGcMonth: 7, startGcDay: 8 },
  { index: 12, nameEn: 'Nehase', nameAm: 'ነሐሴ', startGcMonth: 8, startGcDay: 7 },
  { index: 13, nameEn: 'Pagume', nameAm: 'ጳጉሜ', startGcMonth: 9, startGcDay: 6 },
];

/**
 * Checks if a Gregorian year is a leap year.
 */
export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Checks if an Ethiopian year is a leap year (precedes GC leap year).
 */
export function isEthiopianLeapYear(year: number): boolean {
  return (year + 1) % 4 === 0;
}

/**
 * Converts Julian Day Number to Gregorian Date
 */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  let j = jdn + 32044;
  let g = Math.floor(j / 146097);
  let dg = j % 146097;
  let c = Math.floor((Math.floor(dg / 36524) + 1) * 3 / 4);
  let dc = dg - c * 36524;
  let b = Math.floor(dc / 1461);
  let db = dc % 1461;
  let a = Math.floor((Math.floor(db / 365) + 1) * 3 / 4);
  let da = db - a * 365;
  let y = g * 400 + c * 100 + b * 4 + a;
  let m = Math.floor((da * 5 + 308) / 153) - 2;
  let d = da - Math.floor((m + 4) * 153 / 5) + 122;
  let year = y - 4800 + Math.floor((m + 2) / 12);
  let month = ((m + 2) % 12) + 1;
  let day = d + 1;
  return { year, month, day };
}

/**
 * Converts Gregorian Date to Julian Day Number
 */
export function gregorianToJdn(year: number, month: number, day: number): number {
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Converts Ethiopian Date to Julian Day Number
 */
export function ethiopianToJdn(year: number, month: number, day: number): number {
  const ERA = 1723856; // JDN of Ethiopian Epoch (Meskerem 1, 1 EC = August 29, 8 AD Julian)
  return ERA + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

/**
 * Converts Julian Day Number to Ethiopian Date
 */
export function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
  const ERA = 1723856;
  const r = (jdn - ERA) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - ERA) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

/**
 * Converts Ethiopian Calendar date to Gregorian Calendar date
 */
export function ethiopianToGregorian(year: number, month: number, day: number): {
  year: number;
  month: number;
  day: number;
  formatted: string;
} {
  const jdn = ethiopianToJdn(year, month, day);
  const gc = jdnToGregorian(jdn);
  const formatted = `${gc.year}-${String(gc.month).padStart(2, '0')}-${String(gc.day).padStart(2, '0')}`;
  return { ...gc, formatted };
}

/**
 * Converts Gregorian Calendar date to Ethiopian Calendar date
 */
export function gregorianToEthiopian(year: number, month: number, day: number): {
  year: number;
  month: number;
  day: number;
  monthNameAmharic: string;
  monthNameEnglish: string;
  formatted: string;
} {
  const jdn = gregorianToJdn(year, month, day);
  const ec = jdnToEthiopian(jdn);
  const monthMeta = ETHIOPIAN_MONTHS[ec.month - 1] || ETHIOPIAN_MONTHS[0];
  const formatted = `${ec.year}-${String(ec.month).padStart(2, '0')}-${String(ec.day).padStart(2, '0')}`;
  return {
    ...ec,
    monthNameAmharic: monthMeta.nameAm,
    monthNameEnglish: monthMeta.nameEn,
    formatted,
  };
}

/**
 * Parses an Excel serial number (e.g. 44561 -> 2022-01-01)
 */
export function parseExcelSerialDate(serial: number): string | null {
  if (typeof serial !== 'number' || isNaN(serial) || serial < 1) return null;
  // Excel leap year bug in 1900
  const utcDays = Math.floor(serial - (serial > 60 ? 25569 : 25568));
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  if (isNaN(dateInfo.getTime())) return null;
  return dateInfo.toISOString().split('T')[0];
}

/**
 * Comprehensive parser that detects EC, GC, Excel serials, mixed delimiters, and validates consistency.
 */
export function parseLegacyDate(input: any, forceCalendar?: 'ETHIOPIAN' | 'GREGORIAN'): ParsedDateResult {
  if (input === null || input === undefined || input === '') {
    return {
      isoDate: '',
      originalString: '',
      detectedCalendar: 'UNKNOWN',
      isValid: false,
      isAmbiguous: false,
      notes: 'Empty date value',
    };
  }

  // Handle number (Excel serial)
  if (typeof input === 'number') {
    const gcIso = parseExcelSerialDate(input);
    if (gcIso) {
      const [y, m, d] = gcIso.split('-').map(Number);
      const ec = gregorianToEthiopian(y, m, d);
      return {
        isoDate: gcIso,
        originalString: String(input),
        detectedCalendar: 'EXCEL_SERIAL',
        ethiopianEquivalent: {
          year: ec.year,
          month: ec.month,
          day: ec.day,
          monthNameAmharic: ec.monthNameAmharic,
          formatted: ec.formatted,
        },
        gregorianEquivalent: {
          year: y,
          month: m,
          day: d,
          formatted: gcIso,
        },
        isValid: true,
        isAmbiguous: false,
        notes: `Converted from Excel serial date ${input}`,
      };
    }
  }

  const str = String(input).trim();

  // If string contains explicit EC marker (e.g. "2016-05-12 (EC)", "EC", "ዓ.ም")
  const isExplicitEc = forceCalendar === 'ETHIOPIAN' || /\b(EC|E\.C\.|ዓ\.ም|ዓም)\b/i.test(str);
  const cleanStr = str.replace(/\b(EC|E\.C\.|ዓ\.ም|ዓም|GC|G\.C\.)\b/gi, '').trim();

  // Regex patterns
  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = cleanStr.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/);
  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/);
  // Pattern 3: MM/DD/YYYY
  const mdyMatch = cleanStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  let year = 0;
  let month = 0;
  let day = 0;
  let isAmbiguous = false;

  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else if (dmyMatch) {
    day = parseInt(dmyMatch[1], 10);
    month = parseInt(dmyMatch[2], 10);
    year = parseInt(dmyMatch[3], 10);
    if (day <= 12 && month <= 12 && day !== month) {
      isAmbiguous = true; // Could be DD/MM/YYYY or MM/DD/YYYY
    }
  } else {
    // Try standard JavaScript Date parser
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      year = parsedDate.getFullYear();
      month = parsedDate.getMonth() + 1;
      day = parsedDate.getDate();
    } else {
      return {
        isoDate: '',
        originalString: str,
        detectedCalendar: 'UNKNOWN',
        isValid: false,
        isAmbiguous: true,
        notes: `Unrecognized date format: '${str}'`,
      };
    }
  }

  // Determine if it is likely Ethiopian (year between 1990 and 2025, or marked as EC)
  // Current EC year is ~2016-2018 (corresponding to 2024-2026 GC)
  const looksLikeEc = isExplicitEc || (year >= 1995 && year <= 2018 && !str.includes('202'));

  if (looksLikeEc && month >= 1 && month <= 13 && day >= 1 && day <= 30) {
    if (month === 13 && day > 6) {
      return {
        isoDate: '',
        originalString: str,
        detectedCalendar: 'ETHIOPIAN',
        isValid: false,
        isAmbiguous: false,
        notes: `Invalid Ethiopian date: Pagume has maximum 5 or 6 days (got day ${day})`,
      };
    }
    const gc = ethiopianToGregorian(year, month, day);
    const monthMeta = ETHIOPIAN_MONTHS[month - 1] || ETHIOPIAN_MONTHS[0];
    return {
      isoDate: gc.formatted,
      originalString: str,
      detectedCalendar: 'ETHIOPIAN',
      ethiopianEquivalent: {
        year,
        month,
        day,
        monthNameAmharic: monthMeta.nameAm,
        formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      },
      gregorianEquivalent: gc,
      isValid: true,
      isAmbiguous,
      notes: `Converted Ethiopian date ${year}-${month}-${day} (${monthMeta.nameAm}) to Gregorian ${gc.formatted}`,
    };
  }

  // Standard Gregorian verification
  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    const formattedGc = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ec = gregorianToEthiopian(year, month, day);
    return {
      isoDate: formattedGc,
      originalString: str,
      detectedCalendar: 'GREGORIAN',
      ethiopianEquivalent: {
        year: ec.year,
        month: ec.month,
        day: ec.day,
        monthNameAmharic: ec.monthNameAmharic,
        formatted: ec.formatted,
      },
      gregorianEquivalent: {
        year,
        month,
        day,
        formatted: formattedGc,
      },
      isValid: true,
      isAmbiguous,
    };
  }

  return {
    isoDate: '',
    originalString: str,
    detectedCalendar: 'UNKNOWN',
    isValid: false,
    isAmbiguous: true,
    notes: `Invalid date components: Year=${year}, Month=${month}, Day=${day}`,
  };
}

/**
 * Validates whether a provided EC date and GC date correspond to the same day.
 */
export function validateDualDates(
  ecString: string,
  gcString: string
): { matches: boolean; ecParsed: ParsedDateResult; gcParsed: ParsedDateResult; message?: string } {
  const ecParsed = parseLegacyDate(ecString, 'ETHIOPIAN');
  const gcParsed = parseLegacyDate(gcString, 'GREGORIAN');

  if (!ecParsed.isValid || !gcParsed.isValid) {
    return {
      matches: false,
      ecParsed,
      gcParsed,
      message: 'One or both dates could not be parsed validly',
    };
  }

  const matches = ecParsed.isoDate === gcParsed.isoDate;
  return {
    matches,
    ecParsed,
    gcParsed,
    message: matches
      ? `Dates match: EC ${ecParsed.ethiopianEquivalent?.formatted} == GC ${gcParsed.isoDate}`
      : `Date mismatch: EC ${ecParsed.ethiopianEquivalent?.formatted} resolves to GC ${ecParsed.isoDate}, but GC column provided ${gcParsed.isoDate}`,
  };
}
