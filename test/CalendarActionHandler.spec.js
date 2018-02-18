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
  let testSensor;

  let handler;

  beforeEach(() => {
    calendarSensor = {
      on: sinon.spy(),
      off: sinon.spy(),
      pushState: sinon.spy(),
      reset: sinon.spy(),
      name: 'Calendar'
    };

    testSensor = {
      name: 'Test',
      on: sinon.spy(),
      off: sinon.spy(),
      pushState: sinon.spy(),
      reset: sinon.spy(),
      name: 'Test'
    };

    handler = new CalendarActionHandler(log, calendarSensor, [testSensor]);
  });

  afterEach(() => {
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

    handler.actionsUpdated(actions, now);
    assert.deepEqual(handler._actions, actions);
  });

  it('Should not fail without actions for the trigger date', () => {
    assert.doesNotThrow(() => handler.execute(now));
  });

  it('Should reset all sensors when executing', () => {
    handler.execute(now);

    assert.isOk(calendarSensor.reset.calledOnce);
    assert.isOk(testSensor.reset.calledOnce);
  });

  it('Should push all sensors to HomeKit when executing', () => {
    handler.execute(now);

    assert.isOk(calendarSensor.pushState.calledOnce);
    assert.isOk(testSensor.pushState.calledOnce);
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

    handler.actionsUpdated(actions, now);
    handler.execute(actions[0].date);

    assert.isEmpty(handler._actions);
  });

  it('Should enable the calendar sensor if action state is true', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 11, 0, 0, 0),
        state: true,
        summary: 'foo'
      }
    ];

    handler.actionsUpdated(actions, now);
    handler.execute(actions[0].date);

    assert.isOk(calendarSensor.on.calledOnce);
  });

  it('Should disable the calendar sensor if action state is false', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 11, 0, 0, 0),
        state: false,
        summary: 'foo'
      }
    ];

    handler.actionsUpdated(actions, now);
    handler.execute(actions[0].date);

    assert.isOk(calendarSensor.off.calledOnce);
  });


  it('Should enable the named sensor and calendar sensor if matching action state is true', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 11, 0, 0, 0),
        state: true,
        summary: 'Test'
      }
    ];

    handler.actionsUpdated(actions, now);
    handler.execute(actions[0].date);

    assert.isOk(calendarSensor.on.calledOnce);
    assert.isOk(testSensor.on.calledOnce);
  });

  it('Should disable the named sensor and calendar sensor if matching action state is false', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 11, 0, 0, 0),
        state: false,
        summary: 'Test'
      }
    ];
    handler.actionsUpdated(actions, now);
    handler.execute(actions[0].date);

    assert.isOk(calendarSensor.off.calledOnce);
    assert.isOk(testSensor.off.calledOnce);
  });

  it('Should process multiple actions, which are scheduled for the same time', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 9, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: 'Test'
      },
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'Test'
      },
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: 'foo'
      }
    ];

    handler.actionsUpdated(actions, now);
    calendarSensor.on.reset();
    testSensor.on.reset();
    testSensor.off.reset();

    handler.execute(actions[1].date);

    assert.isOk(calendarSensor.on.calledTwice);
    assert.isOk(testSensor.on.calledOnce);
    assert.isOk(testSensor.off.calledOnce);
  });

  it('Should process multiple actions, which are scheduled for the same time independent of order', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 9, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: 'Test'
      },
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: 'foo'
      },
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'Test'
      }
    ];

    handler.actionsUpdated(actions, now);
    calendarSensor.on.reset();
    testSensor.on.reset();
    testSensor.off.reset();

    handler.execute(actions[1].date);

    assert.isOk(calendarSensor.on.calledTwice);
    assert.isOk(testSensor.on.calledOnce);
    assert.isOk(testSensor.off.calledOnce);
  });

  it('Should not fail if summary is not given', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 9, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: undefined
      }
    ];

    assert.doesNotThrow(() => {
      handler.actionsUpdated(actions, now);
      handler.execute(now);
    });
  });

  it('Should not fail if summary is empty string', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 9, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: true,
        summary: ''
      }
    ];

    assert.doesNotThrow(() => {
      handler.actionsUpdated(actions, now);
      handler.execute(now);
    });
  });
});