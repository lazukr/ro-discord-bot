const dp = require('divine-pride-commons.js');
const logger = require('logger.js')("Divine Pride Item Module");
exports.info = {
  name: "item",
  alias: "ii",
  category: "Divine Pride",
  description: "Gets information of an item from the divine pride database. Currently only supports using an id.",
  usage: "@item <item_id>",
};

exports.run = async (discordBot, message, args) => {
  
  logger.info(args);
  const item = await dp.getItem(args);

  if (item.error > 0) {
    message.channel.send(`\`\`\`${dp.getErrorMessage(item.error)}\`\`\``);
    return;
  }

  message.channel.send(`\`\`\`${dp.itemPrint(item)}\`\`\``);
};

