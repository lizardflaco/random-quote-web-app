const http = require('http');

const quotes = [
  'The only limit to our realization of tomorrow is our doubts of today.',
  'Life is 10% what happens to us and 90% how we react to it.',
  'The purpose of our lives is to be happy.'
];

const server = http.createServer((req, res) => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(quote + '\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
