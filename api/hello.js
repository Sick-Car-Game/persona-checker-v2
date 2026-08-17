const express = require('express');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS設定
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// UI（トップページ）の配信
const renderUI = (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Persona Checker AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #fafafa;
      --surface: #ffffff;
      --border: #e4e4e7;
      --border-hover: #d4d4d8;
      --text-main: #09090b;
      --text-muted: #71717a;
      --primary: #18181b;
      --primary-hover: #27272a;
      --accent-blue: #2563eb;
      --radius: 12px;
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }

    body {
      background-color: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      width: 100%;
      max-width: 680px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 100px;
      background-color: #eff6ff;
      color: var(--accent-blue);
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      margin-bottom: 16px;
      border: 1px solid #dbeafe;
    }

    h1 {
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--text-main);
      margin-bottom: 12px;
      line-height: 1.25;
    }

    p.subtitle {
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.6;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px;
      box-shadow: var(--shadow-lg);
    }

    .form-group {
      margin-bottom: 24px;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 8px;
    }

    input[type="url"], input[type="text"] {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 0.95rem;
      color: var(--text-main);
      transition: all 0.15s ease;
      outline: none;
    }

    input::placeholder { color: #a1a1aa; }

    input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary);
    }

    button {
      width: 100%;
      background-color: var(--primary);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 14px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s ease, transform 0.05s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    button:hover { background-color: var(--primary-hover); }
    button:active { transform: scale(0.99); }
    button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .loading-state {
      display: none;
      text-align: center;
      padding: 24px 0 8px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .spinner-icon {
      width: 20px;
      height: 20px;
      border: 2px solid #e4e4e7;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    #resultArea {
      margin-top: 32px;
      display: none;
      border-top: 1px solid var(--border);
      padding-top: 28px;
    }

    #resultArea h2 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .result-content {
      white-space: pre-wrap;
      line-height: 1.75;
      font-size: 0.95rem;
      color: #3f3f46;
      background: #f4f4f5;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e4e4e7;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">OpenRouter AI Powered</div>
      <h1>Persona Checker AI</h1>
      <p class="subtitle">ペルソナ視点でLPの構造とメッセージテキストをAIが診断します</p>
    </div>

    <div class="card">
      <div class="form-group">
        <label for="targetUrl">Webサイト URL</label>
        <input type="url" id="targetUrl" placeholder="https://example.com" required>
      </div>

      <div class="form-group">
        <label for="persona">ターゲットペルソナ（任意）</label>
        <input type="text" id="persona" placeholder="例: 30代子育て中の主婦（タイパ・コスパ重視）">
      </div>

      <button id="submitBtn" onclick="analyze()">診断を実行する</button>

      <div id="loadingState" class="loading-state">
        <div class="spinner-icon"></div>
        <span>サイトのテキスト情報を取得してAI解析中... (約5~10秒)</span>
      </div>

      <div id="resultArea">
        <h2>分析結果レポート</h2>
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

      if (!targetUrl) {
        alert('URLを入力してください');
        return;
      }

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

// API診断メイン処理
const handleApi = async (req, res) => {
  try {
    const { targetUrl, persona } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY が設定されていません' });

    // 1. テキスト取得 (Jina Reader API)
    const textRes = await fetch('https://r.jina.ai/' + targetUrl);
    if (!textRes.ok) return res.status(400).json({ error: 'Webサイトのテキスト取得に失敗しました' });
    const websiteText = await textRes.text();

    const promptText = `あなたは『${persona || '20代〜30代の一般消費者（スマホメイン・直感重視）'}』です。
以下の【サイト全体のテキスト情報】を元に、スマホで流し読みした顧客になりきって評価してください。

※注意: テキスト内に「実際に存在する要素」のみを根拠にして指摘してください。

【対象Webサイトのテキスト情報】
${websiteText.slice(0, 3000)}

【出力フォーマット】
■ 第一印象（文章から伝わるイメージ・キャッチコピーの分かりやすさ）:
・テキストを見た直感的な感想（何をしているサイトかパッと分かるか）。

■ 生々しい離脱理由:
・テキスト上のどの部分で「わかりにくい」「怪しい」「自分向けじゃない」と感じて閉じたくなったか。

■ プロの改善提案:
1. 【キャッチコピー・メッセージの修正案】
・ペルソナに刺さる具体的な文言の変更案。
2. 【今すぐできるコンバージョン率UPのアクション】
・オファー（提案）や説明順序の変更など具体的な指示。`;

    // 2. OpenRouter API 呼び出し (安定した無料テキストモデルを使用)
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://persona-checker-v2.onrender.com',
        'X-Title': 'Persona Checker AI'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: promptText }]
      })
    });

    const openRouterData = await openRouterRes.json();
    if (!openRouterRes.ok) return res.status(500).json({ error: openRouterData.error?.message || 'OpenRouter APIエラー' });

    const responseText = openRouterData.choices?.[0]?.message?.content;
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
