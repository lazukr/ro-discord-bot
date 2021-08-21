import Logger from "../utils/logger";
import Command from "../utils/command";
import PrettyPrinter from "../utils/prettyPrinter";
import DataTable from "../utils/datatable";
import Moment from "moment-timezone";
import Reminder, { REMIND_TYPE, CRON_DATE } from "../utils/reminder";
import cronstrue from "cronstrue";
import moment from "moment";

// regex
const momenturl = 'https://momentjs.com/timezone/';
Moment.locale('en', {
  calendar: {
    sameDay : '[at] LT',
    nextDay : '[tomorrow at] LT',
    nextWeek : '[on] ddd [at] LT',
    sameElse : '[on] lll'
  }
});

export const TIMEZONE = "remind-timezone";
export const REMIND = "remind";

export default class Remind extends Command {
  constructor(bot) {
    super(bot, {
      name: "remind",
      description: `Set a reminder so that the bot will ping you.\n* Use subcommand **list** to see all your reminders.\n* Use subcommand **remove** to remove one of your reminders based on the id from the list. You can provide a list of comma separated ids.\n* Use subcommand **clear** to remove **ALL** reminders from your list.\n* Use subcommand **timezone** to set it to your local timezone.\n In order for you to know your timezone, visit ${momenturl}`,
      usage: `Refer to \`${bot.prefix}remind\` for in-depth details`,
      aliases: ["rmb"],
      category: "General",
      subCommands: ["list", "clear", "remove", "timezone", "in", "at", "every", "cron", "units"],
    });
    this.botprefix = bot.prefix;
    this.botsubprefix = bot.subprefix;
  }

  async run(message, args) {
    
    // reject empty messages
    if (!args.length) {

      const timezone = await this.bot.scheduler.get(message.author.id);
      const embed = {
          title: `**How to use reminder**`,
          description: `**1.** Set your timezone by using the \`${this.botsubprefix}timezone\` subcommand before queuing a reminder. ` +
          (timezone ? `\n> Your current timezone is set to: **${timezone.args} (${Moment.tz(timezone.args).format("Z z")}).**` 
          : `\n> **You do not have timezone set, thus any reminders queued is assumed to be +00:00 GMT.** Visit ${momenturl} to find out your timezone.`) +
          `\n**2.** Queue a reminder using one of the 4 methods \`in\`, \`at\`, \`every\`, \`cron\`.` +
          `\nUse \`${this.botsubprefix}in\`, \`${this.botsubprefix}at\`, \`${this.botsubprefix}every\`, \`${this.botsubprefix}cron\` for more information on each use case.` +
          `\n**3.** Use \`${this.botsubprefix}units\` for a list of available time units.`,
        };
      await message.channel.send({embed: embed});
      return "No args";
    }

    // handle subcommands 
    const subCommand = super.getSubCommand(args[0]);
    if (subCommand) {
      if (!this.help.subCommands.includes(subCommand)) {
        const reply = `\`${subCommand}\` is not a valid sub command.`;
        await message.channel.send(reply);
        return reply;
      }

      // remove the subcommand from argument list
      // so it is not passed into the subcommands
      args.shift();
      args = args
        .join(" ")
        .split(",")
        .map(arg => arg.trim())
        .filter(arg => arg != "");

      // run the subcommand
      await super.runSubCommand(subCommand, message, args);
      return subCommand;
    }

    // get the matching regex
    const timezone = await this.bot.scheduler.get(message.author.id);
    const sentence = args.join(" ");
    const params = Reminder.getParsedMatchObject(sentence, timezone ? timezone.args : null);
    if (!params) {
      await message.channel.send(`You are not using a valid pattern to queue reminder. Please try again.`);
      return;
    }

    const { replyMessage, type, sleepUntil, modifier, repeat, timeElement } = params;
    if (params.replyMessage === "") {
      await message.channel.send(`You cannot remind yourself with an empty message. Please try again.`);
      return;
    }

    if (!modifier) {
      await message.channel.send(`Your cron pattern was invalid. Please try again.`);
      return;
    }

    if (Reminder.objectPropertiesAllZero(modifier)) {
      await message.channel.send(`You cannot have time offsets of 0 or less. Please try again.`);
      return;
    }

    // valid automarket
    Logger.log(`Queuing reminder from ${message.author.username}(${message.author.id}) on channel ${message.channel.name}(${message.channel.id}) with message: ${sentence}`);
   
    
    // insert into scheduler
    // restore the argument to what it would have looked like
    // if it was ran normally
    const result = await this.bot.scheduler.insert({
      channelid: message.channel.id,
      command: REMIND,
      owner: message.author.id,
      type: type,
      message:  replyMessage,
      creationDateTime: new Date().toISOString(),
      sleepUntil: sleepUntil.toISOString(),
      modifier: modifier,
      repeat: repeat,
      timeElement: timeElement,
    });

    Logger.log(JSON.stringify(result.ops[0]));

    const unixSleepUntil = moment(sleepUntil).unix();
    if (result.result.ok) {
      Logger.log("Successfully queued!");
      const reply = `The message \`${replyMessage}\` has been added for ${message.author.username}.\nYou will be reminded` +
      (type === REMIND_TYPE.IN ? ` in ${Reminder.modifierToSentence(modifier)} (<t:${unixSleepUntil}>)` :
      (type === REMIND_TYPE.EVERY) ? ` every ${Reminder.modifierToSentence(modifier)} (next one at <t:${unixSleepUntil}>)` :
      (type === REMIND_TYPE.AT) ? ` <t:${unixSleepUntil}>` : 
      (type === REMIND_TYPE.CRON) ? ` ${cronstrue.toString(modifier).toLowerCase()} (cron)` :
      `<t:${unixSleepUntil}>`);
      await message.channel.send(reply);
      return reply;
    }
  }

  async in(message) {
    const embed = {
      title: `**How to use reminder - In mode**`,
      description: `\`In\` should be used if you need a message to be sent ***in*** a certain amount of time from now.` +
          `\nIt will interpret the last \`in\` in your message as the time parameter.` +
          `\n> ${this.botprefix}remind <message> in <#> <time unit>` +
          `\nFor example:` +
          `\n> ${this.botprefix}remind hi in 5 min` +
          `\nwill ping you the message "hi" in 5 min.` +
          `\nRun the following for a list of all the available time units:` +
          `\n> ${this.botprefix}remind ${this.botsubprefix}units`,
    };
    await message.channel.send({embed: embed});
  }

  async at(message) {
    const embed = {
      title: `**How to use reminder - At mode**`,
      description: `\`At\` should be used if you need a message to be sent ***at*** a particular time.` +
      `\nIt will interpret the last \`at\` in your message as the time parameter.` +
      `\n> ${this.botprefix}remind <message> at <hh:mm tt>` +
      `\nFor example:` +
      `\n> ${this.botprefix}remind hi at 8:00pm` +
      `\nwill ping you the message "hi" at 8:00pm ` +
      `\n> **Notes:**` +
      `\n> - Your timezone will matter for how it figures out when to send the message. Changing your timezone will **NOT** affect existing queued items.` +
      `\n> - If you do **not** specify an AM or PM, it will **assume** the next available one.`,
    };
    await message.channel.send({embed: embed});
  }

  async every(message) {
    const embed = {
      title: `**How to use reminder - Every mode**`,
      description: `\`Every\` should be used if you need a message to be sent ***every*** x amount of time that passes starting from now.` +
      `\nIt will interpret the last \`every\` in your message as the time parameter.` +
      `\n> ${this.botprefix}remind <message> every <#> <time unit>` +
      `\nFor example:` +
      `\n> ${this.botprefix}remind hi every 5 min` +
      `\nwill ping you the message "hi" every 5 minutes from now.` +
      `\nRun the following for a list of all the available time units:` +
      `\n> ${this.botprefix}remind ${this.botsubprefix}units`,
    }
    await message.channel.send({embed: embed});
  }

  async cron(message) {
    const embed = {
      title: `**How to use reminder - Cron mode**`,
      description: `\`Cron\` should be used if you need a message to be sent periodically at fixed times, dates, or intervals.` +
      `\nIt will interpret the last \`cron\` in your message as the time parameter.` +
      `\n> \`${this.botprefix}remind <message> cron <cron pattern>\`` +
      `\nFor example:` +
      `\n> \`${this.botprefix}remind hi cron 5 * * * *\`` +
      `\nwill ping you the message "hi" at the 5th minute of each hour` +
      `\nTo do a more repetitive example:` +
      `\n> \`${this.botprefix}remind hi cron */5 * * * *\`` +
      `\nwill ping you the message "hi" every 5th minute of each hour (0, 5, 10, 15...)` +
      `\n` +
      `\n**Special Rule:**` +
      `\n> - discord unix timestamp can be used with this to auto update the date to today's date.` +
      `\n>   this effectively allows you to queue reminders that will update for that day.` +
      `\n> \`${this.botprefix}remind raid at <t:1609531200> cron 0 8 * * *\`` +
      `\n> this will queue a daily reminder at 8 am to remind about an event at 12 pm THAT DAY.` +
      `\n` +
      `\n**Cron Patterns:**` +
      `\n> \`\`\`*  *  *  *  *` +
      `\n> ┬  ┬  ┬  ┬  ┬` +
      `\n> │  │  │  │  │` +
      `\n> │  │  │  │  └ day of week (0 - 7) (0 or 7 is Sun)` +
      `\n> │  │  │  └─── month (1 - 12)` +
      `\n> │  │  └────── day of month (1 - 31)` +
      `\n> │  └───────── hour (0 - 23)` +
      `\n> └──────────── minute (0 - 59)` +
      `\n> \`\`\`` +
      `\nIf you need more resources on constructing the correct cron pattern, please refer to https://crontab.guru/.` +
      `\n` +
      `\n**Differences with the \`Every Mode\`**` +
      `\n> - Every operates on regular intervals you set from now. Cron works solely based on a predefined pattern.` +
      `\n> - Every can do irregular intervals such as every 21 minutes. Cron can do it too, but irregular intervals will be cut off when that unit of time completes its cycle. E.g. */21 * * * * (every 21 minutes in the hour) = 8:21, 8:42, 9:21, 9:42...`,
    }
    await message.channel.send({embed: embed});
  }

  async units(message) {
    const embed = {
      title: `**How to use reminder - Time Units**`,
      description: `Available time units:` +
      `\n> Seconds: \`s, sec, secs, second, seconds\`` +
      `\n> Minutes: \`m, min, mins, minute, minutes\`` +
      `\n> Hours: \`h, hr, hrs, hour, hours\`` +
      `\n> Days: \`d, day, days\`` +
      `\n> Weeks: \`w, wk, wks, week, weeks\``,
    }
    await message.channel.send({embed: embed});
  }

  // clearing messages
  async clear(message, args) {
    Logger.log(`Clearing reminders...`);
    const result = await this.bot.scheduler.clear({
      command: REMIND,
      owner: message.author.id,
    });
    
    // if we get valid results
    if (result.result.ok) {
      Logger.log(`Delete ${result.deletedCount} for ${message.author.username}(${message.author.id})`);
      const reply = `${result.deletedCount} entries were deleted.`;
      await message.channel.send(reply);
      return reply;
    }    
  }

  // lists
  async list(message, args) {
    Logger.log(`Listing reminders for ${message.author.username}(${message.author.id})`);
    const list = await this.bot.scheduler.list({
      command: REMIND,
      owner: message.author.id,
    });

    if (!list.length) {
      await message.channel.send(`You have no reminders.`);
      return;
    }

    const timezone = await this.bot.scheduler.get(message.author.id);
    const header = {
      id: "#",
      message: "Message",
      sleepUntil: `Schedule (${Moment.tz(timezone ? timezone.args : null).format("Z z")})`,
      method: "Method",
    };

    const displayList = list.map((row, index) => {
      row.id = (index + 1).toString();
      row.sleepUntil = moment(row.sleepUntil).isSame(moment(CRON_DATE)) 
        ? cronstrue.toString(row.modifier).toLowerCase()
        : Moment.tz(row.sleepUntil, timezone ? timezone.args : null).calendar();
      row.method = `${row.type} ${Reminder.modifierToSentence(row.modifier)}`;
      return row;
    });

    const dt = new DataTable({
      header: header,
      contents: displayList.filter(entry => entry),
    }); 

    const { reply } = PrettyPrinter.tabulate({
      table: dt,
    });

    //Logger.log(reply);
    await message.channel.send(`Reminders for ${message.author.toString()}\n${reply}`);
    return reply;
  }

  async remove(message, args) {
   
    if (!args.length) {
      const reply = "Please specify an reminder id to remove it.";
      await message.channel.send(reply);
      return reply;
    }
    const ids = args.map(arg => parseInt(arg));
    Logger.log(`Removing reminder entries: ${JSON.stringify(ids)}`);
    
    const list = await this.bot.scheduler.list({
      command: REMIND,
      owner: message.author.id,
    });
    
    //console.log(list);

    // get all ids of reminder list
    const removeIds = ids
      .filter(id => id <= list.length)
      .map(id => list[id - 1]._id);

    if (!removeIds.length) {
      const reply = "None of the ids are in your reminders. Nothing was removed";
      await message.channel.send(reply);
      return reply;
    }

    const timezone = await this.bot.scheduler.get(message.author.id);
    const header = {
      message: "Message",
      sleepUntil: `Schedule (${Moment.tz(timezone ? timezone.args : null).format("Z z")})`,
      method: "Method",
    };
    
    const removedReply = await Promise.all(removeIds.map(async (id) => {
      Logger.log(`Attempting to delete reminder with id: ${id}.`);
      await this.bot.scheduler.cancelReminder(id);
      const deleteEntryInfo = await this.bot.scheduler.get(id);  
      const result = await this.bot.scheduler.remove(id);
      //Logger.debug(result);
      deleteEntryInfo.sleepUntil = moment(deleteEntryInfo.sleepUntil).isSame(moment(CRON_DATE)) 
      ? cronstrue.toString(deleteEntryInfo.modifier).toLowerCase() 
      : Moment.tz(deleteEntryInfo.sleepUntil, timezone ? timezone.args : null).calendar(); 
      deleteEntryInfo.method = `${deleteEntryInfo.type} ${Reminder.modifierToSentence(deleteEntryInfo.modifier)}`;
      return deleteEntryInfo; 
    }));

    const dt = new DataTable({
      header: header,
      contents: removedReply,
    });

    const { reply } = PrettyPrinter.tabulate({
      table: dt,
      name: null,
      suppressEntryText: true,
    });
    
    //Logger.log(reply);

    if (removeIds.length) {
      await message.channel.send(`The following reminders were removed from ${message.author.username}'s reminder list.${reply}`);
    }
    return reply; 
  }

  async timezone(message, args) {

    // no sub args
    if (!args.length) {
      const result = await this.bot.scheduler.list({
        command: TIMEZONE,
        owner: message.author.id,
      });  

      const timezone = result[0] ? `${result[0].args} (${Moment.tz(result[0].args).format("Z z")})` : `Not set (+00:00 GMT)`;
      const embed = {
        title: `**How to use reminder - Timezone**`,
        description: `Your current timezone is set to:` +
        `\n> **${timezone}**` +
        `\nTo find or update your timezone, please visit this website ${momenturl} and find the name of the city your timezone falls under. ` +
        `Then run the command:` +
        `\n> ${this.botprefix}remind ${this.botsubprefix}timezone Region/City` +
        `\nFor example, if your timezone falls under Australia/Sydney` +
        `\n> ${this.botprefix}remind ${this.botsubprefix}timezone Australia/Sydney`,
      };
      await message.channel.send({embed: embed});
      return;
    }

    const list = Moment.tz.names();
    const tz = list.filter(tz => tz.includes(args[0].replace(/^\w/, c => c.toUpperCase()))); // capitalize first letter for search
    if (!tz.length) {
      await message.channel.send(`Your timezone is not in the list!`);
      return;
    }
    //Logger.debug(tz);
    Logger.log(`Adding remind-timezone for ${message.author.username} (${message.author.id}) with timezone: ${tz[0]}.`);

    const params = {
      channelid: message.channel.id,
      command: TIMEZONE,
      owner: message.author.id,
      args: tz[0],
    }

    const result = await this.bot.scheduler.update(message.author.id, params, true);

    Logger.log(JSON.stringify(result.ops));
    if (result.result.ok) {
      Logger.log("Successfully added!");
      const reply = `Timezone added for ${message.author.username} as ${tz[0]}.`;
      await message.channel.send(reply);
      return reply;
    }
    await message.channel.send(`Failed to add automarket. Please contact developer.`);
  }
}