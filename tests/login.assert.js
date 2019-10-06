import Scraper from '../src/utils/scraper';
import Nova from '../src/utils/nvro';
import chalk from 'chalk';
import config from '../config.json';


describe(`Testing ${chalk.cyan("Multi login")} functionality`, async() => {
  it('multi-login', async () => {
    await Scraper.login(config.novaCredentials);
  };


});



