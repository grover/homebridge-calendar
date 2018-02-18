'use strict';

class CalendarSensor {

  constructor(log, name, sensor, characteristic, onValue, offValue) {
    this.log = log;
    this.name = name;
    this.sensor = sensor;
    this._characteristic = characteristic;
    this._onValue = onValue;
    this._offValue = offValue;

    this.reset();
    this.pushState();
  }

  reset() {
    this._state = 0;
  }

  on() {
    this._state++;
  }

  off() {
    if (this._state > 0) {
      this._state--;
    }
  }

  pushState() {
    let value = this._offValue;
    if (this._state > 0) {
      value = this._onValue;
    }

    this.log(`Pushing calendar sensor '${this.name}' state ${this._state} - value ${value}`);
    this.sensor
      .getCharacteristic(this._characteristic)
      .updateValue(value);
  }
}

module.exports = CalendarSensor;
