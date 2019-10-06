import Logger from './logger';
import Scraper, { TABLE_TYPE } from './scraper';
import DataTable, { MarketDataTable } from './datatable';

// this file should contain all the tools needed to handle processing the data from websites.

const URL = 'https://www.novaragnarok.com';
const ITEM_SEARCH_TABLE = '#itemtable';
const ITEM_DATA_TABLE = '.vertical-table';
const LOGIN_BUTTON = 'input[type=submit]';

export const MARKET_COLUMNS = Object.freeze({
  QUANTITY: "Qty",
  ITEM: "Item",
  PRICE: "Price",
  ADDPROPS: "Additional Properties",
  REFINE: "Refine",
  LOCATION: "Location",
});

export const MarketErrors = Object.freeze({
  NO_ERRORS: 0,
  NO_RESULT: 1,
  NO_LOGIN: 2,
});


export default class NovaROUtils {
  static async getSearchData(name, pagenum) {
    const qs = {
      module: "item",
      action: "index",
      name: name,
    };

    const page = await Scraper.getPage(URL, qs);
    const search = Scraper.getElement({
      page: page,
      selector: ITEM_SEARCH_TABLE,
      index: 0,
    });
    
    const table = Scraper.getTableContent({
      page: page,
      table: search,
      type: TABLE_TYPE.MARKET,
    });

    const dt = new DataTable(table);

    return {
      table: dt,
      name: `Results for '${name}'`,
      page: pagenum,
    }; 
  }

  static async getItemData(id) {
    
    // query string
    const qs = {
      module: "vending",
      action: "view",
      id: id,
    };
    
    // get html page
    const page = await Scraper.getPage(URL, qs);
    
    // get tables
    const tables = Scraper.getElement({
      page: page,
      selector: ITEM_DATA_TABLE,
    });

    // differentiate tables
    const { info, preview, description, drops } = getItemTables(tables);
    
    // removes image tr
    page(info).children().first().children().first().remove();

    // removes last tr from item drops
    page(drops).children().first().children().last().remove();

    page(drops).find('th').each((i, drop) => {
      drop.tagName = 'td';
    });   

    // insert a title for the drops table
    const dropTitle = "<tr><th>Id</th><th>Name</th><th>Drop Rate</th></tr>";
    page(drops).children().first().children().first().replaceWith(dropTitle);

    const infoTable = Scraper.getTableContent({
      page: page,
      table: info,
      type: TABLE_TYPE.MARKET,
    });

    const descriptionTable = Scraper.getTableContent({
      page: page,
      table: description,
      type: TABLE_TYPE.DESCRIPTION,
    });

    const dropsTable = Scraper.getTableContent({
      page: page,
      table: drops,
    });
    // grab data tables
    const dtInfo = new DataTable(infoTable);
    const dtDescription = new DataTable(descriptionTable);
    const dtDrops = new DataTable(dropsTable);

    // max fields limit is 25 for discord embeded messages  
    dtDrops.contents = dtDrops.contents.slice(0, 25);

    return {
      info: dtInfo.contents[0],
      description: dtDescription.contents[0]["Item Description"],
      drops: dtDrops.contents,
      icon: `${URL}/data/items/icons2/${id}.png`,
      image: `${URL}/data/items/images2/${id}.png`,
      url: `${URL}/?module=vending&action=view&id=${id}`,
      preview: preview ? page(preview).find('img').eq(1).attr('src') : null,  
    };
  }

  static async getMarketData(id, filters = {}, login = 0) {
    const qs = {
      module: "vending",
      action: "item",
      id: id,
    };

    const page = await Scraper.getPage(URL, qs);

    const loginBtn = Scraper.getElement({
      page: page,
      selector: LOGIN_BUTTON,
      index: 1,
    }).attribs.value; 
   
    if (loginBtn === "Log In" && login) {
      // alreadgy tried logging in but it didn't work.
      return {
        error: MarketErrors.NO_LOGIN,
      }
    }

    if (loginBtn === "Log In" && !login) {
      // we need to log in.
      await Scraper.login();
      return await NovaROUtils.getMarketData(id, filters, 1);
    }

    const market = Scraper.getElement({
      page: page,
      selector: ITEM_SEARCH_TABLE,
      index: 0,
    });

    const table = Scraper.getTableContent({
      page: page,
      table: market,
      type: TABLE_TYPE.MARKET,
    }); 

    const dt = new MarketDataTable({
      page: page,
      id: id,
      filters: filters,
      header: table.header,
      contents: table.contents,
    });

    const name = Scraper.getElement({
      page: page,
      selector: 'h2',
      index: 0,
    });

    return {
      table: dt,
      name: page(name).find('a').text().trim(),
      page: filters.PAGE,
      filters: filters, 
      error: MarketErrors.NO_ERRORS,
    };
  }
}

function getItemTables(tables) {
  if (tables.length === 3) {
    const [info, description, drops] = tables.toArray();
    return {
      info: info,
      description: description,
      drops: drops,
    };
  }
 
  // if there's 4 then we have a preview involved
  if (tables.length === 4) {
    const [info, preview, description, drops] = tables.toArray();
    return {
      info: info,
      preview: preview,
      description: description,
      drops: drops,
    };
  } 
}
