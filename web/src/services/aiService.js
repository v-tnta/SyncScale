const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * プロンプトファイルをFetchして取得するヘルパー関数
 */
async function getSystemPrompt() {
    try {
        // Viteのpublic配下ではなくsrc配下なので、開発環境・本番環境を考慮して動的インポートかRaw Loaderが必要ですが、
        // 今回は直接文字列として保持するか、Viteの ?raw インポートを使うのが確実です。
        // ここでは便宜上、直接 Fetch ではなく Vite の import syntax (!raw) を使って読み込むことを想定した設計に切り替えます。
        // 実際の読み込みは呼び出し元で行います。
        return null; 
    } catch(e) {
        console.error("プロンプト読み込みエラー", e);
        return "";
    }
}

/**
 * Gemini APIへリクエストを送信し、サブタスクの候補3つを取得する
 * @param {string} taskTitle - 現在のタスク名
 * @param {string[]} pastSubTasks - 過去に行ったサブタスク名の配列
 * @param {string} systemPrompt - system.GEMINI から読み込んだプロンプトテキスト
 * @returns {Promise<string[]>} - ['候補1', '候補2', '候補3']
 */
export const fetchSubTaskSuggestions = async (taskTitle, pastSubTasks, systemPrompt) => {
    if (!GEMINI_API_KEY) {
        console.warn("Gemini API Key is not set.");
        return ['作業', '調査', 'MTG']; // Fallback
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${GEMINI_API_KEY}`;
    
    // 過去履歴の文字列化 (重複排除なども一応行う)
    const uniquePastSubTasks = [...new Set(pastSubTasks)];
    const historyText = uniquePastSubTasks.length > 0 ? uniquePastSubTasks.join(', ') : 'なし';

    const promptText = `
${systemPrompt}

---
【入力データ】
タスク名: ${taskTitle}
過去の作業履歴: ${historyText}

【出力】
候補1,候補2,候補3
    `.trim();

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{ text: promptText }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!outputText) {
            throw new Error("Invalid response format from Gemini");
        }

        // カンマ区切りの文字列を配列に変換し、空白を除去
        const suggestions = outputText.split(',').map(s => s.trim()).filter(s => s !== '');
        
        // 3つに満たない場合や多すぎる場合があるため、最大3つまで（あるいはフォールバックで補填）
        const finalSuggestions = suggestions.slice(0, 3);
        
        // 足りない分はデフォルトで埋める
        const defaults = ['作業', '調査', 'MTG'];
        while (finalSuggestions.length < 3) {
            const nextDefault = defaults.find(d => !finalSuggestions.includes(d));
            finalSuggestions.push(nextDefault || 'その他');
        }

        return finalSuggestions;
        
    } catch (error) {
        console.error("Gemini API Fetch Error:", error);
        return ['作業', '調査', 'MTG']; // APIエラー時のフォールバック
    }
};
