const express = require('express');
require('dotenv').config();
const hopitalRoutes = require('./routes/hopitalRoutes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MediSys Hopitaux Service is running' });
});

app.use('/api/hopitaux', hopitalRoutes);

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Hopitaux service running on port ${PORT}`);
});
