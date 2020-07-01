const rp = require('request-promise').defaults({jar: true});
import cheerio from 'cheerio';
import Logger from './logger';
import config from '../../config.json';
import sessionConfig from '../../session.json';
import fs from 'fs';
import Scheduler from './scheduler';
import hooman from 'hooman';

export const TABLE_TYPE = Object.freeze({
  DEFAULT: 0,
  MARKET: 1,
  DIVINE: 2,
  DESCRIPTION: 3,
  VEND: 4,
});
const LOGIN_BUTTON = 'input[type=submit]';
const LINK = 'https://novaragnarok.com';
// this function handles getting pages from websites.

export default class Scraper {
  static notLoggedInReply = `Bot is not logged in and could not add the automarket. This will be added automatically when the bot is logged in.`;
  static notified = false;
  static cookie = '';
  static bot = null;

  static async hit(link) {
    try {
      const { body, request } = await hooman.get(link);
      return request.options.headers.cookie;
    } catch (e) {
      const adminChannel = this.bot.client.channels.get(this.bot.admin.channel);
      Logger.error(e);
      adminChannel.send(`<@${this.bot.admin.id}> Bot could not hit page: ${link}. Error message ${e}. Please check!`);
    }
  }
  

  static async login(captcha = null) {
    const loginCookie = await this.hit(LINK);

    if (!loginCookie) {
      return;
    }

    const options = {
      searchParams: {
        module: 'account',
        action: 'login',
      },
      form: {
        server: 'NovaRO',
        ...config.novaCredentials,
        'g-recaptcha-response': captcha,
      },
      headers: {
        Cookie: loginCookie,
      }
    };

    try {
      const response = await hooman.post(LINK, options);
      const $ = cheerio.load(response.body);
      try {
        const loginBtn = Scraper.getElement({
          page: $,
          selector: LOGIN_BUTTON,
          index: 1,
        }).attribs.value;

        if (loginBtn) {
          Logger.log('Nova login unsuccessful.');
          if (!Scraper.notified) {
            const adminChannel = this.bot.client.channels.get(this.bot.admin.channel);
            adminChannel.send(`<@${this.bot.admin.id}> Bot could not login. Please set session!`);
            Scraper.notified = true;
          }
          return 0;
        }
      } catch {
        Scraper.notified = false;
        if (!captcha) {
          return 1;
        }
        sessionConfig.cookie = response.request.options.headers.cookie;
        Scraper.cookie = sessionConfig.cookie;
        fs.writeFileSync('session.json', JSON.stringify(sessionConfig));
        this.bot.scheduler.processQueues();
        return 1;
      }
    } catch (err) {
      if (!Scraper.notified) {
        const adminChannel = this.bot.client.channels.get(this.bot.admin.channel);
        adminChannel.send(`<@${this.bot.admin.id}> Something was wrong with the login process. Please check! ${err}`);
        Scraper.notified = true;
      }
      return 0;
    }



    /*
    return rp(options)
      .then($ => {
        try {
          const loginBtn = Scraper.getElement({
            page: $,
            selector: LOGIN_BUTTON,
            index: 1,
          }).attribs.value; 
          if (loginBtn) {
            Logger.log('Nova login unsuccessful');
            if (!Scraper.notified) {
              const adminChannel = this.bot.client.channels.get(this.bot.admin.channel);
              adminChannel.send(`<@${this.bot.admin.id}> Bot could not login. Please set session!`);
              Scraper.notified = true;
            }
            return 0;
          }
        } catch {
          //Logger.log('Nova login successful!');
          Scraper.notified = false;
          if (!session) {
            return 1;
          }
          sessionConfig.session = session;
          Scraper.session = session;
          fs.writeFileSync('session.json', JSON.stringify(sessionConfig));
          this.bot.scheduler.processQueues();
          return 1;
        }
      })
      .catch(err => {
        Logger.error(`Nova login failed! ${err}`);
        if (!Scraper.notified) {
          const adminChannel = this.bot.client.channels.get(this.bot.admin.channel);
          adminChannel.send(`<@${this.bot.admin.id}> Something was wrong with the login process. Please check! ${err.statusCode}: ${message}`);
          Scraper.notified = true;
        }
        return 0;
      });



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
      headers: {
        Cookie: `fluxSessionData=${session ? session : Scraper.session}`,
      },
      transform: (body, response) => {
        return cheerio.load(body);
      },
    }
      */
  }

  static async getPage(uri, qs = {}) {

    const options = {
      searchParams: qs,
      headers: {
        cookie: Scraper.cookie,
      },
    };

    try {
      const response = await hooman.get(uri, options);
      return cheerio.load(response.body);
    } catch (error) {
      Logger.error(`An error occurred while making a page request: ${e}`);
    }


    /*
    const options = {
      method: 'GET',
      uri: uri,
      qs: qs,
      transform: (body, response) => {
        //console.log(response.headers);
        return cheerio.load(body);
      },
      headers: {
        Cookie: `fluxSessionData=${Scraper.session}`,
      }
    };

    try {
      return await rp(options);
    } catch (e) {
      Logger.error(`An error occurred while making a page request: ${e}`);
    }
    */
  }
  
  static getElement({
    page,
    selector,
    index = null,
  }) {
    if (!page) {
      return null;
    }

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

  static async getDadJoke() {
    const options = {
      method: 'GET',
      uri: 'https://icanhazdadjoke.com/',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'request (https://github.com/lazukr/ro-discord-bot)',
      },
      transform: (body) => {
        return JSON.parse(body);
      }
    };
  
    return rp(options)
      .then(res => {
        return res;
      })
      .catch(err => {
        logger.error(`An error has occurred on ${DADJOKE_URI}: ${err}`);
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

