const logger = require('logger.js')("Nova Command module: Item");

const nvro = require('nova-market-commons');
const pp = require('pretty-print');

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

  const page = filters.page;
  const prettyTable = new pp.PrettyTableFactory(search);
  message.channel.send(prettyTable.getPage(page));
}

async function getItemInfo(message, itemID) {
  logger.info("item");
  itemId = parseInt(itemID);
  const { info, description, drops, icon, image, url, preview } = await nvro.getItemData(itemId);
  
  const itemInfo = info.contents[0];
  const descriptionInfo = description.contents[0]["Item Description"];
  const dropsInfo = drops.contents; 
  
  console.log(itemInfo);
  console.log(dropsInfo); 
  console.log(descriptionInfo);
  
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
  usage: `@iteminfo <itemID|itemName>`,
};

exports.getItemInfo = getItemInfo;
