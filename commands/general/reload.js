const logger = require('../../logger.js')("Command module: reload");
const Enmap = require('enmap');

exports.run = async (discordBot, message, args) => {
    const commandList = getCommandList(discordBot.commandList);
    await message.channel.send(`Reloading the following commands: ${getCommandNames(commandList)}. Please do not issue commands until everything has been reloaded.`);
    let commandsRemoved = [];
    commandList.forEach(command => {
      const commandName = command.cmd.info.name;
      const commandPath = command.path;
      if (discordBot._removeCommand(commandName)) {
        commandsRemoved.push(commandName);
      } 
    });
    await message.channel.send(`The following modules were removed: ${commandsRemoved}.`);
    discordBot.loadCommands();
    const reloadedCommandList = getCommandList(discordBot.commandList);
    await message.channel.send(`The following modules were sucessfully loaded: ${getCommandNames(reloadedCommandList)}`);
};

exports.info = {
  name: "reload",
  category: "general",
  description: "reloads all the commands. If new commands were added since the last reload, it will try to load them",
  usage: "<cmd_prefix>reload",
};

function getCommandList(commandList) {
  list = commandList.filter(command => command.cmd.info.name !== "reload");
  logger.debug(list);
  return list;
}

function getCommandNames(commandList) {
  return commandList.map(command => command.cmd.info.name);
}
