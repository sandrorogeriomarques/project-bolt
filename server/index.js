const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8081;

// Configurar CORS para aceitar todas as origens em desenvolvimento
app.use(cors({
  origin: true, // Aceita qualquer origem em desenvolvimento
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache de preflight por 24 horas
}));

// Middleware para logs detalhados
app.use((req, res, next) => {
  console.log('=== Requisição recebida ===');
  console.log('Método:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('========================');
  next();
});

// Configurar os diretórios de uploads
const uploadsBaseDir = path.join(__dirname, '../public/uploads');
const avatarsDir = path.join(uploadsBaseDir, 'avatars');
const receiptsDir = path.join(uploadsBaseDir, 'receipts');

// Criar diretórios se não existirem
[avatarsDir, receiptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log('Criando diretório:', dir);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configurar o Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type || 'avatar';
    const uploadDir = type === 'avatar' ? avatarsDir : receiptsDir;
    console.log('Configuração de upload:', {
      type: type,
      uploadDir: uploadDir,
      file: {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype
      }
    });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    console.log('Gerando nome do arquivo:', {
      originalName: file.originalname,
      extension: ext,
      generatedName: filename
    });
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Use JPEG, PNG ou WebP.'));
    }
  }
}).single('file');

// Servir arquivos estáticos da pasta public
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
  }
}));

// Rota para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de upload está rodando' });
});

// Rota para verificar se a pasta de uploads está acessível
app.get('/uploads/avatars', (req, res) => {
  try {
    const files = fs.readdirSync(avatarsDir);
    res.json({ status: 'ok', files });
  } catch (error) {
    console.error('Erro ao acessar diretório de avatars:', error);
    res.status(500).json({ error: 'Erro ao acessar diretório de avatars' });
  }
});

// Rota para upload de arquivos
app.post('/upload', (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Erro do Multer:', err);
      return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    } else if (err) {
      console.error('Erro desconhecido:', err);
      return res.status(500).json({ error: `Erro desconhecido: ${err.message}` });
    }

    try {
      if (!req.file) {
        console.error('Nenhum arquivo recebido');
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      console.log('Arquivo recebido:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });

      const type = req.body.type || 'avatar';
      const relativePath = path.join('/uploads', type === 'avatar' ? 'avatars' : 'receipts', req.file.filename)
        .replace(/\\/g, '/'); // Substituir backslashes por forward slashes
      
      console.log('Caminho do arquivo:', {
        absolutePath: req.file.path,
        relativePath: relativePath
      });
      
      res.json({ path: relativePath });
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      res.status(500).json({ error: 'Erro ao processar o arquivo' });
    }
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro global:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar o servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${port}`);
  console.log('Para acessar de outros dispositivos na rede, use o IP da máquina');
});
