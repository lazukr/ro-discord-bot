import Logger from "../utils/logger";
import Command from "../utils/command";
import Nova, { MARKET_COLUMNS } from "../utils/nvro";
import PrettyPrinter from "../utils/prettyPrinter";
import { getSearch, getMarket } from "../utils/nvrocmd";
import Scraper from "../utils/scraper";

export const MARKETQUEUE = "marketqueue";

const FINDER = Object.freeze({
  REFINE: /^<?\+\d{1,2}$/,
  PAGE: /^p\d{1,2}$/,
  ZENY: /^(\d{1,3}(.\d+)?[kmb]|\d+)$/,
});


export default class NovaMarket extends Command {
  constructor(bot) {
    super(bot, {
      name: "market",
      description: "Gets market information of a particular item directly from Nova RO's website.",
      usage: `${bot.prefix}market <item name | item id> [, <page number>]`,
      aliases: ["ws", "whosells"],
      category: "Nova",
    });
  }

  async run(message, args, params = {
    silent: false,
    name: null,
  }) {

    const { silent, name } = params;
    // reject empty messages
    if (!args.length) {
      const reply = `Please specify the name or id of an item to check market.`; 
      await message.channel.send(reply);
      return "No args";
    }

    if (!Scraper.getPage && !silent) {
      /*
      const result = await this.bot.scheduler.insert({
        channelid: message.channel.id,
        command: MARKETQUEUE,
        owner: message.author.id,
        args: `${JSON.stringify(args)}`,
      });

      if (!result.result.ok) {
        Logger.log(`Unable to insert entry: ${result}`);
      }
      */

      await message.channel.send(`Could not query market as the bot is not logged in. The developer has been notified.`);
      return;
    }

    // transform arguments so that the array is comma separated
    args = args
      .join(" ")
      .split(",")
      .map(arg => arg.trim())
      .filter(arg => arg != "");

    // search
    if (isNaN(args[0])) {
      Logger.log(`First argument is not a number. Assuming name.`);
      const name = args.shift();
      const filters = getFilters(args);
      const { reply, result } = await getSearch({
        params: name,
        pagenum: filters.PAGE,
      });

      const newargs = [reply, ...args].join(', ').split(' ');

      // search returned an id indicating one result.
      if (!isNaN(reply)) {
        return this.run(message, newargs); 
      }
      
      await message.channel.send(reply);
      return reply;
    }

    // valid id. Search for it in the market.

    const id = args.shift(); 
    const filters = getFilters(args);
    const { reply, result } = await getMarket({
      name: name,
      id: id,
      filters: filters,
    });

    if (!silent) {
      await message.channel.send(`${message.author.toString()}${reply}`);
    }
    
    //Logger.log(reply);
    return {
      reply: reply,
      result: result,
    };
  }
}

function find(args, type) {
  return args.find(arg => {
    const match = arg.match(type);
    if (match) {
      args = args.filter(arg => arg != match);
    }
    return match;
  });
}

function filterArgs(args, filter) {
  if (filter) {
    return args.filter(arg => arg != filter);
  }
  return args;
}

export function getFilters(args) {
  const refine = find(args, FINDER.REFINE);
  const page = find(args, FINDER.PAGE);
  const zeny = find(args, FINDER.ZENY);
  
  args = filterArgs(args, refine);
  args = filterArgs(args, page);
  args = filterArgs(args, zeny); 

  const price = zeny ? 
    parseFloat(zeny) * (zeny.includes("k") ?
      1000 : zeny.includes("m") ?
      1000000 : zeny.includes("b") ?
      1000000000 : 1) : undefined;
  
  // cloning the market filters and setting it all to null
  const filters = {...MARKET_COLUMNS};
  Object.keys(filters).map(key => {
    filters[key] = null;
  });

  filters.REFINE = parseInt(refine);
  filters.PAGE = page ? parseInt(page.slice(1)) : 1;
  filters.PRICE = parseInt(price);
  filters.ADDPROPS = args.length ? args : null;
  return filters;
}

