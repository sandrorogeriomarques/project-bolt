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

## Gerenciamento de Branches

### Estrutura de Branches

O projeto utiliza três tipos principais de branches:

1. **master (ou main)**
   - Branch principal
   - Contém código estável e testado
   - Representa a versão em produção
   - NUNCA desenvolva diretamente nela

2. **development**
   - Branch de desenvolvimento
   - Onde as features completas são integradas
   - Base para criar novas branches de feature
   - Contém as últimas alterações prontas, mas ainda em teste

3. **Branches temporárias**
   - `feature/*`: para novas funcionalidades
   - `fix/*`: para correções de bugs
   - `hotfix/*`: para correções urgentes em produção
   - Criadas a partir da `development`
   - Excluídas após serem mergeadas

### Comandos Úteis

1. **Verificar branch atual**
```bash
git branch --show-current
```

2. **Listar todas as branches**
```bash
git branch -a
```

3. **Criar nova branch**
```bash
git checkout -b feature/nova-funcionalidade
```

4. **Mudar de branch**
```bash
git checkout nome-da-branch
```

5. **Excluir branch**
```bash
# Modo seguro (só deleta se já foi mergeada)
git branch -d nome-da-branch

# Força a deleção
git branch -D nome-da-branch

# Excluir branch remota
git push origin --delete nome-da-branch
```

### Fluxo de Trabalho

1. **Iniciar nova funcionalidade**
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/nova-funcionalidade
   ```

2. **Desenvolver e commitar**
   ```bash
   git add .
   git commit -m "feat: Implementação da nova funcionalidade"
   ```

3. **Enviar para o GitHub**
   ```bash
   git push origin feature/nova-funcionalidade
   ```

4. **Mergear com development**
   ```bash
   git checkout development
   git merge feature/nova-funcionalidade
   git push origin development
   ```

5. **Mergear com master (após testes)**
   ```bash
   git checkout master
   git merge development
   git push origin master
   ```

## Versionamento (Tags)

### Quando Criar Nova Versão

1. **Mudanças Significativas**
   - Novas funcionalidades completas
   - Correções importantes
   - Melhorias significativas

2. **Padrão Semântico (MAJOR.MINOR.PATCH)**
   - MAJOR (1.0.0): mudanças incompatíveis
   - MINOR (0.1.0): novas funcionalidades compatíveis
   - PATCH (0.0.1): correções de bugs

### Processo de Versionamento

1. **Preparação**
   ```bash
   git checkout master
   git pull origin master
   ```

2. **Criar Tag**
   ```bash
   git tag -a vX.Y.Z -m "Descrição da versão"
   ```

3. **Enviar Tag**
   ```bash
   git push origin vX.Y.Z
   ```

### Boas Práticas de Versionamento

1. **Sempre crie tags na branch master**
2. **Use mensagens descritivas nas tags**
3. **Mantenha um CHANGELOG atualizado**
4. **Documente breaking changes**
5. **Teste antes de criar uma tag**

### Gerenciamento de Tags

1. **Listar tags**
   ```bash
   git tag -l
   ```

2. **Ver detalhes da tag**
   ```bash
   git show vX.Y.Z
   ```

3. **Deletar tag**
   ```bash
   # Local
   git tag -d vX.Y.Z
   
   # Remoto
   git push origin --delete vX.Y.Z
   ```
