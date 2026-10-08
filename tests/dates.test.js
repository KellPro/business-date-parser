import {parseDate, parseTime, parseDateAndTime, parseZonedDate, parseZonedTime, parseZonedDateAndTime} from '../index.js';
import {Temporal as TemporalPolyfill} from '@js-temporal/polyfill';

// Match the library: use the runtime's native Temporal when it has one, and
// fall back to the polyfill only when it does not. Asserting instanceof
// against a different copy than the parser returns would always fail.
const Temporal = globalThis.Temporal || TemporalPolyfill;

import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const test = require('ava');

function expectDate(t, input, year, month, day, hours = 0, minutes = 0, seconds = 0) {
  if (input.replace) {
    input = input.replace('date: ', '');
  }
  const result = parseDate(input);
  t.is(result.getFullYear(), year);
  t.is(result.getMonth() + 1, month);
  t.is(result.getDate(), day);
  t.is(result.getHours(), hours);
  t.is(result.getMinutes(), minutes);
  t.is(result.getSeconds(), seconds);
}

function expectTime(t, input, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) {
  if (input.replace) {
    input = input.replace('time: ', '');
  }
  const result = parseTime(input);
  t.is(result.getHours(), hours);
  t.is(result.getMinutes(), minutes);
  t.is(result.getSeconds(), seconds);
  if (milliseconds > 0) {
    t.is(result.getMilliseconds(), milliseconds);
  }
}

function expectDateAndTime(t, input, year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0, options) {
  if (input.replace) {
    input = input.replace('datetime: ', '');
  }
  const result = parseDateAndTime(input, options);
  t.is(result.getFullYear(), year);
  t.is(result.getMonth() + 1, month);
  t.is(result.getDate(), day);
  t.is(result.getHours(), hours);
  t.is(result.getMinutes(), minutes);
  t.is(result.getSeconds(), seconds);
  if (milliseconds !== false) {
    t.is(result.getMilliseconds(), milliseconds);
  }
}

function expectDateAndTimeISO(t, input, isoString, options) {
  if (input.replace) {
    input = input.replace('datetime: ', '');
  }
  const result = parseDateAndTime(input, options);
  t.is(result.toISOString(), isoString);
}

test('Blank Date', t => {
  const blankValue = parseDate('');
  t.falsy(blankValue);
  const nullValue = parseDate(null);
  t.falsy(nullValue);
});

test('Blank Time', t => {
  const blankValue = parseTime('');
  t.falsy(blankValue);
  const nullValue = parseTime(null);
  t.falsy(nullValue);
});

test('Blank Date And Time', t => {
  const blankValue = parseDateAndTime('');
  t.falsy(blankValue);
  const nullValue = parseDateAndTime(null);
  t.falsy(nullValue);
});

test('Date Object', t => {
  const now = new Date();
  expectDate(t, now, now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
});

test('Date Timestamp', t => {
  const date = new Date('1995-12-17T00:00:00');
  expectDate(t, date.getTime(), 1995, 12, 17);
});

test('Date Custom Rule', t => {
  const result = parseDate('unix epoch', {
    rules: [{
      regex: /^unix epoch$/i, parse: () => {
        return new Date(0);
      }
    }]
  });
  t.is(result.getTime(), 0);
});

test('date: c', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('date: t', t => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('date: y', t => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('date: f', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, 1);
});

test('date: l', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
});

test('date: 11', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, 11);
});

test('date: 11/', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 11, 1);
});

test('date: 55', t => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, last.getDate());
});

test('date: 4/26', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 4, 26);
});

test('date: 11/1', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 11, 1);
});

test('date: 4/26/', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 4, 26);
});

test('date: 4-26', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 4, 26);
});

test('date: 9/31', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 9, 30);
});

test('date: 9/55', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 9, 30);
});

test('date: 3/31', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 3, 31);
});

test('date: 3/32', t => {
  const now = new Date();
  expectDate(t, t.title, now.getFullYear(), 3, 31);
});

test('date: 3/32/1999', t => {
  expectDate(t, t.title, 1999, 3, 31);
});

test('date: 1999-03-32', t => {
  expectDate(t, t.title, 1999, 3, 31);
});

test('date: 2024-02-31', t => {
  expectDate(t, t.title, 2024, 2, 29);
});

test('date: 4/26/1988', t => {
  expectDate(t, t.title, 1988, 4, 26);
});

test('date: 4/26/88', t => {
  expectDate(t, t.title, 1988, 4, 26);
});

test('date: 11/5/2020', t => {
  expectDate(t, t.title, 2020, 11, 5);
});

test('date: 5-3-18', t => {
  expectDate(t, t.title, 2018, 5, 3);
});

test('date: 4-26-1988', t => {
  expectDate(t, t.title, 1988, 4, 26);
});

test('date: 1988-04-26', t => {
  expectDate(t, t.title, 1988, 4, 26);
});

test('date: 2025-03-01', t => {
  expectDate(t, t.title, 2025, 3, 1);
});

test('date: 20210607', t => { // YYYYMMDD
  expectDate(t, t.title, 2021, 6, 7);
});

test('date: 12111988', t => { // MMDDYYYY
  expectDate(t, t.title, 1988, 12, 11);
});

test('date: 13111988', t => { // DDMMYYYY
  expectDate(t, t.title, 1988, 11, 13);
});

test('date: 20012008', t => { // DDMMYYYY
  expectDate(t, t.title, 2008, 1, 20);
});

test('date: 12012008', t => { // MMDDYYYY
  expectDate(t, t.title, 2008, 12, 1);
});

test('date: 19910102', t => { // YYYYMMDD
  expectDate(t, t.title, 1991, 1, 2);
});

test('date: 20240231', t => {
  expectDate(t, t.title, 2024, 2, 29);
});

test('date: -20', t => {
  const now = new Date();
  now.setDate(now.getDate() - 20);
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('date: +20', t => {
  const now = new Date();
  now.setDate(now.getDate() + 20);
  expectDate(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('date: bad value', t => {
  const result = parseDate('bad value');
  t.falsy(result);
});

test('time: c', t => {
  const now = new Date();
  expectTime(t, t.title, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
});

test('time: -20', t => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 20);
  expectTime(t, t.title, now.getHours(), now.getMinutes());
});

test('time: +20', t => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 20);
  expectTime(t, t.title, now.getHours(), now.getMinutes());
});

test('time: 2', t => {
  expectTime(t, t.title, 14);
});

test('time: 02', t => {
  expectTime(t, t.title, 2);
});

test('time: 15', t => {
  expectTime(t, t.title, 15);
});

test('time: 2a', t => {
  expectTime(t, t.title, 2);
});

test('time: 2 am', t => {
  expectTime(t, t.title, 2);
});

test('time: 2:45p', t => {
  expectTime(t, t.title, 14, 45);
});

test('time: 2:45 pm', t => {
  expectTime(t, t.title, 14, 45);
});

test('time: 12:00 AM', t => {
  expectTime(t, t.title, 0, 0);
});

test('time: 12:45am', t => {
  expectTime(t, t.title, 0, 45);
});

test('time: 530', t => {
  expectTime(t, t.title, 17, 30);
});

test('time: 9:23:3', t => {
  expectTime(t, t.title, 9, 23, 3);
});

test('time: 12:42:49 PM', t => {
  expectTime(t, t.title, 12, 42, 49);
});

// The zone is honored, so the legacy Date is that wall time today in the named
// zone, and may render different wall fields on this machine.
function expectTimeInZone(t, input, timeZone, plainTime) {
  const expected = Temporal.Now.plainDateISO(timeZone).toZonedDateTime({timeZone, plainTime});
  t.is(parseTime(input).getTime(), expected.epochMilliseconds);
}

test('time: 08:22:34.028 CST', t => {
  expectTimeInZone(t, '08:22:34.028 CST', 'America/Chicago', '08:22:34.028');
});

test('time: 08:00:00.000 PDT', t => {
  expectTimeInZone(t, '08:00:00.000 PDT', 'America/Los_Angeles', '08:00:00');
});

test('time: 22:00:00.000 AST', t => {
  expectTimeInZone(t, '22:00:00.000 AST', 'America/Halifax', '22:00:00');
});

test('time: 12:00:00.000 America/Chicago', t => {
  expectTimeInZone(t, '12:00:00.000 America/Chicago', 'America/Chicago', '12:00:00');
});

test('time: 12:00:00.000 AM', t => {
  expectTime(t, t.title, 0, 0, 0, 0);
});

test('time: 2:00 America/Chicago', t => {
  // Business hours: 2 with no meridiem is 2 pm.
  expectTimeInZone(t, '2:00 America/Chicago', 'America/Chicago', '14:00:00');
});

test('time: bad value', t => {
  const result = parseTime('bad value');
  t.falsy(result);
});

test('time: 2021-01-27', t => {
  const result = parseTime('2021-01-27');
  t.falsy(result);
});

test('time: 100/100/100', t => {
  const result = parseTime('100/100/100');
  t.falsy(result);
});

test('datetime: c', t => {
  const now = new Date();
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), false);
});

test('datetime: t', t => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('datetime: y', t => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('datetime: y 08:36:50.900 CDT', t => {
  // The CDT zone is honored, so the legacy Date is the same instant as the
  // zoned parse and may render different wall fields on this machine.
  t.is(parseDateAndTime('y 08:36:50.900 CDT').getTime(), parseZonedDateAndTime('y 08:36:50.900 CDT').epochMilliseconds);
});

test('datetime: 1/1/2020 08:22:34.028 CST', t => {
  expectDateAndTimeISO(t, t.title, '2020-01-01T14:22:34.028Z');
});

test('datetime: 2021-01-27 08:36:50.900 CST', t => {
  expectDateAndTimeISO(t, t.title, '2021-01-27T14:36:50.900Z');
});

test('datetime: 55', t => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, last.getDate());
});

test('datetime: 4/26', t => {
  const now = new Date();
  expectDateAndTime(t, t.title, now.getFullYear(), 4, 26);
});

test('datetime: 9/55', t => {
  const now = new Date();
  expectDateAndTime(t, t.title, now.getFullYear(), 9, 30);
});

test('datetime: 2/31/2024', t => {
  expectDateAndTime(t, t.title, 2024, 2, 29);
});

test('datetime: +3 2:30p', t => {
  const now = new Date();
  now.setDate(now.getDate() + 3);
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), 14, 30);
});

test('datetime: 9', t => {
  const now = new Date();
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, 9);
});

test('datetime: 9 but Preferring Time', t => {
  const now = new Date();
  expectDateAndTime(t, '9', now.getFullYear(), now.getMonth() + 1, now.getDate(), 9, 0, 0, 0, {preferTime: true});
});

test('datetime: 9 with options', t => {
  expectDateAndTime(t, '9', 1988, 4, 26, 9, 0, 0, 0, {preferTime: true, defaultDate: '1988-04-26'});
});

test('datetime: Valid Date with Slashes but Preferring Time', t => {
  expectDateAndTime(t, '4/26/1988', 1988, 4, 26, 0, 0, 0, 0, {preferTime: true});
});

test('datetime: Valid Date with Dashes but Preferring Time', t => {
  expectDateAndTime(t, '1988-04-26', 1988, 4, 26, 0, 0, 0, 0, {preferTime: true});
});

test('datetime: Valid Time but Preferring Time', t => {
  // The CDT zone is honored, so the legacy Date is the same instant as the
  // zoned parse and may render different wall fields on this machine.
  t.is(parseDateAndTime('08:36:50.900 CDT', {preferTime: true}).getTime(),
       parseZonedDateAndTime('08:36:50.900 CDT', {preferTime: true}).epochMilliseconds);
});

test('datetime: Yesterday but Preferring Time', t => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  expectDateAndTime(t, 'y', yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate(), 0, 0, 0, 0, {preferTime: true});
});

test('datetime: PostgreSQL ISO 8601 +00', t => {
  expectDateAndTimeISO(t, '2016-02-01 11:19:16+00', '2016-02-01T11:19:16.000Z');
});

test('datetime: PostgreSQL ISO 8601 +0200', t => {
  expectDateAndTimeISO(t, '2016-02-01 11:19:16+0200', '2016-02-01T09:19:16.000Z');
});

test('datetime: PostgreSQL ISO 8601 -0200', t => {
  expectDateAndTimeISO(t, '2016-02-01 11:19:16-0200', '2016-02-01T13:19:16.000Z');
});

test('datetime: 3am', t => {
  const now = new Date();
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), 3);
});

test('datetime: 3pm', t => {
  const now = new Date();
  expectDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), 15);
});

test('datetime: 3am but preferring time', t => {
  const now = new Date();
  expectDateAndTime(t, '3am', now.getFullYear(), now.getMonth() + 1, now.getDate(), 3, 0, 0, 0, {preferTime: true});
});

test('datetime: 3pm but preferring time', t => {
  const now = new Date();
  expectDateAndTime(t, '3pm', now.getFullYear(), now.getMonth() + 1, now.getDate(), 15, 0, 0, 0, {preferTime: true});
});

test('datetime: 2022-02-01 13:00:00.000 PDT', t => {
  // February is standard time in Los Angeles, so PDT names the -08:00 occurrence.
  expectDateAndTimeISO(t, t.title, '2022-02-01T21:00:00.000Z');
});

test('datetime: 2022-02-01 12:00:00.000 Z', t => {
  expectDateAndTimeISO(t, t.title, '2022-02-01T12:00:00.000Z');
});

test('datetime: 2022-02-01 12:00:00.000 America/Chicago', t => {
  expectDateAndTimeISO(t, t.title, '2022-02-01T18:00:00.000Z');
});

test('datetime: 2022-02-01 12:00:00.000 AM', t => {
  expectDateAndTime(t, t.title, 2022, 2, 1, 0);
});

test('datetime: 2022-02-01T19:00:00.000Z', t => {
  expectDateAndTimeISO(t, t.title, '2022-02-01T19:00:00.000Z');
});

test('datetime: 2022-03-28T16:11:37.5158301-05:00', t => {
  expectDateAndTimeISO(t, t.title, '2022-03-28T21:11:37.515Z');
});

test('datetime: bad value', t => {
  const result = parseDateAndTime('bad value');
  t.falsy(result);
});

test('datetime: bad value preferring time', t => {
  const result = parseDateAndTime('bad value', {preferTime: true});
  t.falsy(result);
});

function expectZonedDateAndTime(t, input, year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0, options) {
  if (input.replace) {
    input = input.replace('zoned datetime: ', '');
  }
  const result = parseZonedDateAndTime(input, options);
  t.is(result.year, year);
  t.is(result.month, month);
  t.is(result.day, day);
  t.is(result.hour, hours);
  t.is(result.minute, minutes);
  t.is(result.second, seconds);
  if (milliseconds !== false) {
    t.is(result.millisecond, milliseconds);
  }
}

test('Blank Zoned Date And Time', t => {
  const blankValue = parseZonedDateAndTime('');
  t.falsy(blankValue);
  const nullValue = parseZonedDateAndTime(null);
  t.falsy(nullValue);
});

test('Zoned DateTime Object', t => {
  const now = new Date();
  const result = parseZonedDateAndTime(now);
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, now.getDate());
});

test('Zoned DateTime Timestamp', t => {
  const result = parseZonedDateAndTime(0);
  t.is(result.epochMilliseconds, 0);
});

test('zoned datetime: c', t => {
  const now = new Date();
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), false);
});

test('zoned datetime: t', t => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('zoned datetime: y', t => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate());
});

test('zoned datetime: y 08:36:50.900 CDT', t => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), 8, 36, 50, 900);
});

test('zoned datetime: 1/1/2020 08:22:34.028 CST', t => {
  const result = parseZonedDateAndTime(t.title.replace('zoned datetime: ', ''));
  t.is(result.year, 2020);
  t.is(result.month, 1);
  t.is(result.day, 1);
  t.is(result.hour, 8);
  t.is(result.minute, 22);
  t.is(result.second, 34);
  t.is(result.millisecond, 28);
});

test('zoned datetime: 55', t => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, last.getDate());
});

test('zoned datetime: 4/26', t => {
  const now = new Date();
  expectZonedDateAndTime(t, t.title, now.getFullYear(), 4, 26);
});

test('zoned datetime: 9/55', t => {
  const now = new Date();
  expectZonedDateAndTime(t, t.title, now.getFullYear(), 9, 30);
});

test('zoned datetime: 2/31/2024', t => {
  expectZonedDateAndTime(t, t.title, 2024, 2, 29);
});

test('zoned datetime: +3 2:30p', t => {
  const now = new Date();
  now.setDate(now.getDate() + 3);
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), 14, 30);
});

test('zoned datetime: 9', t => {
  const now = new Date();
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, 9);
});

test('zoned datetime: 9 but Preferring Time', t => {
  const now = new Date();
  expectZonedDateAndTime(t, '9', now.getFullYear(), now.getMonth() + 1, now.getDate(), 9, 0, 0, 0, {preferTime: true});
});

test('zoned datetime: 9 with options', t => {
  expectZonedDateAndTime(t, '9', 1988, 4, 26, 9, 0, 0, 0, {preferTime: true, defaultDate: '1988-04-26'});
});

test('zoned datetime: Valid Date with Slashes but Preferring Time', t => {
  expectZonedDateAndTime(t, '4/26/1988', 1988, 4, 26, 0, 0, 0, 0, {preferTime: true});
});

test('zoned datetime: Valid Date with Dashes but Preferring Time', t => {
  expectZonedDateAndTime(t, '1988-04-26', 1988, 4, 26, 0, 0, 0, 0, {preferTime: true});
});

test('zoned datetime: Valid Time but Preferring Time', t => {
  // With no defaultDate, the date is today in the time part's zone, which may
  // differ from the machine's date.
  const today = Temporal.Now.zonedDateTimeISO('America/Chicago');
  expectZonedDateAndTime(t, '08:36:50.900 CDT', today.year, today.month, today.day, 8, 36, 50, 900, {preferTime: true});
});

test('zoned datetime: Yesterday but Preferring Time', t => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  expectZonedDateAndTime(t, 'y', yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate(), 0, 0, 0, 0, {preferTime: true});
});

test('zoned datetime: PostgreSQL ISO 8601 +00', t => {
  const result = parseZonedDateAndTime('2016-02-01 11:19:16+00', { timeZone: 'UTC' });
  t.is(result.epochMilliseconds, Date.UTC(2016, 1, 1, 11, 19, 16));
});

test('zoned datetime: PostgreSQL ISO 8601 +0200', t => {
  const result = parseZonedDateAndTime('2016-02-01 11:19:16+0200', { timeZone: 'UTC' });
  t.is(result.epochMilliseconds, Date.UTC(2016, 1, 1, 9, 19, 16));
});

test('zoned datetime: PostgreSQL ISO 8601 -0200', t => {
  const result = parseZonedDateAndTime('2016-02-01 11:19:16-0200', { timeZone: 'UTC' });
  t.is(result.epochMilliseconds, Date.UTC(2016, 1, 1, 13, 19, 16));
});

test('zoned datetime: space-separated offset with colon', t => {
  const result = parseZonedDateAndTime('2016-02-01 11:19:16+00:00', {timeZone: 'UTC'});
  t.is(result.epochMilliseconds, Date.UTC(2016, 1, 1, 11, 19, 16));
});

test('zoned datetime: space-separated offset with colon and space', t => {
  const result = parseZonedDateAndTime('2016-02-01 11:19:16 +02:00', {timeZone: 'UTC'});
  t.is(result.epochMilliseconds, Date.UTC(2016, 1, 1, 9, 19, 16));
});

test('zoned datetime: space-separated negative offset with colon', t => {
  const result = parseZonedDateAndTime('2016-02-01 11:19:16-02:00', {timeZone: 'UTC'});
  t.is(result.epochMilliseconds, Date.UTC(2016, 1, 1, 13, 19, 16));
});

test('zoned datetime: Date-parsed offsets still parse', t => {
  t.is(parseZonedDateAndTime('2016-02-01 11:19:16+5', {timeZone: 'UTC'}).epochMilliseconds, Date.parse('2016-02-01 11:19:16+5'));
  t.is(parseZonedDateAndTime('2016-02-01 11:19:16+530', {timeZone: 'UTC'}).epochMilliseconds, Date.parse('2016-02-01 11:19:16+530'));
  t.is(parseZonedDateAndTime('2000-06-15 12:00:00 GMT+00', {timeZone: 'UTC'}).epochMilliseconds, Date.parse('2000-06-15 12:00:00 GMT+00'));
});

test('zoned datetime: 3am', t => {
  const now = new Date();
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), 3);
});

test('zoned datetime: 3pm', t => {
  const now = new Date();
  expectZonedDateAndTime(t, t.title, now.getFullYear(), now.getMonth() + 1, now.getDate(), 15);
});

test('zoned datetime: 3am but preferring time', t => {
  const now = new Date();
  expectZonedDateAndTime(t, '3am', now.getFullYear(), now.getMonth() + 1, now.getDate(), 3, 0, 0, 0, {preferTime: true});
});

test('zoned datetime: 3pm but preferring time', t => {
  const now = new Date();
  expectZonedDateAndTime(t, '3pm', now.getFullYear(), now.getMonth() + 1, now.getDate(), 15, 0, 0, 0, {preferTime: true});
});

test('zoned datetime: 2022-02-01 13:00:00.000 PDT', t => {
  const result = parseZonedDateAndTime('2022-02-01 13:00:00.000 PDT', { timeZone: 'America/Los_Angeles' });
  t.truthy(result.epochMilliseconds > 0);
  t.true(result.hour >= 12 && result.hour <= 14);
});

test('zoned datetime: 2022-02-01 12:00:00.000 Z', t => {
  const result = parseZonedDateAndTime('2022-02-01 12:00:00.000 Z');
  t.is(result.epochMilliseconds, Date.UTC(2022, 1, 1, 12, 0, 0));
});

test('zoned datetime: 2022-02-01 12:00:00.000 America/Chicago', t => {
  const result = parseZonedDateAndTime('2022-02-01 12:00:00.000 America/Chicago');
  t.is(result.year, 2022);
  t.is(result.month, 2);
  t.is(result.day, 1);
  t.is(result.hour, 12);
});

test('zoned datetime: 2022-02-01T19:00:00.000Z', t => {
  const result = parseZonedDateAndTime('2022-02-01T19:00:00.000Z');
  t.is(result.epochMilliseconds, Date.UTC(2022, 1, 1, 19, 0, 0));
});

test('zoned datetime: 2022-03-28T16:11:37.5158301-05:00', t => {
  // The offset input is expressed in timeZone, so pin the zone for a
  // machine-independent wall-time assertion.
  const result = parseZonedDateAndTime('2022-03-28T16:11:37.5158301-05:00', {timeZone: 'America/Chicago'});
  t.truthy(result.epochMilliseconds > 0);
  t.is(result.hour, 16);
  t.is(result.millisecond, 515);
});

test('zoned datetime: bad value', t => {
  const result = parseZonedDateAndTime('bad value');
  t.falsy(result);
});

test('zoned datetime: bad value preferring time', t => {
  const result = parseZonedDateAndTime('bad value', {preferTime: true});
  t.falsy(result);
});

test('zoned datetime: with timeZone option', t => {
  const result = parseZonedDateAndTime('2024-04-26 14:30:00', { timeZone: 'America/New_York' });
  t.is(result.timeZoneId, 'America/New_York');
  t.is(result.hour, 14);
  t.is(result.minute, 30);
});

test('zoned datetime: default timeZone', t => {
  const result = parseZonedDateAndTime('2024-04-26 14:30:00');
  t.truthy(result.timeZoneId);
});

// --- Code Review #9: Reject option tests ---

test('reject: parseTime rejects matching input', t => {
  const result = parseTime('15', { reject: [{ regex: /^\d{2}$/ }] });
  t.falsy(result);
});

test('reject: parseZonedTime rejects matching input', t => {
  const result = parseZonedTime('15', { reject: [{ regex: /^\d{2}$/ }] });
  t.falsy(result);
});

test('reject: parseDate rejects matching input', t => {
  const result = parseDate('4/26/1988', { reject: [{ regex: /^\d+\/\d+\/\d+$/ }] });
  t.falsy(result);
});

test('reject: parseDateAndTime rejects matching input', t => {
  const result = parseDateAndTime('4/26/1988', { reject: [{ regex: /^\d+\/\d+\/\d+$/ }] });
  t.falsy(result);
});

test('reject: parseZonedDate rejects matching input', t => {
  const result = parseZonedDate('4/26/1988', { reject: [{ regex: /^\d+\/\d+\/\d+$/ }] });
  t.falsy(result);
});

test('reject: parseZonedDateAndTime rejects matching input', t => {
  const result = parseZonedDateAndTime('4/26/1988', { reject: [{ regex: /^\d+\/\d+\/\d+$/ }] });
  t.falsy(result);
});

// --- Code Review #10: Direct parseZonedDate tests ---

test('Blank Zoned Date', t => {
  t.falsy(parseZonedDate(''));
  t.falsy(parseZonedDate(null));
});

test('Zoned Date Object', t => {
  const now = new Date();
  const result = parseZonedDate(now.getTime());
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, now.getDate());
});

test('Zoned Date Timestamp', t => {
  const result = parseZonedDate(0);
  t.is(result.epochMilliseconds, 0);
});

test('zoned date: c', t => {
  const now = new Date();
  const result = parseZonedDate('c');
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, now.getDate());
});

test('zoned date: t', t => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const result = parseZonedDate('t');
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, now.getDate());
});

test('zoned date: y', t => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const result = parseZonedDate('y');
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, now.getDate());
});

test('zoned date: f', t => {
  const now = new Date();
  const result = parseZonedDate('f');
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, 1);
});

test('zoned date: l', t => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const result = parseZonedDate('l');
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, lastDay);
});

test('zoned date: +5', t => {
  const now = new Date();
  now.setDate(now.getDate() + 5);
  const result = parseZonedDate('+5');
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, now.getDate());
});

test('zoned date: -5', t => {
  const now = new Date();
  now.setDate(now.getDate() - 5);
  const result = parseZonedDate('-5');
  t.is(result.year, now.getFullYear());
  t.is(result.month, now.getMonth() + 1);
  t.is(result.day, now.getDate());
});

test('zoned date: 4/26/1988', t => {
  const result = parseZonedDate('4/26/1988');
  t.is(result.year, 1988);
  t.is(result.month, 4);
  t.is(result.day, 26);
});

test('zoned date: 1988-04-26', t => {
  const result = parseZonedDate('1988-04-26');
  t.is(result.year, 1988);
  t.is(result.month, 4);
  t.is(result.day, 26);
});

test('zoned date: 2/31/2024 clamps', t => {
  const result = parseZonedDate('2/31/2024');
  t.is(result.year, 2024);
  t.is(result.month, 2);
  t.is(result.day, 29);
});

test('zoned date: with timeZone option', t => {
  const result = parseZonedDate('2024-04-26', { timeZone: 'America/New_York' });
  t.is(result.timeZoneId, 'America/New_York');
  t.is(result.year, 2024);
  t.is(result.month, 4);
  t.is(result.day, 26);
});

test('zoned date: bad value', t => {
  const result = parseZonedDate('bad value');
  t.falsy(result);
});

// --- Code Review #10: Direct parseZonedTime tests ---

test('Blank Zoned Time', t => {
  t.falsy(parseZonedTime(''));
  t.falsy(parseZonedTime(null));
});

test('Zoned Time: Date Object', t => {
  const now = new Date();
  const result = parseZonedTime(now.getTime());
  t.truthy(result);
  t.truthy(result.epochMilliseconds);
});

test('Zoned Time: Timestamp', t => {
  const result = parseZonedTime(0);
  t.is(result.epochMilliseconds, 0);
});

test('zoned time: c', t => {
  const now = new Date();
  const result = parseZonedTime('c');
  t.is(result.hour, now.getHours());
  t.is(result.minute, now.getMinutes());
});

test('zoned time: +20', t => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 20);
  const result = parseZonedTime('+20');
  t.is(result.hour, now.getHours());
  t.is(result.minute, now.getMinutes());
});

test('zoned time: -20', t => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 20);
  const result = parseZonedTime('-20');
  t.is(result.hour, now.getHours());
  t.is(result.minute, now.getMinutes());
});

test('zoned time: 2:45p', t => {
  const result = parseZonedTime('2:45p');
  t.is(result.hour, 14);
  t.is(result.minute, 45);
});

test('zoned time: 08:22:34.028', t => {
  const result = parseZonedTime('08:22:34.028');
  t.is(result.hour, 8);
  t.is(result.minute, 22);
  t.is(result.second, 34);
  t.is(result.millisecond, 28);
});

test('zoned time: 12:00:00.000 America/Chicago', t => {
  const result = parseZonedTime('12:00:00.000 America/Chicago');
  t.is(result.hour, 12);
  t.is(result.minute, 0);
  t.is(result.second, 0);
});

test('zoned time: rejects date-like strings', t => {
  t.falsy(parseZonedTime('2021-01-27'));
  t.falsy(parseZonedTime('100/100/100'));
});

test('zoned time: with timeZone option', t => {
  const result = parseZonedTime('14:30', { timeZone: 'America/New_York' });
  t.is(result.timeZoneId, 'America/New_York');
  t.is(result.hour, 14);
  t.is(result.minute, 30);
});

test('zoned time: bad value', t => {
  const result = parseZonedTime('bad value');
  t.falsy(result);
});

// --- Regression: unparseable strings must return null, not the current time ---

test('zoned time: 9x', t => {
  const result = parseZonedTime('9x');
  t.falsy(result);
});

test('zoned time: 9:30pm', t => {
  const result = parseZonedTime('9:30pm');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.hour, 21);
  t.is(result.minute, 30);
});

test('zoned time: 9:30pm CST', t => {
  const result = parseZonedTime('9:30pm CST');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.hour, 21);
  t.is(result.minute, 30);
});

test('zoned datetime: 9x', t => {
  const result = parseZonedDateAndTime('9x');
  t.falsy(result);
});

test('zoned datetime: 12:00:00x', t => {
  const result = parseZonedDateAndTime('12:00:00x');
  t.falsy(result);
});

// --- System rules: RFC 9557 bracket suffix and textual zone tokens ---

test('zoned datetime: RFC 9557 bracket round-trip', t => {
  const original = Temporal.Now.zonedDateTimeISO('America/Chicago');
  const result = parseZonedDateAndTime(original.toString());
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.epochMilliseconds, original.epochMilliseconds);
  t.is(result.timeZoneId, original.timeZoneId);
});

test('zoned datetime: 2025-01-01 12:00:00.000 CST', t => {
  const result = parseZonedDateAndTime('2025-01-01 12:00:00.000 CST');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.epochMilliseconds, Date.UTC(2025, 0, 1, 18, 0, 0));
});

test('zoned datetime: 2025-01-01 12:00:00.000 America/Chicago', t => {
  const result = parseZonedDateAndTime('2025-01-01 12:00:00.000 America/Chicago');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.offset, '-06:00');
});

test('zoned datetime: 2025-01-01 12:00:00.000 XYZ', t => {
  const result = parseZonedDateAndTime('2025-01-01 12:00:00.000 XYZ');
  t.falsy(result);
});

test('zoned datetime: 2025-01-01T12:00:00-06:00[America/Chicago]', t => {
  const result = parseZonedDateAndTime('2025-01-01T12:00:00-06:00[America/Chicago]', {timeZone: 'UTC'});
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.epochMilliseconds, Date.UTC(2025, 0, 1, 18, 0, 0));
});

// --- System rules: historical US war-time zone abbreviations ---

test('zoned datetime: 1942-11-19 12:00:00.000 CWT', t => {
  const result = parseZonedDateAndTime('1942-11-19 12:00:00.000 CWT');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.epochMilliseconds, Date.UTC(1942, 10, 19, 17, 0, 0));
});

test('zoned datetime: 1943-06-15 12:00:00.000 EWT', t => {
  const result = parseZonedDateAndTime('1943-06-15 12:00:00.000 EWT');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/New_York');
  t.is(result.epochMilliseconds, Date.UTC(1943, 5, 15, 16, 0, 0));
});

test('zoned datetime: 1944-07-01 12:00:00.000 MWT', t => {
  const result = parseZonedDateAndTime('1944-07-01 12:00:00.000 MWT');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Denver');
  t.is(result.epochMilliseconds, Date.UTC(1944, 6, 1, 18, 0, 0));
});

test('zoned datetime: 1945-05-01 12:00:00.000 PWT', t => {
  const result = parseZonedDateAndTime('1945-05-01 12:00:00.000 PWT');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Los_Angeles');
  t.is(result.epochMilliseconds, Date.UTC(1945, 4, 1, 19, 0, 0));
});

test('zoned datetime: 1943-06-15 12:00:00.000 CPT', t => {
  const result = parseZonedDateAndTime('1943-06-15 12:00:00.000 CPT');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.epochMilliseconds, Date.UTC(1943, 5, 15, 17, 0, 0));
});

test('zoned datetime: 1943-06-15 12:00:00.000 EPT', t => {
  const result = parseZonedDateAndTime('1943-06-15 12:00:00.000 EPT');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/New_York');
  t.is(result.epochMilliseconds, Date.UTC(1943, 5, 15, 16, 0, 0));
});

test('zoned datetime: 1942-11-19 12:00:00.000 HWT', t => {
  const result = parseZonedDateAndTime('1942-11-19 12:00:00.000 HWT');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'Pacific/Honolulu');
  t.is(result.epochMilliseconds, Date.UTC(1942, 10, 19, 21, 30, 0));
});

test('zoned datetime: 1942-11-19 12:00:00.000 XYZ', t => {
  const result = parseZonedDateAndTime('1942-11-19 12:00:00.000 XYZ');
  t.falsy(result);
});

// --- @ zone separator ---

test('zoned datetime: 2000-01-01 00:00:00 @ America/Chicago', t => {
  const result = parseZonedDateAndTime('2000-01-01 00:00:00 @ America/Chicago');
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.year, 2000);
  t.is(result.month, 1);
  t.is(result.day, 1);
  t.is(result.hour, 0);
  t.is(result.minute, 0);
  t.is(result.second, 0);
});

test('zoned datetime: 2000-01-01T00:00:00 @ America/Chicago', t => {
  const result = parseZonedDateAndTime('2000-01-01T00:00:00 @ America/Chicago');
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.hour, 0);
});

test('zoned datetime: 2000-01-01 00:00 @ America/Denver', t => {
  const result = parseZonedDateAndTime('2000-01-01 00:00 @ America/Denver');
  t.is(result.timeZoneId, 'America/Denver');
  t.is(result.hour, 0);
  t.is(result.minute, 0);
});

test('zoned datetime: 2000-01-01 12:00:00 @ CST', t => {
  const result = parseZonedDateAndTime('2000-01-01 12:00:00 @ CST');
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.offset, '-06:00');
  t.is(result.hour, 12);
});

test('zoned datetime: 2000-01-01 00:00:00 @ Not/AZone', t => {
  const result = parseZonedDateAndTime('2000-01-01 00:00:00 @ Not/AZone');
  t.falsy(result);
});

test('zoned datetime: 2022-02-01 12:00:00.000 Z is unchanged by @ support', t => {
  const result = parseZonedDateAndTime('2022-02-01 12:00:00.000 Z');
  t.is(result.epochMilliseconds, Date.UTC(2022, 1, 1, 12, 0, 0));
});

// --- Zoneless ISO uses the timeZone option, not the machine zone ---

test('zoned datetime: zoneless ISO matches date-only in timeZone', t => {
  const options = {timeZone: 'America/Denver'};
  const iso = parseZonedDateAndTime('2000-01-01T00:00:00', options);
  const dateOnly = parseZonedDateAndTime('2000-01-01', options);
  t.is(iso.timeZoneId, 'America/Denver');
  t.is(iso.hour, 0);
  t.is(iso.epochMilliseconds, dateOnly.epochMilliseconds);
});

// --- Abbreviation zone rules and DST disambiguation ---
// These tests run against whichever Temporal the runtime provides (native or
// polyfill 0.5.1). Both resolve ambiguous wall times without throwing so far.

test('zoned datetime: 2000-02-02 01:01:01.123 CDT uses zone rules', t => {
  const result = parseZonedDateAndTime('2000-02-02 01:01:01.123 CDT');
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.offset, '-06:00');
  t.is(result.hour, 1);
  t.is(result.minute, 1);
  t.is(result.second, 1);
  t.is(result.millisecond, 123);
});

test('zoned datetime: 2026-11-01 01:30 CDT is the earlier occurrence', t => {
  const result = parseZonedDateAndTime('2026-11-01 01:30 CDT');
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.offset, '-05:00');
  t.is(result.hour, 1);
  t.is(result.minute, 30);
});

test('zoned datetime: 2026-11-01 01:30 CST is the later occurrence', t => {
  const result = parseZonedDateAndTime('2026-11-01 01:30 CST');
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.offset, '-06:00');
  t.is(result.hour, 1);
  t.is(result.minute, 30);
});

// --- Zone tokens on shorthand and slash dates are honored, not dropped ---

test('zoned datetime: 1/1/2020 08:22:34.028 CST honors the zone', t => {
  const result = parseZonedDateAndTime('1/1/2020 08:22:34.028 CST');
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.epochMilliseconds, Date.UTC(2020, 0, 1, 14, 22, 34, 28));
});

test('zoned datetime: y 08:36 CDT is honored with requireTimeZone', t => {
  const result = parseZonedDateAndTime('y 08:36 CDT', {requireTimeZone: true});
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.hour, 8);
  t.is(result.minute, 36);
});

test('zoned time: 08:36 XYZ returns null', t => {
  t.falsy(parseZonedTime('08:36 XYZ'));
});

test('zoned datetime: 2000-06-15 12:00:00 UT is UTC', t => {
  const result = parseZonedDateAndTime('2000-06-15 12:00:00 UT');
  t.is(result.timeZoneId, 'UTC');
  t.is(result.epochMilliseconds, Date.UTC(2000, 5, 15, 12, 0, 0));
});

// --- resultTimeZone projects the result; omit keeps the input zone ---

test('zoned datetime: resultTimeZone converts a ZonedDateTime and keeps the instant', t => {
  const input = Temporal.ZonedDateTime.from('2025-01-01T12:00:00-06:00[America/Chicago]');
  const result = parseZonedDateAndTime(input, {resultTimeZone: 'UTC'});
  t.is(result.epochMilliseconds, input.epochMilliseconds);
  t.is(result.timeZoneId, 'UTC');
});

test('zoned datetime: omitted resultTimeZone keeps a ZonedDateTime zone', t => {
  const input = Temporal.ZonedDateTime.from('2025-01-01T12:00:00-06:00[America/Chicago]');
  const result = parseZonedDateAndTime(input);
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.epochMilliseconds, input.epochMilliseconds);
});

test('zoned datetime: resultTimeZone converts an offset string and keeps the instant', t => {
  const result = parseZonedDateAndTime('2022-02-01T19:00:00.000Z', {resultTimeZone: 'America/Chicago'});
  t.is(result.epochMilliseconds, Date.UTC(2022, 1, 1, 19, 0, 0));
  t.is(result.timeZoneId, 'America/Chicago');
});

test('zoned datetime: omitted resultTimeZone expresses Z and offsets in timeZone', t => {
  const zulu = parseZonedDateAndTime('2022-02-01T19:00:00.000Z', {timeZone: 'America/Chicago'});
  t.is(zulu.timeZoneId, 'America/Chicago');
  t.is(zulu.epochMilliseconds, Date.UTC(2022, 1, 1, 19, 0, 0));
  const offset = parseZonedDateAndTime('2016-02-01 11:19:16+00:00', {timeZone: 'America/Chicago'});
  t.is(offset.timeZoneId, 'America/Chicago');
  t.is(offset.epochMilliseconds, Date.UTC(2016, 1, 1, 11, 19, 16));
});

test('zoned datetime: omitted resultTimeZone keeps a named zone', t => {
  const abbreviation = parseZonedDateAndTime('2025-01-01 12:00:00 CST', {timeZone: 'UTC'});
  t.is(abbreviation.timeZoneId, 'America/Chicago');
  const bracket = parseZonedDateAndTime('2025-01-01T12:00:00[America/Chicago]', {timeZone: 'UTC'});
  t.is(bracket.timeZoneId, 'America/Chicago');
});

test('zoned datetime: invalid resultTimeZone throws', t => {
  const error = t.throws(() => {
    parseZonedDateAndTime('2022-02-01T19:00:00.000Z', {resultTimeZone: 'Not/AZone'});
  });
  t.true(error instanceof RangeError);
});

test('zoned datetime: invalid timeZone throws for zoned input', t => {
  const inputs = [
    '2022-02-01T19:00:00.000Z',
    '2022-02-01T19:00:00',
    '2016-02-01 11:19:16+00',
    '2016-02-01 11:19:16+00:00',
    '2025-01-01',
    '3',
    '9:30',
    Temporal.PlainDateTime.from('2000-01-01T00:00:00')
  ];
  for (const input of inputs) {
    const error = t.throws(() => {
      parseZonedDateAndTime(input, {timeZone: 'Not/AZone'});
    });
    t.true(error instanceof RangeError);
  }
});

test('zoned datetime: unparseable offset stamp returns null', t => {
  t.falsy(parseZonedDateAndTime('2022-02-01T99:00:00Z', {timeZone: 'Not/AZone'}));
  t.falsy(parseZonedDateAndTime('2016-02-01 99:19:16+00', {timeZone: 'UTC'}));
  t.falsy(parseZonedDateAndTime('2016-02-01 99:19:16+00:00', {timeZone: 'Not/AZone'}));
});

// --- requireTimeZone rejects input that names no zone ---

test('zoned datetime: requireTimeZone throws on shorthand and zoneless ISO', t => {
  for (const input of ['3', 'c', '12:00 pm', '2000-01-01T00:00:00']) {
    const error = t.throws(() => {
      parseZonedDateAndTime(input, {requireTimeZone: true});
    }, {instanceOf: Error});
    t.is(error.message, `Date/time missing time zone: ${input}`);
  }
});

test('zoned datetime: requireTimeZone throws on time-shaped and date-only input', t => {
  const error = t.throws(() => {
    parseZonedDateAndTime('9a', {requireTimeZone: true});
  }, {instanceOf: Error});
  t.is(error.message, 'Date/time missing time zone: 9a');

  // The central check runs on the full input, so the message names all of it.
  const shorthandError = t.throws(() => {
    parseZonedDateAndTime('y 08:36', {requireTimeZone: true});
  }, {instanceOf: Error});
  t.is(shorthandError.message, 'Date/time missing time zone: y 08:36');

  const dateOnlyError = t.throws(() => {
    parseZonedDateAndTime('1/1/2020', {requireTimeZone: true});
  }, {instanceOf: Error});
  t.is(dateOnlyError.message, 'Date/time missing time zone: 1/1/2020');
});

test('zoned time: requireTimeZone throws on zoneless times', t => {
  for (const input of ['9:30', '9:30pm', '-20', 'c']) {
    t.throws(() => {
      parseZonedTime(input, {requireTimeZone: true});
    }, {instanceOf: Error});
  }
  // A named zone parses.
  t.true(parseZonedTime('9:30pm CST', {requireTimeZone: true}) instanceof Temporal.ZonedDateTime);
});

test('zoned datetime: y +20 still combines through the space split', t => {
  const result = parseZonedDateAndTime('y +20');
  const yesterday = Temporal.Now.zonedDateTimeISO().subtract({days: 1});
  t.true(result instanceof Temporal.ZonedDateTime);
  t.is(result.year, yesterday.year);
  t.is(result.month, yesterday.month);
  t.is(result.day, yesterday.day);
});

test('zoned datetime: 1/1/2020 08:22:34.028+0200 keeps the offset instant', t => {
  const result = parseZonedDateAndTime('1/1/2020 08:22:34.028+0200');
  t.is(result.epochMilliseconds, Date.UTC(2020, 0, 1, 6, 22, 34, 28));
});

test('zoned datetime: requireTimeZone throws on PlainDateTime', t => {
  const input = Temporal.PlainDateTime.from('2000-01-01T00:00:00');
  const error = t.throws(() => {
    parseZonedDateAndTime(input, {requireTimeZone: true});
  }, {instanceOf: Error});
  t.is(error.message, `Date/time missing time zone: ${input}`);
});

test('zoned datetime: requireTimeZone allows zones the parser accepts', t => {
  const universalTime = '2000-06-15 12:00:00 UT';
  t.is(parseZonedDateAndTime(universalTime, {requireTimeZone: true}).epochMilliseconds, Date.parse(universalTime));
  t.is(parseZonedDateAndTime('2000-06-15 12:00:00 ut', {requireTimeZone: true}).epochMilliseconds, Date.parse(universalTime));
  const greenwichOffset = '2000-06-15 12:00:00 GMT+0';
  t.is(parseZonedDateAndTime(greenwichOffset, {requireTimeZone: true}).epochMilliseconds, Date.parse(greenwichOffset));
  t.is(parseZonedDateAndTime('2016-02-01 11:19:16+00:00', {requireTimeZone: true, timeZone: 'UTC'}).epochMilliseconds, Date.UTC(2016, 1, 1, 11, 19, 16));
});

test('zoned datetime: requireTimeZone allows absolute and zoned input', t => {
  const zoned = Temporal.ZonedDateTime.from('2025-01-01T12:00:00-06:00[America/Chicago]');
  t.is(parseZonedDateAndTime(zoned, {requireTimeZone: true}).timeZoneId, 'America/Chicago');
  t.true(parseZonedDateAndTime(new Date('2022-02-01T19:00:00.000Z'), {requireTimeZone: true}) instanceof Temporal.ZonedDateTime);
  t.true(parseZonedDateAndTime(0, {requireTimeZone: true}) instanceof Temporal.ZonedDateTime);
  t.true(parseZonedDateAndTime(Temporal.Instant.from('2022-02-01T19:00:00.000Z'), {requireTimeZone: true}) instanceof Temporal.ZonedDateTime);
  t.is(parseZonedDateAndTime('2022-02-01T19:00:00.000Z', {requireTimeZone: true}).epochMilliseconds, Date.UTC(2022, 1, 1, 19, 0, 0));
  t.is(parseZonedDateAndTime('2025-01-01 12:00:00.000 CST', {requireTimeZone: true}).timeZoneId, 'America/Chicago');
});

test('zoned datetime: default requireTimeZone still parses shorthand', t => {
  t.true(parseZonedDateAndTime('c') instanceof Temporal.ZonedDateTime);
  const now = Temporal.Now.zonedDateTimeISO();
  const day = parseZonedDateAndTime('3');
  t.is(day.hour, 0);
  t.is(day.day, 3);
  t.is(day.year, now.year);
  const threePm = parseZonedDateAndTime('3pm');
  t.is(threePm.hour, 15);
});

test('zoned datetime: PlainDateTime attaches timeZone', t => {
  const input = Temporal.PlainDateTime.from('2000-01-01T00:00:00');
  const result = parseZonedDateAndTime(input, {timeZone: 'America/Denver'});
  t.is(result.timeZoneId, 'America/Denver');
  t.is(result.hour, 0);
  t.is(result.epochMilliseconds, parseZonedDateAndTime('2000-01-01', {timeZone: 'America/Denver'}).epochMilliseconds);
});

// --- Unparseable strings return null and do not throw ---

test('zoned datetime: malformed bracket returns null', t => {
  const result = parseZonedDateAndTime('2000-01-01T00:00:00[Not/AZone]');
  t.falsy(result);
});

test('zoned datetime: 2000-01-01.5 returns null', t => {
  const result = parseZonedDateAndTime('2000-01-01.5');
  t.falsy(result);
});

test('zoned datetime: meridiem times keep their hour regardless of machine zone', t => {
  const options = {timeZone: 'America/Chicago'};
  const am = parseZonedDateAndTime('2025-01-01 11:00 am', options);
  t.is(am.timeZoneId, 'America/Chicago');
  t.is(am.hour, 11);
  t.is(am.epochMilliseconds, Date.UTC(2025, 0, 1, 17, 0, 0));

  const pm = parseZonedDateAndTime('2025-01-01 12:00 pm', options);
  t.is(pm.hour, 12);
  t.is(pm.epochMilliseconds, Date.UTC(2025, 0, 1, 18, 0, 0));

  const pmSeconds = parseZonedDateAndTime('2025-01-01 12:00:00 PM', options);
  t.is(pmSeconds.hour, 12);

  const shortMeridiem = parseZonedDateAndTime('2025-01-01 08:00 a', options);
  t.is(shortMeridiem.hour, 8);
});

test('zoned datetime: space-separated Z parses without seconds in any machine zone', t => {
  const result = parseZonedDateAndTime('2022-02-01 12:00 Z', {timeZone: 'America/Chicago'});
  t.is(result.epochMilliseconds, Date.UTC(2022, 1, 1, 12, 0, 0));
  const offset = parseZonedDateAndTime('2022-02-01 12:00 +02:00', {timeZone: 'UTC'});
  t.is(offset.epochMilliseconds, Date.UTC(2022, 1, 1, 10, 0, 0));
});

test('zoned datetime: unparseable time part returns null instead of dropping it', t => {
  t.falsy(parseZonedDateAndTime('1/1/20 10:00 XYZ'));
  t.falsy(parseZonedDateAndTime('1/1/20 10:00 XYZ', {requireTimeZone: true}));
  t.falsy(parseZonedDateAndTime('1/1/2020 10:00 am Not/AZone'));
});

test('zoned datetime: requireTimeZone rejects shapes the machine zone would otherwise swallow', t => {
  const error = t.throws(() => {
    parseZonedDateAndTime('2020/01/01 10:00:00 AM', {requireTimeZone: true});
  }, {instanceOf: Error});
  t.is(error.message, 'Date/time missing time zone: 2020/01/01 10:00:00 AM');
});

test('zoned datetime: slash dates honor abbreviation disambiguation on a repeated hour', t => {
  const cst = parseZonedDateAndTime('11/1/2026 01:30 CST', {timeZone: 'America/Chicago'});
  t.is(cst.offset, '-06:00');
  const cdt = parseZonedDateAndTime('11/1/2026 01:30 CDT', {timeZone: 'America/Chicago'});
  t.is(cdt.offset, '-05:00');
});

test('zoned datetime: 1945-09-30 01:30 CPT is the war-offset occurrence', t => {
  const result = parseZonedDateAndTime('1945-09-30 01:30 CPT');
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.offset, '-05:00');
});

test('zoned datetime: offset time parts express in timeZone', t => {
  const result = parseZonedDateAndTime('y 08:22:34+0200', {timeZone: 'America/Chicago'});
  t.is(result.timeZoneId, 'America/Chicago');
  t.is(result.hour, 1);
  t.is(result.minute, 22);
  t.is(result.second, 34);
});

test('zoned datetime: slash dates keep an IANA zone', t => {
  const full = parseZonedDateAndTime('1/1/2020 10:00:00 America/Chicago', {timeZone: 'UTC'});
  t.is(full.timeZoneId, 'America/Chicago');
  t.is(full.epochMilliseconds, Date.UTC(2020, 0, 1, 16, 0, 0));
  const short = parseZonedDateAndTime('1/1/20 10:00 America/Denver', {timeZone: 'UTC'});
  t.is(short.timeZoneId, 'America/Denver');
  t.is(short.epochMilliseconds, Date.UTC(2020, 0, 1, 17, 0, 0));
});

test('zoned datetime: requireTimeZone does not read date dashes as an offset', t => {
  for (const input of ['2025-01-15', '1-15', '-3', '+5']) {
    const error = t.throws(() => {
      parseZonedDateAndTime(input, {requireTimeZone: true});
    }, {instanceOf: Error});
    t.is(error.message, `Date/time missing time zone: ${input}`);
  }
});

test('zoned datetime: requireTimeZone does not read a month name as an abbreviation', t => {
  const error = t.throws(() => {
    parseZonedDateAndTime('5 January', {requireTimeZone: true});
  }, {instanceOf: Error});
  t.is(error.message, 'Date/time missing time zone: 5 January');
});

test('zoned datetime: unknown zone abbreviation on a full date returns null', t => {
  t.falsy(parseZonedDateAndTime('2025-01-01 10:00 XYZ', {timeZone: 'UTC'}));
  t.falsy(parseZonedDateAndTime('2025-01-01 10:00:00 BST', {timeZone: 'UTC'}));
});

test('zoned datetime: a spaced meridiem is a time, not a day', t => {
  const options = {timeZone: 'America/Chicago'};
  const today = Temporal.Now.plainDateISO('America/Chicago');
  for (const [input, hour] of [['3 pm', 15], ['9 am', 9], ['12 a', 0], ['1230 pm', 12]]) {
    const result = parseZonedDateAndTime(input, options);
    t.is(result.day, today.day, input);
    t.is(result.hour, hour, input);
  }
  t.is(parseZonedDateAndTime('3 pm CST', options).hour, 15);
});

test('zoned datetime: preferTime with a zoned defaultDate keeps the date zone', t => {
  const defaultDate = Temporal.ZonedDateTime.from('1988-04-26T00:00:00[America/Denver]');
  const result = parseZonedDateAndTime('9', {timeZone: 'UTC', preferTime: true, defaultDate});
  t.is(result.timeZoneId, 'America/Denver');
  t.is(result.toPlainDateTime().toString(), '1988-04-26T09:00:00');
});

test('zoned datetime: multi-segment and Etc IANA ids parse in every position', t => {
  const options = {timeZone: 'UTC'};
  for (const input of ['2025-01-01 10:00 America/Argentina/Buenos_Aires', '1/1/2025 10:00 America/Argentina/Buenos_Aires']) {
    const result = parseZonedDateAndTime(input, options);
    t.is(result.timeZoneId, 'America/Argentina/Buenos_Aires', input);
    t.is(result.epochMilliseconds, Date.UTC(2025, 0, 1, 13, 0, 0), input);
  }
  for (const input of ['2025-01-01 10:00 Etc/GMT+5', '1/1/2025 10:00 Etc/GMT+5']) {
    const result = parseZonedDateAndTime(input, options);
    t.is(result.timeZoneId, 'Etc/GMT+5', input);
    t.is(result.epochMilliseconds, Date.UTC(2025, 0, 1, 15, 0, 0), input);
  }
  t.is(parseZonedTime('10:00 Etc/GMT+5', options).timeZoneId, 'Etc/GMT+5');
});

// requireTimeZone decides up front whether the input names a zone, using the
// same zone-token pieces as the parse rules. This pins the two together: an
// input that names a zone must never throw, and one that does not must throw
// with the full input in the message, whatever rule would have parsed it.
test('zoned datetime: requireTimeZone agrees with the parse rules', t => {
  const options = {timeZone: 'America/Chicago'};
  const namesZone = [
    '2022-02-01T19:00:00.000Z',
    '2022-02-01T19:00:00+05:30',
    '2025-01-01T12:00:00[America/Chicago]',
    '2000-01-01 00:00:00 @ America/Chicago',
    '2000-01-01T00:00 @ CST',
    '2025-01-01 12:00:00 CST',
    '2026-11-01 01:30 cdt',
    '2025-01-01 10:00 America/Argentina/Buenos_Aires',
    '2016-02-01 11:19:16+00',
    '2016-02-01 11:19:16 -02:00',
    '2022-02-01 12:00 Z',
    '2000-06-15 12:00:00 GMT+0',
    '1/1/2020 08:22:34.028 CST',
    '1/1/2020 08:22:34.028+0200',
    '1/1/2025 10:00 Etc/GMT+5',
    'y 08:36 CDT',
    '9:30pm CST',
    '3 pm CST'
  ];
  for (const input of namesZone) {
    t.true(parseZonedDateAndTime(input, {...options, requireTimeZone: true}) instanceof Temporal.ZonedDateTime, input);
  }
  const namesNoZone = [
    'c', '3', '3pm', '3 pm', '12:00 pm', '9a', '-3', '+5', '1-15', '1/1/2020', '2025-01-15',
    'y 08:36', 'y +20', '2000-01-01T00:00:00', '2025-01-01 10:00', '2020/01/01 10:00:00 AM'
  ];
  for (const input of namesNoZone) {
    t.true(parseZonedDateAndTime(input, options) instanceof Temporal.ZonedDateTime, input);
    const error = t.throws(() => {
      parseZonedDateAndTime(input, {...options, requireTimeZone: true});
    }, {instanceOf: Error}, input);
    t.is(error.message, `Date/time missing time zone: ${input}`, input);
  }
});