const logger = require('logger.js')("Nova Command module: Automarket");

const tf = require('task-factory.js');
const nvro = require('nova-market-commons.js');

const ERRNUM = Object.freeze({
  NAS: 1, // no args
  NAONI: 2, // no args or not int
  NVFI: 3, // not valid for interval 
  NVZ: 4, // not valid zeny
});

exports.run = async (discordBot, message, args) => {
  logger.info(args);

  // No arguments
  if (args.length === 0) {
    invalidInput(message, ERRNUM.NAS);
    return;
  }

  switch (args[0]) {
    
    // invoke --list
    case `--${tf.CMD.LIST}`:
      const page = parseInt(args[1]) || 1;
      await list(message, discordBot, page);
      return;
    
    // invokes --clear
    case `--${tf.CMD.CLEAR}`:
      await clear(message, discordBot);
      return;

    // invokes --remove
    case `--${tf.CMD.REMOVE}`:
      const entry = parseInt(args[1]);
      if (!entry) {
        invalidInput(message, ERRNUM.NAONI);
        return;
      }
      await remove(message, discordBot, entry);
      return;

    // invokes --interval
    case `--${tf.CMD.INTERVAL}`:
      const interval = parseInt(args[1]);
      if (!interval) {
        await getInterval(message, discordBot);
        return;        
      }
      if (interval < 1 || interval > 60) {
        invalidInput(message, ERRNUM.NVFI);
        return;
      }
      await setInterval(message, discordBot, interval);
      return;
   
    // invokes automarket adding 
    default:
      await addAutomarket(message, discordBot, args);
      return;
  }
}    

function invalidInput(message, errnum) {
  switch (errnum) {
    case ERRNUM.NAS:
      message.channel.send(`Please specify an argument.`);
      return;
    case ERRNUM.NAONI:
      message.channel.send(`Please provide a positive integer argument.`);
      return;
    case ERRNUM.NVFI:
      message.channel.send(`Interval range is between 1 - 59.`);
      return;
    case ERRNUM.NVZ:
      message.channel.send(`Not a valid zeny value.`);
      return;
  }
}

async function clear(message, bot) {
  logger.info("Clearing...");
  await bot.scheduler.clear(tf.AUTOMARKET);
  message.channel.send(`All automarkets are cleared.`);
}

async function list(message, bot, page) {
  logger.info("Listing...");
  const list = await bot.scheduler.getAutoMarketList(page);
  message.channel.send(list);
}

async function remove(message, bot, entry) {
  logger.info("Removing...");
  const removed = await bot.scheduler.remove(tf.TYPE.AUTOMARKET, entry);
  logger.info(removed);
  message.channel.send(`${removed}`);
}

async function getInterval(message, bot) {
  logger.info("Getting interval...");
  const interval = await bot.scheduler.getCronInterval();
  message.channel.send(`Current interval is set to ${interval} minute${interval == 1 ? "" : "s"}.`);
}

async function setInterval(message, bot, interval) {
  logger.info("Updating interval...");
  await bot.scheduler.setCronInterval(interval);
  message.channel.send(`Set automarket check interval to every ${interval} minute${interval == 1 ? "" : "s"}.`);
}

async function addAutomarket(message, bot, args) {

  const itemID = parseInt(args.shift());
  if (!itemID || itemID < 100) {
    invalidInput(message, ERRNUM.NAONI);
    return;
  }
  
  const filters = nvro.getFilters(args); 
  console.log(filters);  
  
  
  const interval = await bot.scheduler.getCronInterval();
  const props = {
    channel: message.channel.id,
    ownerid: message.author.id,
    owner: message.author.username,
    type: tf.TYPE.AUTOMARKET,
    args: args,
    interval: interval,
    itemID: itemID,
    filters: filters,
  }
  
  const automarketItem = await bot.scheduler.add(props);
  if (!automarketItem) {
    invalidInput(message, ERRNUM.FA);
    return; 
  }
  
  logger.info(`automarket for itemID ${itemID} set for ${interval} minute${interval ? "s" : ""}`);
  
  const replyStringArray = [];
  replyStringArray.push(`Bear will query market for itemID \`${itemID}\``);
  if (filters[nvro.HEADERS.PRICE]) {
    const price = `${filters[nvro.HEADERS.PRICE].toLocaleString()}z`;
    replyStringArray.push(`at price \`${price}\``);
  }

  let filterString = "";

  filterString += filters[nvro.HEADERS.REFINE] ? 
    `, \`${filters[nvro.HEADERS.REFINE]}\`` : "";
  filterString += filters[nvro.HEADERS.ADDPROPS].length ? 
    `, ${filters[nvro.HEADERS.ADDPROPS].map(e => `\`${e}\``).join(', ')}` : "";
  logger.info(filterString);
  const replyString = replyStringArray.join(' ') + filterString;
  logger.info(replyString);
  message.channel.send(replyString);
}

exports.info = {
  name: "automarket",
  alias: "am",
  category: "Nova",
  description: `This handles all the automarket queries. There are several sub commands to use. Here are an explanation of them all:
  clear: use this to clear all automarket entries.
  list: use this to list all active automarket entries.
  interval <value>: set how frequent it checks the market. <value> is in minutes.
  remove <index>: remove an entry based on the index given by the list.`,
  usage: "@automarket <item_ID> <any market parameters>",
};
