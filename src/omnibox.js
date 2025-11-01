'use strict';

const fs = require('fs');
const path = require('path');
const { readJsonFile } = require('./utils.js');

function convertToOmnibox(inputFile, outputFile) {
  try {
    const data = readJsonFile(inputFile);

    const newData = {
      sites: [],
    };

    if (data.api_site) {
      for (const [key, site] of Object.entries(data.api_site)) {
        const newSite = {
          key: key,
          name: site.name,
          api: site.api,
        };

        newData.sites.push(newSite);
      }
    }

    const dir = path.dirname(outputFile);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(newData, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Error during conversion: ${error.message}`);
  }
}

module.exports = {
  convertToOmnibox,
};
