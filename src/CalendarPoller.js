'use strict';

const EventEmitter = require('events').EventEmitter;
const IcalExpander = require('ical-expander');
const https = require('https');
const fs = require('fs');

class CalendarPoller extends EventEmitter {

  constructor(log, name, url, interval) {
    super();

    this.log = log;
    this.name = name;

    this._url = url.replace('webcal://', 'https://');
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

    https.get(this._url, (resp) => {

      resp.setEncoding('utf8');
      let data = '';
  
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
          data += chunk;
      });
  
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
          fs.writeFileSync('./data.ics', data);
          this._refreshCalendar();
      });
  
    }).on("error", (err) => {

      if (err) {
        this.log(`Failed to load iCal calender: ${this.url} with error ${err}`);
        this.emit('error', err);
      }

    });
  }

  _refreshCalendar() {

    const ics = fs.readFileSync('./data.ics', 'utf-8');
    const icalExpander = new IcalExpander({
        ics,
        maxIterations: 1000
    });

    const duration = 7; // days
    var now = new Date();
    var next = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)

    const cal = icalExpander.between(now, next);
    this._printEvent(cal);

    if (cal) {
      this.emit('data', cal);
    }

    this._scheduleNextIteration();
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

  _printEvent(events) {

    const mappedEvents = events.events.map(e => ({
      startDate: e.startDate,
      endDate: e.endDate,
      summary: e.summary
    }));

    const mappedOccurrences = events.occurrences.map(o => ({
      startDate: o.startDate,
      endDate: o.endDate,
      summary: o.item.summary
    }));

    const allEvents = [].concat(mappedEvents, mappedOccurrences);

    console.log(allEvents.map(e => `${e.startDate.toJSDate().toISOString()} to ${e.endDate.toJSDate().toISOString()} - ${e.summary}`).join('\n'));


  }
}

module.exports = CalendarPoller;