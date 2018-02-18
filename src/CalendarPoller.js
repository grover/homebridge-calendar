'use strict';

const EventEmitter = require('events').EventEmitter;

const ical = require('node-ical');

class CalendarPoller extends EventEmitter {

  constructor(log, name, url, interval) {
    super();

    this.log = log;
    this.name = name;

    this._url = url.replace('webcal://', 'http://');
    this._interval = interval;
    this._isStarted = false;
  }

  start() {
    if (this._isStarted === false) {
      this.emit('started');
      this._isStarted = true;
      this._loadCalendar();
    }
  }

  stop() {
    if (this._isStarted === true) {
      this.emit('stopped');
      this._isStarted = false;

      clearTimeout(this._refreshTimer);
      this._refreshTimer = undefined;
    }
  }

  _loadCalendar() {
    // TODO: Make use of HTTP cache control stuff
    this.log(`Updating calendar ${this.name}`);
    ical.fromURL(this._url, {}, (err, cal) => {
      if (err) {
        this.log(`Failed to load iCal calender: ${this.url} with error ${err}`);
        this.emit('error', err);
      }

      if (cal) {
        this.emit('data', cal);
      }

      this._scheduleNextIteration();
    });
  }

  _scheduleNextIteration() {
    if (this._refreshTimer !== undefined || this._isStarted === false) {
      return;
    }

    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = undefined;
      this._loadCalendar();
    }, this._interval);
  }
}

module.exports = CalendarPoller;