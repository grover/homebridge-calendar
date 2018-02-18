'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');

const CalendarScheduleHandler = require('./../src/CalendarScheduleHandler');

describe('CalendarScheduleHandler', () => {

  const now = new Date(2018, 0, 30, 9, 0, 0, 0);

  const log = console.log;
  let handler;

  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: now
    });

    handler = new CalendarScheduleHandler(log);
  });

  afterEach(() => {
    clock.restore();
  });

  it('Should not have a schedule by default', () => {
    assert.deepEqual([], handler._calendarEntries);
  });

  it('Should store given events', () => {
    const expectedEvents = [
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];

    handler.scheduleUpdated(expectedEvents, now);
    assert.deepEqual(handler._calendarEntries, expectedEvents);
  });

  it('Should only store unique events', () => {
    const expectedEvents = [
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];
    const givenEvents = [
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];

    handler.scheduleUpdated(givenEvents, now);
    assert.deepEqual(handler._calendarEntries, expectedEvents);
  });

  it('Should not store past events', () => {
    const expectedEvents = [
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];

    const givenEvents = [
      new Date(2018, 0, 30, 8, 0, 0, 0),
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];

    handler.scheduleUpdated(givenEvents, now);
    assert.deepEqual(handler._calendarEntries, expectedEvents);
  });

  it('Should raise event with date when timer expires', () => {
    let raised;

    handler.once('event', date => {
      raised = date;
    });

    const expectedEvents = [
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];
    handler.scheduleUpdated(expectedEvents, now);

    clock.next();
    assert.equal(raised.valueOf(), expectedEvents[0].valueOf());
  });

  it('Should raise event after updates with date when timer expires', () => {
    let raised;

    handler.once('event', date => {
      raised = date;
    });

    const expectedEvents = [
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];
    handler.scheduleUpdated(expectedEvents, now);
    handler.scheduleUpdated(expectedEvents, now);

    clock.next();

    assert.equal(raised.valueOf(), expectedEvents[0].valueOf());
  });

  it('Should raise multiple events', () => {
    let raised = 0;

    handler.on('event', () => {
      raised++;
    });

    const expectedEvents = [
      new Date(2018, 0, 30, 10, 0, 0, 0),
      new Date(2018, 0, 30, 11, 0, 0, 0)
    ];
    handler.scheduleUpdated(expectedEvents, now);

    clock.next();
    clock.next();

    assert.equal(raised, 2);
  });
});