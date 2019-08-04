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

  const params = args.length > 1 ? args.pop() : "-/-";
  const values = verifyValues(params, max_values);
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

function verifyValues(params, max_values) {
  const values = params.split('/');
  const first = parseInt(values[0]);
  const second = parseInt(values[1]);

  return {
    first: isNaN(first) || !between(first, 0, max_values[0]) ?
      getRandomInt(0, max_values[0]) : first,
    second: isNaN(second) || !between(second, 0, max_values[1]) ?
      getRandomInt(0, max_values[1]) : second,
  };
}

function between(value, min, max) {
  return (value >= min && value <= max);
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

