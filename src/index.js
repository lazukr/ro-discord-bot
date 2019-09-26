const Discord = require('discord.js');
const util = require('util');
const fs = require('fs');
const path = require('path');
const Enmap = require('enmap');
const sc = require('scrape-commons');
const readdir = util.promisify(fs.readdir);
const CONFIG = require('./config.json');
const LOGGER = require('logger.js');
const Scheduler = require('task-scheduler.js');
// bot constants
const LIVE_STORAGE = 'src/liveSchedulerDB';

class RagnarokBot {
  constructor(logger, config) {
    this.logger = logger("Ragnarok Bot");
    this.config = config;
    this.commandList = new Enmap();
    this.commandAliasList = new Enmap();
    this.client = new Discord.Client;
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

  async loginWrap(token) {
    if (token == '') {
      throw new Error('Token is empty'); 
    } 
    return await this.client.login(token);
  }


  async login() {
    this.logger.info(`token: ${this.config.discordToken}`);
    
    if (this.client) {
      this.client.destroy();
    }
    await this.loginWrap(this.config.discordToken)    
      .then(res => {
        console.log(`Logged in successfully: ${res}`);
      })
      .catch(err => {
        console.log(`Login error: ${err}`);
        console.log(`Retrying...`);
        return this.login();
      });
  } 

  async init() {
    await this.loadEvents();
    await this.loadCommands();
    await this.loadListeners();
  }

  async novaLogin() {
    await sc.login();
  }

  async start() {
    this.logger.info('Starting ro-discord-bot...');
    await this.login();
    this.replyChannel = this.client.channels.get(this.config.replyChannel);
    this.startScheduler();
    await this.novaLogin();
    this.replyChannel.send(`Bear is ready!`);
  }
  
  startScheduler() {
    if (this.scheduler) {
      this.scheduler.cancelAllJobs();
    }

    this.logger.info('Starting scheduler...');
    this.scheduler = new Scheduler(LIVE_STORAGE);
    this.scheduler.init(this.client);
    this.logger.info(`Scheduler successfully started!`);
  }

  async loadListeners() {
    this.logger.info(`Starting listeners...`);
    this.client.on('disconnect', dis => {
      this.logger.info(`Disconnected: ${dis}`);
      this.scheduler.cancelAllJobs();
      this.replyChannel.send(`Bear got disconnected :(`);
    });

    this.client.on('reconnecting', rec => {
      this.logger.info(`Bear reconnecting`);
      this.replyChannel.send(`Bear is attempting to reconnect...`); 
    });

    this.client.on('error', async (err) => {
      this.logger.error(`Bear encountered an error. ${err.name}: ${err.message}`);
      this.replyChannel.send(`Bear encountered an error: ${err.name} - ${err.message}`); 
      this.logger.info("attempting to restart bot...");
      this.scheduler.cancelAllJobs();
      this.start();
    });

    this.client.on('ready', () => {
      this.logger.info(`Ready!`);
    });
    this.logger.info(`Listeners successfully started!`);
  }
};

async function botboot() {
  const roBot = new RagnarokBot(LOGGER, CONFIG);
  await roBot.init();
  await roBot.start();
}

botboot();
