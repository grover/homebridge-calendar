'use strict';

const assert = require('chai').assert;

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
    new CalendarSensor(console.log, 'Test', service, characteristic, 1, 0);
    assert.equal(value, 0);
  });

  describe('Initialized calendar sensor', () => {

    let sensor;

    beforeEach(() => {
      sensor = new CalendarSensor(console.log, 'Test', service, characteristic, 1, 0);
      value = undefined;
    });

    it('Turning on should not update the characteristic', () => {
      sensor.on();
      assert.isUndefined(value);
    });

    it('Turning on should increment the state', () => {
      sensor.on();
      assert.equal(sensor._state, 1);
    });

    it('Turning on twice should increment the state twice', () => {
      sensor.on();
      sensor.on();
      assert.equal(sensor._state, 2);
    });

    it('Turning on and off should reset the state to zero', () => {
      sensor.on();
      sensor.off();
      assert.equal(sensor._state, 0);
    });

    it('Turning on, on and off should keep the state at 1', () => {
      sensor.on();
      sensor.on();
      sensor.off();
      assert.equal(sensor._state, 1);
    });

    it('Should not underflow on too many offs', () => {
      sensor.on();
      sensor.off();
      sensor.off();
      assert.equal(sensor._state, 0);
    });

    it('Reset should set the state to zero', () => {
      sensor.on();
      sensor.reset();
      assert.equal(sensor._state, 0);
    });

    it('pushState should update HomeKit to reflect the state value', () => {
      sensor.on();
      sensor.pushState();
      assert.equal(value, 1);
    });

    it('pushState should update HomeKit to reflect the state value', () => {
      sensor.off();
      sensor.pushState();
      assert.equal(value, 0);
    });
  });
});