# Instruções para Execução dos Servidores

Este projeto possui dois servidores que precisam ser executados simultaneamente para o funcionamento completo da aplicação.

## Iniciando os Servidores

1. **Servidor Frontend (React/Vite)**
   ```bash
   # Na pasta raiz do projeto
   npm run dev
   ```
   O servidor frontend será iniciado na porta 5173
   Acesse: http://localhost:5173

2. **Servidor Backend (Upload)**
   ```bash
   # Na pasta raiz do projeto, em outro terminal
   node server/index.js
   ```
   O servidor backend será iniciado na porta 3001

## Parando os Servidores

Para parar qualquer um dos servidores:
1. Vá para o terminal onde o servidor está rodando
2. Pressione `Ctrl + C`
3. Confirme a operação se solicitado

## Observações
- Certifique-se de que ambos os servidores estejam rodando simultaneamente
- Verifique se as portas 5173 e 3001 estão disponíveis antes de iniciar os servidores
- Em caso de erro, verifique se todas as dependências foram instaladas:
  ```bash
  # Na pasta raiz do projeto
  npm install
  
  # Na pasta do servidor
  cd server
  npm install
  ```

## Procedimentos de Versionamento

### Verificar Tags e Status

1. Verificar tags existentes:
```bash
git tag --list
```

2. Verificar status atual do repositório:
```bash
git status
```

3. Verificar branch atual e branches disponíveis:
```bash
git branch
```

### Criar Nova Versão

1. Adicionar alterações ao stage:
```bash
git add .
```

2. Criar commit com as alterações:
```bash
git commit -m "fix: Correção no parseamento de endereços com bairro"
```

3. Criar nova tag (substitua X.Y.Z pela versão adequada):
```bash
git tag -a vX.Y.Z -m "Versão X.Y.Z - Melhorias no parseamento de endereços"
```

### Enviar para o GitHub

1. Enviar commits para o repositório remoto:
```bash
git push origin development
```

2. Enviar tags para o repositório remoto:
```bash
git push origin --tags
```

### Boas Práticas

1. Sempre verifique o status antes de criar uma nova versão
2. Use versionamento semântico (X.Y.Z):
   - X: Mudanças incompatíveis (major)
   - Y: Novas funcionalidades compatíveis (minor)
   - Z: Correções de bugs (patch)
3. Mantenha mensagens de commit descritivas e claras
4. Documente mudanças significativas no CHANGELOG.md

### Rollback (se necessário)

1. Voltar para uma tag específica:
```bash
git checkout vX.Y.Z
```

2. Criar nova branch a partir de uma tag:
```bash
git checkout -b hotfix/vX.Y.Z vX.Y.Z
```
