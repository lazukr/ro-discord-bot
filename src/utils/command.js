export default class Command {
  constructor(bot, {
    name = null,
    description = "No description provided.",
    category = "Miscellaneous",
    usage = "No usage provided.",
    enabled = true,
    subCommands = new Array(),
    aliases = new Array(),
  }) {
    this.bot = bot;
    this.configuration = { enabled, aliases};
    this.help = { name, description, category, usage, subCommands };
  }

  getSubCommand(arg) {
    const match = arg.match(/(?<=--).*/g);
    return match ? match[0] : null;
  }

  async runSubCommand(cmd, message, args) {
    await this[cmd](message, args);
  }
}
