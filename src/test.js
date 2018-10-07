// packages
const fs = require('fs');
const cheerio = require('cheerio');
const rp = require('request-promise');

// configuration
const config = require('./config.json'); 

// custom files
const logger = require('logger.js')("Test module: ");
const nvro = require('nova-market-commons');
const dp = require('divine-pride-commons');
const Scheduler = require('task-scheduler');
const marketCmd = require('./commands/nova/market.js');
const storage = require('node-persist');
const TaskFactory = require('task-factory');
const pp = require('pretty-print');

// constants
const mobTestID = 1002;
const url = 'https://www.novaragnarok.com';
const QTY = 'Qty';
const PRICE = 'Price';
const MSG_LIM = 2000;
const TEST_STORAGE = 'src/testdb';
const SETTINGS_STORAGE = 'src/settings';
const AUTOMARKET_DB = 'src/automarket';

const settings = storage.create();
settings.init({
  dir: SETTINGS_STORAGE,
});

const amdb = storage.create();

amdb.init({
  dir: AUTOMARKET_DB,
});

const market_qs = {
  "module": "vending",
  "action": "item",
};

async function testMarket(itemID) {
  const market = await nvro.getLiveMarketData(itemID); 
  
  if (market.error = nvro.ERROR.UNKNOWN) {
    console.log("Unknown");
  }

  if (market.error = nvro.ERROR.NO_RESULT) {
    console.log("No Result");
  }

  console.log(market.table);


  market.table.intToStrCols(nvro.HEADERS.QTY);
  market.table.intToStrCols(nvro.HEADERS.PRICE);
  /*
  const prettyTable = new pp.PrettyTable(market);
  //prettyTable.print();
  
  for (i = 1; i <= prettyTable.pages; i++) {
    const msg = prettyTable.getMessage(i);
    console.log(msg);
  }

  //console.log(result);
  */
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


// ----------------------- moment testing

//const moment = require('moment-timezone');
//const currentDate = new Date();
//console.log(moment(currentDate).tz("America/Toronto").calendar());
//

// ---------------------- automarket checker

async function automarket(itemID, price) {
  if (isNaN(price)) {
    console.log("Price must be a number");
    return;
  }
  const results = await market.getLiveMarketData(itemID); 
  
  if (!results) {
    console.log("No results!");
    return;
  }
  console.log(results);
  const filteredResults = results.table.filter(entry => entry.Price <= price);
  
  if (filteredResults.length == 0) {
    console.log("No matching results");
    return;
  }
  
  console.log(filteredResults);
}

async function setAutoMarketInterval(interval) {
  
  const cronInterval = `*/${interval} * * * *`;
  await settings.setItem('automarket-interval', cronInterval);
  const value = await settings.getItem('automarket-interval'); 
  const len = await settings.length();
  
  console.log(value, len);
}

async function AutoMarketScheduler() {
  


}

// test factory
//

const testString = "rsx 102 343 in 2 hrs".split(' ');
const secondstr = "rsasdfsd in 2 hrs in 5 hrs".split(' ');

const prop = {
  channel: "2342394293492342340232",
  owner: "Bob",
  ownerid: "203402340239235923523",
  type: "message",
  args: secondstr, 
}

// test dp commons

const itemTestlist = [
  "22010",
  "6607",
  "asdfadf",
  "a213",
  "12.234",
  "32,asdf",
  "1002",
];

function testdp(list) {
  list.forEach(async test => {
    const mob = await dp.getMob(test);
  });
}

//testdp(itemTestlist);

async function testnvroSearch(args) {

  

  const search = await nvro.getSearchData(args); 
  
  if (market.error = nvro.ERROR.UNKNOWN) {
    console.log("Unknown");
  }

  if (market.error = nvro.ERROR.NO_RESULT) {
    console.log("No Result");
  }

  console.log(market.table);


  market.table.intToStrCols(nvro.HEADERS.QTY);
  market.table.intToStrCols(nvro.HEADERS.PRICE);
  /*
  const prettyTable = new pp.PrettyTable(market);
  //prettyTable.print();
  
  for (i = 1; i <= prettyTable.pages; i++) {
    const msg = prettyTable.getMessage(i);
    console.log(msg);
  }

  //console.log(result);
  */
}








