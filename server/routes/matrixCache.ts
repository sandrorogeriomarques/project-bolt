import { Router } from 'express';
import { matrixCache } from '../services/matrixCache';

const router = Router();

// GET /api/matrix-cache
// Busca resultado do cache baseado nas coordenadas
router.get('/', async (req, res) => {
  try {
    const { origin_lat, origin_lng, destination_lat, destination_lng } = req.query;

    // Validar parâmetros
    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const result = await matrixCache.findRoute(
      { 
        lat: parseFloat(origin_lat as string), 
        lng: parseFloat(origin_lng as string) 
      },
      { 
        lat: parseFloat(destination_lat as string), 
        lng: parseFloat(destination_lng as string) 
      }
    );

    return res.json(result);
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
    return res.status(500).json({ error: 'Erro ao buscar cache' });
  }
});

// POST /api/matrix-cache
// Salva novo resultado no cache
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

    const success = await matrixCache.saveRoute({
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

    if (success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: 'Erro ao salvar cache' });
    }
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
    return res.status(500).json({ error: 'Erro ao salvar cache' });
  }
});

export default router;
