import Bot from './bot';
import { default as config } from '../config.json';

const bot = new Bot(config);

bot.loadEvents();
bot.loadCommands();
bot.attachListeners();
bot.start();
