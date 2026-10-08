const Temporal = globalThis.Temporal;

if (!Temporal) {
  throw new Error('Temporal is not defined. Please install @js-temporal/polyfill to globalThis.Temporal or use a runtime that supports Temporal.');
}

function resolveTimeZone(options) {
  return options?.timeZone || Temporal.Now.timeZoneId();
}

function normalizeOffset(offset) {
  if (offset.length === 3) return offset + ':00';
  if (offset.length === 5) return offset.substring(0, 3) + ':' + offset.substring(3);
  return offset;
}

const abbreviationTimeZones = {
  ADT: 'America/Halifax',
  AST: 'America/Halifax',
  CDT: 'America/Chicago',
  CST: 'America/Chicago',
  CPT: 'America/Chicago',
  CWT: 'America/Chicago',
  EDT: 'America/New_York',
  EST: 'America/New_York',
  EPT: 'America/New_York',
  EWT: 'America/New_York',
  MDT: 'America/Denver',
  MST: 'America/Denver',
  MPT: 'America/Denver',
  MWT: 'America/Denver',
  PDT: 'America/Los_Angeles',
  PST: 'America/Los_Angeles',
  PPT: 'America/Los_Angeles',
  PWT: 'America/Los_Angeles',
  AKDT: 'America/Anchorage',
  AKST: 'America/Anchorage',
  HDT: 'Pacific/Honolulu',
  HST: 'Pacific/Honolulu',
  HWT: 'Pacific/Honolulu',
  GMT: 'UTC',
  UT: 'UTC',
  UTC: 'UTC'
};

// Zone tokens. The parse rules and hasZoneDesignator() share these pieces, so
// "what counts as a zone" is defined once.

// A named zone: an IANA id (contains "/"), or an abbreviation of two to five
// letters. am/pm and a/p are meridiems, not zones.
const zoneNameSource = '(?![ap]m?$)(?:[A-Za-z][A-Za-z0-9_+\\-]*(?:\\/[A-Za-z0-9_+\\-]+)+|[A-Za-z]{2,5})';

// A named zone at the end of the input, as a whole word, so the tail of a
// longer word ("January") or of an IANA id ("Buenos_Aires") does not count.
const trailingZoneNamePattern = new RegExp(`(?:^|[^A-Za-z/_])(${zoneNameSource})$`, 'i');

// A numeric offset after a time, so date dashes ("2025-01-15", "-3") are not
// read as offsets.
const offsetAfterTimeSource = '\\d{1,2}:\\d{2}[^+-]*[+-]\\d{1,4}(?::?\\d{2})?';

// Z (not as the end of a word) or a numeric offset after a time.
const trailingOffsetPattern = new RegExp(`(?:(?<![A-Za-z])Z|${offsetAfterTimeSource})$`, 'i');

function trailingZoneName(input) {
  return input.match(trailingZoneNamePattern)?.[1];
}

// Returns the IANA id a zone name stands for: an IANA id as written, or the
// mapped zone for a known abbreviation. Returns undefined for anything else.
function resolveZoneName(zoneName) {
  return zoneName.includes('/') ? zoneName : abbreviationTimeZones[zoneName.toUpperCase()];
}

// True when the input ends in some kind of zone: a bracket annotation, Z, a
// numeric offset, or a zone name (including after an "@" separator). A zone
// name the parser cannot resolve still counts; the rules return null for it.
function hasZoneDesignator(input) {
  return /\[[^\]]*\]$/.test(input) || trailingOffsetPattern.test(input) || trailingZoneNamePattern.test(input);
}

function calculateFullYear(input) {
  const currentYear = Temporal.Now.plainDateISO().year.toString();
  const currentShortPrefix = parseInt(currentYear.substring(0, 2), 10);
  const currentShortSuffix = parseInt(currentYear.substring(2), 10);
  const inputAsInt = parseInt(input, 10);
  const prefix = (inputAsInt > currentShortSuffix + 10 ? currentShortPrefix - 1 : currentShortPrefix);
  return `${prefix}${input}`;
}

function systemParseDate(input, timeZone) {
  let parsed = new Date(input);
  if (isDate(parsed)) {
    return dateToZonedDateTime(parsed, timeZone);
  } else {
    parsed = Date.parse(input);
    if (Number.isInteger(parsed)) {
      return dateToZonedDateTime(new Date(parsed), timeZone);
    }
  }
  return null;
}

function dateToZonedDateTime(legacyDate, timeZone) {
  return Temporal.Instant.fromEpochMilliseconds(legacyDate.getTime()).toZonedDateTimeISO(timeZone);
}

function zonedDateTimeToDate(zonedDateTime) {
  return new Date(zonedDateTime.epochMilliseconds);
}

function isDate(input) {
  return input instanceof Date && !isNaN(input.valueOf());
}

function isZonedDateTime(input) {
  return input instanceof Temporal.ZonedDateTime;
}

function isPlainDateTime(input) {
  return input instanceof Temporal.PlainDateTime;
}

function isInstant(input) {
  return input instanceof Temporal.Instant;
}

function isTimeStamp(input) {
  return Number.isFinite(input);
}

function isNotValid(input) {
  return (!isTimeStamp(input) && !input);
}

function isLikelyDateFormat(input) {
  return (input.includes('-') || input.includes('/'));
}

function isLikelyISOFormat(input) {
  // We only want this to match full formats that include full date, separator, and something after the time.
  // YYYY-MM-DDTHH:MM:SSZ
  if (input.length >= 20 && isLikelyDateFormat(input)) {
    // Check for the "T" delimiter
    if (/\d{2}T\d{2}/.test(input)) {
      return true;
    }
    // See if it ends in a zone name only Date might parse, Z, or a numeric
    // offset. Zone names we resolve must fall through to the space split,
    // which applies zone rules instead of the machine zone. Check the name
    // first so an IANA id such as Etc/GMT+5 is not read as an offset.
    const zoneName = trailingZoneName(input);
    if (zoneName) {
      return !resolveZoneName(zoneName);
    }
    if (trailingOffsetPattern.test(input)) {
      return true;
    }
  }
  return false;
}

function adjustForBusinessHours(hour) {
  hour = parseInt(hour, 10);
  if (hour >= 1 && hour <= 6) {
    return hour + 12;
  }
  return hour;
}

function adjustForMeridiem(hours, meridiem) {
  const intHours = parseInt(hours, 10);
  if (meridiem && meridiem.toLowerCase().startsWith('p') && intHours < 12) {
    hours = intHours + 12;
  }
  if (meridiem && meridiem.toLowerCase().startsWith('a') && intHours === 12) {
    hours = intHours - 12;
  }
  if (!meridiem && !hours.startsWith('0')) {
    hours = adjustForBusinessHours(hours);
  }
  return hours.toString();
}

function limitDayToLastOfMonth(year, month, day) {
  const lastDay = new Temporal.PlainYearMonth(parseInt(year, 10), parseInt(month, 10)).daysInMonth;
  return Math.min(day, lastDay);
}

function nowZoned(timeZone) {
  return Temporal.Now.zonedDateTimeISO(timeZone);
}

function missingTimeZoneError(input) {
  return new Error(`Date/time missing time zone: ${input}`);
}

// Returns 'compatible' when the token is not a known abbreviation.
function abbreviationDisambiguation(abbreviation) {
  const code = abbreviation?.toUpperCase();
  if (!abbreviationTimeZones[code]) {
    return 'compatible';
  }
  // Daylight, war-time, and peace-time codes name the summer offset, which is
  // the earlier occurrence of a repeated fall-back hour. CPT is peace time and
  // kept the war offset (-05:00 in Chicago), it is not standard time.
  if (code.endsWith('DT') || code.endsWith('WT') || code.endsWith('PT')) {
    return 'earlier';
  }
  return 'later';
}

// Callers must pass a ZonedDateTime. Returns it unchanged when no resultTimeZone was requested.
function projectResultTimeZone(zonedDateTime, resultTimeZone) {
  if (!resultTimeZone) {
    return zonedDateTime;
  }
  return zonedDateTime.withTimeZone(resultTimeZone);
}

function startOfDay(zonedDateTime) {
  return zonedDateTime.startOfDay();
}

// Returns {matched, value}. matched says whether any rule claimed the input;
// value is the rule's parse result, null when the input was rejected or could
// not be parsed. Callers use matched to tell a claimed-but-unparseable input
// (a final null) apart from one no rule claimed (fall through to looser rules).
function testForMatches(input = '', userRules = [], systemRules = [], userRejectRules = [], systemRejectRules = []) {
  for (const syntax of [...userRejectRules, ...systemRejectRules]) {
    if (syntax.regex.test(input)) {
      return {matched: true, value: null};
    }
  }
  for (const syntax of [...userRules, ...systemRules]) {
    if (syntax.regex.test(input)) {
      const matches = input.match(syntax.regex);
      return {matched: true, value: syntax.parse(matches, input)};
    }
  }
  return {matched: false, value: null};
}

export function parseZonedDateAndTime(input, options = {rules: [], reject: [], preferTime: false, defaultDate: null}) {
  const timeZone = resolveTimeZone(options);
  const resultTimeZone = options?.resultTimeZone;
  const requireTimeZone = options?.requireTimeZone;

  let resolvedZonedDateTime;
  if (isZonedDateTime(input)) {
    resolvedZonedDateTime = input;
  } else if (isInstant(input)) {
    resolvedZonedDateTime = input.toZonedDateTimeISO(timeZone);
  } else if (isDate(input)) {
    resolvedZonedDateTime = dateToZonedDateTime(input, timeZone);
  } else if (isTimeStamp(input)) {
    resolvedZonedDateTime = Temporal.Instant.fromEpochMilliseconds(input).toZonedDateTimeISO(timeZone);
  } else if (isPlainDateTime(input)) {
    if (requireTimeZone) {
      throw missingTimeZoneError(input);
    }
    resolvedZonedDateTime = input.toZonedDateTime(timeZone);
  }
  if (resolvedZonedDateTime) {
    return projectResultTimeZone(resolvedZonedDateTime, resultTimeZone);
  }

  if (isNotValid(input)) {
    return input;
  }

  input = input.toString().trim();

  // With requireTimeZone, fail fast when the input names no zone at all,
  // rather than relying on each parse rule to check for itself (easy to miss
  // one). Input that names a zone it cannot resolve still returns null below.
  if (requireTimeZone && !hasZoneDesignator(input)) {
    throw missingTimeZoneError(input);
  }

  const parseRules = [
    {
      regex: /^c$/i,
      parse: () => {
        return nowZoned(timeZone);
      }
    },
    {
      // Full date, a T or space, a time, then a zone introduced by a space or
      // "@" separator, for example "2000-01-01 00:00:00 @ America/Chicago".
      // Must run before the ISO rule below: Temporal.Instant.from throws on
      // trailing text and brackets, and that throw falls back to
      // systemParseDate, which drops the zone. A zone name we cannot resolve
      // returns null.
      regex: new RegExp(`^(\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}(?::\\d{2})?(?:\\.\\d+)?)\\s+(?:@\\s+)?(${zoneNameSource})$`, 'i'),
      parse: (matches) => {
        const zoneName = matches[2];
        const ianaTimeZone = resolveZoneName(zoneName);
        if (!ianaTimeZone) {
          return null;
        }
        try {
          return Temporal.ZonedDateTime.from(`${matches[1]}[${ianaTimeZone}]`, {
            disambiguation: abbreviationDisambiguation(zoneName)
          });
        } catch {
          return null;
        }
      }
    },
    {
      // Must run before the ISO rule below: Temporal.Instant.from throws on bracket
      // annotations, and that throw falls back to systemParseDate which drops the zone.
      regex: /\[.+]$/,
      parse: (matches, input) => {
        try {
          return Temporal.ZonedDateTime.from(input);
        } catch {
          return null;
        }
      }
    },
    {
      regex: /^\d{4}-\d{2}-\d{2}T.+$/,
      parse: (matches, input) => {
        let instant;
        let plainDateTime;
        try {
          instant = Temporal.Instant.from(input);
        } catch {
          // Instant.from failed: the string names no offset, or is malformed.
          try {
            plainDateTime = Temporal.PlainDateTime.from(input);
          } catch {
            return null;
          }
        }
        if (instant) {
          // A bad timeZone option throws here on purpose: the input named an
          // offset, so a zone the caller cannot resolve is a caller error.
          return instant.toZonedDateTimeISO(timeZone);
        }
        // Zoneless ISO: interpret in timeZone, never in the machine zone.
        return plainDateTime.toZonedDateTime(timeZone);
      }
    },
    {
      regex: /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)\s*(Z|[+-]\d{2}(?::?\d{2})?)$/i,
      parse: (matches) => {
        const offset = matches[3].toUpperCase() === 'Z' ? '+00:00' : normalizeOffset(matches[3]);
        let instant;
        try {
          instant = Temporal.Instant.from(`${matches[1]}T${matches[2]}${offset}`);
        } catch {
          return null;
        }
        // A bad timeZone option throws here on purpose: the input named an
        // offset, so a zone the caller cannot resolve is a caller error.
        return instant.toZonedDateTimeISO(timeZone);
      }
    },
    {
      // Date.parse accepts offsets such as GMT+0 that the offset rule does
      // not. The regex claims only shapes it can fully own: a full date, a
      // time, and a trailing offset. Anything else must not match so it can
      // fall through to the space split below.
      regex: new RegExp(`^\\d{4}-\\d{2}-\\d{2}.*\\s${offsetAfterTimeSource}$`, 'i'),
      parse: (matches, input) => {
        return systemParseDate(input, timeZone);
      }
    }
  ];

  const {matched, value: ruleResult} = testForMatches(input, options.rules, parseRules, options.reject);
  if (matched) {
    // A rule claimed the input, so its result is final: a value, or null when
    // the input could not be parsed. Falling through could drop a zone.
    if (isZonedDateTime(ruleResult) || isDate(ruleResult)) {
      const zoned = isDate(ruleResult) ? dateToZonedDateTime(ruleResult, timeZone) : ruleResult;
      return projectResultTimeZone(zoned, resultTimeZone);
    }
    return null;
  }

  // "3 pm" is one time, not day 3 followed by a time part.
  const parts = input.replace(/  +/g, ' ').replace(/^(\d{1,4}) ([ap]m?)(?= |$)/i, '$1$2').split(' ');

  let datePart = parts.shift() || input;
  const hasTimePart = parts.length > 0;
  let timePart = parts.join(' ') || '00:00:00';

  if (isLikelyISOFormat(input)) {
    datePart = input;
    timePart = null;
  }

  if (options.preferTime && !isLikelyDateFormat(input)) {
    const likelyTime = parseZonedTime(input, options);
    if (isZonedDateTime(likelyTime)) {
      if (options.defaultDate) {
        datePart = options.defaultDate;
      } else {
        datePart = null;
      }
      timePart = likelyTime;
    }
  }

  let parsedDate = datePart !== null ? parseZonedDate(datePart, options) : null;
  if (!parsedDate && !isZonedDateTime(timePart)) {
    const likelyTime = parseZonedTime(input, options);
    if (isZonedDateTime(likelyTime)) {
      parsedDate = startOfDay(nowZoned(likelyTime.timeZoneId));
      timePart = likelyTime;
    }
  }

  // If datePart was null (preferTime with no defaultDate), use today in the
  // time part's zone, which the time rules may have named.
  if (!parsedDate && isZonedDateTime(timePart)) {
    parsedDate = startOfDay(nowZoned(timePart.timeZoneId));
  }

  const parsedTime = isZonedDateTime(timePart) ? timePart : parseZonedTime(timePart, options);
  if (hasTimePart && !isLikelyISOFormat(input) && !isZonedDateTime(parsedTime)) {
    // The input carried a time part that no rule could parse, so the parse
    // failed. Returning the date alone would silently drop the time.
    return null;
  }
  if (parsedDate && parsedTime) {
    // The zoneless time rules attach timeZone, so a time in any other zone
    // named that zone in the input (an abbreviation or IANA id). The result
    // then lives in the time's zone, so the wall time the user typed survives
    // and a known abbreviation picks its side of a repeated hour. Otherwise
    // the result stays in the date's zone, which matters when defaultDate is
    // a ZonedDateTime in another zone.
    const timeNamedZone = parsedTime.timeZoneId !== nowZoned(timeZone).timeZoneId;
    const combined = Temporal.ZonedDateTime.from({
      year: parsedDate.year,
      month: parsedDate.month,
      day: parsedDate.day,
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      second: parsedTime.second,
      millisecond: parsedTime.millisecond,
      timeZone: timeNamedZone ? parsedTime.timeZoneId : parsedDate.timeZoneId
    }, {
      disambiguation: typeof timePart === 'string' ? abbreviationDisambiguation(trailingZoneName(timePart)) : 'compatible'
    });
    return projectResultTimeZone(combined, resultTimeZone);
  }

  if (isZonedDateTime(parsedDate)) {
    return projectResultTimeZone(parsedDate, resultTimeZone);
  }
  return parsedDate;
}

export function parseZonedDate(input, options = {rules: [], reject: []}) {
  const timeZone = resolveTimeZone(options);

  if (isZonedDateTime(input)) {
    return input;
  }

  if (isDate(input)) {
    return dateToZonedDateTime(input, timeZone);
  }

  if (isTimeStamp(input)) {
    return Temporal.Instant.fromEpochMilliseconds(input).toZonedDateTimeISO(timeZone);
  }

  if (isNotValid(input)) {
    return input;
  }

  input = input.toString().trim();

  const parseRules = [
    {
      regex: /^c$/i,
      parse: () => {
        return startOfDay(nowZoned(timeZone));
      }
    },
    {
      regex: /^t$/i,
      parse: () => {
        return startOfDay(nowZoned(timeZone).add({days: 1}));
      }
    },
    {
      regex: /^y$/i,
      parse: () => {
        return startOfDay(nowZoned(timeZone).subtract({days: 1}));
      }
    },
    {
      regex: /^f$/i,
      parse: () => {
        return startOfDay(nowZoned(timeZone).with({day: 1}));
      }
    },
    {
      regex: /^l$/i,
      parse: () => {
        const now = nowZoned(timeZone);
        return startOfDay(now.with({day: now.daysInMonth}));
      }
    },
    {
      regex: /^\+(\d+)/, // +#
      parse: (matches) => {
        return startOfDay(nowZoned(timeZone).add({days: parseInt(matches[1], 10)}));
      }
    },
    {
      regex: /^-(\d+)/, // -#
      parse: (matches) => {
        return startOfDay(nowZoned(timeZone).subtract({days: parseInt(matches[1], 10)}));
      }
    },
    {
      regex: /^(\d{1,2})$/, // DD
      parse: (matches) => {
        const now = nowZoned(timeZone);
        const parsedDay = parseInt(matches[1], 10);
        const clampedDay = limitDayToLastOfMonth(now.year, now.month, parsedDay);
        return startOfDay(now.with({day: clampedDay}));
      }
    },
    {
      regex: /^(\d{1,2})[\/\\\-.,;](\d{1,2})?$/, // MM/ or MM/DD
      parse: (matches) => {
        const now = nowZoned(timeZone);
        const parsedMonth = parseInt(matches[1], 10);
        const parsedDay = parseInt(matches[2] || 1, 10);
        const clampedDay = limitDayToLastOfMonth(now.year, parsedMonth, parsedDay);
        return startOfDay(now.with({month: parsedMonth, day: clampedDay}));
      }
    },
    {
      regex: /^(\d{1,2})[\/\\\-.,;](\d{1,2})[\/\\\-.,;](\d{2,4})?$/, // MM/DD/ or MM/DD/YYYY or MM/DD/YY
      parse: (matches) => {
        let year = matches[3];
        if (year?.length === 2) {
          year = calculateFullYear(year);
        }

        const now = nowZoned(timeZone);
        const resolvedYear = year ? parseInt(year, 10) : now.year;
        const parsedMonth = parseInt(matches[1], 10);
        const parsedDay = parseInt(matches[2], 10);
        const clampedDay = limitDayToLastOfMonth(resolvedYear, parsedMonth, parsedDay);
        return startOfDay(now.with({year: resolvedYear, month: parsedMonth, day: clampedDay}));
      }
    },
    {
      regex: /^(\d{4})[\/\\\-.,;](\d{1,2})[\/\\\-.,;](\d{1,2})$/, // YYYY-MM-DD
      parse: (matches) => {
        const parsedYear = parseInt(matches[1], 10);
        const parsedMonth = parseInt(matches[2], 10);
        const parsedDay = parseInt(matches[3], 10);
        const clampedDay = limitDayToLastOfMonth(parsedYear, parsedMonth, parsedDay);
        return Temporal.PlainDate.from({year: parsedYear, month: parsedMonth, day: clampedDay})
          .toZonedDateTime(timeZone);
      }
    },
    {
      regex: /^(\d{8})$/,
      parse: (matches, input) => {
        // YYYYMMDD
        let year = parseInt(input.substring(0, 4), 10);
        let month = parseInt(input.substring(4, 6), 10);
        let day = parseInt(input.substring(6, 8), 10);

        // MMDDYYYY
        if (month > 12 || day > 31) {
          year = parseInt(input.substring(4, 8), 10);
          month = parseInt(input.substring(0, 2), 10);
          day = parseInt(input.substring(2, 4), 10);
        }

        // DDMMYYYY
        if (month > 12 || day > 31) {
          year = parseInt(input.substring(4, 8), 10);
          month = parseInt(input.substring(2, 4), 10);
          day = parseInt(input.substring(0, 2), 10);
        }

        const clampedDay = limitDayToLastOfMonth(year, month, day);
        return Temporal.PlainDate.from({year, month, day: clampedDay})
          .toZonedDateTime(timeZone);
      }
    },
    {
      regex: /.*/,
      parse: (matches, input) => {
        return systemParseDate(input, timeZone);
      }
    }
  ];

  const {value: result} = testForMatches(input, options.rules, parseRules, options.reject);
  if (isDate(result)) {
    return dateToZonedDateTime(result, timeZone);
  }
  return result;
}

export function parseZonedTime(input, options = {rules: [], reject: []}) {
  const timeZone = resolveTimeZone(options);
  const requireTimeZone = options?.requireTimeZone;

  if (isZonedDateTime(input)) {
    return input;
  }

  if (isDate(input)) {
    return dateToZonedDateTime(input, timeZone);
  }

  if (isTimeStamp(input)) {
    return Temporal.Instant.fromEpochMilliseconds(input).toZonedDateTimeISO(timeZone);
  }

  if (isNotValid(input)) {
    return input;
  }

  input = input.toString().trim();

  const rejectRules = [
    {regex: /^(\d+)[\/\\\-](\d+)[\/\\\-](\d{2,})$/}
  ];

  const parseRules = [
    {
      regex: /^c$/i,
      parse: () => {
        if (requireTimeZone) {
          throw missingTimeZoneError(input);
        }
        return nowZoned(timeZone);
      }
    },
    {
      regex: /^-(\d+)/, // -#
      parse: (matches) => {
        if (requireTimeZone) {
          throw missingTimeZoneError(input);
        }
        const now = nowZoned(timeZone);
        return now.subtract({minutes: parseInt(matches[1], 10)})
          .with({second: 0, millisecond: 0, microsecond: 0, nanosecond: 0});
      }
    },
    {
      regex: /^\+(\d+)/, // +#
      parse: (matches) => {
        if (requireTimeZone) {
          throw missingTimeZoneError(input);
        }
        const now = nowZoned(timeZone);
        return now.add({minutes: parseInt(matches[1], 10)})
          .with({second: 0, millisecond: 0, microsecond: 0, nanosecond: 0});
      }
    },
    {
      regex: /^(\d{1,4})\s*([ap]m?)?$/i,
      parse: (matches) => {
        if (requireTimeZone) {
          throw missingTimeZoneError(input);
        }
        const numbers = matches[1];
        const meridiem = matches[2];
        let hour;
        let minutes = 0;
        switch (numbers.length) {
          case 1:
          case 2:
            hour = numbers;
            break;
          case 3:
            hour = numbers.substring(0, 1);
            minutes = numbers.substring(1);
            break;
          case 4:
            hour = numbers.substring(0, 2);
            minutes = numbers.substring(2)
        }

        hour = adjustForMeridiem(hour, meridiem);

        return startOfDay(nowZoned(timeZone)).with({
          hour: parseInt(hour, 10),
          minute: parseInt(minutes, 10),
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0
        });
      }
    },
    {
      regex: /^(\d{2}):(\d{2}):(\d{2})([.]\d{1,3})?([-+]\d{1,4})$/, // ISO 8601 Time Part
      parse: (matches) => {
        const today = Temporal.Now.plainDateISO().toString();
        let offset = matches[5];
        if (offset.length === 3) {
          offset += ':00';
        } else if (offset.length === 5) {
          offset = offset.substring(0, 3) + ':' + offset.substring(3);
        }
        // A numeric offset names an absolute moment: keep the instant and
        // express it in timeZone, like every other offset-bearing input.
        const instant = Temporal.Instant.from(`${today}T${matches[1]}:${matches[2]}:${matches[3]}${matches[4] || ''}${offset}`);
        return instant.toZonedDateTimeISO(timeZone);
      }
    },
    {
      regex: new RegExp(`^(\\d{1,2})[:.,;\\-]?(\\d{1,2})?[:.,;\\-]?(\\d{1,2})?[:.,;\\-]?(\\d{1,3})?[:.,;\\-]?\\s*([ap]m?(?=\\s|$))?(?:\\s+(${zoneNameSource}))?$`, 'i'),
      parse: (matches) => {
        let hours = matches[1];
        const minutes = parseInt(matches[2] || 0, 10);
        const seconds = parseInt(matches[3] || 0, 10);
        const milliseconds = parseInt(matches[4] || 0, 10);
        const meridiem = matches[5];
        const zoneToken = matches[6];

        hours = adjustForMeridiem(hours, meridiem);

        let zone = timeZone;
        if (zoneToken) {
          zone = resolveZoneName(zoneToken);
          if (!zone) {
            // An unknown zone token must fail, not drop the zone.
            return null;
          }
        } else if (requireTimeZone) {
          throw missingTimeZoneError(input);
        }

        let dayStart;
        try {
          dayStart = startOfDay(nowZoned(zone));
        } catch (error) {
          if (!zoneToken) {
            // The zone came from the timeZone option: a caller error throws.
            throw error;
          }
          // The zone came from the input and does not exist.
          return null;
        }
        return dayStart.with({
          hour: parseInt(hours, 10),
          minute: minutes,
          second: seconds,
          millisecond: milliseconds,
          microsecond: 0,
          nanosecond: 0
        });
      }
    }
  ];

  const {value: result} = testForMatches(input, options.rules, parseRules, options.reject, rejectRules);
  if (isDate(result)) {
    return dateToZonedDateTime(result, timeZone);
  }
  return result;
}

// Legacy Date wrappers — thin conversions over the ZonedDateTime API

export function parseDateAndTime(input, options) {
  const result = parseZonedDateAndTime(input, options);
  if (isZonedDateTime(result)) {
    return zonedDateTimeToDate(result);
  }
  return result;
}

export function parseDate(input, options) {
  const result = parseZonedDate(input, options);
  if (isZonedDateTime(result)) {
    return zonedDateTimeToDate(result);
  }
  return result;
}

export function parseTime(input, options) {
  const result = parseZonedTime(input, options);
  if (isZonedDateTime(result)) {
    return zonedDateTimeToDate(result);
  }
  return result;
}