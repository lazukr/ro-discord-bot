const logger = require('logger.js')("Nova Command module: market");
const nvro = require('nova-market-commons');
const pp = require('pretty-print');

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
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${marketData.name}\n\nNo Results Found :(\`\`\``);
    return;
  }

  if (marketData.header[pp.QTY]) {
    marketData.table = pp.getStringIntsInCol(marketData.table, pp.QTY);
  }
  
  marketData.table = pp.getStringIntsInCol(marketData.table, pp.PRICE);
  prettyTable = pp.print(marketData.header, marketData.table, true);

  console.log(prettyTable);
  
  if (prettyTable.firstMsg) {
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${marketData.name}\n\n\n${prettyTable.firstMsg.join("\n")}\`\`\``);
  }
  
  prettyTable.formatted.forEach(msg => {
    message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${msg.join("\n")}\`\`\``);

  });
};

// converts integer columns back to strings
// inserts the commas (,) for thousands separating
function getStringIntsInCol(array, col) {
  return array.map(row => {
    row[col] = row[col].toLocaleString();
    return row;
  });
}

exports.info = {
  name: "market",
  alias: "sv",
  category: "Nova",
  description: "idk yet",
  usage: "@market <item_ID>",
};
