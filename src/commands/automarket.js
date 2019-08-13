import Logger from "../utils/logger";
import Command from "../utils/command";
import Nova from "../utils/nvro";
import PrettyPrinter from "../utils/prettyPrinter";
import DataTable from "../utils/datatable";

export default class NovaAutoMarket extends Command {
  constructor(bot) {
    super(bot, {
      name: "automarket",
      description: "Gets market information of a particular item directly from Nova RO's website on a regular basis. When results exist, the bot will notify the user.\n\* Use subcommand **list** to list out all your automarket.\n\* Use subcommand **remove** to remove an entry from your automarket based on the id from the list. You can provide a list of comma separated ids.\n\* Use subcommand **clear** to remove ALL entries from your automarket.",
      usage: `${bot.prefix}automarket <item id> [, <refine>] [, <price>] [, <additional properties>, ...].\n\n` +
      `${bot.prefix}automarket ${bot.subprefix}list \n\n` +
      `${bot.prefix}automarket ${bot.subprefix}remove <entry id> [, <entry id>, ...]\n\n` +
      `${bot.prefix}automarket ${bot.subprefix}clear`,
      aliases: ["am"],
      category: "Nova",
      subCommands: ["list", "clear", "remove"],
    });
  }

  async run(message, args) {
    
    // reject empty messages
    if (!args.length) {
      const reply = `Please specify the id of an item to queue automarket.`;
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


    // convert args to comma deliminated list
    args = args
      .join(" ")
      .split(",")
      .map(arg => arg.trim())
      .filter(arg => arg != "");


    // id is required to use automarket
    if (isNaN(args[0])) {
      Logger.log("Not a number.");
      const reply = "First parameter must be an item ID";
      await message.channel.send(reply);
      return reply;
    }

    // valid automarket
    Logger.log(`Queuing automarket query from ${message.author.username}(${message.author.id}) on channel ${message.channel.name}(${message.channel.id}) with arguments: ${args}`);
   
    // grabbing datatable (for name)
    const datatable = await Nova.getMarketData(args[0]);
    args = args ? args : [];

    // insert into scheduler
    // restore the argument to what it would have looked like
    // if it was ran normally
    const result = await this.bot.scheduler.insert({
      channelid: message.channel.id,
      command: "market",
      owner: message.author.id,
      itemid: datatable.table.id,
      name: datatable.name,
      args: `${JSON.stringify(args)}`,
    });

    Logger.log(JSON.stringify(result.ops));

    if (result.result.ok) {
      Logger.log("Successfully queued!");
      const reply = `Automarket queued for ${datatable.name} with the following filters: ${args.slice(1).join(",")}`;
      await message.channel.send(reply);
      return reply;
    }
  }

  // clearing messages
  async clear(message, args) {
    Logger.log(`Clearing automarket...`);
    const result = await this.bot.scheduler.clear({
      command: "market",
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
    Logger.log(`Listing automarket for ${message.author.username}(${message.author.id})`);
    const list = await this.bot.scheduler.list({
      command: "market",
      owner: message.author.id,
    });

    Logger.log(JSON.stringify(list));


    const header = {
      id: "#",
      itemid: "Id",
      name: "Item",
      args: "Properties", 
    };

    const displayList = list.map((row, index) => {
      row.id = (index + 1).toString(); 
      row.args = JSON.parse(row.args).slice(1).join(",");
      return row;
    });
     
    const dt = new DataTable({
      header: header,
      contents: displayList,
    }); 

    const { reply } = PrettyPrinter.tabulate({
      table: dt,
    });

    Logger.log(reply);
    await message.channel.send(`Automarket for ${message.author.toString()}\n${reply}`);
    return reply;
  }

  async remove(message, args) {
   
    if (!args.length) {
      const reply = "Please specify an automarket id to remove it.";
      await message.channel.send(reply);
      return reply;
    }
    const ids = args.map(arg => parseInt(arg));
    Logger.log(`Removing automarket entries: ${ids.toString()}`);
    
    const list = await this.bot.scheduler.list({
      command: "market",
      owner: message.author.id,
    });
    
    const removeids = ids
      .filter(id => id <= list.length)
      .map(id => list[id - 1]._id);
 
    if (!removeids.length) {
      const reply = "None of the ids are in your automarket. Nothing was removed";
      await message.channel.send(reply);
      return reply;
    }

    const removedReply = await Promise.all(removeids.map(async (id) => {
      Logger.log(`Attempting to delete automarket with id: ${id}.`);
      const deleteEntryInfo = await this.bot.scheduler.get(id);
      deleteEntryInfo.args = JSON.parse(deleteEntryInfo.args).slice(1).join(","); 

      const result = await this.bot.scheduler.remove(id);
      Logger.log(result);
      return deleteEntryInfo; 
    }));

    const header = {
      itemid: "Id",
      name: "Item",
      args: "Properties", 
    };
    
    const table = {
      header: header,
      contents: removedReply,
    };

    const { reply } = PrettyPrinter.tabulate({
      table: table,
    });
    
    Logger.log(reply);
    await message.channel.send(`The following automarket were removed.\n${reply}`);
    return reply; 
  }

  async interval(message, args) {
    if (!args.length) {
      Logger.log(`Getting automarket interval...`);
      const interval = await this.bot.scheduler.getInterval();
      Logger.log(JSON.stringify(interval));
      return;
    }

    if (isNaN(args[0])) {
      Logger.log(`Not a number`);
      await message.channel.send('Setting interval requires a number.');
      return "Not a number";
    }

    const min = parseInt(args[0]);
    Logger.log(`Setting automarket interval...`);
    const result = await this.bot.scheduler.setInterval(min);
    
    if (result.result.ok) {
      const reply = `Interval is set to ${min}.`; 
      Logger.log(reply);
      await message.channel.send(reply);
    }
  }
}
