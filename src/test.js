// packages
const fs = require('fs');
const cheerio = require('cheerio');
const rp = require('request-promise');

// configuration
const config = require('./config.json'); 

// custom files
const logger = require('logger.js')("Test module: ");
const market = require('nova-market-commons');
const dpapi = require('divine-pride-api');
const Scheduler = require('task-scheduler');

// constants
const mobTestID = 1002;
const url = 'https://www.novaragnarok.com';
const QTY = 'Qty';
const PRICE = 'Price';
const MSG_LIM = 2000;
const TEST_STORAGE = 'src/testdb';


const market_qs = {
  "module": "vending",
  "action": "item",
};

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

function commandParser(input) {
  return input.split();
}


// ------------------------- SCHEDULER TEST
//

const listArgs = [
  "actual test, in 2 seconds",
  "combined test, in 3 hrs 45 min",
  "combined test, in 5 hrs 23 min",
  "abbreviated hours, in 3 hrs",
  "written hours, in 3 hours",
  "abbreviated hour, in 1 hr",
  "written hour, in 1 hour",
  "abbreviated minutes, in 5 mins",
  "written minutes, in 5 minutes",
  "abbreviated minute, in 1 min",
  "written minute, in 1 minute",
];

function taskprocessor(data) {
  console.log('hi');
}

async function schedulerTest() {
  const scheduler = new Scheduler(TEST_STORAGE, taskprocessor); 
  await scheduler.init();
  const splitArgs = listArgs.map(test => test.split(' '));
  splitArgs.forEach(async (args) => {
    await scheduler.add('channel', 'me', 'message', args);
  });
  const list = await scheduler.getList();
  console.log(list); 
}

schedulerTest();
