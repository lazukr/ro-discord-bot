import Logger from '../utils/logger';
import Nova, { MarketErrors } from '../utils/nvro';
import PrettyPrinter from '../utils/prettyPrinter';

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
  id,
  filters,
}) {
  Logger.log(`Getting market info on item: ${id}. With filters: ${JSON.stringify(filters)}`);
  const table = await Nova.getMarketData(id, filters);
  
  if (table.error === MarketErrors.NO_LOGIN) {
    const reply = `\nBot was unable to login to Nova. Please contact Developer.`;
    return {
      reply: reply,
      result: 1,
    };
  }
    
  const reply = PrettyPrinter.tabulate(table);
  return reply;
};
