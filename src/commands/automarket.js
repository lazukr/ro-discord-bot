import Logger from "../utils/logger";
import Command from "../utils/command";
import Nova from "../utils/nvro";
import PrettyPrinter from "../utils/prettyPrinter";
import DataTable from "../utils/datatable";
import { getFilters } from "./market";
import Scraper from "../utils/scraper";

export const MARKET = "market";

export default class NovaAutoMarket extends Command {
  constructor(bot) {
    super(bot, {
      name: "automarket",
      description: "Gets market information of a particular item directly from Nova RO's website on a regular basis. When results exist, the bot will notify the user.\n\* Use subcommand **list** to list out all your automarket.\n\* Use subcommand **remove** to remove an entry from your automarket based on the id from the list. You can provide a list of comma separated ids.\n\* Use subcommand **clear** to remove ALL entries from your automarket.",
      usage: `${bot.prefix}automarket <item id> [, <refine>] [, <price>] [, <additional properties>, ...].\n\n` +
      `${bot.prefix}automarket ${bot.subprefix}list [#]\n > If you append a number, it will return the result for that page.\n\n` +
      `${bot.prefix}automarket ${bot.subprefix}remove <entry id | item id> [, <entry id | item id>, ...].\n > If duplicates are found, they will be listed and will require entry id in order to delete.\n\n` +
      `${bot.prefix}automarket ${bot.subprefix}clear\n\n` +
      `${bot.prefix}automarket ${bot.subprefix}all\n > Processes all your queries immediately and return the results.`,
      aliases: ["am"],
      category: "Nova",
      subCommands: ["list", "clear", "remove", "session", "all"],
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

    const list = await this.bot.scheduler.list({
      command: MARKET,
      owner: message.author.id,
    });

    if (list.length === 500) {
      await message.channel.send(`You cannot have more than 500 queries. Please delete an existing one.`);
      return;
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
    const datatable = await Nova.getNewMarketData(args[0]);
    args = args ? args : [];
    
    // insert into scheduler
    // restore the argument to what it would have looked like
    // if it was ran normally
    const result = await this.bot.scheduler.insert({
      channelid: message.channel.id,
      command: MARKET,
      owner: message.author.id,
      itemid: datatable.table.id,
      name: datatable.name,
      result: "",
      args: `${JSON.stringify(args)}`,
      creationDateTime: new Date().toISOString(),
    });

    Logger.log(JSON.stringify(result.ops));

    if (result.result.ok) {
      Logger.log("Successfully queued!");
      const reply = `Automarket queued for ${datatable.table.id} - ${datatable.name} with the following filters: ${args.slice(1).join(",")}`;
      await message.channel.send(reply);
      return reply;
    }
    await message.channel.send(`Failed to add automarket. Please contact developer.`);
  }

  // clearing messages
  async clear(message, args) {
    Logger.log(`Clearing automarket...`);
    const result = await this.bot.scheduler.clear({
      command: MARKET,
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
  async list(message, args, filterids = []) {

    const page = !args.length ? 0 
      : !parseInt(args[0]) ? 0
      : parseInt(args[0]);

    Logger.log(`Listing automarket for ${message.author.username}(${message.author.id}) on page ${page}`);
    const list = await this.bot.scheduler.list({
      command: MARKET,
      owner: message.author.id,
    });

    if (!list.length && !filterids.length) {
      await message.channel.send(`You have no automarkets.`);
      return;
    }

    list.forEach(item => {
      item.result = undefined;
      //Logger.log(JSON.stringify(item));
    });

    const header = {
      id: "#",
      itemid: "Id",
      name: "Item",
      args: "Properties", 
    };

    const displayList = list.map((row, index) => {
      //console.log(row);

      if (filterids.length > 0 && !filterids.includes(row._id.toString())) {
        return undefined;
      }

      const args = JSON.parse(row.args).slice(1); // remove first item as that is the item id
      const rowargs = getFilters(args);

      const price = rowargs.PRICE ? `${rowargs.PRICE.toLocaleString()}z` : "";
      const refine = rowargs.REFINE ? `+${rowargs.REFINE}` : "";
      const addprops = rowargs.ADDPROPS ? rowargs.ADDPROPS.join(", ") : "";

      const propsarr = [price, refine, addprops];
      const props = propsarr.filter(arr => arr != "");
      row.id = (index + 1).toString(); 
      row.args = props.join(", ");
      return row;
    });
     
    const dt = new DataTable({
      header: header,
      contents: displayList.filter(entry => entry),
    }); 

    const { reply } = PrettyPrinter.tabulate({
      table: dt, 
      name: null,
      suppressEntryText: filterids.length ? true : false,
      page: page,
    });

    Logger.log(reply);

    if (filterids.length === 0) {
      await message.channel.send(`Automarket for ${message.author.toString()}\n${reply}`);
    }
    return reply;
  }

  async remove(message, args) {
   
    if (!args.length) {
      const reply = "Please specify an automarket id or item id to remove it.";
      await message.channel.send(reply);
      return reply;
    }
    const ids = args.map(arg => parseInt(arg));
    Logger.log(`Removing automarket entries: ${JSON.stringify(ids)}`);
    
    const list = await this.bot.scheduler.list({
      command: MARKET,
      owner: message.author.id,
    });
    
    //console.log(list);

    // get all ids based on the automarket list
    const removeEntryIds = ids
      .filter(id => id <= list.length)
      .map(id => list[id - 1]._id);
 
    // get all ids based on the item id. The main assumption being item ids start at 501 and no one is going to have 500 queries.
    // it will also check against the automarket id list and remove any duplicates.
    const removeItemIds = ids
      .filter(id => id > 500)
      .map(id => list
        .filter(entry => parseInt(entry.itemid) === id)
        .map(entry => entry._id)
      );
    
    const duplicates = [].concat(...removeItemIds
      .filter(entry => entry.length > 1))
      .map(id => id.toString());

    const removeIds = removeEntryIds
      .concat(...removeItemIds
        .filter(entry => entry.length === 1)
      );

    if (!removeIds.length && !duplicates.length) {
      const reply = "None of the ids are in your automarket. Nothing was removed";
      await message.channel.send(reply);
      return reply;
    }

    const removedReply = await Promise.all(removeIds.map(async (id) => {
      Logger.log(`Attempting to delete automarket with id: ${id}.`);
      const deleteEntryInfo = await this.bot.scheduler.get(id);  
      const args = JSON.parse(deleteEntryInfo.args).slice(1); // remove first item as that is the item id
      const rowargs = getFilters(args);

      const price = rowargs.PRICE ? `${rowargs.PRICE.toLocaleString()}z` : "";
      const refine = rowargs.REFINE ? `+${rowargs.REFINE}` : "";
      const addprops = rowargs.ADDPROPS ? rowargs.ADDPROPS.join(", ") : "";

      const propsarr = [price, refine, addprops];
      const props = propsarr.filter(arr => arr != "");
      deleteEntryInfo.args = props.join(", ");
      const result = await this.bot.scheduler.remove(id);
      Logger.log(result);
      return deleteEntryInfo; 
    }));

    const header = {
      itemid: "Id",
      name: "Item",
      args: "Properties", 
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
      await message.channel.send(`The following automarket were removed from ${message.author.username}'s automarket.${reply}`);
    }
    
    if (duplicates.length) {
      const duplicateList = await this.list(message, args, duplicates);
      await message.channel.send(`The following automarkets for ${message.author.username} could not be deleted due to ambiguity. Please use the automarket list id to delete these.${duplicateList}`);
    }
    return reply; 
  }

  async all(message, args) {
    Logger.log(`Getting all for ${message.author.username}...`);

    const list = await this.bot.scheduler.processAutomarkets(message.author.id);

    if (!list) {
      await message.channel.send(`You have no automarkets`);
      return;
    }

    //console.log(list);
    const resultList = list.filter(entry => entry.result);

    if (!resultList) {
      await message.channel.send(`No automarkets with relevant results.`);
      return;
    }

    let curMsg = `${message.author.toString()}`;
    const printList = [];
    
    for (let i = 0; i < resultList.length; i++) {
  
      if ((curMsg + resultList[i].reply).length > 2000) {
        printList.push(curMsg);
        curMsg = resultList[i].reply;
      } else {
        curMsg += resultList[i].reply;
      }
  
      if (i === resultList.length - 1) {
        printList.push(curMsg);
      }
    }
    //console.log(printList);
    printList.forEach(async (sendMsg) => {
      await message.channel.send(`${sendMsg}`);
    });

  }

  async session(message, args) {
      if (!args.length) {
        message.channel.send(`Please include a captcha key.`);
        return;
      }

      const captcha = args[0];
      Logger.log(`captcha: ${captcha}`);
      const loginResult = await Scraper.login(captcha);
      if (!loginResult) {
        message.channel.send(`The captcha key did not work! Try again!`);
        return;
      }

      //Scraper.session = session;
      message.channel.send(`Session has been set!`);
      //await this.bot.scheduler.processQueues();
  }

}
