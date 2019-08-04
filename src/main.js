import Bot from './bot';
import { default as config } from '../config.json';

const bot = new Bot(config);

bot.attachListeners();
bot.loadCommands();
bot.loadEvents();
bot.start();
