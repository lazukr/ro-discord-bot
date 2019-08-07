import chalk from 'chalk';
import Module from '../../src/commands/choose';

const message = {
  channel: {
    send: (text) => {
      return text;
    },
  },
};

const bot = {
  name: "test",
};

const module = new Module(bot);

describe(`Running ${chalk.cyan("choose")} command with:`, () => {
  it("returns no argument message after passing no arguments", async () => {
    const reply = await module.run(message, []);
    expect(reply).toBe(`${bot.name} cannot choose something that is not there.`);
  }); 

  it("returns forced message after passing one argument", async () => {
    const reply = await module.run(message, ["choose"]);
    expect(reply).toBe(`${bot.name} was forced to choose \`choose\` as there was nothing else to choose from.`);  
  });

  it("returns forced message after passing multiple same arguments", async () => {
    const reply = await module.run(message, ["choose, ", "choose"]);
    expect(reply).toBe(`${bot.name} was forced to choose \`choose\` as there was nothing else to choose from.`);  
  });

  it("returns a selection from the list after passing multiple uniqe arguments", async () => {
    const list = ["choose", "hello"];
    const listReply = list.map(choice => `\`${choice}\``);
    const args = list.join(", ").split(" ");
    const reply = await module.run(message, args);
    expect(listReply).toContain(reply); 

  });
});
