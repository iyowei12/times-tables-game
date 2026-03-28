# 九九乘法大挑戰

使用 React + Vite 製作的乘法練習遊戲，已調整為可部署到 GitHub Pages。

Repository:

- `https://github.com/iyowei12/times-tables-game`

## 本機開發

```bash
npm install
npm run dev
```

## GitHub Pages 部署

專案已包含 GitHub Actions 自動部署設定。

1. 將專案推到 GitHub repository。
2. 到 repository 的 `Settings > Pages`。
3. 在 `Build and deployment` 中把來源改成 `GitHub Actions`。
4. 之後只要 push 到 `main` 分支，就會自動建置並部署。
5. 部署網址會是 `https://iyowei12.github.io/times-tables-game/`。

部署設定檔：

- `.github/workflows/deploy.yml`
