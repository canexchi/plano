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
- **O plano alimentar é só consulta.** Não existe marcar refeição como feita — é um guia de
  o que comer e quanto, com os substitutos. O que o app registra é **água e corpo**.
- **Histórico** acompanha hidratação: média por dia, dias seguidos batendo a meta e % de dias na meta.

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

## APK (Android nativo)

O APK é compilado na nuvem pelo GitHub Actions — nada de Node, JDK ou Android Studio no Mac.
O workflow está em `.github/workflows/apk.yml` e roda a cada push no `main`.

Para baixar: repositório → aba **Actions** → clique na execução mais recente → em *Artifacts*,
baixe **plano-apk**. Vem um `.zip`; dentro está o `app-debug.apk`.

Para instalar no celular: mande o `.apk` para o aparelho (Drive, Telegram, cabo), abra pelo
gerenciador de arquivos e autorize *"instalar apps de fontes desconhecidas"* quando ele pedir.

É um APK de debug, assinado com a chave de debug do Android — instala normalmente,
mas não serve para publicar na Play Store.

Peças envolvidas:

- `package.json` / `capacitor.config.json` — configuração do Capacitor (`webDir` = `www`)
- `branding/android/` — ícones do app, gerados por `tools/make_icons.py`
- a pasta `www/` é montada durante o build; não fica versionada

## Regenerar os ícones

```bash
python3 tools/make_icons.py
```

---
Plano prescrito em 04/07/2022.
