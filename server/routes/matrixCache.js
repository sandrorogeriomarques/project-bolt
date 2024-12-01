const express = require('express');
const router = express.Router();
const axios = require('axios');
const matrixCache = require('../services/matrixCacheService');

// Buscar rota no cache
router.get('/', async (req, res) => {
  try {
    const { 
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng
    } = req.query;

    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const route = await matrixCache.findRoute(
      { lat: parseFloat(origin_lat), lng: parseFloat(origin_lng) },
      { lat: parseFloat(destination_lat), lng: parseFloat(destination_lng) }
    );

    if (!route) {
      return res.status(404).json({ error: 'Rota não encontrada no cache' });
    }

    res.json(route);
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
    res.status(500).json({ error: 'Erro ao buscar cache' });
  }
});

// POST /api/distance-matrix
router.post('/', async (req, res) => {
  try {
    const { origin, destinations, key } = req.body;

    if (!origin || !destinations || !key) {
      return res.status(400).json({ error: 'Origem, destino e chave da API são obrigatórios' });
    }

    // Tentar buscar do cache primeiro
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destinations.split(',').map(Number);

    console.log('🔍 Buscando no cache:', { origin, destinations });
    const cachedRoute = await matrixCache.findRoute(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    if (cachedRoute) {
      console.log('✅ Rota encontrada no cache:', {
        origin_address: cachedRoute.origin_address,
        destination_address: cachedRoute.destination_address,
        distance: cachedRoute.distance,
        duration: cachedRoute.duration
      });
      
      // Converter o resultado do cache para o formato da API do Google Maps
      const response = {
        status: 'OK',
        origin_addresses: [cachedRoute.origin_address],
        destination_addresses: [cachedRoute.destination_address],
        rows: [{
          elements: [{
            status: 'OK',
            distance: { 
              text: `${(cachedRoute.distance / 1000).toFixed(1)} km`,
              value: cachedRoute.distance 
            },
            duration: { 
              text: `${Math.round(cachedRoute.duration / 60)} mins`,
              value: cachedRoute.duration 
            }
          }]
        }]
      };
      return res.json(response);
    }

    // Se não estiver no cache, buscar da API do Google
    console.log('❌ Rota não encontrada no cache, buscando da API do Google Maps...');
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    const response = await axios.get(url, {
      params: {
        origins: origin,
        destinations: destinations,
        mode: 'driving',
        language: 'pt-BR',
        key: key
      }
    });

    console.log('📥 Resposta da API:', JSON.stringify(response.data, null, 2));

    if (response.data.status !== 'OK') {
      throw new Error(`Erro na API do Google: ${response.data.status}`);
    }

    const element = response.data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      throw new Error(`Elemento da matriz inválido: ${element?.status || 'Não encontrado'}`);
    }

    // Salvar no cache
    const distance = element.distance.value;
    const duration = element.duration.value;

    console.log('💾 Salvando no cache:', {
      origin_lat: originLat,
      origin_lng: originLng,
      destination_lat: destLat,
      destination_lng: destLng,
      origin_address: response.data.origin_addresses[0],
      destination_address: response.data.destination_addresses[0],
      distance,
      duration
    });

    await matrixCache.saveRoute({
      origin_lat: originLat,
      origin_lng: originLng,
      destination_lat: destLat,
      destination_lng: destLng,
      origin_address: response.data.origin_addresses[0],
      destination_address: response.data.destination_addresses[0],
      distance,
      duration
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ Erro na Matrix API:', error);
    console.error('Stack trace:', error.stack);
    if (error.response) {
      console.error('Resposta de erro:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Erro ao calcular distância',
      details: error.message,
      status: error.response?.status
    });
  }
});

// Salvar rota no cache
router.post('/save', async (req, res) => {
  try {
    const {
      origin_address,
      origin_lat,
      origin_lng,
      destination_address,
      destination_lat,
      destination_lng,
      distance,
      duration,
      points
    } = req.body;

    // Validar dados
    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng || 
        !origin_address || !destination_address || !distance || !duration || !points) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const route = await matrixCache.saveRoute({
      origin_address,
      origin_lat,
      origin_lng,
      destination_address,
      destination_lat,
      destination_lng,
      distance,
      duration,
      points
    });

    if (!route) {
      return res.status(500).json({ error: 'Erro ao salvar no cache' });
    }

    res.json(route);
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
    res.status(500).json({ error: 'Erro ao salvar cache' });
  }
});

// Limpar cache antigo
router.delete('/cleanup', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const success = await matrixCache.cleanupOldRoutes(days);
    
    if (success) {
      res.json({ message: 'Cache limpo com sucesso' });
    } else {
      res.status(500).json({ error: 'Erro ao limpar cache' });
    }
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({ error: 'Erro ao limpar cache' });
  }
});

module.exports = router;
