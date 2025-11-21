require('dotenv').config();
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, 'ads_history.db');
const TEXT_FILE = path.join(__dirname, 'text.txt');
const ADS_X_FILE = path.join(__dirname, 'ads_x.json');
const ADS_IG_FILE = path.join(__dirname, 'ads_ig.json');
const ADS_TIKTOK_FILE = path.join(__dirname, 'ads_tiktok.json');
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "google/gemini-2.0-flash-exp:free"; // Or any other model

// Initialize Database
const db = new sqlite3.Database(DB_PATH);

function initDB() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Enable WAL mode for better concurrency/performance
            db.run("PRAGMA journal_mode = WAL;");

            db.run(`
                CREATE TABLE IF NOT EXISTS ads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform TEXT,
                    content TEXT,
                    date TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

function getRecentAds() {
    return new Promise((resolve, reject) => {
        db.all("SELECT content FROM ads ORDER BY created_at DESC LIMIT 20", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.content));
        });
    });
}

function saveAdsToDB(ads, platform) {
    const today = new Date().toISOString().slice(0, 10);
    const stmt = db.prepare("INSERT INTO ads (platform, content, date) VALUES (?, ?, ?)");

    ads.forEach(ad => {
        const contentToSave = typeof ad === 'string' ? ad : JSON.stringify(ad);
        stmt.run(platform, contentToSave, today);
    });

    stmt.finalize();
}

async function generateAds() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("Error: OPENROUTER_API_KEY not found in .env file.");
        process.exit(1);
    }

    console.log("Reading context from text.txt...");
    let context = "";
    try {
        context = fs.readFileSync(TEXT_FILE, 'utf-8');
    } catch (e) {
        console.warn("Warning: text.txt not found or empty.");
    }

    console.log("Fetching recent ads from history...");
    const history = await getRecentAds();

    console.log("Generating new ads with AI...");
    const prompt = `
    أنت خبير تسويق إبداعي ومحترف.
    
    معلومات التطبيق (Context):
    ${context}

    تاريخ الإعلانات السابقة (تجنب تكرارها):
    ${history.join('\n')}

    المطلوب:
    1. قائمة بـ 10 إعلانات قصيرة (تغريدات) لمنصة X.
    2. قائمة بـ 10 إعلانات جذابة لمنصة Instagram.
    3. قائمة بـ 5 أفكار فيديوهات لمنصة TikTok.
    
    الشروط:
    - **يجب ذكر اسم التطبيق "تكلفة" في جميع الإعلانات.**
    - **يجب استخدام الهاشتاق #تكلفة في جميع الإعلانات.**
    - يجب أن يكون كل إعلان نصاً منفصلاً في القائمة.
    - استخدم لهجة سعودية بيضاء جذابة ومشوقة.
    - ركز على الفوائد (زيادة المبيعات، الوصول للعملاء، السهولة).
    - أضف إيموجي وهاشتاقات مناسبة أخرى.
    
    بالنسبة لـ TikTok، كل عنصر يجب أن يحتوي على:
    - idea: فكرة الفيديو (السيناريو).
    - directing: توجيهات للإخراج والتصوير.
    - prompt: وصف دقيق (Prompt) لتوليد صورة مصغرة أو مشهد باستخدام Nano Banana.

    CRITICAL: Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
    Format:
    {
        "x_ads": [
            "نص الإعلان الأول هنا...",
            ...
        ],
        "ig_ads": [
            "نص إعلان انستقرام الأول...",
            ...
        ],
        "tiktok_ads": [
            {
                "idea": "فكرة الفيديو...",
                "directing": "طريقة التصوير...",
                "prompt": "وصف الصورة..."
            },
            ...
        ]
    }
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/videoads',
                'X-Title': 'VideoAds Generator'
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // Clean markdown if present
        content = content.replace(/```json|```/g, '').trim();
        const adsData = JSON.parse(content);

        // Save to Files
        fs.writeFileSync(ADS_X_FILE, JSON.stringify(adsData.x_ads, null, 2));
        fs.writeFileSync(ADS_IG_FILE, JSON.stringify(adsData.ig_ads, null, 2));
        fs.writeFileSync(ADS_TIKTOK_FILE, JSON.stringify(adsData.tiktok_ads, null, 2));
        console.log("Saved ads to JSON files.");

        // Save to DB
        saveAdsToDB(adsData.x_ads, 'x');
        saveAdsToDB(adsData.ig_ads, 'ig');
        saveAdsToDB(adsData.tiktok_ads, 'tiktok');
        console.log("Saved ads to SQLite database.");

    } catch (error) {
        console.error("Generation failed:", error);
    }
}

// Main execution
(async () => {
    try {
        await initDB();
        await generateAds();
    } catch (e) {
        console.error(e);
    } finally {
        db.close();
    }
})();
