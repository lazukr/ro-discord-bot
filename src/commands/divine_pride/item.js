const dpapi = require('divine-pride-api.js');
const logger = require('logger.js')("Divine Pride Item Module");
const itemType = dpapi.types.item;

exports.info = {
  name: "item",
  category: "Divine Pride",
  description: "Gets information of an item from the divine pride database.",
  usage: "@item <item_id>",
};

exports.run = async (discordBot, message, args) => {
  const apiKey = discordBot.config.divinePrideToken;
  const jsonReply = await dpapi.getApiJSON(message, args, apiKey, itemType.apiName);

  if (!jsonReply || jsonReply.name == null) {
    const notlikeblob = discordBot.client.emojis.find("name", "notlikeblob");
    message.channel.send(`Bear has no data on this. ${notlikeblob}`);
    return;
  }

  logger.info(`Requested item: ${jsonReply.name}, ${jsonReply.id}`);
  
  logger.info(JSON.stringify(jsonReply, null, 2));

};

