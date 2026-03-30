# 九九乘法大挑戰

一個使用 React + Vite 製作的九九乘法練習遊戲，主打節奏感、即時回饋與適合小朋友操作的互動體驗。

線上版本：

- `https://iyowei12.github.io/times-tables-game/`

Repository：

- `https://github.com/iyowei12/times-tables-game`

## 專案特色

- 提供多種遊戲模式：混合模式、單題限時、總時挑戰、無限模式、生存模式
- 可指定 `2 ~ 9` 的乘法題組進行練習
- 內建分數、連擊、正確率與結果評語
- 支援鍵盤輸入，適合桌機與平板操作
- 具備音效與完成動畫回饋
- 已加入 PWA 設定，可安裝成接近 App 的體驗
- 已設定 GitHub Pages 部署路徑與 GitHub Actions 自動部署流程

## 技術棧

- React 19
- Vite 8
- Framer Motion
- Lucide React
- Tailwind CSS 4
- `vite-plugin-pwa`

## 本機開發

安裝依賴：

```bash
npm install
```

啟動開發伺服器：

```bash
npm run dev
```

若要讓區域網路中的其他裝置也能連線測試：

```bash
npm run dev:host
```

## 可用指令

```bash
npm run dev
npm run dev:host
npm run build
npm run preview
npm run lint
```

## 遊戲模式

- `混合模式`：全部題目混合練習
- `單題限時`：每一題都有倒數時間
- `總時挑戰`：在總時限內完成更多題目
- `無限模式`：持續作答並累積高分
- `生存模式`：答錯或超時就結束，節奏會越來越快


## 專案結構

```text
src/
  components/   畫面與 UI 元件
  constants/    題目與遊戲常數
  hooks/        遊戲狀態與音效邏輯
  utils/        出題與計分工具
```

## 建置與部署

建立正式版：

```bash
npm run build
```

產生的靜態檔案會輸出到 `dist/`。

## GitHub Pages 部署

本專案已包含 GitHub Actions 自動部署設定，並且 Vite `base` 已設定為：

```txt
/times-tables-game/
```

部署步驟：

1. 將專案推到 GitHub repository。
2. 到 repository 的 `Settings > Pages`。
3. 在 `Build and deployment` 中把來源改成 `GitHub Actions`。
4. 之後只要 push 到 `main` 分支，就會自動建置並部署。
5. 部署網址會是 `https://iyowei12.github.io/times-tables-game/`。

相關檔案：

- `.github/workflows/deploy.yml`
- `vite.config.js`

## 備註

- PWA 在開發模式也有啟用設定，方便本機測試安裝流程
- 若更換 GitHub repository 名稱，記得同步修改 `vite.config.js` 的 `base`
