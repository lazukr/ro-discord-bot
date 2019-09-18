import chalk from 'chalk';
import moment from 'moment';

const LogType = Object.freeze({
  Log: 'LOG',
  Warn: 'WRN',
  Error: 'ERR',
  Debug: 'DBG',
});

const ColourForeground = Object.freeze({
  LOG: chalk.green,
  WRN: chalk.yellow,
  ERR: chalk.red,
  DBG: chalk.blue,
});

const ColourBackground = Object.freeze({
  LOG: chalk.black.bgGreen,
  WRN: chalk.black.bgYellow,
  ERR: chalk.black.bgRed,
  DBG: chalk.black.bgBlue,
});


export default class Logger {
  
  static getTimestamp() {
    return `[${moment().format('YYYY-MM-DD HH:mm:ss:SSS')}]`;
  }

  static _buildMessage(message, type) {
    return console.log(`${Logger.getTimestamp()} ${ColourBackground[type](type)}: ${ColourForeground[type](message)}`);
  }

  static log(message) {
    Logger._buildMessage(message, LogType.Log);
  }

  static warn(message) {
    Logger._buildMessage(message, LogType.Warn);
  }

  static error(message) {
    Logger._buildMessage(message, LogType.Error);
  }

  static debug(message) {
    Logger._buildMessage(message, LogType.Debug);
  }

}

