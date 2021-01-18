const fs = require('fs');
const hooman = require('hooman');
const cheerio = require('cheerio');

const novaMarket = require('../src/node_modules/nova-market-commons');
const dt = require('../src/node_modules/data-tables');
const pp = require('../src/node_modules/pretty-print');
const sc = require('../src/node_modules/scrape-commons');

const LINK = 'https://www.novaragnarok.com/data/cache/ajax/item_*.json';

const HEADERS = Object.freeze({
    QTY: "qty",
    PRICE: "price",
    REFINE: "refine",
});

const grabMarketData = async (id) => {
    const result = await novaMarket.getNewMarketData(id);
    console.log(result);

    if (result.error) {
        console.log('No results or errors');
        return;
    }

    console.log(result.table.contents);
    const pt = new pp.PrettyTableFactory(result);
    const filters = novaMarket.getFilters([]);
    const p1 = pt.getPage(1, filters);
    console.log(p1);
}

const testMarket = (html, func, byFile = true) => {
    if (!byFile) {
        const result = func(html);
        console.log(result);
        return;
    }

    fs.readFile(html, 'utf8', (err, html) => {
        if (err) {
            console.log(err);
            return;
        }

        const result = func(cheerio.load(html));



        console.log(result);

        result.intToStrCols(novaMarket.HEADERS.QTY);
        result.intToStrCols(novaMarket.HEADERS.PRICE);
        result.intToStrCols(novaMarket.HEADERS.REFINE);

        const pt = new pp.PrettyTableFactory({
            table: result,
            name: 'test',
            id: 4033,
        });

        const filters = novaMarket.getFilters([]);
        const p1 = pt.getPage(1, filters);
        const p2 = pt.getPage(2, filters);
        console.log(p1);
        console.log(p2);

  


        //return JSON.stringify(result);
        //fs.writeFileSync('old-market.json', JSON.stringify(result));
 
    });

}

const staticPageTest = () => {
    testMarket('./src/market-4035-result.html', novaMarket.getMarketTable);
}

const newPageTest = () => {
    grabMarketData(603);
}

//staticPageTest();
newPageTest();