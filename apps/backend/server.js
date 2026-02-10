const express = require('express');
const app = express();
const port = 3001;

app.get('/api/auth/google/callback', (req, res) => {
  const code = req.query.code;
  res.send(`Code empfangen: ${code}`);
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
