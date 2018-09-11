const Discord = require('discord.js');
const util = require('util');
const fs = require('fs');
const path = require('path');
const Enmap = require('enmap');

const readdir = util.promisify(fs.readdir);
const CONFIG = require('./config.json');
const LOGGER = require('logger.js');
const Scheduler = require('task-scheduler.js');
const taskHandler = require('task-handler.js');
// bot constants
const LIVE_STORAGE = 'src/liveSchedulerDB';

class RagnarokBot {
  constructor(logger, config) {
    this.logger = logger("Ragnarok Bot");
    this.config = config;
    this.commandList = new Enmap();
    this.commandAliasList = new Enmap();
    this.client = new Discord.Client();
    this.scheduler = new Scheduler(LIVE_STORAGE, taskHandler.messageHandler);
  }

  // loads all events that the bot can handle.
  // this is a complicated set of code to load the only current event
  // message
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
  
  // loads all the commands
  // they are structured weirdly in that they are categorized in folders
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
    
    if (command.info.alias) {
      this.commandAliasList.set(command.info.alias, {
        cmd: command,
        path: commandPath,
      });
    }

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

  async start() {
    this.logger.info('Starting ro-discord-bot...');
    await this.client.login(this.config.discordToken);
    this.logger.info('Starting scheduler...');
    this.scheduler.init(this.client);
  }

  async startListeners() {
    this.client.on('disconnect', dis => {
      this.logger.info(dis);
    });

    this.client.on('error', err => {
      this.logger.error(`${err.name}: ${err.message}`);
      this.logger.info("attempting to restart bot...");
      this.client.destroy()
        .then(async () => {
          await this.start();       
      });
    });
  }

  rename(name) {
    this.client.on('ready', () => {
      this.client.user.setUsername(name);
    });
  }
};

async function botboot() {
  const roBot = new RagnarokBot(LOGGER, CONFIG);
  await roBot.loadEvents();
  await roBot.loadCommands();
  await roBot.start();
  await roBot.startListeners();
}

botboot();
