import Logger from './logger';
import hooman from 'hooman';

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
  console.log(lastArg, params, valid);
  
  if (valid.first || valid.second) {
    args.pop();
  } 
  
  const values = getNewArgs(valid, params, max_values); 
  
  const name = args.join('_');
  const timestamp = Date.now();
  const commandType = type === 'sig' ? 'newsig/' : 'character/';
  const fullLink = `${LINK}${commandType}${name}/${values.first}/${values.second}?${timestamp}`;
  const response = await hooman.get(fullLink);

  await message.channel.send(`\`${name} - ${values.first}/${values.second}\``, {
    files: [
      response.rawBody,
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
    first: !isNaN(first) && between(first, 1, max_values[0]), 
    second: !isNaN(second) && between(second, 1, max_values[1]), 
  }
}

export function getNewArgs(valid, params, max_values) {
  return {
    first: valid.first ? params.first : getRandomInt(1, max_values[0]),
    second: valid.second ? params.second : getRandomInt(1, max_values[1]),
  }
}

function between(value, min, max) {
  return (value >= min && value <= max);
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

