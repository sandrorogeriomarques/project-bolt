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
    const { origin, destinations } = req.body;

    if (!origin || !destinations) {
      return res.status(400).json({ error: 'Origem e destino são obrigatórios' });
    }

    // Tentar buscar do cache primeiro
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destinations.split(',').map(Number);

    const cachedRoute = await matrixCache.findRoute(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    if (cachedRoute) {
      console.log('✅ Usando rota do cache');
      return res.json(cachedRoute);
    }

    // Se não estiver no cache, buscar da API do Google
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    const response = await axios.get(url, {
      params: {
        origins: origin,
        destinations: destinations,
        mode: 'motorcycle',
        language: 'pt-BR',
        key: process.env.VITE_GOOGLE_MAPS_API_KEY || req.body.key
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Erro na API do Google: ${response.data.status}`);
    }

    // Salvar no cache
    const result = response.data;
    if (result.rows[0].elements[0].status === 'OK') {
      const distance = result.rows[0].elements[0].distance.value;
      const duration = result.rows[0].elements[0].duration.value;

      await matrixCache.saveRoute({
        origin_lat: originLat,
        origin_lng: originLng,
        destination_lat: destLat,
        destination_lng: destLng,
        distance,
        duration
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erro na Matrix API:', error);
    res.status(500).json({ error: 'Erro ao calcular distância' });
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
