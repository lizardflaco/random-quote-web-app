const express = require('express');
const app = express();
const quotes = [
  'To be, or not to be, that is the question.',
  'The only thing we have to fear is fear itself.',
  'I think, therefore I am.',
  'The unexamined life is not worth living.'
];
app.get('/api/quote', (req, res) => {
  const index = Math.floor(Math.random() * quotes.length);
  res.json({ quote: quotes[index] });
});
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
