const logger = require('logger.js')("Nova Command module: item");
const rp = require('request-promise');
const cheerio = require('cheerio');

// variables
const market_link = 'https://www.novaragnarok.com';
const itemdb_link = 'https://www.divine-pride.net/database/item';
const abbrvObj = {
  "Additional Properties": "+Props",
  "Refine": "Rfn",
};
const QTY = 'Qty';
const ITEM = 'Item';
const MSG_LIM = 2000;


async function getMarket(url, id) {
  const options = {
    method: 'GET',
    uri:    url,
    qs: {
      "module": "vending",
      "action": "item",
      "id": `${id}`,
    },
    resolveWithFullResponse: true,
    transform: function(body) {
      return cheerio.load(body);
    },
  };

  return rp(options)
    .then($ => {
      return $;
    })
    .catch(error => {
      logger.error(`An error has occurred on request. ${error}`);
    });
};

function selectRowContent($, table, type) {
  const elements = [];
  $(table).find(`tr ${type}`).each((i, elem) => {
    let element = $(elem).text().trim();
    if (element == "") {
      element = $(elem).find('img').attr('src').match(/\d{3,}/)[0];
    }
    elements.push(element);
  });
  return elements;
}

function getMarketTable($) {
  const table = $('#itemtable').get(0);
  const headers = selectRowContent($, table, 'th');
  const contents = selectRowContent($, table, 'td');
  const arrayContents = contents.reduce((rows, key, index) => (index % headers.length == 0 ? rows.push([key]) 
    : rows[rows.length-1].push(key)) && rows, []);
  return tableJoin(headers, arrayContents);
}

function getItemNameFromId($) {
  const header = $('h2').get(0);
  return $(header).find('a').text().trim();
}

function tableJoin(headers, contents) {
  const tableArray = headers.map((header, i) => {
    const entry = {};
    entry[header] = contents.map((val, indx) => (val[i]));
    return entry;
  });

  return tableArray.reduce((obj, header) => {
    obj[Object.keys(header)[0]] = header[Object.keys(header)[0]];
    return obj;
  }, {});
}

function getItemDescription($) {
  const tooltip = $('#tooltip_content').find('div').get(1);
  return $(tooltip).text().trim();
}

function abbreviateKeys(object, abbrvObj) {
  keys = Object.keys(object);
  const result = keys.reduce((acc, key) => {
    const content = object[key];
    if (!!abbrvObj[key]) {
      key = abbrvObj[key];
    }
    acc[key] = content;
    return acc;
  }, {});
  return result; 
}

function priceComparator(a, b, index) {
  return parseInt(a.split("|")[index].replace(/,/g, '')) - parseInt(b.split("|")[index].replace(/,/g, ''));
}

exports.run = async (discordBot, message, args) => {
  
  // no input
  if (args.length === 0) {
    message.channel.send("Need to specify an id.");
    return;
  }

  const itemId = parseInt(args);

  // not positive integer case
  if (isNaN(itemId) || itemId < 1) {
    message.channel.send("Id needs to be a positive integer.");
    return;
  }
 
  logger.info(itemId);
  
  // grab some information from the page itself
  const $ = await getMarket(market_link, itemId);  
  const vendInitial = getMarketTable($);
  const itemDescription = getItemDescription($); 
  
  // base reply template
  const embedReply = {
    "embed": {
      "color": vendInitial ? 4886754 : 13632027,
      "title": `${getItemNameFromId($)} - ${itemId}`,
      "url": `${itemdb_link}/${itemId}`,
      "thumbnail": {
        "url": `${market_link}/data/items/images2/${itemId}.png`,
      },
      "timestamp": `${new Date(Date.now()).toISOString()}`,
      "author": {
        "icon_url": `https://www.novaragnarok.com/forum/uploads/monthly_2016_09/avatar.png.dc23ee19b4a3fbd4cee885fb11d5d508.png`,
        "name": "Nova Marketplace",
        "url": `${market_link}/?module=vending&action=item&id=${itemId}`,
      },
      "description": getItemDescription($),
    }
  }

  // no result case
  if (!vendInitial || Object.keys(vendInitial).length == 0) {
    message.channel.send(embedReply);
    message.channel.send("\`\`\`:( No Items Founds.\`\`\`");
    return; 
  }

  // here on after indicates there was some sort of result
  
  // abbreviate headers to save space 
  const vend = abbreviateKeys(vendInitial, abbrvObj);

  // grab the keys
  const vendKeys = Object.keys(vend);

  // if there is quantity column, get rid of the ea. after the values 
  if (!!vend[QTY]) {
    vend[QTY] = vend[QTY].map(el => el.split(" ")[0]);
  }

  // determine maximum length of each row by value
  const maxItemLengthInRow = vendKeys.map(key => {
    return Math.max(...(vend[key].map(el => el.length)));
  });

  // match header to same size
  const vendFormattedTableHeader = vendKeys.map((el, indx) => {
    return el.padEnd(maxItemLengthInRow[indx]);
  });

  // create separator to match length
  const vendSeparator = vendFormattedTableHeader.map(el => {
    return '-'.repeat(el.length);
  });

  // create the table
  let vendFormattedTable = ``;

  // Location always exists, so we use it to iterate through the array
  // - grabs each row and pad them against max of each row and header
  // - accumulate it into a giant string
  for (i = 0; i < vend.Location.length; i++) {
    const vendRow = vendKeys.map(key => {
      return vend[key][i];
    });
    
    const vendPaddedRows = vendRow.map((el, indx) => {
      const paddedElem = el.padEnd(maxItemLengthInRow[indx]);
      return paddedElem.padEnd(vendKeys[indx].length);
    });
    vendFormattedTable += `${vendPaddedRows.join(' | ')}\n`;
  }  

  // parse table into rows so we can rebuild it if necessary if message is too long
  // pop the last element since that is always a blank entry due to the extra \n on last join
  const parsedTable = vendFormattedTable.split(/\r?\n/);
  parsedTable.pop();

  // sort the table by price. 
  // We are grabbing each row, splitting it and since the first row is usually the price, we sort by that
  // However, if there is an item column, it goes before the price, so we take into account that as well
  parsedTable.sort((a, b) => {
    if (!!vend[ITEM]) {
      return priceComparator(a, b, 1);
    }
    return priceComparator(a, b, 0);
  });

  // add the header and separator to our array
  parsedTable.unshift(`${vendFormattedTableHeader.join(' | ')}`, `${vendSeparator.join('-+-')}`);

  // get info on row lengths and number of row to help calculate the number of rows per message (if applicable) to send off in one message 
  const rowLength = parsedTable[0].length;
  const numOfRows = parsedTable.length;

  // when total message is less than 2000 characters, we can send it in one message
  if (rowLength * numOfRows < MSG_LIM) {
    message.channel.send(embedReply);
    message.channel.send(`\`\`\`${parsedTable.join("\n")}\`\`\``);
    return;
  }
 
  // calculates the threshold 
  const thresholdCount = MSG_LIM / rowLength;
  
  // create a multi message that takes in the number of rows dictated by the threshold
  let multiMsg = [];
  while(parsedTable.length) {
    multiMsg.push(parsedTable.splice(0, thresholdCount));
  }
  
  // sends each message
  message.channel.send(embedReply);
  multiMsg.forEach(msg => {
    message.channel.send(`\`\`\`${msg.join("\n")}\`\`\``);
  }); 
};


exports.info = {
  name: "market",
  category: "Nova",
  description: "idk yet",
  usage: "@market <item_ID>",
};

exports.getMarketTable = getMarketTable;
