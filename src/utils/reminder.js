import Logger from './logger';
import { EventEmitter } from 'events';
import moment from 'moment-timezone';
const cron = require('cron-validator');

// any amount of digits, duration does not care
const inDigitRegex = "(-)?\\d*";

// duration regex object
const durationRegexObject = {
  second: "\\ss(ec(ond)?(s)?)?$",
  minute: "\\sm(in(ute)?(s)?)?$",
  hour:   "\\sh((ou)?r(s)?)?$",
  day:    "\\sd(ays|ay)?$",
  week:   "\\sw((ee)?k(s)?)?$",
};

const time24Regex = /\s([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
const timeRegex = /\s((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm])?)$/;
const hourRegex = /\s((1[0-2]|0?[1-9]) ?([AaPp][Mm])?)$/;
const unixRegex = /(?<=(<t:))\d{10}/;

export const REMIND_TYPE = {
    IN: 'in',
    EVERY: 'every',
    CRON: 'cron',
    AT: 'at',
    ON: 'on',
};

export const CRON_DATE = new Date(0);

// regex
const inRegex = /in(?!.+\sin)\s.+/;
const atRegex = /at(?!.+\sat)\s.+/;
const everyRegex = /every(?!.+\severy)\s.+/;
const cronRegex = /cron(?!.+\scron)\s.+/;

export default class Reminder extends EventEmitter {
    constructor(bot) {
        super();
        this.bot = bot;
    }

    static objectPropertiesAllZero(object) {
        return Object.values(object).every(o => o === 0);
     }

     static modifierToSentence(modifier) { 
        if (typeof modifier === 'string') {
            return modifier;
        }

        if (modifier.hasOwnProperty('strict')) {
            return moment(`${modifier.hour}:${modifier.minute}${modifier.tt ? modifier.tt.toUpperCase() : ""}`, "h:m A").format("hh:mm A");
        }

        return Object.keys(modifier)
            .reduce((result, value) => {
                if (modifier[value]) {
                    result = `${modifier[value]} ${value}${modifier[value] > 1 ? "s" : ""}`;
                }
                return result;
            }, "");
     }

    static getMatch(sentence) {

        // *in* pattern
        const inMatch = sentence.match(inRegex);
        // *every* pattern
        const everyMatch = sentence.match(everyRegex);
        // *at* pattern
        const atMatch = sentence.match(atRegex);
        // *cron* pattern
        const cronMatch = sentence.match(cronRegex);

        const matches = [inMatch, everyMatch, atMatch, cronMatch].filter(x => x);
        const selection = Math.max.apply(Math, matches.map(match => match ? match.index : 0));

        return {
            inMatch: inMatch ? inMatch.index === selection ? inMatch : null : null,
            everyMatch: everyMatch ? everyMatch.index === selection ? everyMatch : null : null,
            atMatch: atMatch ? atMatch.index === selection ? atMatch : null : null,
            cronMatch: cronMatch ? cronMatch.index === selection ? cronMatch : null : null,
        }
    }

    static getParsedMatchObject(sentence, timezone) {
        const { inMatch, everyMatch, atMatch, cronMatch } = Reminder.getMatch(sentence);

        return inMatch ? Reminder.parseInMatch(inMatch) 
            : everyMatch ? Reminder.parseEveryMatch(everyMatch)
            : atMatch ? Reminder.parseAtMatch(atMatch, timezone)
            : cronMatch ? Reminder.parseCronMatch(cronMatch, timezone)
            : null;
    }

    static parseMatch(match, type) {
        const { index, input } = match;
        const message = input.slice(0, index ? index - 1 : 0); 
        const timeElement = input.slice(index + type.length + 1);
        return {
            message: message,
            timeElement: timeElement,
        }
    }

    static parseInMatch(match) {
        const { message, timeElement } = Reminder.parseMatch(match, REMIND_TYPE.IN);
        const modifier = Reminder.getDurationObject(timeElement);
        const resultDate = Reminder.applyDateTransform(new Date(), modifier);
        return {
          type: REMIND_TYPE.IN,
          replyMessage: message,
          sleepUntil: resultDate,
          modifier: modifier,
          repeat: false,
          timeElement: timeElement,
        };
    }

    static parseEveryMatch(match) {
        const { message, timeElement } = Reminder.parseMatch(match, REMIND_TYPE.EVERY);
        const modifier = Reminder.getDurationObject(timeElement);
        const resultDate = Reminder.applyDateTransform(new Date(), modifier);
        return {
            type: REMIND_TYPE.EVERY,
            replyMessage: message,
            sleepUntil: resultDate,
            modifier: modifier,
            repeat: true,
            timeElement: timeElement,
        }
    }

    // null sleepUntil + repeat = true ==> cron
    static parseCronMatch(match, timezone) {
        const { message, timeElement } = Reminder.parseMatch(match, REMIND_TYPE.CRON);
        const validCron = cron.isValidCron(timeElement) ? timeElement : null;
        return {
            type: REMIND_TYPE.CRON,
            replyMessage: message,
            sleepUntil: CRON_DATE,
            modifier: validCron,
            repeat: true,
            timeElement: timezone,
        };
    }

    static parseAtMatch(match, timezone) {
        const { message, timeElement } = Reminder.parseMatch(match, REMIND_TYPE.AT);
        // check for unix at match
        const unixTest = timeElement.match(unixRegex);
        if (unixTest) {
            const resultDate = moment.unix(unixTest[0]);
            return {
                type: REMIND_TYPE.AT,
                replyMessage: message,
                sleepUntil: resultDate,
                modifier: timeElement,
                repeat: false,
                timeElement: timeElement
            }
        }

        const modifier = Reminder.getTimeObject(timeElement);
        const resultDate = Reminder.applyDateSet(modifier, timezone);
        return {
            type: REMIND_TYPE.AT,
            replyMessage: message,
            sleepUntil: resultDate,
            modifier: modifier,
            repeat: false,
            timeElement: timeElement,
        }
    }

    // parses *in* and *every* case
    // e.g.
    // in 5 min
    // every 5 min
    static getDurationObject(args) {
        // returns object of the duration result of each time unit.
        // if not found, that time unit will be 0 instead.
        return Object.keys(durationRegexObject)
            .reduce((result, value) => {
                const curExp = new RegExp(inDigitRegex + durationRegexObject[value]);
                const match = ` ${args}`.match(curExp); // to make regex work in case that a digit is not provideds
                // if digit is not provided, but still found a match, assume 1.
                // otherwise if it's 0, stay 0.
                const number = match ? parseInt(match[0]) === 0 ? 0 : parseInt(match[0]) || 1 : 0; 
                result[value] = number > 0 ? number : 0;  // if digits is less than 0, put 0.
                return result;
            }, {});
    }

    // parses *at* case
    // e.g.
    // at 8:00 pm
    // at 5:00
    // at 13:00
    static getTimeObject(args) {
        const time24 = ` ${args}`.match(time24Regex);
        const time = ` ${args}`.match(timeRegex);
        const hour = ` ${args}`.match(hourRegex);
        const timeObject = time ? {
            hour: parseInt(moment(`${time[2]} ${time[4]}`, "h A").format("HH")) % 12,
            minute: parseInt(time[3]),
            strict: time[4] ? true : false,
            tt: time[4] ? time[4] : null,
        } : time24 ? {
            hour: parseInt(time24[1]),
            minute: parseInt(time24[2]),
            strict: parseInt(time24[1]) > 12 ? true : false,
        } : hour ? {
            hour: parseInt(moment(`${hour[2]} ${hour[3]}`, "h A").format("HH")) % 12,
            minute: 0,
            strict: hour[3] ? true : false,
            tt: hour[3] ? hour[3] : null,
        } : null;
        return timeObject;
    }

    static applyDateTransform(date, transform) {
        date.setSeconds(date.getSeconds() + transform.second);
        date.setMinutes(date.getMinutes() + transform.minute);
        date.setHours(date.getHours() + transform.hour);
        date.setDate(date.getDate() + transform.day);
        date.setDate(date.getDate() + transform.week * 7);
        return date;
    }

    static applyDateSet(time, timezone, test=null) {
        const date = test ? test.toISOString() : new Date().toISOString();
        const now = moment.tz(date, timezone);
        const expected = moment.tz(date, timezone)
            .hour(time.hour + (time.tt ? time.tt.toLowerCase() === 'pm' ? 12 : 0 : 0))
            .minute(time.minute)
            .second(0);
        while (expected.isBefore(now)) {
            if (time.strict) {
                expected.add(1, 'd');
            } else {
            expected.add(12, 'h');
            }
        }
        Logger.log(expected);
        return expected;
    }

    // main reminder processing method.
    async process(params) {
        const { channelid, owner, type } = params;
        let { message } = params;
        const channel = await this.bot.client.channels.fetch(channelid);
        if (type === REMIND_TYPE.CRON) {
            const unixPart = message.match(unixRegex);
            if (unixPart) {
                const messageDate = new Date(unixPart[0] * 1000);
                const currentDate = new Date();
                const newMessageDate = new Date();
                newMessageDate.setHours(messageDate.getHours());
                newMessageDate.setMinutes(messageDate.getMinutes());
                newMessageDate.setSeconds(messageDate.getSeconds());
                const curUnix = moment(currentDate).unix();
                let newUnix = moment(newMessageDate).unix();
                
                if (curUnix > newUnix) {
                    newUnix += 86400;
                }
                
                message = message.replace(unixRegex,  newUnix);
                Logger.log(`msgDate: ${unixPart[0]} | curDate: ${curUnix} | newDate: ${newUnix}`);
                this.bot.adminChannel.send(`msgDate: <t:${unixPart[0]}> | curDate: <t:${curUnix}> | newDate: <t:${newUnix}>`);
            }
        }
        await channel.send(`<@${owner}>! ${this.bot.name} has a message for you.\n> ${message}`);
    }
}

