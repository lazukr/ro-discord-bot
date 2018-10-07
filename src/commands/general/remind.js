const logger = require('logger.js')("Command module: scheduler");
const tf = require('task-factory.js');

const ERRNUM = Object.freeze({
  NO_ARGS: 1,
  INVALID_INPUT: 2,
  NOT_INT: 3,
  FAILED_ADD: 4,
});

exports.run = async (discordBot, message, args) => {
  logger.info(args);
  
  switch (args.length) {
    // No Arguments Case
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
      switch(args[0]) {
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
        default:
          invalidInput(message, ERRNUM.INVALID_INPUT);
          return;
      }
    // Add message case
    default:
      await addMessage(message, discordBot, args);
      return;
  }
}

function invalidInput(message, errnum) {
  switch (errnum) {
    case ERRNUM.NO_ARGS:
      message.channel.send(`Need to Specify an argument`);
      return;
    case ERRNUM.INVALID_INPUT:
      message.channel.send(`This is not a valid command`);
      return;
    case ERRNUM.NOT_INT:
      message.channel.send(`Your argument is not a positive integer`);
      return;
    case ERRNUM.FAILED_ADD:
      message.channel.send(`Failed to add message, perhaps add an \`in\` clause or have a valid time offset after the \`in\` clause.`);
      return;
  }
}

async function clear(message, bot) {
  await bot.scheduler.clear(tf.TYPE.MSG);
  message.channel.send(`All reminders have been cleared.`);
}

async function list(message, bot, page) {
  const list = await bot.scheduler.getMessageList(page);
  console.log(list);
  message.channel.send(list);
}

async function remove(message, bot, entry) {
  const removed = await bot.scheduler.remove(tf.MSG, entry);
  console.log(removed);
  message.channel.send(`${removed}`);
}

async function addMessage(message, bot, args) {
  const props = {
    channel: message.channel.id,
    ownerid: message.author.id,
    owner: message.author.username,
    type: tf.MSG,
    args: args,
  };
  
  const scheduledItem = await bot.scheduler.add(props);

  if (!scheduledItem) {
    invalidInput(message, ERRNUM.FAILED_ADD);
  }
  
  const localTime = await bot.scheduler.timeLocalize(message.author.id, scheduledItem.scheduled);
  
  logger.info(`Message set to go off at ${scheduledItem.scheduled}(${localTime})`);
    
  message.channel.send(`Message successfully added and you will be reminded ${localTime}`);  
};

exports.info = {
  name: "remind",
  alias: "rmb",
  category: "general",
  description: `Set a reminder so that the bot will automatically remind you. There are several sub commands to use. Here are an explanation of them all:
  clear: use this to clear all message entries.
  list: use this to list all active message entries.
  remove <index>: remove an entry based on the index given by the list.
  <message>, in <duration>: sets a reminder for the bot to remind you IN <duration> amount of time.
  <message>, at <time>: sets a reminder for the bot to remind you AT the specified <time>. (Currently unsupported)`,
  usage: "@remind <message>, in/at <time pattern>",
};
