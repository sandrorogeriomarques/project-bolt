const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');

const app = express();
const port = 8081;

// Configurar CORS
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

// Endpoint para obter direções do Google Maps
app.post('/api/directions', async (req, res) => {
  try {
    const { origin, destination, key } = req.body;
    
    console.log('Recebendo requisição de direções:', {
      origin,
      destination,
      key: key ? 'presente' : 'ausente'
    });

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${key}`;
    console.log('URL da requisição:', url);
    
    const response = await axios.get(url);
    console.log('Resposta do Google Maps:', response.data);

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao obter direções:', error.message);
    res.status(500).json({ 
      error: 'Erro ao obter direções',
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
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
