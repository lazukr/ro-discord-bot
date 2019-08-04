import Module, { MAX_ACTION as MAX_FIRST, MAX_ROTATION as MAX_SECOND } from '../src/commands/char';
import { getRandomInt } from '../src/utils/rochargenphp';

// setups
const message = {
  channel: {
    send: (text) => {
      return text
    },
  },
}; 

const module = new Module({});
const name = 'rain';
const type = 'char';
const iterations = 100;

// tests
it('No args.', async () => {
  const reply = await module.run(message, '');
  expect(reply).toBe('No args');
});

it('Name. No values.', async () => {
  let i = iterations;
  while (i) {
    const reply = await module.run(message, [name]);
    expect(reply.name).toBe(name);
    expect(reply.type).toBe(type);
    
    const { first, second } = reply.values;
    
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
    i--;
  }
});

it('Name. Both values within range.', async () => {
  let i = iterations;
  while (i) {

    const inputFirst = getRandomInt(0, MAX_FIRST);
    const inputSecond = getRandomInt(0, MAX_SECOND);
    const values = `${inputFirst}/${inputSecond}`;

    const reply = await module.run(message, [name, values]);
    expect(reply.name).toBe(name);
    expect(reply.type).toBe(type);
    
    const { first, second } = reply.values;

    expect(first).toBe(inputFirst);
    expect(second).toBe(inputSecond);
    i--;
  }
});

it('Name. First value within range, second value out of range.', async () => {
  let i = iterations;
  while (i) {
    const inputFirst = getRandomInt(0, MAX_FIRST);
    const inputSecond = MAX_SECOND + getRandomInt(0, iterations);
    const values = `${inputFirst}/${inputSecond}`;

    const reply = await module.run(message, [name, values]);
    expect(reply.name).toBe(name);
    expect(reply.type).toBe(type);

    const { first, second } = reply.values;
    
    expect(first).toBe(inputFirst);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
    i--;
  }
});

it('Name. First value out of range, second value within range.', async () => {
  let i = iterations;
  while (i) {
    const inputFirst = MAX_FIRST + getRandomInt(0, iterations);
    const inputSecond = getRandomInt(0, MAX_SECOND);
    const values = `${inputFirst}/${inputSecond}`;

    const reply = await module.run(message, [name, values]);
    expect(reply.name).toBe(name);
    expect(reply.type).toBe(type);

    const { first, second } = reply.values;
    
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBe(inputSecond);
    i--;
  }
});

it('Name. Neither values within range.', async () => {
  let i = iterations;
  while (i) {
    const inputFirst = MAX_FIRST + getRandomInt(0, iterations);
    const inputSecond = MAX_SECOND + getRandomInt(0, iterations);
    const values = `${inputFirst}/${inputSecond}`;

    const reply = await module.run(message, [name, values]);
    expect(reply.name).toBe(name);
    expect(reply.type).toBe(type);

    const { first, second } = reply.values;
    
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
    i--;
  }
});

it('Name. Neither values exist.', async () => {
  let i = iterations;
  while (i) {
    const inputFirst = '';
    const inputSecond = '';
    const values = `${inputFirst}/${inputSecond}`;

    const reply = await module.run(message, [name, values]);
    expect(reply.name).toBe(name);
    expect(reply.type).toBe(type);

    const { first, second } = reply.values;
    
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
    i--;
  }
});
