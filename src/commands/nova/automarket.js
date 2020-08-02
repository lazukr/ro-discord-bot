const logger = require('logger.js')("Nova Command module: Automarket");

const tf = require('task-factory');
const nvro = require('nova-market-commons');
const pp = require('pretty-print');
const sc = require('scrape-commons');
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

    // invokes --all
    case `--${tf.CMD.ALL}`:
      await getAll(message, discordBot);
      return;
    // invokes automarket adding 

    // sets the session
    case `--session`:
      await setSession(message, args[1]);
      return;

    case `--listall`:
      const listallpage = parseInt(args[1]) || 1;
      await listall(message, discordBot, listallpage);
      return;

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

async function getAll(message, bot) {
  logger.info(`Getting All for ${message.author.id}`);
  const list = await bot.scheduler._getAutoMarketList(message.author.id);
  
  if (!list) {
    message.channel.send("```\nNo automarkets\n```");
    return;
  }

  let curMsg = "";
  const printList = [];
  
  for (let i = 0; i < list.length; i++) {

    if ((curMsg + list[i]).length > 2000) {
      printList.push(curMsg);
      curMsg = list[i];
    } else {
      curMsg += list[i];
    }

    if (i === list.length - 1) {
      printList.push(curMsg);
    }
  }

  if (printList.length === 0) {
    message.channel.send("```\nNo automarkets for filters.\n```");
    return;
  }

  printList.forEach(msg => {
    message.channel.send(msg);
  });
}

async function clear(message, bot) {
  logger.info("Clearing...");
  await bot.scheduler.clear(tf.AUTOMARKET, message.author.id);
  message.channel.send(`All automarkets are cleared.`);
}

async function listall(message, bot, page) {
  logger.info("Listing All...");
  const list = await bot.scheduler.getAutoMarketList(page);
  message
    .channel
    .send(list)
    .catch(err => {
      message.channel.send(err.message);
    });
}

async function list(message, bot, page) {
  logger.info("Listing...");
  const list = await bot.scheduler.getAutoMarketList(page, message.author.id);
  message
    .channel
    .send(list)
    .catch(err => {
      message.channel.send(err.message);
    });
}

async function remove(message, bot, entry) {
  logger.info("Removing...");

  const removed = await bot.scheduler.remove(tf.TYPE.AUTOMARKET, entry, message.author.id, entry < 501 ? false : true);
  logger.info(removed);
  message.channel.send(`${removed}`);
}

async function setSession(message, captcha) {

  if (!captcha) {
    message.channel.send(`Please provide captcha key`);
    return;
  }

  logger.info("Setting Automarket Cookies...");
  const getPage = await sc.login(captcha);

  if (!getPage) {
    message.channel.send(`The captcha didn't work! Try again.`);
    return;
  }

  tf.getPage = getPage;
  message.channel.send(`Session has been set!`);
}

async function addAutomarket(message, bot, args) {

  args = args.join(' ').split(',');
  args = args.map(i => i.trim());

  let item = args.shift();
  let itemID = 0;


  if (isNaN(item)) {
    const search = await nvro.getSearchData(item);
    if (search.error == nvro.ERROR.NO_RESULT) {
      message.channel.send(`\`\`\`${pp.HIGHTLIGHT}\n${search.name}\n\nNo results for this. Automarket could not be added.\`\`\``);
      return;
    }

    if (search.table.contents.length > 1) {
      args.shift();
      const filters = nvro.getFilters(args);
      message.channel.send(`\`\`\`${pp.HIGHLIGHT}\nThe name search has returned multiple results, please be more specific.\`\`\``);
      const page = filters.page;
      const prettyTable = new pp.PrettyTableFactory(search);
      message.channel.send(prettyTable.getPage(page));
      return;
    }
    
    if (search.table.contents.length === 1) {
      itemID = search.table.contents[0].Id;
      item = search.table.contents[0].Name;
    }

  } else if (!item || item < 100) {
    invalidInput(message, ERRNUM.NAONI);
    return;
  } else {
    itemID = parseInt(item);
    const market = await nvro.getLiveMarketData(itemID);
    item = market.name; 
  } 
 
  //const market = await nvro.getLiveMarketData(itemIDID);

  //if (market.error == nvro.ERROR.UNKNOWN) {
  //  message.channel.send(`\`\`\`${pp.HIGHLIGHT}\n${market.name}\n\nBear cannot automarket the unknown.\`\`\``);
  //  return;
  //}


  const filters = nvro.getFilters(args); 
  console.log(filters);  
  
  
  const props = {
    channel: message.channel.id,
    ownerid: message.author.id,
    owner: message.author.username,
    type: tf.TYPE.AUTOMARKET,
    args: args,
    //interval: interval,
    itemID: itemID,
    filters: filters,
    name: item,
    result: '',
  }
  
  const automarketItem = await bot.scheduler.add(props);
  if (!automarketItem) {
    invalidInput(message, ERRNUM.FA);
    return; 
  }
 
  const fullItemID = isNaN(item) ? `${itemID} - ${item}` : itemID;
  logger.info(`automarket for itemID ${fullItemID} set!`);
  
  const replyStringArray = [];
  replyStringArray.push(`Bear will query market for itemID \`${fullItemID}\``);
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

  list <page number>: use this to list all your active automarket entries. Use <page number> to see different pages.
  
  remove <index | id>: remove an entry based on the index given by the list if index is less than 501. Over 501, it will assume it is an item's id. 
  If there are multiple queries on the same item id, it will list them out and ask you to use indices to remove it.
  
  all: queries every automarket owned by you all at once. It may take some time to reply.\n`,
  usage: `@automarket <item_ID> <any market parameters>
  It can also be fine tuned by:
    - using spaces to match multiple parameters within a property
    - using commas to match multiple parameters in distinct properties
  For example:
    - !am 2964 matk 3%
      * Find item 2974 with a property that contains both "matk" and "3%" 
    - !am 2964 matk, 3%
      * Find item 2974 with two separate properties that contains "matk" and "3%" respectively
    - !am 2964 matk 3%, matk 2% 
      * Find item 2974 with a property that contains "matk" and "2%" AND a second property that contains "matk" and "3%"`,
};
