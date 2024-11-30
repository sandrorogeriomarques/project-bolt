const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const matrixCacheRoutes = require('./routes/matrixCache');

console.log('\n=== INICIANDO SERVIDOR ===');
console.log('Variáveis de ambiente carregadas:', {
  VITE_BASEROW_API_URL: process.env.VITE_BASEROW_API_URL,
  VITE_BASEROW_TOKEN: process.env.VITE_BASEROW_TOKEN ? 'presente' : 'ausente',
  VITE_BASEROW_MATRIX_CACHE_TABLE_ID: process.env.VITE_BASEROW_MATRIX_CACHE_TABLE_ID,
  VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY ? 'presente' : 'ausente'
});

const app = express();
const port = 8081;

// Configurar variáveis de ambiente
process.env.VITE_BASEROW_API_URL = 'https://api.baserow.io/api';
process.env.VITE_BASEROW_TOKEN = '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';
process.env.VITE_BASEROW_MATRIX_CACHE_TABLE_ID = '400157';
process.env.VITE_GOOGLE_MAPS_API_KEY = 'AIzaSyDKabwnDraJmiX2e6gMn_BdVOYCF6TSdAo';

// Configuração do CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurar body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint para obter usuários
app.get('/api/users', (req, res) => {
  const usersPath = path.join(__dirname, 'data', 'users.json');
  
  try {
    if (!fs.existsSync(usersPath)) {
      return res.json([]);
    }
    
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    res.json(users);
  } catch (error) {
    console.error('Erro ao ler usuários:', error);
    res.status(500).json({ error: 'Erro ao ler usuários' });
  }
});

// Endpoint para obter um usuário específico
app.get('/api/users/:id', (req, res) => {
  const usersPath = path.join(__dirname, 'data', 'users.json');
  
  try {
    if (!fs.existsSync(usersPath)) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = users.find(u => u.id === parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao ler usuário:', error);
    res.status(500).json({ error: 'Erro ao ler usuário' });
  }
});

// Endpoint para atualizar um usuário
app.put('/api/users/:id', upload.single('avatar'), (req, res) => {
  const usersPath = path.join(__dirname, 'data', 'users.json');
  
  try {
    let users = [];
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    }
    
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const updatedUser = {
      ...users[userIndex],
      ...req.body
    };
    
    if (req.file) {
      updatedUser.avatar = `/uploads/${req.file.filename}`;
    }
    
    users[userIndex] = updatedUser;
    
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Endpoint para obter preferências do usuário
app.get('/api/preferences/:userId', (req, res) => {
  const preferencesPath = path.join(__dirname, 'data', 'preferences.json');
  
  try {
    if (!fs.existsSync(preferencesPath)) {
      return res.json({});
    }
    
    const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
    const userPreferences = preferences[req.params.userId] || {};
    res.json(userPreferences);
  } catch (error) {
    console.error('Erro ao ler preferências:', error);
    res.status(500).json({ error: 'Erro ao ler preferências' });
  }
});

// Endpoint para atualizar preferências do usuário
app.put('/api/preferences/:userId', (req, res) => {
  const preferencesPath = path.join(__dirname, 'data', 'preferences.json');
  
  try {
    let preferences = {};
    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
    }
    
    preferences[req.params.userId] = {
      ...preferences[req.params.userId],
      ...req.body
    };
    
    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
    res.json(preferences[req.params.userId]);
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({ error: 'Erro ao atualizar preferências' });
  }
});

// Endpoint para obter restaurantes
app.get('/api/restaurants', (req, res) => {
  const restaurantsPath = path.join(__dirname, 'data', 'restaurants.json');
  
  try {
    if (!fs.existsSync(restaurantsPath)) {
      return res.json([]);
    }
    
    const restaurants = JSON.parse(fs.readFileSync(restaurantsPath, 'utf8'));
    res.json(restaurants);
  } catch (error) {
    console.error('Erro ao ler restaurantes:', error);
    res.status(500).json({ error: 'Erro ao ler restaurantes' });
  }
});

// Endpoint para obter um restaurante específico
app.get('/api/restaurants/:id', (req, res) => {
  const restaurantsPath = path.join(__dirname, 'data', 'restaurants.json');
  
  try {
    if (!fs.existsSync(restaurantsPath)) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }
    
    const restaurants = JSON.parse(fs.readFileSync(restaurantsPath, 'utf8'));
    const restaurant = restaurants.find(r => r.id === parseInt(req.params.id));
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Erro ao ler restaurante:', error);
    res.status(500).json({ error: 'Erro ao ler restaurante' });
  }
});

// Rota para geocodificação
app.post('/api/geocode', async (req, res) => {
  try {
    const { address, key } = req.body;
    
    if (!address || !key) {
      return res.status(400).json({ error: 'Endereço e chave da API são obrigatórios' });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const response = await axios.get(url);

    if (response.data.status !== 'OK') {
      throw new Error(`Erro na API do Google: ${response.data.status}`);
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erro na geocodificação:', error);
    res.status(500).json({ error: 'Erro ao geocodificar endereço' });
  }
});

// Endpoint para obter direções do Google Maps
app.post('/api/directions', async (req, res) => {
  try {
    console.log('Recebendo requisição Directions:', req.body);
    const { origin, destination, key } = req.body;
    
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

// Rota para Distance Matrix API
app.post('/api/distance-matrix', async (req, res) => {
  try {
    console.log('\n=== INICIANDO REQUISIÇÃO DISTANCE MATRIX ===');
    console.log('Body da requisição:', JSON.stringify(req.body, null, 2));
    
    const { origin, destinations, key } = req.body;
    
    if (!origin || !destinations || !key) {
      console.error('Parâmetros inválidos:', { origin, destinations, key: key ? 'presente' : 'ausente' });
      return res.status(400).json({ 
        error: 'Parâmetros inválidos',
        details: {
          hasOrigin: !!origin,
          hasDestinations: !!destinations,
          hasKey: !!key
        }
      });
    }

    // Extrair coordenadas de origem e destino
    const [origin_lat, origin_lng] = origin.split(',').map(coord => parseFloat(coord.trim()));
    const [destination_lat, destination_lng] = destinations.split(',').map(coord => parseFloat(coord.trim()));

    if (isNaN(origin_lat) || isNaN(origin_lng) || isNaN(destination_lat) || isNaN(destination_lng)) {
      console.error('Coordenadas inválidas:', { origin_lat, origin_lng, destination_lat, destination_lng });
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    console.log('Coordenadas extraídas:', {
      origin: { lat: origin_lat, lng: origin_lng },
      destination: { lat: destination_lat, lng: destination_lng }
    });

    // Tentar buscar do cache primeiro
    const matrixCache = require('./services/matrixCacheService');
    console.log('Buscando no cache...');
    const cachedRoute = await matrixCache.findRoute(
      { lat: origin_lat, lng: origin_lng },
      { lat: destination_lat, lng: destination_lng }
    );

    if (cachedRoute) {
      console.log('✅ Rota encontrada no cache:', cachedRoute);
      return res.json({
        status: 'OK',
        source: 'cache',
        rows: [{
          elements: [{
            distance: { value: cachedRoute.distance },
            duration: { value: cachedRoute.duration },
            status: 'OK'
          }]
        }]
      });
    }

    console.log('❌ Rota não encontrada no cache, buscando na API do Google...');
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destinations)}&key=${key}&mode=motorcycle&language=pt-BR&units=metric`;
    
    console.log('URL da requisição Distance Matrix (com key ocultada):', 
      url.replace(key, 'API_KEY_HIDDEN')
    );

    const response = await axios.get(url);
    console.log('Resposta da Distance Matrix API:', response.data);

    if (response.data.status !== 'OK') {
      throw new Error(`Erro na API do Google: ${response.data.status} - ${response.data.error_message || 'Sem mensagem de erro'}`);
    }

    const element = response.data.rows[0].elements[0];
    if (element.status === 'OK') {
      console.log('Salvando rota no cache...');
      const routeToCache = {
        origin_address: response.data.origin_addresses[0] || '',
        origin_lat,
        origin_lng,
        destination_address: response.data.destination_addresses[0] || '',
        destination_lat,
        destination_lng,
        distance: element.distance.value,
        duration: element.duration.value,
        points: []
      };
      
      try {
        const savedRoute = await matrixCache.saveRoute(routeToCache);
        console.log('✅ Rota salva no cache:', savedRoute);
      } catch (cacheError) {
        console.error('❌ Erro ao salvar no cache:', cacheError);
        // Continua mesmo se falhar o cache
      }
    }

    res.json({
      status: 'OK',
      source: 'google',
      rows: response.data.rows
    });
  } catch (error) {
    console.error('Erro na requisição à API do Google:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao calcular distância',
      details: error.response?.data || error.message
    });
  }
});

// Rotas da API
app.use('/api/matrix-cache', matrixCacheRoutes);

// Endpoint para upload de arquivos
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  res.json({
    message: 'Arquivo enviado com sucesso',
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro global:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar o servidor
const server = app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
