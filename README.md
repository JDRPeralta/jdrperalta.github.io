# MarketBarrio (React + GitHub Pages)

Este repo está listo para publicarse en **GitHub Pages** usando **GitHub Actions**.

## Ejecutar localmente
```bash
npm install
npm run dev
```

## Publicar en GitHub Pages (User Site: https://jdrperalta.github.io/)
1. Crea un repositorio llamado **jdrperalta.github.io**
2. Sube TODO el contenido de este proyecto a la raíz del repo (branch **main**)
3. En GitHub: **Settings → Pages → Source: GitHub Actions**
4. Ve a **Actions** y espera a que termine el workflow ✅
5. Abre: https://jdrperalta.github.io/

## Notas
- El carrito y los pedidos se guardan en `localStorage`.
- `vite.config.js` tiene `base: "/"` (correcto para User Site).
