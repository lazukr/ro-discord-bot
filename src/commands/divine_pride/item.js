const getApiLink = require('divine-pride-api.js');
const type = "Item";

exports.run = async (discordBot, message, args) => {
  getApiLink(message, args, discordBot.config.divinePrideToken, type);
};

exports.info = {
  name: "item",
  category: "Divine Pride",
  description: "",
  usage: "",
};
