const fs = require('fs');
const content = fs.readFileSync('node_modules/@mastra/core/package.json', 'utf8');
const lines = content.split('\n').slice(0, 50);
console.log(lines.join('\n'));
