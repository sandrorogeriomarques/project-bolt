const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const port = 8081;

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
    console.log('Recebendo requisição Distance Matrix:', req.body);
    const { origin, destinations, key } = req.body;
    
    if (!origin || !destinations || !key) {
      return res.status(400).json({ 
        error: 'Parâmetros inválidos',
        details: {
          hasOrigin: !!origin,
          hasDestinations: !!destinations,
          hasKey: !!key
        }
      });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destinations)}&key=${key}&mode=motorcycle&language=pt-BR&units=metric`;
    
    console.log('URL da requisição Distance Matrix (com key ocultada):', 
      url.replace(key, 'API_KEY_HIDDEN')
    );

    const response = await axios.get(url);
    console.log('Resposta da Distance Matrix API:', {
      status: response.data.status,
      rows: response.data.rows?.length || 0,
      elements: response.data.rows?.[0]?.elements?.length || 0
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Erro na API do Google: ${response.data.status} - ${response.data.error_message || 'Sem mensagem de erro'}`);
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erro na requisição Distance Matrix:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao calcular matriz de distância',
      details: error.response?.data || error.message 
    });
  }
});

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
