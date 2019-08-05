import Logger from '../utils/logger';
import Nova from '../utils/nvro';
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
    return reply;
  } 

  if (search.table.length === 1) {
    const id = search.table.contents[0].Id;
    Logger.log(`Matches exactly one result. Id: ${id}`);
    return id;
  }

  const reply = PrettyPrinter.tabulate(search);
  Logger.log(reply);
  return reply;
}

export async function getItem(itemId) {
  Logger.log(`Getting item info: ${itemId}`);
  const id = parseInt(itemId);
  const result = await Nova.getItemData(id);
  const reply = PrettyPrinter.itemInfo(result);  
  return reply;
};

export async function getMarket({
  id,
  filters,
}) {
  Logger.log(`Getting market info on item: ${id}. With filters: ${JSON.stringify(filters)}`);
  const result = await Nova.getMarketData(id, filters);
  const reply = PrettyPrinter.tabulate(result);
  return reply;
};
