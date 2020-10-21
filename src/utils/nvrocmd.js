import Logger from '../utils/logger';
import Nova, { MarketErrors } from '../utils/nvro';
import PrettyPrinter from '../utils/prettyPrinter';
import { Collection } from 'discord.js';

let couldNotLogin = false;


export async function getSearch({
  params,
  pagenum,
  callback = null,
}) {
  Logger.log(`Getting search info: ${params}. Page: ${pagenum}`);
  const search = await Nova.getSearchData(params, pagenum);
  
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

export async function getItem(itemId) {
  Logger.log(`Getting item info: ${itemId}`);
  const id = parseInt(itemId);
  const table = await Nova.getItemData(id);
  const reply = PrettyPrinter.itemInfo(table);  
  return reply;
};

export async function getMarket({
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
    const reply = `\nBot was unable to login to Nova. A separate message was sent to them and they will fix the issue ASAP.`;
    Logger.log('Could not log in');
    const result = !couldNotLogin ? 1 : 0;
    
    return {
      reply: reply,
      result: result,
    };
  }
  
  const reply = PrettyPrinter.tabulate(table);
  return reply;
};
