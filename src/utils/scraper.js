const rp = require('request-promise').defaults({jar: true});
import cheerio from 'cheerio';
import Logger from './logger';
import config from '../../config.json';

export const TABLE_TYPE = Object.freeze({
  DEFAULT: 0,
  MARKET: 1,
  DIVINE: 2,
  DESCRIPTION: 3,
  VEND: 4,
});

// this function handles getting pages from websites.

export default class Scraper {
  static async login() {
    const options = {
      method: 'POST',
      uri: 'https://www.novaragnarok.com',
      qs: {
        module: 'account',
        action: 'login',
      },
      form: {
        server: 'NovaRO',
        ...config.novaCredentials,
      },
      followAllRedirects: true,  
    }
    
    return rp(options)
      .then(res => {
        Logger.log('Nova login successful!');
      })
      .catch(err => {
        Logger.err(`Nova login failed! ${err}`);
      });
  }

  static async getPage(uri, qs = {}) {
    const options = {
      method: 'GET',
      uri: uri,
      qs: qs,
      transform: (body) => {
        return cheerio.load(body);
      },
    };

    try {
      return await rp(options);
    } catch (e) {
      Logger.error(`An error occurred while making a page request: ${e}`);
    }
  }
  
  static getElement({
    page,
    selector,
    index = null,
  }) {
    if (index !== null) {
      return page(selector).get(index) || null;
    }
    return page(selector) || null;
  }

  static getTableContent({
    page,
    table,
    type = TABLE_TYPE.DEFAULT,
  }) {

    const rows = page(table).find('tr');
    const header = {};
    page(rows).find('th').each((i, elem) => {
      const text = page(elem).text().trim();
      header[text] = text;
    });
    const contents =  page(rows).find('td').toArray();
    
    return tableToJSON({
      page: page,
      header: header,
      rows: contents,
      type: type,
    });
  
  }  
}

function tableToJSON({
  page,
  header,
  rows,
  type,
}) {
  // gets the keys
  const keys = Object.keys(header);

  // since the rows contain all the data
  // we need to reduce it in such a way that each row
  // contains the proper data according to the keys
  // thus we just slice array every n times (key.length)
  // and push that into the accumulator

  const rowsReducer = rows.reduce((acc, cur, idx, arr) => {
    if (idx % keys.length === 0) {
      acc.push(arr.slice(idx, idx + keys.length));
    };
    return acc;
  }, []);

  // now that the rows are proper
  // we can map them to an object entry
  const contents = rowsReducer.map(content => {
    return rowToJSON({
      page: page,
      header: header,
      rows: content,
      keys: keys,
      type: type,
    });
  });

  return {
    header: type === TABLE_TYPE.DIVINE ? { 'Id': "Id", ...header } : header,
    contents: contents,
  };
}

function rowToJSON({
  page,
  header,
  rows,
  keys,
  type,
}) {
  return rows.reduce((acc, cur, idx) => {
    // market item case
    if (type === TABLE_TYPE.MARKET &&
        header[keys[idx]] === "Item") {
      const tooltip = page(cur)
        .find('img')
        .data('tooltipContent');
      const name = page(tooltip)
        .find('div.item-name')
        .text()
        .trim();
      const itemID = tooltip.match(/d+/g)[0];
      acc[header[keys[idx]]] = `${itemID} - ${name}`;
    } 
    
    // description case
    else if (type === TABLE_TYPE.DESCRIPTION) {
      acc[header[keys[idx]]] = page(cur)
        .text()
        .trim();
    }
    
    // divine case
    else if (type === TABLE_TYPE.DIVINE &&
              header[keys[idx]] === "Name") {
      const id = page(cur)
        .find('a')
        .attr('href')
        .match(/\d{3,}/g)[0];
      acc.Id = id;
      acc[header[keys[idx]]] = page(cur)
        .text()
        .trim();
    }

    // default
    else {
      acc[header[keys[idx]]] = page(cur)
        .text()
        .trim()
        .split("\n")[0];
    }
    return acc;
  }, {});
}

