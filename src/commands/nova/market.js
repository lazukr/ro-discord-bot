const logger = require('logger.js')("Nova Command module: item");
const rp = require('request-promise');
const cheerio = require('cheerio');
const nvro = require('nova-market-commons');

// constants
const QTY = 'Qty';
const PRICE = 'Price';
const MSG_LIM = 2000;
const HIGHLIGHT = 'JSON';

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

  // get market data
  const marketData = await nvro.getLiveMarketData(itemId);

  if (!marketData.table) {
    message.channel.send(`\`\`\`${HIGHLIGHT}\n${marketData.name}\n\nNo Results Found :(\`\`\``);
    return;
  }

  if (marketData.header[QTY]) {
    marketData.table = getStringIntsInCol(marketData.table, QTY);
  }

  marketData.table = getStringIntsInCol(marketData.table, PRICE);
  marketData.table.unshift(marketData.header);
  formattedTable = formatTable(marketData.header, marketData.table);

  const rowLength = formattedTable[0].length + 1;
  const numRows = formattedTable.length;

  console.log(formattedTable);

  // numRows + 1 to accomodate the name
  // name will probably be never as long as a row
  if (rowLength * (numRows + 1) < MSG_LIM) {
    message.channel.send(`\`\`\`${HIGHLIGHT}\n${marketData.name}\n\n${formattedTable.join("\n")}\`\`\``);
    return;
  }

  const threshold = MSG_LIM / rowLength;

  const multiMessage = [];

  // first message needs to take account space for the name
  const firstMsg = formattedTable.splice(0, threshold - 1);
  while(formattedTable.length) {
    multiMessage.push(formattedTable.splice(0, threshold));
  }

  message.channel.send(`\`\`\`${HIGHLIGHT}\n${marketData.name}\n\n${firstMsg.join("\n")}\`\`\``);
  multiMessage.forEach(msg => {
    message.channel.send(`\`\`\`${HIGHLIGHT}\n${msg.join("\n")}\`\`\``);
  });
};

// joins every item in the row into one string
function stringifyTable(table) {
  return table.map(row => {
    return Object.values(row).join(' | ');
  }); 
}

// creates a separator to divide the header from
// the actual table content
function getTableSeparator(headerList, padValues) {
  return headerList.reduce((result, value) => {
    result[value] = '-'.repeat(padValues[value]);
    return result;
  }, {});
}

// converts integer columns back to strings
// inserts the commas (,) for thousands separating
function getStringIntsInCol(array, col) {
  return array.map(row => {
    row[col] = row[col].toLocaleString();
    return row;
  });
}

// formats the table to be in a printable form
function formatTable(header, table) {
  const headerList = Object.keys(header);
  const tablePadValues = getDictOfMaxStrInCols(headerList, table);
  const tableSeparator = getTableSeparator(headerList, tablePadValues);
  
  // inserts the header / table separator 
  table.splice(1, 0, tableSeparator);
  const paddedTable = table.map(row => {
    return headerList.reduce((result, value) => {
      result[value] = row[value].padEnd(tablePadValues[value]);
      return result; 
    }, {});  
  });
  return stringifyTable(paddedTable);
}

// gets max string length in each column
// returns as dictionary
function getDictOfMaxStrInCols(headerList, table) {
  return headerList.reduce((result, value) => {
    result[value] = Math.max(...(table.map(col => {
      return col[value].length;
    })));
    return result; 
  }, {});
}


exports.info = {
  name: "market",
  category: "Nova",
  description: "idk yet",
  usage: "@market <item_ID>",
};
