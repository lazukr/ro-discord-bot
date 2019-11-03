import chalk from 'chalk';
import Char, {MAX_ACTION as CHAR_FIRST, MAX_ROTATION as CHAR_SECOND } from '../../src/commands/char';
import Sig, {MAX_BACKGROUND as SIG_FIRST, MAX_POSE as SIG_SECOND } from '../../src/commands/sig';
import ROChargenPHP, { getRandomInt, parse, verifyValues, getNewArgs } from '../../src/utils/rochargenphp';

// setups
const message = {
  channel: {
    send: (text) => {
      return text;
    },
  },
}; 

const char = new Char({});
const sig = new Sig({});
const SIG_MAX = [SIG_FIRST, SIG_SECOND];
const CHAR_MAX = [CHAR_FIRST, CHAR_SECOND];

// tests
describe(`Unit tests for ${chalk.cyan('ROChargenPHP')} module:`, () => {
 it("returns NaN in parse object after passing {A} format.", async () => {
    const wordResult = parse('test');
    expect(wordResult).toEqual({
      first: NaN,
      second: NaN,
    });
  });

  it("returns NaN in parse object after passing {A/A} format.", async () => {
    const result = parse('x/y');
    expect(result).toEqual({
      first: NaN,
      second: NaN,
    });
  });

  it("returns valid first and invalid second in parse object after passing {#} format.", async () => {
    const result = parse('5');
    expect(result).toEqual({
      first: 5,
      second: NaN,
    });
  });

  it("returns valid first and invalid second in parse object after passing a {#/A} format.", async () => {
    const result = parse('1/a');
    expect(result).toEqual({
      first: 1,
      second: NaN,
    });
  });

  it("returns invalid first and valid second in parse object after passing a {A/#} format.", async () => {
    const result = parse('a/2');
    expect(result).toEqual({
      first: NaN,
      second: 2,
    });
  });

  it("returns valid first and valid second in parse object after passing a {#/#} format.", async () => {
    const result = parse('3/4');
    expect(result).toEqual({
      first: 3,
      second: 4,
    });
  });

  it("returns invalid first and invalid second in valid object after passing non-numerical values for both.", async () => {
    const params = {
      first: 'test',
      second: 'hey',
    };

    const result = verifyValues(params, CHAR_MAX);
    expect(result).toEqual({
      first: false,
      second: false,
    });
  });

  it("returns invalid first and invalid second in valid object after passing values not less than range.", async () => {
    const params = {
      first: -1,
      second: -3,
    };

    const result = verifyValues(params, SIG_MAX);
    expect(result).toEqual({
      first: false,
      second: false,
    });
  });

  it("returns invalid first and invalid second in valid object after passing values greater than range.", async () => {
    const params = {
      first: CHAR_MAX[0] + 5,
      second: CHAR_MAX[1] + 1,
    };
    
    const result = verifyValues(params, CHAR_MAX);
    expect(result).toEqual({
      first: false,
      second: false,
    });
  });

  it("returns valid first and invalid second in valid object after passing respective values.", async () => {
    const params = {
      first: 1,
      second: -5,
    };

    const result = verifyValues(params, CHAR_MAX);
    expect(result).toEqual({
      first: true,
      second: false,
    });
  });

  it("returns invalid first and valid second in valid object after passing respective values.", async () => {
    const params = {
      first: SIG_MAX[0] + 10,
      second: 2,
    };

    const result = verifyValues(params, SIG_MAX);
    expect(result).toEqual({
      first: false,
      second: true,
    });
  });

  it("returns No args after passing no arguments.", async () => {
    const charReply = await char.run(message, "");
    const sigReply = await sig.run(message, "");
    expect(charReply).toBe("No args");
    expect(sigReply).toBe("No args");
  });
  
  it("returns correct name and type after passing one-word-name.", async () => {
    const name = 'Rain';
    const params = name.split(' ');
    const expected = params.join('_');
    const charReply = await char.run(message, params);
    expect(charReply.name).toBe(expected);
    expect(charReply.type).toBe('char');
    const sigReply = await sig.run(message, params);
    expect(sigReply.name).toBe(expected);
    expect(sigReply.type).toBe('sig');
  });

  it("returns correct name after passing multi-word-name.", async () => {
    const name = 'Hello world';
    const params = name.split(' ');
    const expected = params.join('_');
    const charReply = await char.run(message, params);
    expect(charReply.name).toBe(expected);
    const sigReply = await sig.run(message, params);
    expect(sigReply.name).toBe(expected);
  });
  
 

  /*
  it("returns random first and second within range after passing no first or second", async () => {
    



  });

  it("returns the same first and second when both are within range", async () => {
    const inputFirst = getRandomInt(0, MAX_FIRST);
    const inputSecond = getRandomInt(0, MAX_SECOND);
    const values = `${inputFirst}/${inputSecond}`;
    const charReply = await char.run(message, [name, values]);
    const { first, second } = charReply.values;
    expect(first).toBe(inputFirst);
    expect(second).toBe(inputSecond);

  }); 

  it("returns random first and second when neither are within range", async () => {
    const inputFirst = MAX_FIRST + getRandomInt(1, 5);
    const inputSecond = MAX_SECOND + getRandomInt(1, 5);
    const values = `${inputFirst}/${inputSecond}`;
    const charReply = await char.run(message, [name, values]);
    const { first, second } = charReply.values;
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
  });

  it("returns random first and same second when first is not specified and second is and within range", async () => {
    const inputFirst = "";
    const inputSecond = getRandomInt(0, MAX_SECOND);
    const values = `${inputFirst}/${inputSecond}`;
    const charReply = await char.run(message, [name, values]);
    const { first, second } = charReply.values;
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(MAX_FIRST);
    expect(second).toBe(inputSecond);
  });

  it("returns same first and random second when first is within range and second is not specified", async () => {
    const inputFirst = getRandomInt(0, MAX_FIRST);
    const inputSecond = "";
    const values = `${inputFirst}/${inputSecond}`;
    const charReply = await char.run(message, [name, values]);
    const { first, second } = charReply.values;
    expect(first).toBe(inputFirst);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(MAX_SECOND);
  });
  */
});
