const Discord = require('discord.js');
const CONFIG = require('./config.json');
const LOGGER = require('logger.js');
const util = require('util');
const fs = require('fs');
const path = require('path');
const Enmap = require('enmap');
const readdir = util.promisify(fs.readdir);

class RagnarokBot {
  constructor(logger, config) {
    this.logger = logger("Ragnarok Bot");
    this.config = config;
    this.commandList = new Enmap();
    this.client = new Discord.Client();
  }

  async loadEvents() {
    var eventsPath = path.resolve(__dirname, `${this.config.eventsPath}`);
    const eventFiles = await this._loadFiles(eventsPath);
    this.logger.info(`Loading ${eventFiles.length} event modules... (${eventFiles})`);
    eventFiles.forEach(file => {
      const eventName = file.split('.')[0];
      const eventFunction = require(`${eventsPath}/${file}`);
      this.client.on(eventName, eventFunction.bind(null, this));
      this.logger.debug(`${file} loaded successfully.`);
    });
    this.logger.info(`Events loaded`);
  }

  async loadCommands() {
    var commandsPath = path.resolve(__dirname, `${this.config.commandsPath}`);
    const folders = await this._getFolders(commandsPath);
    this.logger.debug(`Loading ${folders.length} folder(s). (${folders})`);
    for (let folder of folders) {
      this.logger.info(`Loading Commands from the ${folder} folder...`);
      const commandFiles = await this._loadFiles(`${commandsPath}/${folder}`);
      this.logger.info(`Loading ${commandFiles.length} command module(s)... (${commandFiles})`);
      commandFiles.forEach(file => {
        this._addCommand(`${commandsPath}/${folder}/${file}`);
      });
      this.logger.info(`Commands loaded successfully`);
    }
  }

  _addCommand(commandPath) {
    const command = require(commandPath);
    this.commandList.set(command.info.name, {
      cmd: command,
      path: commandPath,
    });
    this.logger.debug(`(${command.info.name}) module loaded successfully.`);
  }

   _removeCommand(commandName) {
    let command;
    if (this.commandList.has(commandName)) {
      command = this.commandList.get(commandName);
    }
    if (!command) {
      this.logger.error(`${commandName} module could not be found.`);
      return false;
    }
    delete require.cache[require.resolve(command.path)];
    this.logger.debug(`${commandName} module removed successfully`);
    return true;
  }

   _loadFiles(folderPath) {
      return readdir(folderPath)
        .then(list => {
          return list.filter(file => file.endsWith('.js'));
        }).catch(err => {
          this.logger.error(err);
        });
   }

   _getFolders(folderPath) {
    return readdir(folderPath)
      .then(list => {
        return list.filter(file => fs.lstatSync(`${folderPath}/${file}/`).isDirectory());
      }).catch(err => {
        this.logger.error(err);
      });
   }

  start() {
    this.logger.info('Starting ro-discord-bot...');
    this.client.login(this.config.discordToken);
  }

  startListeners() {
    this.client.on('disconnect', dis => {
      this.logger.info(dis);
    });

    this.client.on('error', err => {
      this.logger.error(`${err.name}: ${err.message}`);
      this.logger.info("attempting to restart bot...");
      this.client.destroy()
        .then(() => {
          this.start();       
      });
    });
  }


  rename(name) {
    this.client.on('ready', () => {
      this.client.user.setUsername(name);
    });
  }
};

roBot = new RagnarokBot(LOGGER, CONFIG);
roBot.loadEvents();
roBot.loadCommands();
roBot.start();
roBot.startListeners();
