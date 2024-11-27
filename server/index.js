const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Configurar CORS
app.use(cors());

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
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
    console.log('Salvando arquivo em:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    console.log('Nome do arquivo:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  }
}).single('file');

// Servir arquivos estáticos da pasta public
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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

      console.log('Arquivo recebido:', req.file);
      const type = req.body.type || 'avatar';
      const relativePath = path.join('/uploads', type === 'avatar' ? 'avatars' : 'receipts', req.file.filename);
      console.log('Caminho do arquivo:', relativePath);
      
      res.json({ path: relativePath });
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      res.status(500).json({ error: 'Erro ao processar o arquivo' });
    }
  });
});

// Rota para análise de imagem (mock por enquanto)
app.post('/analyze', upload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    // Mock da análise de imagem
    const mockText = `
      NOTA FISCAL
      Pedido: #123456
      Data: 01/01/2024
      Total: R$ 150,00
      
      ITENS:
      1x Produto A - R$ 50,00
      2x Produto B - R$ 100,00
      
      LOJA:
      Nome: Loja Exemplo
      CNPJ: 12.345.678/0001-90
      Endereço: Rua Exemplo, 123
    `;

    res.json({ text: mockText });
  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    res.status(500).json({ error: 'Erro ao analisar imagem' });
  }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${port}`);
  console.log('Para acessar de outros dispositivos na rede, use o IP da máquina');
});
