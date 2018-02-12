'use strict';

const assert = require('chai').assert;
const clone = require('clone');
const moment = require('moment');
const sinon = require('sinon');

const CalendarActionHandler = require('./../src/CalendarActionHandler');

describe('CalendarActionHandler', () => {

  const now = new Date(2018, 0, 30, 9, 0, 0, 0);

  const log = console.log;
  let calendarSensor;
  let namedSensors;
  let handler;

  let clock;

  beforeEach(() => {
    calendarSensor = {
      on: sinon.spy(),
      off: sinon.spy()
    };

    namedSensors = [
      {
        name: 'Test',
        on: sinon.spy(),
        off: sinon.spy()
      }
    ];

    clock = sinon.useFakeTimers({
      now: now
    });

    handler = new CalendarActionHandler(log, calendarSensor, namedSensors);
  });

  afterEach(() => {
    clock.restore();
  });

  it('Should be created in stopped state', () => {
    assert.isNotOk(handler._started);
  });

  it('Should set the started state', () => {
    handler.start();
    assert.isOk(handler._started);
  });

  it('Should reset the started state', () => {
    handler.start();
    handler.stop();
    assert.isNotOk(handler._started);
  });

  it('Should store given actions', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.actionsUpdated(actions);
    assert.equal(actions, handler._actions);
  });

  it('Should remove expired actions', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.actionsUpdated(actions);
    clock.tick(3601000);

    handler._expireActions();

    assert.isEmpty(handler._actions);
  });

  it('Should pick next action', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.actionsUpdated(actions);

    const nextAction = handler._pickNextAction(now);
    assert.equal(nextAction, actions[0]);
  });

  it('Should schedule next action', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.actionsUpdated(actions);

    handler._scheduleNextActionAfter(now);

    assert.isDefined(handler._actionTimer);
  });

  it('Should reset action timer when it expires', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.start();
    handler.actionsUpdated(actions);

    clock.next();
    assert.isUndefined(handler._actionTimer);
  });

  it('Should remove expired actions, when the action is executed', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.start();
    handler.actionsUpdated(actions);

    clock.next();

    assert.isEmpty(handler._actions);
  });

  it('Should enable the calendar sensor if action state is true', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: 'foo'
      }
    ];

    handler.start();
    handler.actionsUpdated(actions);

    clock.next();

    assert.isOk(calendarSensor.on.calledOnce);
  });

  it('Should disable the calendar sensor if action state is false', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.start();
    handler.actionsUpdated(actions);

    clock.next();

    assert.isOk(calendarSensor.off.calledOnce);
  });


  it('Should enable the named sensor and calendar sensor if matching action state is true', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: 'Test'
      }
    ];

    handler.start();
    handler.actionsUpdated(actions);

    clock.next();

    assert.isOk(calendarSensor.on.calledOnce);
    assert.isOk(namedSensors[0].on.calledOnce);
  });

  it('Should disable the named sensor and calendar sensor if matching action state is false', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'Test'
      }
    ];

    handler.start();
    handler.actionsUpdated(actions);

    clock.next();

    assert.isOk(calendarSensor.off.calledOnce);
    assert.isOk(namedSensors[0].off.calledOnce);
  });
});