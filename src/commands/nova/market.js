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
  args = args.join(' ').split(',');
  args = args.map(i => i.trim());
  
  console.log(args);
  
  // No arguments Case
  if (args.length === 0) {
    invalidInput(message, ERRNUM.NAS);
    return;
  } 
  
  // handles searching 
  if (isNaN(args[0])) {
    doSearch(message, args);
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

async function doSearch(message, args) {
  logger.info("Search");
  const name = args[0];
  const search = await nvro.getSearchData(name);
  if (search.error == nvro.ERROR.NO_RESULT) {
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${search.name}\n\nNo Results Found :(\`\`\``);
    return;
  }


  args.shift();
  const filters = nvro.getFilters(args);

  if (search.table.contents.length === 1) {
    const itemID = search.table.contents[0].Id;
    console.log(itemID);
    doItemId(message, itemID, filters);
    return; 
  }

  const page = parseInt(args[0]) || 1;
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
  
  //console.log(market);

  if (market.error === nvro.ERROR.NO_LOGIN) {
    message.channel.send(`Bot was unable to login.`);
    return;
  }

  if (market.error === nvro.ERROR.NO_RESULT && !silent) {
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${market.id} - ${market.name}\n\nNo Results Found :(\n\`\`\``);
    return;
  }
 
  market.table.intToStrCols(nvro.HEADERS.QTY);
  market.table.intToStrCols(nvro.HEADERS.PRICE);
  market.table.intToStrCols(nvro.HEADERS.REFINE);
  const prettyTable = new pp.PrettyTableFactory(market);

  console.log(prettyTable);

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

exports.getFromLive = getFromLive;


exports.info = {
  name: "market",
  alias: "ws",
  category: "Nova",
  description: "Use this command to get current items sold in Nova, or look for items in Nova.",
  usage: "\n\n" +
  "\tSearch who sells by itemID:\n" +
  "\t\t@market #itemID \n\n" + 
  "\tSearch for itemID by name. If the name is the only result, it will automatically search it as if it was an itemID: \n" +
  "\t\t@market [item name] \n\n",
};

