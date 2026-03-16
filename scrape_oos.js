const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const URL = "https://ultimateframedata.com/stats";

async function scrapeOOS() {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    const oosData = {};

    $("table tbody tr").each((i, row) => {
      const cells = $(row).find("td");

      // Only process rows that have full OOS data
      if (cells.length < 13) return;

      const character = $(cells[0]).text().trim();

      // Skip header rows or weird rows
      if (!character || character === "Character") return;

      oosData[character] = {
        fastest: {
          frame: $(cells[1]).text().trim(),
          moves: $(cells[2]).text().trim()
        },
        second: {
          frame: $(cells[3]).text().trim(),
          moves: $(cells[4]).text().trim()
        },
        third: {
          frame: $(cells[5]).text().trim(),
          moves: $(cells[6]).text().trim()
        },
        grab: $(cells[7]).text().trim(),
        grab_post_shieldstun: $(cells[8]).text().trim(),
        item_throw_forward: $(cells[9]).text().trim(),
        item_throw_back: $(cells[10]).text().trim(),
        jump_zdrop_front: $(cells[11]).text().trim(),
        jump_zdrop_back: $(cells[12]).text().trim()
      };
    });

    fs.writeFileSync("oosdata.json", JSON.stringify(oosData, null, 2));

    console.log(
      "✅ oosdata.json created with",
      Object.keys(oosData).length,
      "characters"
    );

  } catch (err) {
    console.error("Scrape failed:", err);
  }
}

scrapeOOS();