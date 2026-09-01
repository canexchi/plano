# Plano Alimentar — PWA

App offline de plano alimentar, hidratação e acompanhamento corporal.
HTML/CSS/JS puro: **não tem build, não precisa de Node**. É só servir a pasta.

```
index.html              página única
assets/data.js          o plano prescrito (edite aqui para mudar alimentos)
assets/app.js           lógica: estado, dia lógico, views
assets/styles.css       estilos
manifest.webmanifest    metadados de instalação
sw.js                   service worker (offline)
icons/                  ícones gerados por tools/make_icons.py
```

## Como funciona

- **Dia lógico vira às 05:00.** O que você marcar entre 00:00 e 04:59 conta para o dia anterior.
  Nada é "resetado": cada dia é uma chave separada, então o histórico fica intacto.
  Constante `RESET_HOUR` em `assets/app.js`.
- **Tudo fica no aparelho** (`localStorage`, chave `saude.plano.v1`). Nenhum servidor, nenhuma conta.
  Limpar os dados do navegador apaga tudo → use **Ajustes → Exportar JSON** de vez em quando.
- **Aderência** = refeições concluídas ÷ refeições obrigatórias (café, almoço, lanche, jantar).
  O pré-treino é extra por padrão, para não punir dia sem treino. Dá para mudar em Ajustes.

## Rodar no Mac (teste)

```bash
python3 -m http.server 8765
```

Abra <http://localhost:8765>. O service worker guarda os arquivos em cache: depois de editar
qualquer arquivo, suba a versão de `CACHE` em `sw.js` (ou recarregue duas vezes).

## Instalar no Android

O Chrome só oferece "Instalar app" em origem segura — ou seja, **precisa de uma URL https**
(`http://` na rede local não serve). Publicar é arrastar uma pasta:

1. Abra <https://app.netlify.com/drop>
2. Arraste a pasta `saude` inteira para a página. Sai uma URL `https://algo.netlify.app`.
3. Abra essa URL no Chrome do celular → menu (⋮) → **Instalar app** / *Adicionar à tela inicial*.
4. Ícone na home, abre em tela cheia, funciona offline.

Para atualizar depois: arraste a pasta de novo no mesmo site (ou use GitHub Pages / Cloudflare Pages).

## Virar APK depois (Capacitor)

A pasta já está no formato que o Capacitor consome (`webDir` = raiz). Quando quiser
notificações locais de verdade nos horários das refeições:

```bash
brew install node openjdk
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/local-notifications
npx cap init "Plano Alimentar" app.plano.alimentar --web-dir=.
npx cap add android && npx cap open android   # requer Android Studio
```

Alternativa sem instalar Android Studio: um workflow do GitHub Actions compila o APK na nuvem
e você baixa o artefato.

## Regenerar os ícones

```bash
python3 tools/make_icons.py
```

---
Plano prescrito em 04/07/2022.
