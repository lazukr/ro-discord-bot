const logger = require('logger.js')("Nova Command module: Automarket");

const taskFactory = require('task-factory.js');
const zenyRegex = /^(\d{1,3}(.\d+)?[kmb]|\d+)$/;

exports.run = async (discordBot, message, args) => {
  
  if (args == "clear") {
    await discordBot.scheduler.clear(taskFactory.AUTOMARKET);
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

  if (args[0] == taskFactory.REMOVE) {
    if (isNaN(args[1])) {
      message.channel.send("Please specify the index on the list to remove the item.");
      return;
    }
    const removedMsg = await discordBot.scheduler.remove(taskFactory.AUTOMARKET, args[1]);
    console.log(removedMsg);
    message.channel.send(removedMsg);
    return;
  }

  if (args[0] == taskFactory.INTERVAL) {
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
    type: taskFactory.AUTOMARKET,
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
