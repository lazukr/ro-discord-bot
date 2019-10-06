import { getSearch, getMarket } from '../../src/utils/nvrocmd'; 
import chalk from 'chalk';

describe(`Testing ${chalk.cyan("nvro commands")} functionaltiy`, async () => {
  it (`No login`, async () => {
    const result = await getMarket({
      id: 603,
    });
    console.log(result);
  });
});
