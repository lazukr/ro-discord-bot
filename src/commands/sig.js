import Logger from '../utils/logger';
import Command from '../utils/command';
import ROChargenPHP from '../utils/rochargenphp';

export const MAX_BACKGROUND = 10;
export const MAX_POSE = 15;

export default class Signature extends Command {
  constructor(bot) {
    super(bot, {
      name: "sig",
      description: `Gets the signature of a Nova RO character. To specify background and pose respectively, include #/# after the name. Background seems to go from 0 - ${MAX_BACKGROUND}. Pose seems to go from 0 - ${MAX_POSE}.`,
      usage: `${bot.prefix}char <name> [#/#]`,
      aliases: [],
      category: "Nova",
    });
  } 

  async run(message, args) {
    return await ROChargenPHP({
      message: message,
      args: args,
      max_values: [MAX_BACKGROUND, MAX_POSE],
      type: 'sig',
    });
  }
}
