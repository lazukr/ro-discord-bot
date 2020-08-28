const logger = require('logger.js')("Nova Command module: Item");
const notifier = require('notifier');
const nvro = require('nova-market-commons');
const pp = require('pretty-print');

const PREV_QUERIES = {};
let LAST_QUERY = 0;


const ERRNUM = Object.freeze({
  NAS: 1, // no args
});


exports.run = async (discordBot, message, args) => {
  logger.info(args);
  args = args.join(' ').split(',');
  args = args.map(i => i.trim());  

  if (args.length === 0) {
    invalidInput(message, ERRNUM.NAS);
    return;
  }

  if (isNaN(args[0])) {
    doSearch(message, args);
    return;
  }

  const itemID = args.shift();
  getItemInfo(message, itemID);
}

function invalidInput(message, errnum) {
  switch (errnum) {
    case ERRNUM.NAS:
      message.channel.send(`Please specify an argument.`);
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
    getItemInfo(message, itemID);
    return; 
  }

  const page = parseInt(args[0]) || 1;
  const prettyTable = new pp.PrettyTableFactory(search);
  message.channel.send(prettyTable.getPage(page));
}

async function doItemId(message, itemId) {
  logger.info("ID");
  itemId = parseInt(itemId);
  if (itemId < 100) {
    page = ItemId;
    getFromLast(message, page);
  } else if (PREV_QUERIES.hasOwnProperty(itemId)) {
    getFromPrevious(message, itemId, page);
  } else {
    getFromLive(message, itemId, page);
  }
} 

async function getItemInfo(message, itemID) {
  logger.info("item");
  itemId = parseInt(itemID);
  const { info, description, drops, icon, image, url, preview, error } = await nvro.getItemData(itemId);
  
  if (error) {
    message.channel.send(`Bot not logged in. Cannot query.`);
    notifier.send(`Bot not logged in. Please check.`);
    return;
  };

  const itemInfo = info.contents[0];
  const descriptionInfo = description.contents[0]["Item Description"];
  const dropsInfo = drops.contents; 
  
  const fullName = `${itemInfo["Item ID"]} - ${itemInfo.Name}`;
  const npcSell = `$${itemInfo["NPC Sell Price"]}z`;
  const type = itemInfo.Type;
  console.log(fullName, npcSell, type);

  const embededMessage = {
    title: type,
    author: {
      name: fullName,
      icon_url: icon,
      url: url, 
    },
    thumbnail: {
      url: image,
    }, 
    description: descriptionInfo, 
  }

  if (dropsInfo.length) {
    const fields = dropsInfo.map(drop => {
      return {
        name: drop["Drop Rate"],
        value: `${drop.Id} - ${drop.Name}`,
        inline: true,
      };
    });
    
    embededMessage.fields = fields; 
  }
  
  if (preview) {
    embededMessage.image = {
      url: preview,
    };
  }

  message.channel.send({embed: embededMessage});
}


exports.info = {
  name: "iteminfo",
  alias: "ii",
  category: "Nova",
  description: `This allows you to look up information regarding an item`,
  usage: `@iteminfo <itemID|itemName>, [p#]\n - including [p#] should only be for searching results. This represent the page for results.`,
};

exports.getItemInfo = getItemInfo;
