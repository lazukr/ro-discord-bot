import Reminder, { REMIND_TYPE } from '../../src/utils/reminder';
import chalk from 'chalk';

function *permute(list, length = list.length) {
    if (length <= 1) {
        yield list.slice();
    } else {
        for (let i = 0; i < length; i++) {
            yield *permute(list, length - 1);
            const j = length % 2 ? 0 : i;
            [list[length - 1], list[j]] = [list[j], list[length - 1]];
        }
    }
}



describe(`Testing the method: ${chalk.cyan("objectPropertiesAllZero(object)")}`, () => {
    it("True when all properties in object is zero.", () => {
        const object = {
            hello: 0,
            world: 0,
        }
        const result = Reminder.objectPropertiesAllZero(object);
        expect(result).toBeTruthy();
    });

    it("False when one property is not zero.", () => {
        const object = {
            hello: 1,
            world: 0,
        }
        const result = Reminder.objectPropertiesAllZero(object);
        expect(result).toBeFalsy();
    });
});

describe(`Testing the method: ${chalk.cyan("getMatch(sentence)")}`, () => {
    it("finds *in* match", () => {
        const args = "test in test";
        const result = Reminder.getMatch(args);
        expect(result.inMatch).not.toBeNull();
        expect(result.everyMatch).toBeNull();
        expect(result.cronMatch).toBeNull();
        expect(result.atMatch).toBeNull();
    });

    it("finds *every* match", () => {
        const args = "test every test";
        const result = Reminder.getMatch(args);
        expect(result.inMatch).toBeNull();
        expect(result.everyMatch).not.toBeNull();
        expect(result.cronMatch).toBeNull();
        expect(result.atMatch).toBeNull();
    });

    it("finds *cron* match", () => {
        const args = "test cron test";
        const result = Reminder.getMatch(args);
        expect(result.inMatch).toBeNull();
        expect(result.everyMatch).toBeNull();
        expect(result.cronMatch).not.toBeNull();
        expect(result.atMatch).toBeNull();
    });

    it("finds *at* match", () => {
        const args = "test at test";
        const result = Reminder.getMatch(args);
        expect(result.inMatch).toBeNull();
        expect(result.everyMatch).toBeNull();
        expect(result.cronMatch).toBeNull();
        expect(result.atMatch).not.toBeNull();
    });

    it("finds *no* matches", () => {
        const args = "test no test";
        const result = Reminder.getMatch(args);
        expect(result.inMatch).toBeNull();
        expect(result.everyMatch).toBeNull();
        expect(result.cronMatch).toBeNull();
        expect(result.atMatch).toBeNull();
    });

    it("always finds the last token to match", () => {
        const permutations = Array.from(permute("in every cron at".split(' ')));
        permutations.forEach(permutation => {
            const args = `test ${permutation.join(" ")} test`;
            const result = Reminder.getMatch(args);
            const match = permutation[permutation.length - 1];

            switch (match) {
                case "in": {
                    expect(result.inMatch).not.toBeNull();
                    expect(result.everyMatch).toBeNull();
                    expect(result.cronMatch).toBeNull();
                    expect(result.atMatch).toBeNull();
                    break;
                }
                case "at": {
                    expect(result.inMatch).toBeNull();
                    expect(result.everyMatch).toBeNull();
                    expect(result.cronMatch).toBeNull();
                    expect(result.atMatch).not.toBeNull();
                    break;
                }
                 case "every": {
                    expect(result.inMatch).toBeNull();
                    expect(result.everyMatch).not.toBeNull();
                    expect(result.cronMatch).toBeNull();
                    expect(result.atMatch).toBeNull();
                    break;
                 }
                 case "cron": {
                    expect(result.inMatch).toBeNull();
                    expect(result.everyMatch).toBeNull();
                    expect(result.cronMatch).not.toBeNull();
                    expect(result.atMatch).toBeNull();
                    break;
                 }
            }
        });
    }); 
});
  
describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")}`, () => {
    it ("finds no matching duration", () => {
        const args = "in no duration";
        const result = Reminder.getDurationObject(args);
        const hasDuration = Reminder.objectPropertiesAllZero(result);
        expect(hasDuration).toBeTruthy();
    });

    it ("finds matching seconds duration", () => {
        const args = "2 seconds";
        const expectedResults = {
            second: 2,
            minute: 0,
            hour:   0,
            day:    0,
            week:   0,
          };
        const result = Reminder.getDurationObject(args);
        expect(result).toStrictEqual(expectedResults);
    });

    it ("finds matching minute duration", () => {
        const args = "3 minutes";
        const expectedResults = {
            second: 0,
            minute: 3,
            hour:   0,
            day:    0,
            week:   0,
          };
        const result = Reminder.getDurationObject(args);
        expect(result).toStrictEqual(expectedResults);
    });

    it ("finds matching hour duration", () => {
        const args = "4 hours";
        const expectedResults = {
            second: 0,
            minute: 0,
            hour:   4,
            day:    0,
            week:   0,
          };
        const result = Reminder.getDurationObject(args);
        expect(result).toStrictEqual(expectedResults);
    });

    it ("finds matching days duration", () => {
        const args = "5 days";
        const expectedResults = {
            second: 0,
            minute: 0,
            hour:   0,
            day:    5,
            week:   0,
          };
        const result = Reminder.getDurationObject(args);
        expect(result).toStrictEqual(expectedResults);
    });

    it ("finds matching weeks duration", () => {
        const args = "6 weeks";
        const expectedResults = {
            second: 0,
            minute: 0,
            hour:   0,
            day:    0,
            week:   6,
          };
        const result = Reminder.getDurationObject(args);
        expect(result).toStrictEqual(expectedResults);
    });
});

describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")} - all seconds combinations`, () => {
    it ("finds s as valid seconds", () => {
        const args = "1 s";
        const result = Reminder.getDurationObject(args);
        expect(result.second).toBe(1);
    });

    it ("finds sec as valid seconds", () => {
        const args = "2 sec";
        const result = Reminder.getDurationObject(args);
        expect(result.second).toBe(2);
    });

    it ("finds s as valid seconds", () => {
        const args = "3 secs";
        const result = Reminder.getDurationObject(args);
        expect(result.second).toBe(3);
    });

    it ("finds s as valid seconds", () => {
        const args = "4 second";
        const result = Reminder.getDurationObject(args);
        expect(result.second).toBe(4);
    });
});

describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")} - all minutes combinations`, () => {
    it ("finds m as valid minutes", () => {
        const args = "1 m";
        const result = Reminder.getDurationObject(args);
        expect(result.minute).toBe(1);
    });

    it ("finds min as valid minutes", () => {
        const args = "2 min";
        const result = Reminder.getDurationObject(args);
        expect(result.minute).toBe(2);
    });

    it ("finds mins as valid minutes", () => {
        const args = "3 mins";
        const result = Reminder.getDurationObject(args);
        expect(result.minute).toBe(3);
    });

    it ("finds minute as valid minutes", () => {
        const args = "4 minute";
        const result = Reminder.getDurationObject(args);
        expect(result.minute).toBe(4);
    });
});

describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")} - all hours combinations`, () => {
    it ("finds h as valid hours", () => {
        const args = "1 h";
        const result = Reminder.getDurationObject(args);
        expect(result.hour).toBe(1);
    });

    it ("finds hr as valid hours", () => {
        const args = "2 hr";
        const result = Reminder.getDurationObject(args);
        expect(result.hour).toBe(2);
    });

    it ("finds hrs as valid hours", () => {
        const args = "3 hrs";
        const result = Reminder.getDurationObject(args);
        expect(result.hour).toBe(3);
    });

    it ("finds hour as valid hours", () => {
        const args = "4 hour";
        const result = Reminder.getDurationObject(args);
        expect(result.hour).toBe(4);
    });
});

describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")} - all weeks combinations`, () => {
    it ("finds w as valid weeks", () => {
        const args = "1 w";
        const result = Reminder.getDurationObject(args);
        expect(result.week).toBe(1);
    });

    it ("finds wk as valid weeks", () => {
        const args = "2 wk";
        const result = Reminder.getDurationObject(args);
        expect(result.week).toBe(2);
    });

    it ("finds wks as valid weeks", () => {
        const args = "3 wks";
        const result = Reminder.getDurationObject(args);
        expect(result.week).toBe(3);
    });

    it ("finds week as valid weeks", () => {
        const args = "4 weeks";
        const result = Reminder.getDurationObject(args);
        expect(result.week).toBe(4);
    });
});

describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")} - no digits assumes 1`, () => {
    it ("no digit seconds", () => {
        const args = "s";
        const result = Reminder.getDurationObject(args);
        expect(result.second).toBe(1);
    });

    it ("no digit minutes", () => {
        const args = "m";
        const result = Reminder.getDurationObject(args);
        expect(result.minute).toBe(1);
    });

    it ("no digit hours", () => {
        const args = "h";
        const result = Reminder.getDurationObject(args);
        expect(result.hour).toBe(1);
    });

    it ("no digit days", () => {
        const args = "d";
        const result = Reminder.getDurationObject(args);
        expect(result.day).toBe(1);
    });

    it ("no digit weeks", () => {
        const args = "w";
        const result = Reminder.getDurationObject(args);
        expect(result.week).toBe(1);
    });
});

describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")} - negative digits assumes 0`, () => {
    it ("negative digit seconds", () => {
        const args = "-1 s";
        const result = Reminder.getDurationObject(args);
        expect(result.second).toBe(0);
    });

    it ("negative digit minutes", () => {
        const args = "-1 m";
        const result = Reminder.getDurationObject(args);
        expect(result.minute).toBe(0);
    });

    it ("negative digit hours", () => {
        const args = "-1 h";
        const result = Reminder.getDurationObject(args);
        expect(result.hour).toBe(0);
    });

    it ("negative digit days", () => {
        const args = "-1 d";
        const result = Reminder.getDurationObject(args);
        expect(result.day).toBe(0);
    });

    it ("negative digit weeks", () => {
        const args = "-1 w";
        const result = Reminder.getDurationObject(args);
        expect(result.week).toBe(0);
    });
});

describe(`Testing the method: ${chalk.cyan("getDurationObject(args)")} - explicit 0 goes to 1`, () => {
    it ("explicit 0 digit seconds", () => {
        const args = "0 s";
        const result = Reminder.getDurationObject(args);
        expect(result.second).toBe(0);
    });

    it ("explicit 0 digit minutes", () => {
        const args = "0 m";
        const result = Reminder.getDurationObject(args);
        expect(result.minute).toBe(0);
    });

    it ("explicit 0 digit hours", () => {
        const args = "0 h";
        const result = Reminder.getDurationObject(args);
        expect(result.hour).toBe(0);
    });

    it ("explicit 0 digit days", () => {
        const args = "0 d";
        const result = Reminder.getDurationObject(args);
        expect(result.day).toBe(0);
    });

    it ("explicit 0 digit weeks", () => {
        const args = "0 w";
        const result = Reminder.getDurationObject(args);
        expect(result.week).toBe(0);
    });
});


describe(`Testing the method: ${chalk.cyan("parseMatch(match)")}`, () => {
    it ("No message argument", () => {
        const args = "in 5 weeks";
        const expectedResult = {
            message: "",
            timeElement: "5 weeks",
        };
        const { inMatch } = Reminder.getMatch(args);
        const result = Reminder.parseMatch(inMatch, REMIND_TYPE.IN);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("Valid message argument", () => {
        const args = "hello world in 7 weeks";
        const expectedResult = {
            message: "hello world",
            timeElement: "7 weeks",
        };
        const { inMatch } = Reminder.getMatch(args);
        const result = Reminder.parseMatch(inMatch, REMIND_TYPE.IN);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("Valid message argument", () => {
        const args = "hello world every minute";
        const expectedResult = {
            message: "hello world",
            timeElement: "minute",
        };
        const { everyMatch } = Reminder.getMatch(args);
        const result = Reminder.parseMatch(everyMatch, REMIND_TYPE.EVERY);
        expect(result).toStrictEqual(expectedResult);
    });
});

describe(`Testing the method: ${chalk.cyan("getTimeObject(args)")}`, () => {
    it ("Invalid time", () => {
        const args = "hello";
        const result = Reminder.getTimeObject(args);
        expect(result).toBeNull();
    });

    it ("Invalid time - hours beyond the expected values", () => {
        const args = "24:00";
        const result = Reminder.getTimeObject(args);
        expect(result).toBeNull();
    });

    it ("Invalid time - minutes beyond the expected values", () => {
        const args = "12:61";
        const result = Reminder.getTimeObject(args);
        expect(result).toBeNull();
    });

    it ("Invalid time - 24 hours with am / pm", () => {
        const args = "13:00 am";
        const result = Reminder.getTimeObject(args);
        expect(result).toBeNull();
    });

    it ("Invalid time - 24 hours with am / pm", () => {
        const args = "15:00 pm";
        const result = Reminder.getTimeObject(args);
        expect(result).toBeNull();
    });

    it ("valid time - 12 hr, single hour, no am / pm", () => {
        const args = "5:12";
        const expectedResult = {
            hour: 5,
            minute: 12,
            strict: false,
            tt: null,
        };
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - 12 hr, double hour, no am / pm", () => {
        const args = "11:35";
        const expectedResult = {
            hour: 11,
            minute: 35,
            strict: false,
            tt: null,
        };
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - 12 hr, single hour, with am", () => {
        const args = "5:23 am";
        const expectedResult = {
            hour: 5,
            minute: 23,
            strict: true,
            tt: "am",
        }
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - 12 hr, single hour, with pm", () => {
        const args = "6:43 pm";
        const expectedResult = {
            hour: 6,
            minute: 43,
            strict: true,
            tt: "pm",
        };
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - 12 hr, double hour, with am", () => {
        const args = "12:19 am";
        const expectedResult = {
            hour: 0,
            minute: 19,
            strict: true,
            tt: "am",
        };
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - 12 hr, double hour, with pm", () => {
        const args = "12:59 pm";
        const expectedResult = {
            hour: 0,
            minute: 59,
            strict: true,
            tt: "pm",
        }
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - 24 hr, double hour", () => {
        const args = "13:59";
        const expectedResult = {
            hour: 13,
            minute: 59,
            strict: true,
        }
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("invalid time - hour only, beyond 12", () => {
        const args = "13";
        const result = Reminder.getTimeObject(args);
        expect(result).toBeNull();
    });

    it ("valid time - hour only, no am / pm", () => {
        const args = "4";
        const expectedResult = {
            hour: 4,
            minute: 0,
            strict: false,
            tt: null,
        }
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - hour only, yes am", () => {
        const args = "5 am";
        const expectedResult = {
            hour: 5,
            minute: 0,
            strict: true,
            tt: "am",
        }
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });

    it ("valid time - hour only, yes pm", () => {
        const args = "7 pm";
        const expectedResult = {
            hour: 7,
            minute: 0,
            strict: true,
            tt: "pm",
        }
        const result = Reminder.getTimeObject(args);
        expect(result).toStrictEqual(expectedResult);
    });
});

describe(`Testing the method: ${chalk.cyan("applyDateSet(time, timezone, test=null)")}`, () => {
    const timezone = "America/Vancouver"; // - 8

    it ("doesn't shift if time is later", () => {
        const date = new Date('Dec 17 1995 09:00:00 GMT+0000');
        const expectedResult = "1995-12-17T02:00:00-08:00";
        const time = {
            hour: 2,
            minute: 0,
            strict: false,
        };

        const result = Reminder.applyDateSet(time, timezone, date);
        expect(result.format()).toBe(expectedResult);
    });

    it ("shift if time is later", () => {
        const date = new Date('Dec 17 1995 11:00:00 GMT+0000');
        const expectedResult = "1995-12-17T14:00:00-08:00";
        const time = {
            hour: 2,
            minute: 0,
            strict: false,
        };

        const result = Reminder.applyDateSet(time, timezone, date);
        expect(result.format()).toBe(expectedResult);
    });

    it ("shift if time is later, minute test", () => {
        const date = new Date('Dec 17 1995 10:45:00 GMT+0000');
        const expectedResult = "1995-12-17T14:33:00-08:00";
        const time = {
            hour: 2,
            minute: 33,
            strict: false,
        };

        const result = Reminder.applyDateSet(time, timezone, date);
        expect(result.format()).toBe(expectedResult);
    });

    it ("shift a whole day if time is later and is strict", () => {
        const date = new Date('Dec 17 1995 10:45:00 GMT+0000');
        const expectedResult = "1995-12-18T02:33:00-08:00";
        const time = {
            hour: 2,
            minute: 33,
            strict: true,
        };

        const result = Reminder.applyDateSet(time, timezone, date);
        expect(result.format()).toBe(expectedResult);
    });

    it ("handles 12 correctly (to behave like 0 when necessary) pm", () => {
        const date = new Date('Dec 17 1995 10:45:00 GMT+0000');
        const expectedResult = "1995-12-17T12:00:00-08:00";
        const time = {
            hour: 0,
            minute: 0,
            strict: false,
        };

        const result = Reminder.applyDateSet(time, timezone, date);
        expect(result.format()).toBe(expectedResult);
    });

    it ("handles 12 correctly (to behave like 0 when necessary) am", () => {
        const date = new Date('Dec 17 1995 10:45:00 GMT+0000');
        const expectedResult = "1995-12-18T00:00:00-08:00";
        const time = {
            hour: 0,
            minute: 0,
            strict: true,
        };

        const result = Reminder.applyDateSet(time, timezone, date);
        expect(result.format()).toBe(expectedResult);
    });

    it ("handles explict pm correctly", () => {
        const date = new Date('Dec 17 1995 18:45:00 GMT+0000');
        const expectedResult = "1995-12-17T23:00:00-08:00";
        const time = {
            hour: 11,
            minute: 0,
            strict: true,
            tt: 'PM',
        };

        const result = Reminder.applyDateSet(time, timezone, date);
        expect(result.format()).toBe(expectedResult);
    });
});

describe(`Testing the method: ${chalk.cyan("modifierToSentence(modifier)")}`, () => {
    it ("transforms seconds", () => {
        const modifier = {
            second: 2,
            minute: 0,
        };
        const expectedResult = "2 seconds";
        const result = Reminder.modifierToSentence(modifier);
        expect(result).toBe(expectedResult);
    });

    it ("transforms minute", () => {
        const modifier = {
            second: 0,
            minute: 1,
        };
        const expectedResult = "1 minute";
        const result = Reminder.modifierToSentence(modifier);
        expect(result).toBe(expectedResult);
    });
});