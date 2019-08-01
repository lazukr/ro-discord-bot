'use strict';
import Logger from './utils/logger';
import Discord from 'discord.js';
import fs from 'fs';
import util from 'util';

const readdir = util.promisify(fs.readdir);

export default class Bot {
  constructor({
    token,
    commands,
    name,
    prefix,
  }) {
    this.token = token;
    this.commands = commands;
    this.name = name;
    this.prefix = prefix;
    this.client = new Discord.Client();
  }

  async loadEvents() {
    this._load('event');
  }

  async loadCommands() {
    this._load('command');
  }

  async _load(type) {
    const files = await readdir(`./src/${type}s`)
      .then(list => {
        return list.filter(file => file.endsWith('.mjs'));
      }).catch(err => {
        Logger.error(err);
      });
    Logger.log(`Loading a total of ${files.length} ${type}s.`);

    files.forEach(file => {
      const name = file.split('.')[0];
      Logger.log(`Loading ${type}: ${name}`);
    });
  }
  
  attachListeners() {
    Logger.log(`${this.name} is starting listeners...`);
    this.client.on('disconnect', dis => {
      Logger.warn(`${this.name} was disconnected: ${JSON.stringify(dis)}`);
    });
  
    this.client.on('reconnecting', rec => {
      Logger.log(`${this.name} is attempting to reconnect...`);
    });

    this.client.on('error', error => {

      Logger.error(`${this.name} has encountered an error.\n${error.name}: ${error.message}`);
    });

    this.client.on('ready', () => {
      Logger.log(`${this.name} is ready!`);
    });

    Logger.log(`${this.name} has successfully attached all listeners!`);
  }

  async start() {
    Logger.log(`${this.name} is starting...`);
    this.client.login(this.token);
  }
};
