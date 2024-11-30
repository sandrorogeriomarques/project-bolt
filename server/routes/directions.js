const express = require('express');
const axios = require('axios');

const router = express.Router();

// POST /api/directions
router.post('/', async (req, res) => {
  try {
    const { origin, destination, key } = req.body;

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin,
        destination,
        key
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar direções:', error);
    res.status(500).json({ error: 'Erro ao buscar direções' });
  }
});

module.exports = router;
