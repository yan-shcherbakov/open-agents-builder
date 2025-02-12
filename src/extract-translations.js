const fs = require('fs');
const path = require('path');
const glob = require('glob');

const translationKeys = new Set();

// Function to extract translation keys from a file
const extractTranslationKeys = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /t\('([^']+)'\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    translationKeys.add(match[1]);
  }
};

// Scan the codebase for translation keys
const scanCodebase = (directory) => {
  const files = glob.sync(`${directory}/**/*.tsx`);
  files.forEach(extractTranslationKeys);
};

// Generate the translation JSON file
const generateTranslationFile = (outputPath) => {
    let translations = {};

    if (fs.existsSync(outputPath)) {
        translations = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    }
  translationKeys.forEach((key) => {
    if (!translations[key]) translations[key] = key;
  });
  fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2), 'utf8');
};

// Main function
const main = (langCode) => {
    if (!langCode) {
        console.error('Please provide a language code');
        return;
    }
  const projectDirectory = path.resolve(__dirname, '.');
  const outputFilePath = path.resolve(__dirname, '../locales/' + langCode + '/translation.json');

  scanCodebase(projectDirectory);
  generateTranslationFile(outputFilePath);

  console.log(`Translation file generated at ${outputFilePath}`);
};

console.log('Usage: node extract-translations.js <langCode>');
console.log(process.argv);
main(process.argv[2]);