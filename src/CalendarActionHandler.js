"use strict";

class CalendarActionHandler {
  constructor(log, calendarSensor, namedSensors) {
    this.log = log;

    this._sensor = calendarSensor;
    this._namedSensors = namedSensors;

    this._sensors = [calendarSensor, ...namedSensors];

    this._actions = [];
  }

  actionsUpdated(actions, now) {
    this._actions = actions;
    this.execute(now);
  }

  execute(now) {

    this._resetSensors();

    this._actions
      .filter(e => e.date.valueOf() <= now.valueOf())
      .forEach(e => {
        this._handleAction(e);
      });

    this._pushSensorState();
    this._expireActions(now);
  }

  _resetSensors() {
    this._sensors.forEach(sensor => sensor.reset());
  }

  _handleAction(e) {
    this._applyState(this._sensor, e.state);

    if (typeof e.summary === 'string') {
      for (const sensor of this._namedSensors) {
        if (e.summary.startsWith(sensor.name)) {
          this._applyState(sensor, e.state);
        }
      }
    }
  }

  _applyState(sensor, state) {
    this.log(`Setting ${sensor.name} to ${state}`);
    if (state) {
      sensor.on();
    }
    else {
      sensor.off();
    }
  }

  _pushSensorState() {
    this._sensors.forEach(sensor => sensor.pushState());
  }

  _expireActions(now) {
    this._actions = this._actions.filter(e => e.expires > now);
  }
}

module.exports = CalendarActionHandler;
