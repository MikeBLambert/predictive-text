const fs = require('fs');
// import dictionary from "./words.json" assert { type: "json" };

const csv = fs.readFileSync('./unigram_freq.csv', 'utf-8');
const csvArray = csv.split('\n');
const dictionary = csvArray.reduce((acc, row) => {
  const [word, frequency] = row.split(',');
  const frequencyNumber = parseFloat(frequency);
  if (typeof frequencyNumber === 'number') {
    acc[word] = frequencyNumber;
  }

  return acc;
}, {});

// write dictionary to json file
fs.writeFileSync('./words.json', JSON.stringify(dictionary, null, 2));
