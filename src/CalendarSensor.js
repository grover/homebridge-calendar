"use strict";

class CalendarSensor {

  constructor(log, name, sensor, characteristic, onValue, offValue) {
    this.log = log;
    this._name = name;
    this._sensor = sensor;
    this._characteristic = characteristic;
    this._onValue = onValue;
    this._offValue = offValue;

    this._state = 0;

    this._reflectState();
  }

  on() {
    this._state++;
    this._reflectState();
  }

  off() {
    if (this._state > 0) {
      this._state--;
      this._reflectState();
    }
  }

  _reflectState() {
    let value = this._offValue;
    if (this._state > 0) {
      value = this._onValue;
    }

    this.log(`Setting calendar sensor '${this._name}' state to ${this._state > 0 ? 1 : 0}`);
    this._sensor
      .getCharacteristic(this._characteristic)
      .updateValue(value);
  }
}

module.exports = CalendarSensor;