import Logger from '../utils/logger';
import Nova, { MarketErrors } from '../utils/nvro';
import PrettyPrinter from '../utils/prettyPrinter';

let couldNotLogin = false;

export default class NvroCommands {
  static bot = null;

  static async getSearch({
  params,
  pagenum,
  callback = null,
  }) {
    Logger.log(`Getting search info: ${params}. Page: ${pagenum}`);
    const search = await Nova.getSearchData(params, pagenum);
    
    if (search.error === MarketErrors.NO_LOGIN) {
      const reply = "Not logged in, can't get results. Devs notified.";
      //const adminChannel = await this.bot.client.channels.fetch(this.bot.admin.channel);
      this.bot.adminChannel.send(`<@${this.bot.admin.id}> Bot is not logged in. Please login!`);
      Logger.warn(reply);
      return {
        result: false,
        reply: reply,
      };
    }

    if (search.error === MarketErrors.NO_PAGE) {
      const reply = "Something went wrong. Try again. Devs notified.";
      //const adminChannel = await this.bot.client.channels.fetch(this.bot.admin.channel);
      this.bot.adminChannel.send(`<@${this.bot.admin.id}> Bot could not get page. Please check!`);
      Logger.warn(reply);
      return {
        result: false,
        reply: reply,
      };
    }

    if (!search.table.length) {
      const reply = 'No results found.';
      Logger.warn(reply);
      return {
        result: false,
        reply: reply, 
      };
    } 

    if (search.table.length === 1) {
      const id = search.table.contents[0].Id;
      Logger.log(`Matches exactly one result. Id: ${id}`);
      return {
        reply: id,
        result: true, 
      };
    }
    const reply = PrettyPrinter.tabulate(search);
    Logger.log(reply);
    return reply;
  }

  static async getItem(itemId) {
    Logger.log(`Getting item info: ${itemId}`);
    const id = parseInt(itemId);
    const table = await Nova.getItemData(id);

    
    if (table.error === MarketErrors.NO_LOGIN) {
      const reply = "Not logged in, can't get results. Devs notified.";
      //const adminChannel = await this.bot.client.channels.fetch(this.bot.admin.channel);
      this.bot.adminChannel.send(`<@${this.bot.admin.id}> Bot is not logged in. Please login!`);
      Logger.warn(reply);
      return {
        result: false,
        reply: reply,
      };
    }

    if (table.error === MarketErrors.NO_PAGE) {
      const reply = "Something went wrong. Try again. Devs notified.";
      //const adminChannel = await this.bot.client.channels.fetch(this.bot.admin.channel);
      this.bot.adminChannel.send(`<@${this.bot.admin.id}> Bot could not get page. Please check!`);
      Logger.warn(reply);
      return {
        result: false,
        reply: reply,
      };
    }

    const reply = PrettyPrinter.itemInfo(table);  
    return reply;
  };

  static async getMarket({
    name,
    id,
    filters,
  }) {
    const {PRICE, ADDPROPS, REFINE } = filters;
    Logger.log(`GETTING ${id.toString().padStart(5, '0')} $: ${PRICE} AP: ${ADDPROPS} RF: ${REFINE}`);
    const table = await Nova.getMarketData(id, filters);

    if (name) {
      table.name = `${id} - ${name}`;
    }
    
    if (table.error === MarketErrors.NO_LOGIN) {
      const reply = `Not Logged in, can't get results. Devs notified.`;
      //const adminChannel = await this.bot.client.channels.fetch(this.bot.admin.channel);
      this.bot.adminChannel.send(`<@${this.bot.admin.id}> Bot is not logged in. Please login!`);
      Logger.warn(reply);
      const result = !couldNotLogin ? 1 : 0;
      return {
        reply: reply,
        result: result,
      };
    }

    if (table.error === MarketErrors.NO_PAGE) {
      const reply = "Something went wrong. Try again. Devs notified.";
      //const adminChannel = await this.bot.client.channels.fetch(this.bot.admin.channel);
      this.bot.adminChannel.send(`<@${this.bot.admin.id}> Bot could not get page. Please check!`);
      Logger.warn(reply);
      return {
        result: false,
        reply: reply,
      };
    }
    
    const reply = PrettyPrinter.tabulate(table);
    return reply;
  };
}