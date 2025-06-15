const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const quotes = [
  'Life is what happens when you\'re busy making other plans.',
  'The greatest glory in living lies not in never falling, but in rising every time we fall.',
  'The way to get started is to quit talking and begin doing.',
  'Your time is limited, so don\'t waste it living someone else\'s life.'
];

app.use(express.static(__dirname));

app.get('/api/quote', (req, res) => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  res.json({ quote });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
