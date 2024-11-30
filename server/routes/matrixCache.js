const express = require('express');
const router = express.Router();
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

// Salvar rota no cache
router.post('/', async (req, res) => {
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
