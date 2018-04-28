'use strict';

const EventEmitter = require('events').EventEmitter;

class CalendarScheduleHandler extends EventEmitter {

  constructor(log) {
    super();

    this.log = log;
    this._calendarEntries = [];
    this._nextEventAt = undefined;
    this._timer = undefined;
  }

  scheduleUpdated(events, now) {
    this._calendarEntries = events
      .filter(value => value.valueOf() >= now.valueOf())
      .filter((value, index) => {
        return index == 0 || events[index - 1].valueOf() != value.valueOf();
      });


    this._updateTimer();
  }

  _updateTimer() {
    if (this._calendarEntries.length === 0) {
      this.log('No events to schedule.');

      this._resetTimer();
      this._nextEventAt = undefined;
      this._timer = undefined;
      return;
    }

    const nextEventAt = this._calendarEntries[0];
    if (this._nextEventAt !== undefined && this._nextEventAt.valueOf() === nextEventAt.valueOf()) {
      return;
    }

    this._resetTimer();

    let diffInMilliseconds = nextEventAt.valueOf() - Date.now();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    if (diffInMilliseconds > millisecondsPerDay) {
      diffInMilliseconds = millisecondsPerDay;
    }

    this.log(`Scheduling next action in ${diffInMilliseconds}ms`);

    this._timer = setTimeout(this._expire.bind(this), diffInMilliseconds);
    this._nextEventAt = nextEventAt;
  }

  _resetTimer() {
    if (this._timer !== undefined) {
      clearTimeout(this._timer);

      this._nextEventAt = undefined;
      this._timer = undefined;
    }
  }

  _expire() {
    const now = Date.now();

    while (this._calendarEntries.length > 0 && this._calendarEntries[0].valueOf() <= now) {
      const nextEventAt = this._calendarEntries[0];
      this._calendarEntries.splice(0, 1);

      this.emit('event', nextEventAt);
    }

    this._timer = undefined;
    this._nextEventAt = undefined;

    this._updateTimer();
  }

}

module.exports = CalendarScheduleHandler;
