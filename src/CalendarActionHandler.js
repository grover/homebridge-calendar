"use strict";

class CalendarActionHandler {
  constructor(log, calendarSensor, namedSensors) {
    this.log = log;

    this._sensor = calendarSensor;
    this._namedSensors = namedSensors;

    this._actions = [];
    this._actionTimer = undefined;
    this._started = false;
  }

  start() {
    this._started = true;
    this._scheduleNextAction();
  }

  stop() {
    this._cancelTimer();
    this._started = false;
  }

  actionsUpdated(actions) {
    this._actions = actions;
    // this._applyCurrentState();
    this._scheduleNextAction();
  }

  _cancelTimer() {
    if (this._actionTimer) {
      clearTimeout(this._actionTimer);
    }
  }

  _scheduleNextAction() {
    if (!this._started) {
      return;
    }

    const now = Date.now();
    this._scheduleNextActionAfter(now);
  }

  _scheduleNextActionAfter(now) {
    this._cancelTimer();

    const nextAction = this._pickNextAction(now);
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

  _pickNextAction(now) {
    return this._actions.find(p => p.date > now);
  }

  _handleAction(e) {
    this._applyState(this._sensor, e.state);

    for (const sensor of this._namedSensors) {
      if (e.summary.startsWith(sensor.name)) {
        this._applyState(sensor, e.state);
      }
    }
  }

  _applyState(sensor, state) {
    if (state) {
      sensor.on();
    } else {
      sensor.off();
    }
  }

  _expireActions() {
    const now = Date.now();
    this._actions = this._actions.filter(e => e.expires > now);
  }
}

module.exports = CalendarActionHandler;
