const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORSヘッダーの設定
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// GETアクセス時：フロントエンド画面を表示
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ペルソナ視点 LP診断ツール (Vision AI対応)</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0f172a;
      --card-bg: #1e293b;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --text: #f8fafc;
      --text-sub: #94a3b8;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
    body { background-color: var(--bg-color); color: var(--text); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
    .container { width: 100%; max-width: 800px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    h1 { font-size: 1.8rem; font-weight: 700; text-align: center; margin-bottom: 8px; color: #fff; }
    p.subtitle { text-align: center; color: var(--text-sub); font-size: 0.95rem; margin-bottom: 28px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 8px; color: var(--text-sub); }
    input, textarea { width: 100%; background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; color: #fff; font-size: 1rem; transition: border-color 0.2s; }
    input:focus, textarea:focus { outline: none; border-color: var(--accent); }
    button { width: 100%; background: var(--accent); color: white; border: none; border-radius: 8px; padding: 14px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 10px; }
    button:hover { background: var(--accent-hover); }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    #resultArea { margin-top: 32px; display: none; background: #0f172a; border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
    #resultArea h2 { font-size: 1.2rem; margin-bottom: 16px; color: #a5b4fc; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .result-content { white-space: pre-wrap; line-height: 1.7; font-size: 0.95rem; color: #e2e8f0; }
    .spinner { display: none; text-align: center; margin-top: 20px; color: var(--text-sub); font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>ペルソナLP診断ツール</h1>
    <p class="subtitle">テキストとファーストビュー画像の両方をAIが認識して超高精度診断します</p>

    <div class="form-group">
      <label for="targetUrl">診断したいWebサイトのURL</label>
      <input type="url" id="targetUrl" placeholder="https://example.com" required>
    </div>

    <div class="form-group">
      <label for="persona">ペルソナ設定（空欄の場合はデフォルト設定）</label>
      <input type="text" id="persona" placeholder="例: 30代子育て中の主婦（時短重視・コスパに敏感）">
    </div>

    <button id="submitBtn" onclick="analyze()">画像＋テキストで高精度診断する</button>

    <div id="spinner" class="spinner">Webサイトのキャプチャ取得とテキスト解析中...（約10〜15秒）</div>

    <div id="resultArea">
      <h2>診断結果レポート</h2>
      <div id="resultContent" class="result-content"></div>
    </div>
  </div>

  <script>
    async function analyze() {
      const targetUrl = document.getElementById('targetUrl').value.trim();
      const persona = document.getElementById('persona').value.trim();
      const submitBtn = document.getElementById('submitBtn');
      const spinner = document.getElementById('spinner');
      const resultArea = document.getElementById('resultArea');
      const resultContent = document.getElementById('resultContent');

      if (!targetUrl) {
        alert('URLを入力してください');
        return;
      }

      submitBtn.disabled = true;
      spinner.style.display = 'block';
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
        spinner.style.display = 'none';
      }
    }
  </script>
</body>
</html>
  `);
});

// APIメイン処理
const handleApi = async (req, res) => {
  try {
    const { targetUrl, persona } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY が設定されていません');

    // 1. テキストデータとスクショ画像を並行取得
    const [textRes, imgRes] = await Promise.all([
      fetch('https://r.jina.ai/' + targetUrl),
      fetch('https://s.jina.ai/' + targetUrl)
    ]);

    if (!textRes.ok) throw new Error('Webサイトのテキスト取得に失敗しました');
    const websiteText = await textRes.text();

    // 画像をBase64データに変換
    let imageContent = null;
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      imageContent = `data:${contentType};base64,${base64Image}`;
    }

    const promptText = `あなたは『${persona || '20代〜30代の一般消費者（スマホメイン・直感重視）'}』です。
添付された【ファーストビューのスクリーンショット画像】と【サイト全体のテキスト情報】を元に、スマホで流し読みした顧客になりきって評価してください。

※注意: 画像とテキストに「実際に存在する要素」のみを根拠にして指摘してください。存在しない要素を捏造した批判は厳禁です。

【対象Webサイトのテキスト情報】
${websiteText.slice(0, 3000)}

【出力フォーマット】
■ 第一印象（ファーストビューの見た目・3秒で感じたこと）:
・画像を見た直感的な感想（デザイン、文字の読みやすさ、何をしているサイトかパッと分かるか）。

■ 生々しい離脱理由:
・視覚的またはテキスト上のどの部分で「見づらい」「よく分からない」「怪しい」と感じて閉じたくなったか。

■ プロの改善提案:
1. 【キャッチコピー・デザインの修正案】
・画像とテキストを踏まえた具体的な改善ポイント。
2. 【今すぐできるコンバージョン率UPのアクション】
・ボタン位置・装飾・文言など、具体的な指示。`;

    // 2. Groq Vision APIに渡すメッセージ構造を組み立て
    const userContent = [{ type: 'text', text: promptText }];
    if (imageContent) {
      userContent.unshift({
        type: 'image_url',
        image_url: { url: imageContent }
      });
    }

    // 3. Groq API (llama-3.2-11b-vision-preview) 呼び出し
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [{ role: 'user', content: userContent }]
      })
    });

    const groqData = await groqRes.json();
    if (!groqRes.ok) throw new Error(groqData.error?.message || 'Groq APIエラー');

    const responseText = groqData.choices?.[0]?.message?.content;
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
