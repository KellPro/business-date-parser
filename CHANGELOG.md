# Change Log

## Unreleased

- `parseZonedDateAndTime()` accepts a `local @ zone` separator.
- A zoneless ISO date-time is interpreted in `timeZone`, not the machine zone.
- Known abbreviations use IANA zone rules, including optional seconds and daylight/standard disambiguation.
- A zone token on a shorthand or slash-date time (`y 08:36 CDT`, `1/1/2020 08:22:34.028 CST`) names the result's zone instead of being dropped. Unknown tokens return `null`.
- `UT` joins the abbreviation map as UTC.
- New `parseZonedDateAndTime()` options: `requireTimeZone` and `resultTimeZone`.
- `requireTimeZone` is enforced up front on the full input, so the error message always names the whole input. `parseZonedTime()` honors it per rule; `parseZonedDate()` ignores it.
- A time part with a numeric offset (`1/1/2020 08:22+05`) keeps the typed wall time and the offset instant.
- A zoned stamp that cannot be parsed returns `null` instead of throwing.
- A bad `timeZone` option throws for `Z` and numeric-offset input.
- `requireTimeZone` accepts every zone the parser accepts, including `UT` and offsets such as `GMT+0`. `GMT+00` parses instead of returning `null`.
- Space-separated times accept `±HH:MM` offsets.
- A spaced meridiem (`3 pm`, `9 am`) parses as a time instead of a day of the month.
- With `preferTime`, a `ZonedDateTime` `defaultDate` keeps its own zone unless the time names one.
- Multi-segment and `Etc` IANA ids (`America/Argentina/Buenos_Aires`, `Etc/GMT+5`) parse after any date form and in `parseZonedTime()`.

## Release 1.0.19
- Removes debugging code.
- Fixes the test for "Y" when run on the first of the month.

## Release 1.0.18
- Fixes several tests that were failing due to timezone issues.

## Release 1.0.17
- Adds support for additional machine-style dates.

## Release 1.0.16
- Improves support for time-only date & time parsing.
- Simplify tests.

## Release 1.0.15
- Fixed support for negative offsets in ISO 8601 formatted time parts.

## Release 1.0.14
- Added support for ISO 8601 formatted time parts.
- Removed some debug logging.

## Release 1.0.13
- Fixed a bug that caused timezones that started with a "P" to assume PM.

## Release 1.0.12
- Added support for 8-digit input, with no delimiters. The date parser will guess at valid dates in the following order: YYYYMMDD, MMDDYYYY, and DDMMYYYY.

## Release 1.0.11
- Rewrite how the preferTime option for parseDateAndTime works. If the option is used, it will attempt to parse the entire input as time and use the result if it's a valid date.
- Added 5 more tests.

## Release 1.0.10
- Include time when using "c" with date & time parsing.

## Release 1.0.9
- Fix "12:00 AM" time parsing.

## Release 1.0.8
- Always return the original input if it's falsy and not a timestamp value of 0.
- Parse as a date part, in the date & time parsing, if there is only one part, and it's likely a date because it contains a "-" or a "/".

## Release 1.0.7
- Fixed a month parsing bug when parsing dates on the 31st day of the current month, and entering a month that did not have 31 days.

## Release 1.0.6
- Added a `rules` option to all parse functions which allows users to specify their own parsing rules.
- Improved the documentation.

## Release 1.0.5
- Switch from Travis CI to Github Actions.

## Release 1.0.4
- Fix a bug where hour 12 would incorrectly be adjusted for AM/PM

## Release 1.0.3
- Added support for numeric timestamps as input
- Automatically adjust short years based on current decade

## Release 1.0.2
Added options to `parseDateAndTime()`
- `preferTime`: Parses as time when no date part is found
- `defaultDate`: Set a date to default to when time is preferred

## Release 1.0.1
Added support for more date formats
- 12/
- 4/26/

## Release 1.0.0
First release with initial functionality!