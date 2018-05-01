'use strict';

const moment = require('./moment');

class CalendarActionBuilder {

  constructor(offset) {
    if (offset === undefined) {
      this._startOffset = '-0s';
    }
    else if (offset.startsWith('-') === false) {
      this._startOffset = `-${offset}`;
    }
    else {
      this._startOffset = offset;
    }

    if (moment().isRelativeTimeFormat(this._startOffset) === false) {
      throw new Error('Invalid relative time format.');
    }
  }

  generateActions(cal, now) {
    let allEvents = [].concat(
      this._generateNonRecurringEvents(cal),
      this._generateRecurringEvents(cal, moment(now)));

    allEvents = this._sortEventsByDate(allEvents);
    allEvents = this._filterExpiredEvents(allEvents, now);

    return allEvents;
  }

  _generateNonRecurringEvents(cal) {
    const events = [];

    for (const key in cal) {
      if (cal.hasOwnProperty(key)) {
        const event = cal[key];
        if (event.type === 'VEVENT' && event.rrule === undefined) {
          events.push({
            date: moment(event.start).relativeTime(this._startOffset).toDate(),
            expires: event.end,
            state: true,
            summary: event.summary
          });
          events.push({
            date: event.end,
            expires: event.end,
            state: false,
            summary: event.summary
          });
        }
      }
    }

    return events;
  }

  _generateRecurringEvents(cal, now) {
    const events = [];

    for (const key in cal) {
      if (cal.hasOwnProperty(key)) {
        const event = cal[key];
        if (event.type === 'VEVENT' && event.rrule !== undefined) {
          const duration = event.end - event.start;

          const rstart = now.clone().subtract(2 * duration, 'milliseconds').toDate();
          const rend = now.clone().add(7, 'days').toDate();

          const expandedStartDates = event.rrule.between(rstart, rend, true);

          for (const startDate of expandedStartDates) {
            const endDate = new Date(startDate.valueOf() + duration);
            events.push({
              date: moment(startDate).relativeTime(this._startOffset).toDate(),
              expires: endDate,
              state: true,
              summary: event.summary
            });
            events.push({
              date: endDate,
              expires: endDate,
              state: false,
              summary: event.summary
            });
          }
        }
      }
    }

    return events;
  }

  _sortEventsByDate(events) {
    // Sort in start-order
    return events.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }

  _filterExpiredEvents(events, now) {
    // Keep only events that expire right now or in the future
    return events.filter(event => event.expires.valueOf() >= now);
  }
}

module.exports = CalendarActionBuilder;
