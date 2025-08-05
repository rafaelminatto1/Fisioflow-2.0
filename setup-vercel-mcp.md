# Configuração do Vercel MCP para Claude Code

## 1. Obter Token da Vercel
1. Acesse: https://vercel.com/account/tokens
2. Crie um novo token com nome "Claude Code MCP"
3. Copie o token gerado

## 2. Configurar MCP Server

```bash
# Navegar para o diretório MCP
cd mcp-vercel-temp

# Criar arquivo de ambiente
echo "VERCEL_API_TOKEN=seu_token_aqui" > .env

# Testar o servidor
npm run start
```

## 3. Conectar no Claude Code

No Claude Code, use um dos comandos:

```bash
# Opção 1: Conectar diretamente
/connect mcp --path "C:\Users\rafal\OneDrive\Documentos\kiro fisio flow 2\Fisioflow-2.0\mcp-vercel-temp\build\index.js"

# Opção 2: Via configuração
claude mcp add-json "vercel" '{"command":"node","args":["C:\\Users\\rafal\\OneDrive\\Documentos\\kiro fisio flow 2\\Fisioflow-2.0\\mcp-vercel-temp\\build\\index.js"]}'
```

## 4. Funcionalidades Disponíveis

O MCP da Vercel oferece:

- **Deployments**: Listar, obter detalhes, criar deploys
- **Projects**: Gerenciar projetos Vercel
- **Teams**: Operações de equipe
- **Environment Variables**: Gerenciar variáveis de ambiente

## 5. Comandos de Exemplo

Após conectar, você pode usar:
- Listar deployments do projeto atual
- Obter informações de um deploy específico
- Gerenciar variáveis de ambiente
- Configurar domínios e aliases

## 6. Próximos Passos

1. ✅ MCP Server instalado e funcionando
2. 🔄 Obter token da Vercel
3. ⏳ Configurar no Claude Code
4. ⏳ Testar integração com o projeto Fisioflow