"use strict";

const version = require('../package.json').version;
const inherits = require('util').inherits;
const inspect = require('util').inspect;
const ical = require('node-ical');
const moment = require('moment');

let Accessory, Characteristic, Service;

const SwitchStates = [
  'Off',
  'On'
];

class CalendarAccessory {

  constructor(api, log, config) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;
    this.config = config;

    if (!this.config.sensors) {
      this.config.sensors = [];
    }

    this._services = this.createServices();

    this._stateCounter = 0;
    this._actionTimer = undefined;

    this._loadCalendar(true);
  }

  getServices() {
    return this._services;
  }

  createServices() {
    const services = [
      this.getAccessoryInformationService(),
      this.getBridgingStateService()
    ];

    return services.concat(this.getSensors());
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Calendar Switch')
      .setCharacteristic(Characteristic.SerialNumber, '98')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getBridgingStateService() {
    this._bridgingStateService = new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, false)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.SWITCH);

    return this._bridgingStateService;
  }

  getSensors() {

    let subtype = 0;

    const sensors = [];

    this._sensor = new Service.ContactSensor(this.name, subtype++);
    this._sensor.isPrimaryService = true;

    sensors.push(this._sensor);

    this._namedSensors = [];
    for (const sw of this.config.sensors) {
      const namedSensor = new Service.ContactSensor(sw, subtype++);
      this._namedSensors[sw] = namedSensor;
      sensors.push(namedSensor);
    }

    return sensors;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _scheduleRefresh() {
    setTimeout(() => this._loadCalendar(false), this.config.pollingInterval * 60000);
  }

  _loadCalendar(initialLoad) {
    this.log(`Updating calendar information`);
    const url = this.config.url.replace('webcal://', 'http://');

    // TODO: Reachable if succeded, non-reachable if failed
    ical.fromURL(url, {}, (err, cal) => {
      if (err) {
        this.log(`Failed to load iCal calender: ${this.config.url} with error ${err}`);
        this._setReachable(false);
        this._scheduleRefresh();
        return;
      }

      this._setReachable(true);

      let events = [];
      // Extract the events from the response
      for (const key in cal) {
        if (cal.hasOwnProperty(key)) {
          const event = cal[key];
          if (event.type === "VEVENT" && !event.rrule) {
            events.push({
              date: event.start,
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

      // TODO: Expand recurring rules
      for (const key in cal) {
        if (cal.hasOwnProperty(key)) {
          const event = cal[key];
          if (event.type === "VEVENT" && event.rrule) {
            const duration = event.end - event.start;
            const rstart = moment().subtract(2 * duration, 'milliseconds').toDate();
            const rend = moment().add(7, 'days').toDate();
            const expandedStartDates = event.rrule.between(rstart, rend, true);

            for (const startDate of expandedStartDates) {
              const endDate = new Date(startDate.valueOf() + duration);
              events.push({
                date: startDate,
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

      // Sort in start-order
      events.sort((a, b) => a.date.valueOf() - b.date.valueOf());

      // Discard past events
      const now = Date.now();
      events = events.filter(event => event.expires.valueOf() >= now);

      if (initialLoad) {
        this._processCurrentEvents(events, now);
      }


      // Save the events = keep plugin working even if calender is inaccessible
      this._events = events;

      this._scheduleRefresh();
      this._scheduleNextAction();
    });
  }

  _processCurrentEvents(events, now) {
    // Update state counter for all starts that happened before now, but have not expired yet... :)
    this._stateCounter = 0;
    this._setupSwitches();

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.date <= now && e.expires >= now) {
        const diff = e.state ? 1 : -1;
        this._stateCounter += diff;

        for (const sw of this.config.sensors) {
          if (e.summary.startsWith(sw)) {
            this._switchStates[sw] += diff;
          }
        }
      }
    }

    // state counter has the total state of the calendar switch
    this.log(`State counter is ${this._stateCounter}`);
    this._reflectSwitchStates();
  }

  _setupSwitches() {
    this._switchStates = [];
    for (const sw of this.config.sensors) {
      this._switchStates[sw] = 0;
    }
  }

  _scheduleNextAction() {
    if (this._actionTimer) {
      clearTimeout(this._actionTimer);
    }

    const now = Date.now();
    const nextAction = this._events.find(p => p.date > now);
    if (!nextAction) {
      this.log(`No next event found.`);
      return;
    }

    const timeout = nextAction.date - now;

    this.log(`Scheduling next action in ${timeout}ms`);
    this._actionTimer = setTimeout(() => {
      this._actionTimer = undefined;
      this._handleAction(nextAction);
      this._expireActions();
      this._scheduleNextAction();
    }, timeout);
  }

  _handleAction(e) {
    const diff = e.state ? 1 : -1;
    this._stateCounter += diff;

    for (const sw of this.config.sensors) {
      if (e.summary.startsWith(sw)) {
        this._switchStates[sw] += diff;
      }
    }

    this._reflectSwitchStates();
  }

  _expireActions() {
    const now = Date.now();
    this._events = this._events.filter(e => e.expires > now);
  }

  _reflectSwitchStates() {
    const globalState = this._stateCounter > 0;

    this.log(`Setting calendar state to ${SwitchStates[globalState ? 1 : 0]}`);
    this._sensor
      .getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(globalState ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED);

    for (const sw of this.config.sensors) {
      const state = this._switchStates[sw] > 0;
      this.log(`Setting calendar switch ${sw} to ${SwitchStates[state ? 1 : 0]}`);

      this._namedSensors[sw]
        .getCharacteristic(Characteristic.ContactSensorState)
        .updateValue(state ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED);
    }
  }

  _setReachable(reachable) {
    this._bridgingStateService
      .getCharacteristic(Characteristic.Reachable)
      .updateValue(reachable);
  }
}

module.exports = CalendarAccessory;
