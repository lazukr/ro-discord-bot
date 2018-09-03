const logger = require('logger.js')('General module: 8ball');
const eightBall = [
  "Yes", 
  "Very doubtful", 
  "Totally!",
  "Probably not",
  "Perhaps",
  "Of course!",
  "Not sure",
  "Nope",
  "No",
  "NO - It may cause disease contraction",
  "My sources say yes",
  "My sources say no",
  "Most likely no",
  "Most likely",
  "Most definitely yes",
  "Maybe",
  "It is uncertain",
  "For sure",
  "Dont even think about it",
  "Don't count on it",
  "Definitely no",
  "Ask me again later",
  "As I see it, yes"
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.run = async (DiscordBot, message, args) => {

  logger.info(args);

  if (args.length === 0) {
    message.channel.send("Bear needs a yes/no question to use 8ball");
    return;
  }
  
  const listLength = eightBall.length - 1;
  message.channel.send(eightBall[getRandomInt(0, listLength)]);
};


exports.info = {
  name: "8ball",
  category: "general",
  description: "ask a yes/no question. It will answer",
  usage: "@8ball <your_question>?",
};
