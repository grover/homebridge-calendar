# homebridge-calendar

A calendar plugin for [homebridge](https://github.com/nfarina/homebridge), which allows flexible scheduling of triggers using any iCal calendar.

HomeKits own scheduling means are limited and in some instances not flexible enough for more advanced scheduling needs. This plugin integrates any iCal calendar (iCloud, Google Calendar, ...) into HomeKit and creates stateless switches for the events in the calendar using the scheduled event summary.

## Status

[![HitCount](http://hits.dwyl.io/grover/homebridge-calendar.svg)](https://github.com/grover/homebridge-calendar)
[![Build Status](https://travis-ci.org/grover/homebridge-calendar.png?branch=master)](https://travis-ci.org/grover/homebridge-calendar)
[![codecov.io](https://img.shields.io/codecov/c/github/grover/homebridge-calendar/master.svg?style=flat-square)](http://codecov.io/github/grover/homebridge-calendar?branch=master)
[![Dependency Status](https://img.shields.io/david/grover/homebridge-calendar.svg?style=flat-square)](https://david-dm.org/grover/homebridge-calendar)
[![devDependency Status](https://img.shields.io/david/dev/grover/homebridge-calendar.svg?style=flat-square)](https://david-dm.org/grover/homebridge-calendar#info=devDependencies)
[![Node version](https://img.shields.io/node/v/homebridge-calendar.svg?style=flat)](http://nodejs.org/download/)
[![NPM Version](https://badge.fury.io/js/homebridge-calendar.svg?style=flat)](https://npmjs.org/package/homebridge-calendar)

## Supported calendars

- iCloud Calendar
- Google Calendar

In theory any calendar solution that supports iCal ([RFC 5545](https://tools.ietf.org/html/rfc5545)) and sharing should work, however some vendors choose to deviate from the RFC in their implementation. If you use one that works, but isn't on the list - great please add it to this README.md.

## Installation

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

 ```sudo npm install -g homebridge-calendar --unsafe-perm```

## Configuration

```json
{
  "bridge": {
      ...
  },
  "platforms": [
    {
      "platform": "Calendar",
      "calendars": [
        {
          "name": "Cal 1",
          "url": "webcal://",
          "pollingInterval": 5,
          "offset": "-8h",
          "sensors": [
            "Sensor 1",
            "Sensor 2"
          ]
        }
      ]
    }
  ]
}
```

| Attributes | Usage |
|------------|-------|
| name | A unique name for the calendar. Will be used as the accessory name and default switch for any calendar events. |
| url | The address of the calender. Can be a `webcal://`, a `http://` or an `https://` URL. |
| pollingInterval | The polling interval the plugin uses to retrieve calendar updates in minutes. If not set, the plugin will update the calendar ones in 15 minutes. |
| sensors | An array of event summaries to create special sensors for. |

The above example creates the plugin with three contact sensors:

- Cal 1
- Sensor 1
- Sensor 2

`Cal 1` will be opened any time any event starts in the calendar. `Sensor 1` and `Sensor 2` will only open if the event name starts with `Sensor 1` or `Sensor 2` respectively.

Calendar events may overlap, may be full day, recurring or single occurance events and can even span multiple days.

### Offset

You might want to trigger the sensors earlier than the scheduled event. This can be done by applying an offset to the calendar. An offset specifies the time to subtract from the scheduled start of the event. The offset essentially moves the start date ahead by the specified amount of time. The end date of the events is unaffected. Essentially this extends the event duration by the offset.

#### Offset syntax

An offset is a combination of a number and a postfix that indicates the unit of time to move. The supported offset postfixes are the following:

| Postfix | Example | Description |
|---------|---------|-------------|
| d       | 2d      | Make an event start earlier by two days. |
| h       | 8h      | Make an event start earlier by eight hours. |
| m       | 15m     | Make an event start earlier by fifteen minutes. |
| s       | 10s     | Make an event start earlier by ten seconds. |

An offset is always negative, e.g. it moves the start to an earlier time. You can specify the minus in front of the offset. Positive offsets (with a plus symbol in front) to move to a later time are not supported.

### Sharing an iCloud calender

To give the plugin access to a calender it is advised to create a seperate (iCloud) calender and share it publically. Public sharing provides a read-only view on the calender and a URL that can be used by the plugin to access the calender. No one else can modify a publically shared calender in this way.

[Here's good instructions](http://www.idownloadblog.com/2016/02/14/how-to-share-calendars-iphone-ipad-mac-iclod/) on how to do this. Refer to the public sharing section there.

## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/grover/homebridge-calendar/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/grover/homebridge-calendar/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.

## Some asks for friendly gestures

If you use this and like it - please leave a note by staring this package here or on GitHub.

If you use it and have a
problem, file an issue at [GitHub](https://github.com/grover/homebridge-calendar/issues) - I'll try
to help.

If you tried this, but don't like it: tell me about it in an issue too. I'll try my best
to address these in my spare time.

If you fork this, go ahead - I'll accept pull requests for enhancements.

## License

MIT License

Copyright (c) 2018 Michael Fröhlich

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
