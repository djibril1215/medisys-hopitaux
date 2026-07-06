const express = require('express');
const cors = require('cors');
require('dotenv').config();
const hopitalRoutes = require('./routes/hopitalRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MediSys Hopitaux Service is running' });
});

app.use('/api/hopitaux', hopitalRoutes);

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Hopitaux service running on port ${PORT}`);
});
