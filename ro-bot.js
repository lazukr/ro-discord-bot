const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("message", (message) => {
  if (message.content.startsWith("ping")) {
    message.channel.send("pong!");
  }
});

client.login("Mzk1Mjg5NTQ4OTc4MTI2ODQ5.DSQtlw.r7DYOEk36mQucEBP6okJ_E53QXc")
