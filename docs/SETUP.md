# SETUP — Etapa E0 (Windows 11)

Rode no **PowerShell**, um comando por vez.

## 1. Ferramentas
```
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Microsoft.VisualStudioCode
```
Feche e reabra o PowerShell, depois confira:
```
node -v; npm -v; git --version
```

Configure seu nome no Git (uma vez só):
```
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@gmail.com"
```

## 2. Extensões do VS Code
```
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension toba.vsfire
```

## 3. Contas (grátis)
- GitHub: https://github.com
- Vercel: https://vercel.com (entrar com GitHub)
- Firebase: https://console.firebase.google.com
  1. Criar projeto `torneio-play-da-tarde` (pode desativar Google Analytics).
  2. **Firestore Database** → Criar → modo produção → região `southamerica-east1`.
  3. **Authentication** → Começar → Provedor **Google** → Ativar.
  4. Configurações do projeto (engrenagem) → "Seus apps" → ícone **Web `</>`** → registrar app (sem Hosting) → copiar o objeto `firebaseConfig` (6 valores).

## 4. Scaffold do projeto
A pasta `C:\Projetos\play-da-tarde` já existe com `docs/` — o create-next-app aceita isso.
```
cd C:\Projetos
npx create-next-app@latest play-da-tarde --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Se perguntar algo a mais (Turbopack, React Compiler etc.), aceite o padrão (Enter).

> Se reclamar que a pasta não está vazia: mova `docs` para fora, rode o comando e depois devolva `docs` para dentro.

```
cd play-da-tarde
npm install firebase lucide-react
npm install -D @types/node@24 vitest
npm pkg set scripts.test="vitest run"
```

## 5. Variáveis de ambiente
Criar `C:\Projetos\play-da-tarde\.env.local` com os valores do passo 3.4:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_EMAILS=seu-email@gmail.com
```
(Essas chaves Web do Firebase são públicas por natureza; a proteção real são as Security Rules. O `.env.local` já fica fora do Git.)

## 6. GitHub
Criar no GitHub um repositório **vazio** chamado `play-da-tarde` (sem README), e:
```
git add .
git commit -m "scaffold inicial"
git remote add origin https://github.com/SEU_USUARIO/play-da-tarde.git
git branch -M main
git push -u origin main
```

## 7. Teste da E0
```
npm run dev
```
Abrir http://localhost:3000 → página padrão do Next = **E0 concluída**.
Também rode `npm test` → deve dizer "No test files found" (normal por enquanto).
