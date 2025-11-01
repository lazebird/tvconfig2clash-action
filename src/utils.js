'use strict';

const fs = require('fs');

function readJsonFile(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error('Invalid input path');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file '${filePath}' does not exist.`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

module.exports = {
  readJsonFile,
};
