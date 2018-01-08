const Discord = require('discord.js');
const CONFIG = require('./config.json');
const LOGGER = require('./logger.js');
const EVENT_PATH = './events/';
const COMMAND_PATH = './commands/';
const util = require('util');
const fs = require('fs');
const Enmap = require('enmap');
const EnmapLevel = require('enmap-level');
const readdir = util.promisify(fs.readdir);

class RagnarokBot {
  constructor(logger, config) {
    this.logger = logger("Ragnarok Bot");
    this.config = config;
    this.commands = new Enmap();
    this.database = new Enmap();
    this.client = new Discord.Client();
  }

  async loadEvents(folderPath) {
    const eventFiles = await this._loadFolder(folderPath);
    this.logger.info(`Loading ${eventFiles.length} event modules... (${eventFiles})`);
    eventFiles.forEach(file => {
      const eventName = file.split('.')[0];
      const eventFunction = require(`${folderPath}${file}`);
      this.client.on(eventName, eventFunction.bind(null, this));
      this.logger.debug(`${file} loaded successfully.`);
    });
    this.logger.info(`Events loaded`);
  }

  async loadCommands(folderPath) {
   
    const folders = await this._getFolders(folderPath);
    this.logger.debug(`Loading ${folders.length} folder(s). (${folders})`);
    for (let folder of folders) {
      this.logger.info(`Loading Commands from the ${folder} folder...`);
      const commandFiles = await this._loadFolder(`${folderPath}${folder}`);
      this.logger.info(`Loading ${commandFiles.length} command module(s)... (${commandFiles})`);
      commandFiles.forEach(file => {
        const command = require(`${folderPath}${folder}/${file}`);
        this.commands.set(command.info.name, command);
        this.logger.debug(`${file} loaded successfully.`);
      });
      this.logger.info(`Commands loaded`);
    }
  }

   _loadFolder(folderPath) {
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
        return list.filter(file => fs.lstatSync(`${folderPath}${file}/`).isDirectory());
      }).catch(err => {
        this.logger.error(err);
      });
   }

  start() {
    this.logger.info('Starting ro-discord-bot...');
    this.client.login(this.config.discordToken);
  }
};

roBot = new RagnarokBot(LOGGER, CONFIG);
roBot.loadEvents(EVENT_PATH);
roBot.loadCommands(COMMAND_PATH);
roBot.start();

