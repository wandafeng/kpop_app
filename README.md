<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# K-Stan Master 追星大師

一個使用 Google Gemini AI 打造的互動式 K-pop 問答遊戲！測試你對 K-pop 的了解程度。

## 遊戲模式

- **K-POP 猜歌** - 根據歌詞、舞步描述或 MV 情節猜歌名
- **猜人遊戲** - 根據線索猜出是哪位偶像
- **小卡鑑價** - 測試你對 K-pop 小卡市場價格的了解

## 在線遊玩

遊戲已部署到 GitHub Pages，可以直接在線遊玩：
**https://wandafeng.github.io/kpop_app/**

## 本地運行

**前置需求:** Node.js

1. 安裝依賴套件：
   ```bash
   npm install
   ```

2. 設定 API 密鑰：
   - 複製 `.env.local.example` 為 `.env.local`
   - 在 [Google AI Studio](https://aistudio.google.com/apikey) 取得你的 Gemini API 密鑰
   - 將密鑰填入 `.env.local` 文件：
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

4. 打開瀏覽器訪問 `http://localhost:3000`

## 部署到 GitHub Pages

### 首次設定

1. **在 GitHub 上設定 Secret:**
   - 前往你的 GitHub repository
   - 點擊 Settings > Secrets and variables > Actions
   - 點擊 "New repository secret"
   - Name: `GEMINI_API_KEY`
   - Secret: 貼上你的 Gemini API 密鑰
   - 點擊 "Add secret"

2. **啟用 GitHub Pages:**
   - 前往 Settings > Pages
   - Source 選擇 "GitHub Actions"

3. **推送代碼觸發部署:**
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

4. **查看部署進度:**
   - 前往 Actions 標籤頁
   - 等待部署完成（通常需要 1-2 分鐘）
   - 部署完成後，遊戲會自動發布到 `https://<你的用戶名>.github.io/kpop_app/`

## 技術棧

- **前端框架:** React 19 + TypeScript
- **構建工具:** Vite
- **AI 引擎:** Google Gemini 2.5 Flash
- **UI 樣式:** Tailwind CSS
- **圖標:** Lucide React
- **部署:** GitHub Pages + GitHub Actions

## 原始專案

View your app in AI Studio: https://ai.studio/apps/drive/19eYi1uPia-G80_9yuPTwT3kgZhwm3_Sl
