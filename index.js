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
    // See if it ends in a timezone, or offset.
    if (/([A-Z]{1,5})|([+-]\d{1,4})$/.test(input)) {
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

function startOfDay(zonedDateTime) {
  return zonedDateTime.startOfDay();
}

function testForMatches(input = '', userRules = [], systemRules = [], userRejectRules = [], systemRejectRules = []) {
  for (const syntax of [...userRejectRules, ...systemRejectRules]) {
    if (syntax.regex.test(input)) {
      return null;
    }
  }
  for (const syntax of [...userRules, ...systemRules]) {
    if (syntax.regex.test(input)) {
      const matches = input.match(syntax.regex);
      return syntax.parse(matches, input);
    }
  }
  return null;
}

export function parseZonedDateAndTime(input, options = {rules: [], reject: [], preferTime: false, defaultDate: null}) {
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
        return nowZoned(timeZone);
      }
    },
    {
      regex: /^\d{4}-\d{2}-\d{2}T.+$/,
      parse: (matches, input) => {
        try {
          return Temporal.Instant.from(input).toZonedDateTimeISO(timeZone);
        } catch {
          return systemParseDate(input, timeZone);
        }
      }
    },
    {
      regex: /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*(Z|[+-]\d{2,4})$/i,
      parse: (matches) => {
        const offset = matches[3].toUpperCase() === 'Z' ? '+00:00' : normalizeOffset(matches[3]);
        return Temporal.Instant.from(`${matches[1]}T${matches[2]}${offset}`).toZonedDateTimeISO(timeZone);
      }
    }
  ];

  const ruleResult = testForMatches(input, options.rules, parseRules, options.reject);
  if (isZonedDateTime(ruleResult) || isDate(ruleResult)) {
    return isDate(ruleResult) ? dateToZonedDateTime(ruleResult, timeZone) : ruleResult;
  }

  const parts = input.replace(/  +/g, ' ').split(' ');

  let datePart = parts.shift() || input;
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
      parsedDate = startOfDay(nowZoned(timeZone));
      timePart = likelyTime;
    }
  }

  // If datePart was null (preferTime with no defaultDate), use today
  if (!parsedDate && isZonedDateTime(timePart)) {
    parsedDate = startOfDay(nowZoned(timeZone));
  }

  const parsedTime = isZonedDateTime(timePart) ? timePart : parseZonedTime(timePart, options);
  if (parsedDate && parsedTime) {
    return parsedDate.with({
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      second: parsedTime.second,
      millisecond: parsedTime.millisecond,
      microsecond: 0,
      nanosecond: 0
    });
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

  const result = testForMatches(input, options.rules, parseRules, options.reject);
  if (isDate(result)) {
    return dateToZonedDateTime(result, timeZone);
  }
  return result;
}

export function parseZonedTime(input, options = {rules: [], reject: []}) {
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

  const rejectRules = [
    {regex: /^(\d+)[\/\\\-](\d+)[\/\\\-](\d{2,})$/}
  ];

  const parseRules = [
    {
      regex: /^c$/i,
      parse: () => {
        return nowZoned(timeZone);
      }
    },
    {
      regex: /^-(\d+)/, // -#
      parse: (matches) => {
        const now = nowZoned(timeZone);
        return now.subtract({minutes: parseInt(matches[1], 10)})
          .with({second: 0, millisecond: 0, microsecond: 0, nanosecond: 0});
      }
    },
    {
      regex: /^\+(\d+)/, // +#
      parse: (matches) => {
        const now = nowZoned(timeZone);
        return now.add({minutes: parseInt(matches[1], 10)})
          .with({second: 0, millisecond: 0, microsecond: 0, nanosecond: 0});
      }
    },
    {
      regex: /^(\d{1,4})\s*([ap]m?)?$/i,
      parse: (matches) => {
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
        const instant = Temporal.Instant.from(`${today}T${matches[1]}:${matches[2]}:${matches[3]}${matches[4] || ''}${offset}`);
        return instant.toZonedDateTimeISO(timeZone);
      }
    },
    {
      regex: /^(\d{1,2})[:.,;\-]?(\d{1,2})?[:.,;\-]?(\d{1,2})?[:.,;\-]?(\d{1,3})?[:.,;\-]?\s*([ap](?=m|^\w|$))?/i,
      parse: (matches) => {
        let hours = matches[1];
        const minutes = parseInt(matches[2] || 0, 10);
        const seconds = parseInt(matches[3] || 0, 10);
        const milliseconds = parseInt(matches[4] || 0, 10);
        const meridiem = matches[5];

        hours = adjustForMeridiem(hours, meridiem);

        return startOfDay(nowZoned(timeZone)).with({
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

  const result = testForMatches(input, options.rules, parseRules, options.reject, rejectRules);
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