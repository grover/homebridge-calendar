'use strict';

const version = require('../package.json').version;

const CalendarAccessory = require('./CalendarAccessory');


const HOMEBRIDGE = {
  Accessory: null,
  Service: null,
  Characteristic: null,
  UUIDGen: null
};

const platformName = 'homebridge-calendar';
const platformPrettyName = 'Calendar';

module.exports = (homebridge) => {
  HOMEBRIDGE.Accessory = homebridge.platformAccessory;
  HOMEBRIDGE.Service = homebridge.hap.Service;
  HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
  HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform(platformName, platformPrettyName, CalendarPlatform, true);
};

const CalendarPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log(`CalendarPlatform Plugin Loaded - version ${version}`);
    this.config = config;
    this.api = api;
  }

  accessories(callback) {
    let _accessories = [];
    const { calendars } = this.config;

    calendars.forEach(cal => {
      this.log(`Found calendar in config: "${cal.name}"`);
      if (cal.name === undefined || cal.name.length === 0) {
        throw new Error('Invalid configuration: Calendar name is invalid.');
      }

      cal.version = version;
      cal.pollingInterval = cal.pollingInterval || 15;

      const accessory = new CalendarAccessory(this.api, this.log, cal);
      _accessories.push(accessory);
    });

    callback(_accessories);
  }
};