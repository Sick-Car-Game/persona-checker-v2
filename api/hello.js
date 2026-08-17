const express = require('express');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

const renderUI = (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Persona Checker AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #fafafa;
      --surface: #ffffff;
      --border: #e4e4e7;
      --text-main: #09090b;
      --text-muted: #71717a;
      --primary: #18181b;
      --primary-hover: #27272a;
      --accent-blue: #2563eb;
      --radius: 12px;
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
    body { background-color: var(--bg); color: var(--text-main); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
    .wrapper { width: 100%; max-width: 680px; }
    .header { text-align: center; margin-bottom: 40px; }
    .badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 100px; background-color: #eff6ff; color: var(--accent-blue); font-size: 0.8rem; font-weight: 600; margin-bottom: 16px; border: 1px solid #dbeafe; }
    h1 { font-size: 2.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px; }
    p.subtitle { color: var(--text-muted); font-size: 1rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; box-shadow: var(--shadow-lg); }
    .form-group { margin-bottom: 24px; }
    label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
    input[type="url"], input[type="text"] { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; font-size: 0.95rem; color: var(--text-main); outline: none; }
    input:focus { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary); }
    button { width: 100%; background-color: var(--primary); color: #ffffff; border: none; border-radius: 8px; padding: 14px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    button:hover { background-color: var(--primary-hover); }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .loading-state { display: none; text-align: center; padding: 24px 0 8px; color: var(--text-muted); font-size: 0.9rem; }
    .spinner-icon { width: 20px; height: 20px; border: 2px solid #e4e4e7; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #resultArea { margin-top: 32px; display: none; border-top: 1px solid var(--border); padding-top: 28px; }
    #resultArea h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }
    .result-content { white-space: pre-wrap; line-height: 1.75; font-size: 0.95rem; color: #3f3f46; background: #f4f4f5; border-radius: 8px; padding: 20px; border: 1px solid #e4e4e7; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">Hugging Face AI Powered</div>
      <h1>Persona Design Checker</h1>
      <p class="subtitle">ペルソナ視点でLPのデザイン・配色・構造をAIが画像診断します</p>
    </div>

    <div class="card">
      <div class="form-group">
        <label for="targetUrl">Webサイト URL</label>
        <input type="url" id="targetUrl" placeholder="https://example.com" required>
      </div>

      <div class="form-group">
        <label for="persona">ターゲットペルソナ（任意）</label>
        <input type="text" id="persona" placeholder="例: 30代女性（おしゃれで洗練された雰囲気を好む）">
      </div>

      <button id="submitBtn" onclick="analyze()">デザイン診断を実行する</button>

      <div id="loadingState" class="loading-state">
        <div class="spinner-icon"></div>
        <span>画像キャプチャ＆デザイン解析中... (約10~15秒)</span>
      </div>

      <div id="resultArea">
        <h2>デザイン分析レポート</h2>
        <div id="resultContent" class="result-content"></div>
      </div>
    </div>
  </div>

  <script>
    async function analyze() {
      const targetUrl = document.getElementById('targetUrl').value.trim();
      const persona = document.getElementById('persona').value.trim();
      const submitBtn = document.getElementById('submitBtn');
      const loadingState = document.getElementById('loadingState');
      const resultArea = document.getElementById('resultArea');
      const resultContent = document.getElementById('resultContent');

      if (!targetUrl) { alert('URLを入力してください'); return; }

      submitBtn.disabled = true;
      loadingState.style.display = 'block';
      resultArea.style.display = 'none';

      try {
        const res = await fetch('/api/hello', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl, persona })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.details || data.error || 'エラーが発生しました');

        resultContent.textContent = data.analysis;
        resultArea.style.display = 'block';
      } catch (err) {
        alert('エラー: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        loadingState.style.display = 'none';
      }
    }
  </script>
</body>
</html>
  `);
};

app.get('/', renderUI);
app.get('/api/hello', renderUI);

const handleApi = async (req, res) => {
  try {
    const { targetUrl, persona } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

    const token = process.env.HF_TOKEN;
    if (!token) return res.status(500).json({ error: 'HF_TOKEN が設定されていません' });

    const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false`;
    const imageRes = await fetch(screenshotUrl);
    const imageData = await imageRes.json();
    const imageUrl = imageData?.data?.screenshot?.url;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Webサイトの画像キャプチャに失敗しました' });
    }

    const promptText = `あなたは『${persona || '20代〜30代の一般消費者'}』視点を持つデザイナーです。
添付のWebサイト画像を見て、以下の項目を日本語で評価・診断してください。

■ 第一印象・配色:
■ 視線誘導・レイアウト:
■ デザインの違和感・離脱原因:
■ 今すぐできる具体的な修正案:`;

    const hfRes = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-7B-Instruct', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          image: imageUrl,
          question: promptText
        }
      })
    });

    const hfData = await hfRes.json();
    if (!hfRes.ok) return res.status(500).json({ error: hfData.error || 'Hugging Face APIエラー' });

    const responseText = Array.isArray(hfData) ? hfData[0]?.generated_text : (hfData.generated_text || JSON.stringify(hfData));
    return res.status(200).json({ analysis: responseText });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message || 'Unknown error' 
    });
  }
};

app.post('/api/hello', handleApi);
app.post('/', handleApi);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
