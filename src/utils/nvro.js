import Logger from './logger';
import Scraper, { TABLE_TYPE } from './scraper';
import DataTable, { MarketDataTable } from './datatable';
import cheerio from 'cheerio';
import nodeStorage from 'node-persist';

// this file should contain all the tools needed to handle processing the data from websites.

const URL = 'https://www.novaragnarok.com';
const ITEM_SEARCH_TABLE = '#itemtable';
const ITEM_DATA_TABLE = '.vertical-table';
const LOGIN_BUTTON = 'input[type=submit]';
const itemStorage = nodeStorage.create();
itemStorage.init({
  dir: 'data/items',
});

export const MARKET_COLUMNS = Object.freeze({
  QUANTITY: "qty",
  ITEM: "item",
  PRICE: "price",
  ADDPROPS: "property",
  REFINE: "refine",
  LOCATION: "location",
});

const SORT_ORDER = [
  'item',
  'price',
  'qty',
  'refine',
  'property',
  'location',
];

export const MarketErrors = Object.freeze({
  NO_ERRORS: 0,
  NO_RESULT: 1,
  NO_LOGIN: 2,
  NO_PAGE: 3,
});

export default class NovaROUtils {
  static async getSearchData(name, pagenum) {
    const qs = {
      module: "item",
      action: "index",
      name: name,
    };

    if (!Scraper.getPage) {
      await Scraper.login("");
      /*
      return {
        error: MarketErrors.NO_LOGIN,
      }
      */
    }

    const page = await Scraper.getPage(URL, qs);
    
    if (!page) {
      return {
        error: MarketErrors.NO_PAGE,
      };
    }

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
    
    if (!Scraper.getPage) {
      await Scraper.login("");
      /*
      return {
        error: MarketErrors.NO_LOGIN,
      }
      */
    }

    // get html page
    const page = await Scraper.getPage(URL, qs);

    if (!page) {
      return {
        error: MarketErrors.NO_PAGE,
      };
    }
    
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

  static async getNewMarketData(id, filters = {}) {
    const data = await Scraper.getItemJSONData(id);
    const name = await NovaROUtils.getItemName(id);

    if (data.length === 0) {

      const dt = new MarketDataTable({
        page: null,
        id: id,
        filters: filters,
        header: {},
        contents: [],
      });

      return {
        table: dt,
        name: name,
        page: filters.PAGE,
        filters: filters, 
        error: MarketErrors.NO_RESULT,
      };
    }

    const items = data.map(i => i.items);
    const orders = data.map(i => i.orders);
    const itemHeaders = Object.getOwnPropertyNames(items[0]);
    const orderHeaders = Object.getOwnPropertyNames(orders[0]);
    const afterPropertyResults = orderHeaders.includes('property') ?
      orders.map((item, index) => {
        const property = items[index].property;
        item.property = cheerio(property).text().trim();
        return item;
      }) :
      orders;

    const afterItemResults = itemHeaders.includes('item') ?
      await Promise.all(afterPropertyResults.map(async (item, index) => {
        const id = cheerio(items[index].item).find('img')
        .attr('src')
        .match(/\d+.(?=.png)/)[0];
        const name = await NovaROUtils.getItemName(parseInt(id));
        item.item = `${id} - ${name}`;
        return item;
      })) : 
      afterPropertyResults;

    const afterRefineResults = itemHeaders.includes('refine') ?
      afterItemResults :
      afterItemResults.map(item => {
        delete item.refine;
        return item;
      });    

    const results = afterRefineResults;
    const headers = Object.getOwnPropertyNames(results[0]).sort((a, b) => {
      return SORT_ORDER.indexOf(a) - SORT_ORDER.indexOf(b);
    }).reduce((acc, cur) => {
        acc[cur] = cur;
        return acc;
        }, {});
      
    const dt = new MarketDataTable({
      page: null,
      id: id,
      filters: filters,
      header: headers,
      contents: results,
    });

    //console.log(dt);

    return {
      table: dt,
      name: name,
      page: filters.PAGE,
      filters: filters, 
      error: MarketErrors.NO_ERRORS,
    };
  }

  static async getMarketData(id, filters = {}, page) {
    /*
    const qs = {
      module: "vending",
      action: "item",
      id: id,
    };

    if (!Scraper.getPage) {
      return {
        error: MarketErrors.NO_LOGIN,
      };
    }

    const page = await Scraper.getPage(URL, qs);
   

    if (!page) {
      return {
        error: MarketErrors.NO_PAGE,
      };
    }
     */

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

    //console.log(table);

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

  static async getItemName(itemID) {
    const qs = {
      "module": "vending",
      "action": "item",
      "id": itemID,
    };
    let name = '???';
    const storedName = await itemStorage.getItem(`${itemID}`);
    if (!storedName) {
      if (Scraper.getPage) {
        const page = await Scraper.getPage(URL, qs);
        name = Scraper.getElement({
          page: page,
          selector: 'h2',
          index: 0,
        });
        name = page(name).find('a').text().trim();
        if (name) {
          itemStorage.setItem(`${itemID}`, name);
        }
      }
    } else {
      name = storedName;
    }
    return name; 
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
