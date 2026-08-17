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
  <title>Design Persona Checker</title>
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
      <div class="badge">API Key-Free Local Analyzer</div>
      <h1>Persona Structure Checker</h1>
      <p class="subtitle">APIキー不要・完全独立でWebサイトの構造・訴求内容を即座に解析します</p>
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

      <button id="submitBtn" onclick="analyze()">ペルソナ診断を実行する</button>

      <div id="loadingState" class="loading-state">
        <div class="spinner-icon"></div>
        <span>Web構造解析中...</span>
      </div>

      <div id="resultArea">
        <h2>分析レポート</h2>
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

    // Jina ReaderでWebサイトの内容（テキスト・Markdown構造）を取得
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const jinaRes = await fetch(jinaUrl);
    
    if (!jinaRes.ok) {
      return res.status(400).json({ error: '対象のWebサイト情報を取得できませんでした' });
    }

    const rawText = await jinaRes.text();
    const lines = rawText.split('\n').filter(l => l.trim() !== '');

    // タイトルや見出しを簡易抽出
    const title = lines.find(l => l.startsWith('Title:') || l.startsWith('# ')) || '（タイトル取得不可）';
    const headings = lines.filter(l => l.startsWith('#') || l.startsWith('##')).slice(0, 5);
    const textLength = rawText.length;

    const personaLabel = persona ? `『${persona}』` : '設定されたペルソナ';

    // 外部AIを使わずに確定的なレポートを作成
    const report = `【${personaLabel} 視点による構造・テキスト診断レポート】

■ 第一印象・メインキャッチコピー:
・検出された主要テキスト: ${title.replace('Title:', '').replace('#', '').trim()}
・評価: 初速で何を提供するサービスかが明確に伝わるかがポイントです。ペルソナが期待する価値（利便性・価格・信頼感など）がこの一文に含まれているか確認してください。

■ サイト構成・情報の流れ（見出し構造）:
${headings.length > 0 ? headings.map(h => '・' + h.replace(/^#+\s*/, '')).join('\n') : '・主な見出し構造の検出が少ないか、画像ベースの可能性があります。'}
・評価: 見出しを追うだけで全貌が把握できる構成が理想です。見出し間の論理展開が飛躍していないか注意してください。

■ ペルソナ視点での離脱・疑問懸念点:
・文章量/情報密度: 約 ${textLength} 文字検出
・懸念: 情報が多すぎる場合は「要点が絞られていない」と感じられ、少なすぎる場合は「信頼性が不足している」と判断されるリスクがあります。

■ 改善のための推奨アクション:
1. ファーストビューの見出しにペルソナの悩みを解決するベネフィット（利得）を直接記載する。
2. 信頼性を補強するための第三者実績や口コミ・FAQをコンテンツ中盤に配置する。
3. 行動を促すボタン（CTA）がスクロール途中で見失われないよう、視覚的なコントラストを高める。`;

    return res.status(200).json({ analysis: report });

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
