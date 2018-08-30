const fs = require('fs');
const market = require('nova-market-commons');
const dpapi = require('divine-pride-api');
const config = require('./config.json'); 
const mobTestID = 1002;
const logger = require('logger.js')("Test module: ");
const cheerio = require('cheerio');
const rp = require('request-promise');
const url = 'https://www.novaragnarok.com';

const QTY = 'Qty';
const PRICE = 'Price';
const MSG_LIM = 2000;

const market_qs = {
  "module": "vending",
  "action": "item",
};

//const url = dpapi.getAPILink(dpapi.types.mob.apiName, mobTestID);
//console.log(url + `?apiKey=${config.divinePrideToken}`);

//const result = dpapi.getJSONReply(url, config.divinePrideToken);





//console.log(result);

async function testMarket() {
  const itemID = "22010";
  const result = await market.getLiveMarketData(itemID); 
  if (!result.header) {
    return;
  }

  if (result.header[QTY]) {
    result.table = getStringIntsInCol(result.table, QTY);
  }

  result.table = getStringIntsInCol(result.table, PRICE);

  result.table.unshift(result.header);
  paddedTable = formatTable(result.header, result.table);
  
  const rowLength = paddedTable[0].length + 1;
  const numRows = paddedTable.length;

  if (rowLength * numRows < MSG_LIM) {
    console.log(paddedTable.join("\n"));
    return;
  }

  const threshold = MSG_LIM / rowLength;

  const multiMessage = [];
  while(paddedTable.length) {
    multiMessage.push(paddedTable.splice(0, threshold)); 
  }

  multiMessage.forEach(msg => {
    console.log(msg.join("\n"));
  });
  return;
}

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



testMarket();
