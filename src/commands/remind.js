import Logger from "../utils/logger";
import Command from "../utils/command";
import PrettyPrinter from "../utils/prettyPrinter";
import DataTable from "../utils/datatable";
import Moment from "moment-timezone";

// regex
const inRegex = /in(?!.*\sin).*/;
const atRegex = /at(?!.*\sat).*/;
const everyRegex = /every(?!.*\severy).*/;
const momenturl = 'https://momentjs.com/timezone/';

export const TIMEZONE = "remind-timezone";
export const REMIND = "remind";

export default class Reminder extends Command {
  constructor(bot) {
    super(bot, {
      name: "remind",
      description: `Set a reminder so that the bot will ping you.\n* Use subcommand **list** to see all your reminders.\n* Use subcommand **remove** to remove one of your reminders based on the id from the list. You can provide a list of comma separated ids.\n* Use subcommand **clear** to remove **ALL** reminders from your list.\n* Use subcommand **timezone** to set it to your local timezone.\n In order for you to know your timezone, visit ${momenturl}`,
      usage: `${bot.prefix}remind <message> in <duration>\n\n` +
      `${bot.prefix}remind <message> at <time> (requires you to have timezone set up.)\n\n` +
      `${bot.prefix}remind ${bot.subprefix}timezone <timezone>. **E.g. ${bot.prefix}remind ${bot.subprefix}timezone Australia/Sydney.** \n\n` +
      `${bot.prefix}remind ${bot.subprefix}list \n\n` +
      `${bot.prefix}remind ${bot.subprefix}remove <entry id> [, <entry id>, ...].\n\n` +
      `${bot.prefix}remind ${bot.subprefix}clear`,
      aliases: ["rmb"],
      category: "General",
      subCommands: ["list", "clear", "remove", "timezone"],
    });
  }

  async run(message, args) {
    
    // reject empty messages
    if (!args.length) {
      const reply = `Please specify arguments for reminder.`;
      await message.channel.send(reply);
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

    const argSentence = args.join(" ");

    // *in* pattern
    const inMatch = argSentence.match(inRegex);

    // *every* pattern

    // *at* pattern

    // *cron* pattern

    const match = inMatch;

    if (!match) {
      await message.channel.send(`You are not using a valid pattern to queue reminder. Please try again.`);
      return;
    }

    // valid automarket
    Logger.log(`Queuing reminder from ${message.author.username}(${message.author.id}) on channel ${message.channel.name}(${message.channel.id}) with message: ${argSentence}`);
   
    // insert into scheduler
    // restore the argument to what it would have looked like
    // if it was ran normally
    const result = await this.bot.scheduler.insert({
      channelid: message.channel.id,
      command: REMIND,
      owner: message.author.id,
      type: 'in',
      msg: argSentence,
      sleepUntil: Date.now(),
      interval: false,
    });

    Logger.log(JSON.stringify(result.ops));

    if (result.result.ok) {
      Logger.log("Successfully queued!");
      const reply = `Reminder queued for ${message.author.username} with the following message: ${argSentence} `;
      await message.channel.send(reply);
      return reply;
    }
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
      msg: "Message",
      sleepUntil: `Schedule (${Moment.tz(timezone ? timezone.args : null).format("Z z")})`,
    };

    const displayList = list.map((row, index) => {
      row.id = (index + 1).toString();
      row.sleepUntil = Moment.tz(row.sleepUntil, null).format('YYYY-MM-DD HH:mm');
      return row;
    });
     
    console.log(displayList);

    const dt = new DataTable({
      header: header,
      contents: displayList.filter(entry => entry),
    }); 

    const { reply } = PrettyPrinter.tabulate({
      table: dt,
    });

    Logger.log(reply);
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

    const removedReply = await Promise.all(removeIds.map(async (id) => {
      Logger.log(`Attempting to delete reminder with id: ${id}.`);
      const deleteEntryInfo = await this.bot.scheduler.get(id);  
      const result = await this.bot.scheduler.remove(id);
      Logger.log(result);
      deleteEntryInfo.sleepUntil = Moment.tz(deleteEntryInfo.sleepUntil, null).format('YYYY-MM-DD HH:mm');
      return deleteEntryInfo; 
    }));

    const timezone = await this.bot.scheduler.get(message.author.id);
    const header = {
      msg: "Message",
      sleepUntil: `Schedule (${Moment.tz(timezone ? timezone.args : null).format("Z z")})`,
    };
    
    const dt = new DataTable({
      header: header,
      contents: removedReply,
    });

    const { reply } = PrettyPrinter.tabulate({
      table: dt,
      name: null,
      suppressEntryText: true,
    });
    
    Logger.log(reply);

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

      if (!result[0]) {
        await message.channel.send(`Find your corresponding timezone here ${momenturl}. Copy the ***name*** of it and use it with this command with it. E.g. Australia/Sydney.`);
        return;
      }

      await message.channel.send(`Your current timezone is set to: **${result[0] ? result[0].args : "Not Set"}**.\n`);
      return;
    }

    const list = Moment.tz.names();
    if (!list.includes(args[0])) {
      await message.channel.send(`Your timezone is not in the list!`);
      return;
    }
    
    Logger.log(`Adding remind-timezone for ${message.author.username} (${message.author.id}) with timezone: ${args[0]}.`);

    const params = {
      channelid: message.channel.id,
      command: TIMEZONE,
      owner: message.author.id,
      args: args[0],
    }

    const result = await this.bot.scheduler.update(message.author.id, params, true);

    Logger.log(JSON.stringify(result.ops));
    if (result.result.ok) {
      Logger.log("Successfully added!");
      const reply = `Timezone added for ${message.author.username} as ${args[0]}.`;
      await message.channel.send(reply);
      return reply;
    }
    await message.channel.send(`Failed to add automarket. Please contact developer.`);
  }
}
