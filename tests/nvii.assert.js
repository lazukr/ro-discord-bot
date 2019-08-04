import Nova from '../src/utils/nvro';
import PrettyPrinter from '../src/utils/prettyPrinter';

const searchName = 'poring';
const searchId = 607;

it('Get Item Data.', async () => {
  const result = await Nova.getItemData(searchId);
});

it('Get Search Data.', async () => {
  const result = await Nova.getSearchData(searchName);
  const reply = PrettyPrinter.tabulate(result);
});

it('Get Search Data with page.', async () => {
  const result = await Nova.getSearchData(searchName, 2);
  const reply = PrettyPrinter.tabulate(result);
});
