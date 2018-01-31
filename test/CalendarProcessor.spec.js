'use strict';

const assert = require('chai').assert;
const clone = require('clone');
const moment = require('moment');
const RRule = require('rrule').RRule;

const CalendarProcessor = require('./../src/CalendarProcessor');

describe('CalendarProcessor', () => {

  const processor = new CalendarProcessor();

  const oneEvent = {
    'foo': {
      type: 'VEVENT',
      summary: 'Test',
      start: new Date(2018, 0, 30, 10, 0, 0, 0),
      end: new Date(2018, 0, 30, 10, 15, 0, 0),
    }
  };

  const twoEvents = {
    'foo': {
      type: 'VEVENT',
      summary: 'Test',
      start: new Date(2018, 0, 30, 10, 0, 0, 0),
      end: new Date(2018, 0, 30, 10, 15, 0, 0),
    },
    'bar': {
      type: 'VEVENT',
      summary: 'Test2',
      start: new Date(2018, 0, 30, 11, 0, 0, 0),
      end: new Date(2018, 0, 30, 11, 15, 0, 0),
    }
  };

  const recurringEvent = {
    'foo': {
      type: 'VEVENT',
      summary: 'Test',
      start: new Date(2018, 0, 30, 10, 0, 0, 0),
      end: new Date(2018, 0, 30, 10, 15, 0, 0),
      rrule: new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(2018, 0, 30, 10, 0),
        until: new Date(new Date().getFullYear() + 1, 0, 30, 10, 0)
      })
    }
  };

  it('Builds a start and end action for a single non-recurring event', () => {

    const expectedActions = [
      {
        date: oneEvent.foo.start,
        expires: oneEvent.foo.end,
        state: true,
        summary: oneEvent.foo.summary
      }, {
        date: oneEvent.foo.end,
        expires: oneEvent.foo.end,
        state: false,
        summary: oneEvent.foo.summary
      }
    ];

    const actions = processor._generateNonRecurringEvents(oneEvent);
    assert.equal(actions.length, 2, 'Not enough actions created.');
    assert.deepEqual(actions, expectedActions);
  });


  it('Builds a start and end action for a multiple non-recurring event', () => {
    const expectedActions = [
      {
        date: twoEvents.foo.start,
        expires: twoEvents.foo.end,
        state: true,
        summary: twoEvents.foo.summary
      }, {
        date: twoEvents.foo.end,
        expires: twoEvents.foo.end,
        state: false,
        summary: twoEvents.foo.summary
      },
      {
        date: twoEvents.bar.start,
        expires: twoEvents.bar.end,
        state: true,
        summary: twoEvents.bar.summary
      }, {
        date: twoEvents.bar.end,
        expires: twoEvents.bar.end,
        state: false,
        summary: twoEvents.bar.summary
      }
    ];

    const actions = processor._generateNonRecurringEvents(twoEvents);
    assert.equal(actions.length, 4, 'Not enough actions created.');
    assert.deepEqual(actions, expectedActions);
  });


  it('Builds a start and end action for a single recurring event, occurring daily', () => {
    assert.isEmpty(processor._generateNonRecurringEvents(recurringEvent));
  });

  it('Builds a start and end action for a single recurring event, occurring daily', () => {
    /**
     * Only test expansion of the recurring event - do not actually test 
     * all recurrences as that's actually handled by node-ical. This only makes
     * sure that we're generating more than one pair of actions for them.
     */

    const expectedActions = [
      {
        date: recurringEvent.foo.start,
        expires: recurringEvent.foo.end,
        state: true,
        summary: recurringEvent.foo.summary
      }, {
        date: recurringEvent.foo.end,
        expires: recurringEvent.foo.end,
        state: false,
        summary: recurringEvent.foo.summary
      }
    ];

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    for (let i = 1; i < 7; i++) {
      const start = clone(expectedActions[0]);
      const end = clone(expectedActions[1]);

      start.date = new Date(start.date.valueOf() + (i * millisecondsPerDay));
      start.expires = new Date(start.expires.valueOf() + (i * millisecondsPerDay));
      end.date = new Date(end.date.valueOf() + (i * millisecondsPerDay));
      end.expires = new Date(end.expires.valueOf() + (i * millisecondsPerDay));
      expectedActions.push(start, end);
    }

    const actions = processor._generateRecurringEvents(recurringEvent, moment('20180130'));
    assert.equal(actions.length, 14);
    assert.deepEqual(actions, expectedActions);
  });

  it('Should sort all events into an order', () => {
    const unsortedActions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'Foo'
      }, {
        date: new Date(2018, 0, 29, 10, 0, 0, 0),
        expires: new Date(2018, 0, 29, 10, 0, 0, 0),
        state: true,
        summary: 'Foo2'
      }
    ];

    const expectedResult = [
      unsortedActions[1],
      unsortedActions[0]
    ];

    const result = processor._sortEventsByDate(unsortedActions);
    assert.deepEqual(result, expectedResult);
  });


  it('Should sort all events into an order', () => {
    const actions = [
      {
        date: new Date(2018, 0, 30, 10, 0, 0, 0),
        expires: new Date(2018, 0, 30, 10, 0, 0, 0),
        state: false,
        summary: 'Foo'
      }, {
        date: new Date(2018, 0, 29, 10, 0, 0, 0),
        expires: new Date(2018, 0, 29, 10, 0, 0, 0),
        state: true,
        summary: 'Foo2'
      }
    ];

    const expectedResult = [
      actions[0]
    ];

    const now = moment('20180130').valueOf();

    const result = processor._filterExpiredEvents(actions, now);
    assert.deepEqual(result, expectedResult);
  });
});
