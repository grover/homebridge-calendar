'use strict';

const CalendarActionBuilder = require('./CalendarActionBuilder');
const CalendarActionHandler = require('./CalendarActionHandler');
const CalendarScheduleHandler = require('./CalendarScheduleHandler');
const CalendarPoller = require('./CalendarPoller');
const CalendarSensor = require('./CalendarSensor');

let Accessory, Characteristic, Service;

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

    this._calendarPoller = new CalendarPoller(this.log, this.name, this.config.url, this.config.pollingInterval * 60000);
    this._calendarPoller
      .on('error', this._onPollingError.bind(this))
      .on('data', this._onCalendar.bind(this))
      .on('started', this._onPollingStarted.bind(this))
      .on('stopped', this._onPollingStopped.bind(this));

    this._actionBuilder = new CalendarActionBuilder(this.config.offset);

    this._scheduleHandler = new CalendarScheduleHandler(this.log);
    this._scheduleHandler
      .on('event', this._scheduledEvent.bind(this));

    this._calendarPoller.start();
  }

  getServices() {
    return this._services;
  }

  createServices() {
    const services = [
      this.getAccessoryInformationService(),
      this.getBridgingStateService(),
      ...this.getSensors()
    ];

    return services;
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

    const calendarSensor = this._createCalendarSensor(this.name, subtype++);
    sensors.push(calendarSensor.sensor);

    const namedSensors = [];
    for (const sw of this.config.sensors) {
      const namedSensor = this._createCalendarSensor(sw, subtype++);
      namedSensors.push(namedSensor);
      sensors.push(namedSensor.sensor);
    }

    this._actionHandler = new CalendarActionHandler(this.log, calendarSensor, namedSensors);

    return sensors;
  }

  _createCalendarSensor(name, subtype) {
    const sensor = new Service.ContactSensor(name, subtype);
    const characteristic = Characteristic.ContactSensorState;
    const on = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    const off = Characteristic.ContactSensorState.CONTACT_DETECTED;

    const result = new CalendarSensor(this.log, name, sensor, characteristic, on, off);
    return result;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setReachable(reachable) {
    this._bridgingStateService
      .getCharacteristic(Characteristic.Reachable)
      .updateValue(reachable);
  }

  _onPollingStarted() {
    this.log(`Polling calendar ${this.name} has started.`);
  }

  _onPollingStopped() {
    this.log(`Polling calendar ${this.name} has stopped.`);
  }

  _onPollingError(err) {
    this.log(`Polling calendar ${this.name} has raised error: ${err}`);
  }

  _onCalendar(data) {
    const now = new Date();

    const actions = this._actionBuilder.generateActions(data, now);
    this._actionHandler.actionsUpdated(actions, now);

    const schedule = actions.map(action => action.date);
    this._scheduleHandler.scheduleUpdated(schedule, now);

    this._setReachable(true);
  }

  _scheduledEvent(now) {
    this._actionHandler.execute(now);
  }
}

module.exports = CalendarAccessory;
