import chalk from 'chalk';
import Module, { MAX_ACTION as MAX_FIRST, MAX_ROTATION as MAX_SECOND } from '../../src/commands/char';
import { getRandomInt } from '../../src/utils/rochargenphp';

// setups
const message = {
  channel: {
    send: (text) => {
      return text;
    },
  },
}; 

const module = new Module({});
const name = 'name';
const type = 'char';
// tests
describe(`Running ${chalk.cyan(type)} command with:`, () => {
  
  it ("returns No args after passing no arguments.", async () => {
    const reply = await module.run(message, "");
    expect(reply).toBe("No args");
  });

  it("returns name, type after passing name.", async () => {
    const reply = await module.run(message, [name]);
    expect(reply.name).toBe(name);
    expect(reply.type).toBe(type);
  });

  it("returns random first and second within range after passing no first or second", async () => {
    const reply = await module.run(message, [name]);
    const { first, second } = reply.values;
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
  });

  it("returns the same first and second when both are within range", async () => {
    const inputFirst = getRandomInt(0, MAX_FIRST);
    const inputSecond = getRandomInt(0, MAX_SECOND);
    const values = `${inputFirst}/${inputSecond}`;
    const reply = await module.run(message, [name, values]);
    const { first, second } = reply.values;
    expect(first).toBe(inputFirst);
    expect(second).toBe(inputSecond);

  }); 

  it("returns random first and second when neither are within range", async () => {
    const inputFirst = MAX_FIRST + getRandomInt(1, 5);
    const inputSecond = MAX_SECOND + getRandomInt(1, 5);
    const values = `${inputFirst}/${inputSecond}`;
    const reply = await module.run(message, [name, values]);
    const { first, second } = reply.values;
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
  });

  it("returns random first and same second when first is not specified and second is and within range", async () => {
    const inputFirst = "";
    const inputSecond = getRandomInt(0, MAX_SECOND);
    const values = `${inputFirst}/${inputSecond}`;
    const reply = await module.run(message, [name, values]);
    const { first, second } = reply.values;
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBe(inputSecond);
  });

  it("returns same first and random second when first is within range and second is not specified", async () => {
    const inputFirst = getRandomInt(0, MAX_FIRST);
    const inputSecond = "";
    const values = `${inputFirst}/${inputSecond}`;
    const reply = await module.run(message, [name, values]);
    const { first, second } = reply.values;
    expect(first).toBe(inputFirst);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
  });
});
