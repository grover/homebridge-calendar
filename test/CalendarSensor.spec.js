'use strict';

const assert = require('chai').assert;
const clone = require('clone');
const moment = require('moment');
const RRule = require('rrule').RRule;

const CalendarSensor = require('./../src/CalendarSensor');

describe('CalendarSensor', () => {

  let value;
  beforeEach(() => {
    value = undefined;
  });

  const characteristic = {
    updateValue: v => value = v
  };
  const service = {
    getCharacteristic: () => characteristic
  };


  it('Value should be undefined by default', () => {
    assert.isUndefined(value);
  });

  it('Should initialize the sensor to off', () => {
    const sensor = new CalendarSensor(console.log, 'Test', service, characteristic, 1, 0);
    assert.equal(value, 0);
  });

  describe('Initialized calendar sensor', () => {

    let sensor;

    beforeEach(() => {
      sensor = new CalendarSensor(console.log, 'Test', service, characteristic, 1, 0);
    });

    it('Turning on should update the characteristic', () => {
      sensor.on();
      assert.equal(value, 1);
    });

    it('Turning on twice should leave characteristic at 1', () => {
      sensor.on();
      sensor.on();
      assert.equal(value, 1);
    });

    it('Turning on and off should reset characteristic to zero', () => {
      sensor.on();
      sensor.off();
      assert.equal(value, 0);
    });

    it('Turning on, on and off should leave characteristic at 1', () => {
      sensor.on();
      sensor.on();
      sensor.off();
      assert.equal(value, 1);
    });

    it('Should not underflow on too many offs', () => {
      sensor.on();
      sensor.off();
      sensor.off();
      assert.equal(value, 0);
    });
  });
});