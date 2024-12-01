const express = require('express');
const axios = require('axios');

const router = express.Router();

// POST /api/directions
router.post('/', async (req, res) => {
  try {
    const { origin, destination, key: requestKey } = req.body;
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY || requestKey;

    if (!origin || !destination || !key) {
      return res.status(400).json({ 
        error: 'Parâmetros inválidos',
        details: {
          hasOrigin: !!origin,
          hasDestination: !!destination,
          hasKey: !!key
        }
      });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${key}&mode=motorcycle&language=pt-BR&units=metric`;
    
    console.log('URL da requisição Directions (com key ocultada):', 
      url.replace(key, 'API_KEY_HIDDEN')
    );

    const response = await axios.get(url);
    console.log('Resposta da Directions API:', {
      status: response.data.status,
      routes: response.data.routes?.length || 0,
      waypoints: response.data.geocoded_waypoints?.length || 0
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Erro na API do Google: ${response.data.status} - ${response.data.error_message || 'Sem mensagem de erro'}`);
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erro na requisição Directions:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao obter direções',
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
