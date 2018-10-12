const logger = require('logger.js')("Nova Command module: Automarket");

const tf = require('task-factory.js');
const zenyRegex = /^(\d{1,3}(.\d+)?[kmb]|\d+)$/;

const ERRNUM = Object.freeze({
  NO_ARGS: 1,
  INVALID_INPUT: 2,
  NOT_INT: 3,
  INVALID_INTERVAL: 4,
  INVALID_AUTOMARKET: 5,
});

exports.run = async (discordBot, message, args) => {
  logger.info(args);

  switch (args.length) {
    // No Argument Case
    case 0:
      invalidInput(message, ERRNUM.NO_ARGS);
      return;
    // Single word command cases
    case 1:
      switch (args[0]) {
        case tf.CMD.CLEAR:
          await clear(message, discordBot);
          return;
        case tf.CMD.LIST:
          await list(message, discordBot, 1);
          return;
        default:
          invalidInput(message, ERRNUM.INVALID_INPUT);
          return;
      } 
    // Single word command cases with argument
    case 2:
      switch (args[0]) {
        case tf.CMD.LIST:
          const page = parseInt(args[1]);
          if (!page) {
            invalidInput(message, ERRNUM.NOT_INT);
            return;
          }
          await list(message, discordBot, page);
          return;
        case tf.CMD.REMOVE:
          const entry = parseInt(args[1]);
          if (!entry) {
            invalidInput(message, ERRNUM.NOT_INT);
            return;
          }
          await remove(message, discordBot, entry);
          return;
        case tf.CMD.INTERVAL:
          const interval = parseInt(args[1]);
          if (!interval || interval < 0 || interval > 60) {
            invalidInput(mesage, ERRNUM.INVALID_INTERVAL);
            return;
          }
          await setInterval(message, discordBot, interval);
          return;
        default:
          const itemID = parseInt(args[0]);
          if (!itemID) {
            invalidInput(message, ERRNUM.INVALID_AUTOMARKET);
            return;
          }
          if (!zenyRegex.test(args[1])) {
            invalidInput(message, ERRNUM.INVALID_ZENY);
            return;
          } 
          await addAutoMarket(message, discordBot, args); 
          return;
      }
    default:
      const itemID = parseInt(args[0]);
      if (!itemID) {
        invalidInput(message, ERRNUM.INVALID_AUTOMARKET);
        return;
      }
      if (!zenyRegex.test(args[1])) {
        invalidInput(message, ERRNUM.INVALID_ZENY);
        return;
      }
      await addAutoMarket(message, discordBot, args);
      return;
  }
}

async function clear(message, bot) {
  await bot.scheduler.clear(tf.AUTOMARKET);
  message.channel.send(`All automarkets are cleared.`);
}

async function list(message, bot, page) {
  const list = await bot.scheduler.getAutoMarketList(page);
  console.log(list);
  message.channel.send(list);
}

async function remove(message, bot, entry) {
  const removed = await bot.scheduler.remove(tf.TYPE.AUTOMARKET, entry);
  console.log(removed);
  message.channel.send(`${removed}`);
}

async function setInterval(message, bot, interval) {
  await discordBot.scheduler.setCronInterval(interval);
  message.channel.send(`Set automarket check interval to every ${interval} minute${interval == 1 ? "" : "s"}.`);
}

async function addAutoMarket(message, bot, args) {

}

async function oldStuff () {
  if (args == "clear") {
    await discordBot.scheduler.clear(tf.AUTOMARKET);
    message.channel.send("All automarkets are cleared");
    return;
  }

  if (args == "list") {
    const list = await discordBot.scheduler.getAutoMarketList();
    list.forEach(msg => {
      message.channel.send(`\`\`\`${msg.join("\n")}\`\`\``);
    });
    return;
  }

  if (args.length < 2) {
    message.channel.send("Need to specify itemID follwed by the price filter desired. OR need to specify interval in minutes to set interval.");
    return;
  }

  if (args[0] == tf.REMOVE) {
    if (isNaN(args[1])) {
      message.channel.send("Please specify the index on the list to remove the item.");
      return;
    }
    const removedMsg = await discordBot.scheduler.remove(tf.AUTOMARKET, args[1]);
    console.log(removedMsg);
    message.channel.send(removedMsg);
    return;
  }

  if (args[0] == tf.INTERVAL) {
    if (isNaN(args[1] ||
        parseInt(args[1]) < 1)) {
      message.channel.send("Cannot set interval to be less than 1 minute or it needs to be an integer.");
      return;
    }

    await discordBot.scheduler.setCronInterval(args[1]);
    message.channel.send(`Set automarket check interval to every ${args[1]} minute${args[1] == 1 ? "" : "s"}.`);
    return; 
  }

  if (isNaN(args[0])) {
    message.channel.send("itemID needs to be an integer.");
    return;
  }
 
  if(!zenyRegex.test(args[1])) {
    message.channel.send("price is in an invalid format. It's either not a decimal or it is using invalid characters to represent digit groupings (use k, m or b)");
    return;
  } 

  const interval = await discordBot.scheduler.getCronInterval();

  const props = {
    channel: message.channel.id,
    ownerid: message.author.id,
    owner: message.author.username,
    type: tf.TYPE.AUTOMARKET,
    args: args,
    interval: interval,
  };

  const autoMarketItem = await discordBot.scheduler.add(props);
  console.log(autoMarketItem);
  
  message.channel.send(`Bear will query market for itemID \`${autoMarketItem.args[0]}\` at or below \`${autoMarketItem.args[1]}\` every \`${interval} minute${interval ? "s" : ""}\``); 

};

exports.info = {
  name: "automarket",
  alias: "am",
  category: "Nova",
  description: `This handles all the automarket queries. There are several sub commands to use. Here are an explanation of them all:
  clear: use this to clear all automarket entries.
  list: use this to list all active automarket entries.
  interval <value>: set how frequent it checks the market. <value> is in minutes.
  remove <index>: remove an entry based on the index given by the list.`,
  usage: "@automarket <item_ID> <price>",
};
