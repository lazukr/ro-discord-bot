const getApiLink = require('divine-pride-api.js');
const type = "Monster";

exports.run = async (discordBot, message, args) => {
  getApiLink(message, args, discordBot.config.divinePrideToken, type);
};

exports.info = {
  name: "mob",
  category: "Divine Pride",
  description: "",
  usage: "",
};
