const logger = require('logger.js')("Nova Command module: market");
const nvro = require('nova-market-commons');
const pp = require('pretty-print');

const TIME_INTERVAL = 300000; // every 5 minutes

const PREV_QUERIES = {};
let LAST_QUERY = 0;

const ERRNUM = Object.freeze({
  NAS: 1, // no args
});

exports.run = async (discordBot, message, args) => {
  logger.info(args);

  // No arguments Case
  if (args.length === 0) {
    invalidInput(message, ERRNUM.NAS);
    return;
  } 
  
  // handles searching 
  if (isNaN(args[0])) {
    const filters = nvro.getFilters(args);
    doSearch(message, filters);
    return;
  }
  
  const itemID = args.shift();
  const filters = nvro.getFilters(args);
  doItemId(message, itemID, filters);
};

function invalidInput(message, errnum) {
  switch (errnum) {
    case ERRNUM.NAS:
      message.channel.send(`Please specify an argument.`);
      return;
    default:
      message.channel.send(`This is a new species of errors`);
      return; 
  }
}

async function doSearch(message, filters) {
  logger.info("Search");

  const page = filters.page;
  const args = filters[nvro.HEADERS.ADDPROPS];
  const search = await nvro.getSearchData(args);
  
  if (search.error == nvro.ERROR.NO_RESULT) {
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${search.name}\n\nNo Results Found :(\`\`\``);
    return;
  }
  const prettyTable = new pp.PrettyTableFactory(search);
  message.channel.send(prettyTable.getPage(page));
}

async function doItemId(message, itemId, filters = {}) {
  logger.info("Item");
  itemId = parseInt(itemId);
  let page = filters.page; 
  if (itemId < 100) {                               // last 
    page = itemId;
    getFromLast(message, page, filters);
  
  } else if (PREV_QUERIES.hasOwnProperty(itemId)) {  // previous
    getFromPrevious(message, itemId, page, filters);
  
  } else {
    getFromLive(message, itemId, page, filters);             // live
  }
}

function getFromLast(message, page, filters) {
  const msg = PREV_QUERIES[LAST_QUERY];
  if (msg) {
    logger.info("Getting from last...");
    message.channel.send(msg.table.getPage(page, filters));
    return;
  }
  message.channel.send(`\`\`\`\n Last query is emtpy.\n\`\`\``);
}

function getFromPrevious(message, itemId, page, filters) {
  LAST_QUERY = itemId;
  const msg = PREV_QUERIES[LAST_QUERY];
  if (msg) {
    logger.info("Getting from previous...");
    message.channel.send(msg.table.getPage(page, filters));
    return;
  }
  message.channel.send(`\`\`\`\n Previous query did not exist.\n\`\`\``);
}

async function getFromLive(message, itemId, page, filters, silent = 0) {
  logger.info("Getting from live...");
  
  const market = await nvro.getLiveMarketData(itemId);
  
  if (market.error == nvro.ERROR.UNKNOWN && !silent) {
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${market.name}\n\nBear does not know the unknown.\`\`\``);
    return;
  } 

  if (market.error == nvro.ERROR.NO_RESULT && !silent) {
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${market.name}\n\nNo Results Found :(\`\`\``);
    return;
  }
  
  market.table.intToStrCols(nvro.HEADERS.QTY);
  market.table.intToStrCols(nvro.HEADERS.PRICE);
  market.table.intToStrCols(nvro.HEADERS.REFINE);
  const prettyTable = new pp.PrettyTableFactory(market);
  LAST_QUERY = prettyTable.id;
  PREV_QUERIES[LAST_QUERY] = {
    table: prettyTable,
    filters: filters,
  };
  setTimeout(function() {
    delete PREV_QUERIES[this.id];
    logger.info(`Previous query: ${this.id} removed.`);
  }.bind(prettyTable), TIME_INTERVAL);
  
  message.channel.send(prettyTable.getPage(page, filters));
}

exports.info = {
  name: "market",
  alias: "ws",
  category: "Nova",
  description: "Use this command to get current items sold in Nova, or look for items in Nova.",
  usage: "\n\n" +
  "\tSearch who sells by itemID:\n" +
  "\t\t@market #itemID \n\n" + 
  "\tSearch for itemID by name: \n" +
  "\t\t@market [item name] \n\n",
};

