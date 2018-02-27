const logger = require('logger.js')('General module: command');
exports.run = async (discordBot, message, args) => {
  logger.info(args);
  if (args.length === 0) {
    const commandArrayString = discordBot.commandList.keyArray().toString();          
    await message.channel.send(`List of commands: \`${commandArrayString}\` \n` +
                               "Use \`<cmd_prefix>command <command_name>\` to list out the specifics of a particular command");  
    return;
  }

  const cmd = discordBot.commandList.get(args[0]);
  if (!cmd) {
    await message.channel.send(`The command ${args[0]} does not exist.`);
    return;
  }

  const cmdInfo = cmd.cmd.info;
  
  await message.channel.send( `name: \`${cmdInfo.name}\` \n` +
                              `category: \`${cmdInfo.category}\` \n` +
                              `description: \`${cmdInfo.description}\` \n` +
                              `usage: \`${cmdInfo.usage}\``);
};

exports.info = {
  name: "command",
  category: "general",
  description: "use this to get info on all commands",
  usage:  "\`<cmd_prefix>command\` to list out all commands \n" +
          "\`<cmd_prefix>command <command>\` to list out specifics of a particular command",
};
