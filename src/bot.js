import Discord from 'discord.js';
import fs from 'fs';
import util from 'util';
import chalk from 'chalk';
import Scraper from './utils/scraper';
import Logger from './utils/logger';
import Scheduler from './utils/scheduler';
import NvroCommands from './utils/nvrocmd';

const readdir = util.promisify(fs.readdir);

export default class Bot {
  constructor({
    dburl,
    token,
    commands,
    name,
    prefix,
    subprefix,
    aminterval,
    admin,
    mods,
  }) {
    this.aminterval = aminterval;
    this.token = token;
    this.commandList = commands;
    this.commands = new Discord.Collection();
    this.aliases = new Discord.Collection();
    this.name = name;
    this.prefix = prefix;
    this.subprefix = subprefix;
    this.logger = Logger;
    this.client = new Discord.Client();
    this.scheduler = new Scheduler(this, dburl);
    this.admin = admin;
    this.mods = mods;
    Scraper.bot = this;
    NvroCommands.bot = this;
  }

  async loadEvents() {
    const events = await readdir(`./src/events`)
      .then(list => {
        return list.filter(file => file.endsWith('.js'));
      }).catch(err => {
        this.logger.error(err);
      });
    this.logger.log(`Loading a total of ${chalk.cyan(events.length)} event(s).`);
    events.forEach(async (eventFile) => {
      const eventName = eventFile.split('.')[0];
      try {
        this.logger.log(`Loading Event: ${chalk.cyan(eventName)}`);
        const eventModule = await import(`./events/${eventName}`);
        const event = new eventModule.default(this);
        this.client.on(eventName, (...args) => event.run(...args));
      } catch (e) {
        this.logger.error(`Unable to load Event ${chalk.cyan(eventName)}: ${e}`);
      }
    });
  }

  async loadCommands() {
    this.logger.log(`Loading a total of ${chalk.cyan(this.commandList.length)} command(s).`);
    this.commandList.forEach(async (commandName) => {
      try {
        this.logger.log(`Loading Command: ${chalk.cyan(commandName)}`); 
        const commandModule = await import(`./commands/${commandName}`);
        const command = new commandModule.default(this);
        this.commands.set(command.help.name, command);
        command.configuration.aliases.forEach(alias => {
          this.aliases.set(alias, command.help.name);
        });
      } catch (e) {
        this.logger.error(`Unable to load command ${chalk.cyan(commandName)}:`);
        console.log(e);
      }
    });
  }

  attachListeners() {
    this.logger.log(`${this.name} is starting listeners...`);
    this.client.on('disconnect', dis => {
      this.logger.warn(`${this.name} was disconnected: ${JSON.stringify(dis)}`);
    });
  
    this.client.on('reconnecting', rec => {
      this.logger.log(`${this.name} is attempting to reconnect...`);
    });

    this.client.on('error', error => {

      this.logger.error(`${this.name} has encountered an error.\n${error.name}: ${error.message}`);
    });

    this.client.on('ready', () => {
      this.logger.log(`${this.name} is ready!`);
    });

    this.logger.log(`${this.name} has successfully attached all listeners!`);
  }

  async start() {
    this.logger.log(`${this.name} is starting...`);
    await this.loadEvents();
    await this.loadCommands();
    this.attachListeners();
    await this.client.login(this.token);
    this.adminChannel = await this.client.channels.fetch(this.admin.channel);
    await this.scheduler.init();
  }
};
