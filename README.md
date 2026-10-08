# Business Date Parser [![Node.js CI](https://github.com/beauwest/business-date-parser/workflows/Node.js%20CI/badge.svg)](https://github.com/beauwest/business-date-parser/actions)

An opinionated, zero-dependency, fast user input parser for date & times. This module is designed to process & parse user input into a Javascript date object.

## Date Format Examples

- `c`: Current Date
- `y`: Yesterday
- `t`: Tomorrow
- `f`: First day of the month
- `l`: Last day of the month
- `+20`: 20 days from now
- `-20`: 20 days ago
- `15`: The 15th day of the current month
- `4/15`: The 15th day of April of the current year
- `4/15/2020`: April 15th, 2020
- `5-3-18`: May 3rd, 2018
- `2025-03-01`: March 1st, 2025

## Time Format Examples

- `c`: Current Time
- `+20`: 20 minutes from now
- `-20`: 20 minutes ago
- `2`: 2:00 PM
- `02`: 2:00 AM
- `2a`: 2:00 AM
- `2:45`: 2:45 PM
- `2:45a`: 2:45 AM
- `530`: 5:30 PM
- `8:22:34.028`: 8:22:34.028 AM

## Date & Time format examples
- Date and time parsing splits based on the first space encountered.
- `y 5p`: Yesterday at 5:00PM
- `l 8a`: Last day of the month at 8:00AM
- `2025-03-01 8:22:34.028`: March 1st, 2025 at 8:22:34.028 AM

Anything that does not match the rule-based parsing will fall back to Javascript's
built-in [Date.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse).

## Installing
```bash
npm i @beauwest/business-date-parser
```

## Getting Started

```javascript
import {parseDate, parseTime, parseDateAndTime} from 'business-date-parser';

const theFifth = parseDate('5');

const threeDaysFromNow = parseDate('+3');

const quittingTime = parseTime('5');

const snackTime = parseTime('2:30p');

const snackTimeThreeDaysFromNow = parseTime('+3 2:30p');

// Will prefer time parsing when no date part is found in a dateAndTime string
const preferTime = parseDateAndTime('9a', {preferTime: true});

// Default to a specific date when preferring time parsing and there is no date part.
const preferTimeWithSpecificDate = parseDateAndTime('9a', {preferTime: true, defaultDate: '2025-03-01'});
```

## Zoned date and time options

`parseZonedDateAndTime()` returns a `Temporal.ZonedDateTime`. These options apply only to that function.

- `timeZone`: IANA zone used when the input has no zone of its own. If omitted, the current zone from `Temporal.Now.timeZoneId()` is used.
- `requireTimeZone`: when `true`, input that names no zone throws `Date/time missing time zone: ${input}` before parsing, with the full input in the message. Default is `false`, which interprets that input in `timeZone`. Absolute values (`ZonedDateTime`, `Instant`, `Date`, and epoch milliseconds) are not checked. `parseZonedTime()` honors this option; `parseZonedDate()` ignores it because its formats never carry a zone.
- `resultTimeZone`: IANA zone to project the result into with `withTimeZone`. If omitted, a bracket, IANA id, or abbreviation keeps that zone. `Z` and numeric offsets are still expressed in `timeZone`.

```javascript
import {parseZonedDateAndTime} from 'business-date-parser';

const denverWallTime = parseZonedDateAndTime('2000-01-01T00:00:00', {
  timeZone: 'America/Denver'
});

const mustNameAZone = parseZonedDateAndTime('2025-01-01 12:00:00 CST', {
  requireTimeZone: true
});

const asUtc = parseZonedDateAndTime('2022-02-01T19:00:00Z', {
  resultTimeZone: 'UTC'
});
```