import Logger from './logger';

const LINK = 'https://www.novaragnarok.com/ROChargenPHP/';

export default async function ROChargenPHP({
  message,
  args,
  max_values,
  type,
}) {

  Logger.log(args, type);

  if (!args.length) {
    await message.channel.send(`Please specify a name with the command.`);
    return 'No args';
  }
  
  const lastArg = args.length > 1 ? args[args.length - 1] : "-/-";
  const params = parse(lastArg);
  const valid = verifyValues(params, max_values);
  
  if (valid.first || valid.second) {
    args.pop();
  } 
  
  const values = getNewArgs(valid, params, max_values); 
  
  const name = args.join('_');
  const timestamp = Date.now();
  const commandType = type === 'sig' ? 'newsig/' : 'character/';
  await message.channel.send(`\`${name} - ${values.first}/${values.second}\``, {
    files: [
      `${LINK}${commandType}${name}/${values.first}/${values.second}?${timestamp}.png`,
    ]
  });
  return {
    name: name,
    values: values,
    type: type,
  };
}

export function parse(params) {
  const values = params.split('/');
  return {
    first: parseInt(values[0]),
    second: parseInt(values[1]),
  };
}

export function verifyValues({ first, second}, max_values) {
  return {
    first: !isNaN(first) && between(first, 0, max_values[0]), 
    second: !isNaN(second) && between(second, 0, max_values[1]), 
  }
}

export function getNewArgs(valid, params, max_values) {
  return {
    first: valid.first ? params.first : getRandomInt(0, max_values[0]),
    second: valid.second ? params.second : getRandomInt(0, max_values[1]),
  }
}

function between(value, min, max) {
  return (value >= min && value <= max);
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

