import Nova from '../../src/utils/nvro';
import PrettyPrinter from '../../src/utils/prettyPrinter';
import chalk from 'chalk';

const noDescription = "An item description does not exist yet.";
describe(`Testing ${chalk.cyan("nvro utilities")} functionality`, async () => {
  describe(`Testing ${chalk.green("getItemData")} method:`, async () => {
    it("returns item data with no drops", async () => {
      const nodropId = 1221; // item with no drops
      const result = await Nova.getItemData(nodropId);
      expect(result.drops.length).toEqual(0);
    });

    it("returns item data with drops", async () => {
      const dropId = 716; // item with drops
      const result = await Nova.getItemData(dropId);
      expect(result.drops.length).toBeGreaterThan(0);
    });

    it("returns item data with preview", async () => {
      const previewId = 20132; // item with preview
      const result = await Nova.getItemData(previewId);
      expect(result.preview).not.toEqual(null);
    });

    it("returns item data that is invalid", async () => {
      const invalidId = 23422; // invalid itemId
      const result = await Nova.getItemData(invalidId);
      expect(result.preview).toEqual(null);
      expect(result.description).toEqual(noDescription);
    });
  });

  describe(`Testing ${chalk.green("getSearchData")} method`, async () => {
    it("returns search data with results", async () => {
      const multiResultSearch = "poring";
      const result = await Nova.getSearchData(multiResultSearch); 
      expect(result.table.contents.length).toBeGreaterThan(0);
    });

    it("returns search data with no results", async () => {
      const noResultSearch = "asdlfjasd";
      const result = await Nova.getSearchData(noResultSearch);
      expect(result.table.contents.length).toEqual(0);
    });
  });

  describe(`Testing ${chalk.green("getMarketData")} method`, async () => {
    it("returns market data with results", async () => {
      const resultMarket = 984;
      const result = await Nova.getMarketData(resultMarket); 
      expect(result.table.contents.length).toBeGreaterThan(0);
      expect(result.table.contents.length).toEqual(result.table.originalLength);
});

    it("returns market data with no results", async () => {
      const noResultMarket = 23422;
      const result = await Nova.getMarketData(noResultMarket);
      expect(result.table.contents.length).toEqual(0);
      expect(result.table.contents.length).toEqual(result.table.originalLength);
    });

    it("returns market data for quantitative items", async () => {
      const resultMarket = 984;
      const result = await Nova.getMarketData(resultMarket);
      const expectedHeader = {
        Price: "Price",
        Qty: "Qty",
        Location: "Location",
      };
      
      expect(result.table.header).toEqual(expectedHeader);
    });

    it("returns market data with price filters", async () => {
      const resultMarket = 984;
      const filters = {
        PRICE: 30000,
      };

      const result = await Nova.getMarketData(resultMarket, filters);
      const contents = result.table.contents;
      contents.forEach(content => {
        expect(content.Price).toBeLessThanOrEqual(filters.PRICE);
      });

    });

    it("returns market data with results on non-applicable filter (refine on misc items)", async () => {
      const resultMarket = 984;
      const filters = {
        REFINE: "+7",
      };
      const result = await Nova.getMarketData(resultMarket, filters);
      expect(result.table.contents.length).toEqual(result.table.originalLength);
    });

    it("returns market data with results on non-applicable filters (add props on misc items)", async () => {
      const resultMarket = 984;
      const filters = {
        ADDPROPS: ["magic"],
      };
      const result = await Nova.getMarketData(resultMarket, filters);
      expect(result.table.contents.length).toEqual(result.table.originalLength);
    });

    it("returns market data for additional properties items", async () => {
      const resultMarket = 22010;
      const result = await Nova.getMarketData(resultMarket);
      const expectedHeader = {
        Price: "Price",
        Refine: "Rfn",
        "Additional Properties": "Add Props",
        Location: "Location",
      };
      expect(result.table.header).toEqual(expectedHeader);
    });


  });
});

