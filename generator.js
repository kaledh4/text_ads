require('dotenv').config();
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, 'ads_history.db');
const TEXT_FILE = path.join(__dirname, 'text.txt');
const ADS_X_FILE = path.join(__dirname, 'ads_x.yaml');
const ADS_IG_FILE = path.join(__dirname, 'ads_ig.yaml');
const ADS_TIKTOK_FILE = path.join(__dirname, 'ads_tiktok.yaml');

// OpenRouter Configuration
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY; // User requested GitHub Secret

// Model
// User confirmed: x-ai/grok-4.1-fast:free exists and is free.
const PRIMARY_MODEL = "google/gemma-3n-e4b-it:free";

const MODELS_TO_TRY = [
    "google/gemma-3n-e4b-it:free", // Primary free model
    "qwen/qwen3-coder:free",
    "openai/gpt-oss-120b:free",
    "google/gemini-2.0-flash-exp:free"
];

// CREATIVE PROMPT VARIATIONS
const PROMPT_VARIATIONS = [
    "Senior Marketing Strategist",
    "Growth Hacking Expert",
    "Business Development Consultant",
    "Professional Copywriter",
    "Creative Director",
    "Digital Transformation Specialist"
];

// Initialize Database
const db = new sqlite3.Database(DB_PATH);

function initDB() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
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

// RANDOM ELEMENTS
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// RANDOM FOCUS AREAS
function getRandomFocus() {
    const focuses = [
        "تقليل التكاليف التشغيلية وزيادة الأرباح",
        "إدارة المخزون والمبيعات بكفاءة عالية",
        "التحول الرقمي للمتاجر التقليدية بأقل تكلفة",
        "الوصول لعملاء جدد دون مصاريف تسويقية ضخمة",
        "أتمتة العمليات التجارية لتوفير الوقت والجهد",
        "تحليلات دقيقة للمبيعات لاتخاذ قرارات مربحة",
        "ربط الفروع والمستودعات في نظام واحد متكامل",
        "تجربة عميل مميزة تزيد من ولاء الزبائن",
        "حلول دفع ذكية وسريعة لتسريع التدفق النقدي",
        "إدارة الموظفين والورديات بكفاءة واحترافية",
        "تقارير مالية فورية لضبط المصاريف والإيرادات",
        "التوسع في أسواق جديدة باستثمار مدروس",
        "بناء هوية تجارية قوية بتكلفة معقولة",
        "الاستفادة من الذكاء الاصطناعي في نمو الأعمال",
        "حلول لوجستية ذكية لتقليل تكاليف التوصيل"
    ];
    return getRandomElement(focuses);
}

function getRandomCallToAction() {
    const actions = [
        "حمّل التطبيق الآن",
        "سجل مجاناً",
        "ابدأ اليوم",
        "جرّب الآن",
        "انضم إلينا",
        "اكتشف الميزات",
        "اطلب نسختك",
        "احصل عليه الآن"
    ];
    return getRandomElement(actions);
}

async function generateAds() {
    if (!API_KEY) {
        console.error("Error: OPENROUTER_API_KEY not found.");
        process.exit(1);
    }

    const persona = getRandomElement(PROMPT_VARIATIONS);
    const focus = getRandomFocus();
    const callToAction = getRandomCallToAction();

    console.log(`Using model: ${PRIMARY_MODEL}`);
    console.log(`Persona: ${persona}`);
    console.log(`Focus: ${focus}`);

    let context = "";
    try {
        context = fs.readFileSync(TEXT_FILE, 'utf-8');
    } catch (e) {
        console.warn("Warning: text.txt not found or empty.");
    }

    const history = await getRecentAds();

    const prompt = `
    أنت مستشار استراتيجي (Strategic Consultant) ومدير إبداعي (Creative Director) بخبرة عالمية، متخصص في السوق السعودي وقطاع الأعمال (B2B/B2C).
    
    معلومات التطبيق (Context):
    ${context}
    
    التركيز اليومي: ${focus}
    الدعوة للعمل (CTA): ${callToAction}

    تاريخ الإعلانات السابقة (تجنب تكرارها):
    ${history.join('\n')}

    المهمة:
    قم بابتكار محتوى إعلاني احترافي جداً يركز على أقسام المنصة الرئيسية (المتاجر والخدمات) وميزة رفع المنتجات بالذكاء الاصطناعي، مع التركيز على "القيمة مقابل التكلفة" ونمو الأعمال، كالتالي:

    1. **منصة X (تويتر):** 4 تغريدات.
       - الأسلوب: رسمي لكن قريب، يعتمد على الأرقام والحقائق، يخاطب العقل، ويقدم حلولاً لمشاكل التجار.
       - يجب استخدام الهاشتاق #تكلفة.
       - ركز على: التوفير، الكفاءة، النمو، والذكاء في الإدارة.

    2. **إنستقرام (Instagram):** 4 نصوص (Captions).
       - الأسلوب: بصري، ملهم، يركز على "أسلوب حياة التاجر الناجح" (Successful Merchant Lifestyle).
       - استخدم لغة راقية وقوية.
       - ركز على: التطور، الاحترافية، والتميز عن المنافسين.

    3. **تيك توك (TikTok):** 4 أفكار صور إعلانية (Image Prompts) بصيغة JSON.
       - **المدن:** اختر 4 مدن مختلفة من القائمة (الرياض، جدة، الدمام، مكة، الخبر، أبها، العلا) أو مناطق مختلفة من نفس المدينة.
       - **الأسلوب البصري (Visual Style):**
         * يجب أن يكون إعلانان (2) بأسلوب "يد تمسك منصة عرض مصغرة" (Human hand holding a miniature display platform).
         * يجب أن يكون إعلانان (2) بأسلوب "آيزومتريك ثلاثي الأبعاد" (Isometric 3D).
       - **نسبة العرض (Aspect Ratio):** يجب أن تكون جميع الصور بنسبة 9:16 (عمودي) بدقة 1080x1920 بكسل، مناسبة للهواتف المحمولة.
       - **حقل Prompt:** يجب أن يكون **باللغة الإنجليزية فقط** (English Only).
       - **النصوص في الصورة:** يمنع منعاً باتاً طلب نصوص عربية داخل الصورة لتجنب مشاكل الخطوط. النص الوحيد المسموح به هو "Taklifa App" بالإنجليزية.

    ⛔ تحذيرات صارمة (Strict Rules):
    1. **الإملاء:** اكتب اسم التطبيق دائماً "تكلفة" (بالعربي) في النصوص، و "Taklifa" (بالإنجليزي) في الـ Prompt.
    2. **اللغة:** عربية سعودية بيضاء للنصوص (KeyMessages)، وإنجليزية سليمة للـ Prompt.
    3. **التركيز:** كلمة "تكلفة" ليست مجرد اسم، بل هي فلسفة (تقليل التكلفة = زيادة الربح).
    4. **الجودة:** المحتوى يجب أن يبدو وكأنه صادر من وكالة إعلانية عالمية.

    تنسيق المخرجات (JSON Only):
    {
        "x_ads": [
            "نص التغريدة 1...",
            "نص التغريدة 2...",
            "نص التغريدة 3...",
            "نص التغريدة 4..."
        ],
        "ig_ads": [
            "نص إنستقرام 1...",
            "نص إنستقرام 2...",
            "نص إنستقرام 3...",
            "نص إنستقرام 4..."
        ],
        "tiktok_ads": [
            {
                "City": "اسم المدينة (بالعربي)",
                "Prompt": "وصف المشهد بالإنجليزية فقط (English Only). ابدأ بـ 'Create a hyper-realistic vertical phone ad (9:16 aspect ratio, 1080x1920)...'. صف المعالم بدقة. حدد الأسلوب (Hand holding OR Isometric). تأكد من ذكر الأبعاد.",
                "KeyMessages": [
                    "رسالة تسويقية قصيرة 1",
                    "رسالة تسويقية قصيرة 2",
                    "رسالة تسويقية قصيرة 3",
                    "رسالة تسويقية قصيرة 4"
                ],
                "Hashtags": ["هاشتاق1", "هاشتاق2", "هاشتاق3", "هاشتاق4", "هاشتاق5"]
            }
        ]
    }
    
    ⚠️ ملاحظة هامة جداً:
    - يجب أن يكون عدد إعلانات TikTok بالضبط 4 إعلانات.
    - التزم بهيكل JSON أعلاه بدقة متناهية.
    - تأكد أن حقل "SampleOutput" يحتوي على سيناريو *كامل* ومفيد.
    `;

    // Try each model until one succeeds
    let lastError = null;
    for (let i = 0; i < MODELS_TO_TRY.length; i++) {
        const currentModel = MODELS_TO_TRY[i];
        console.log(`Attempting with model ${i + 1}/${MODELS_TO_TRY.length}: ${currentModel}`);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/kaledh4/text_ads',
                    'X-Title': 'Taklifa Ads Generator'
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [{ role: "user", content: prompt }],
                    // response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errText}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            if (!content) throw new Error('Empty response from model');

            // Clean markdown
            content = content.replace(/```json|```/g, '').trim();

            let adsData;
            try {
                adsData = JSON.parse(content);
            } catch (parseError) {
                console.warn(`JSON parse failed: ${parseError.message}. Content: ${content.substring(0, 100)}...`);
                // Attempt simple fix
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    adsData = JSON.parse(jsonMatch[0]);
                } else {
                    throw parseError;
                }
            }

            // Strict Validation
            if (!adsData.x_ads || !Array.isArray(adsData.x_ads) || adsData.x_ads.length === 0) {
                throw new Error('Missing or invalid x_ads');
            }
            if (!adsData.ig_ads || !Array.isArray(adsData.ig_ads) || adsData.ig_ads.length === 0) {
                throw new Error('Missing or invalid ig_ads');
            }
            if (!adsData.tiktok_ads || !Array.isArray(adsData.tiktok_ads) || adsData.tiktok_ads.length === 0) {
                throw new Error('Missing or invalid tiktok_ads');
            }

            // SUCCESS! Save the data
            console.log(`✅ Success with model: ${currentModel}`);

            // Convert to YAML format
            const yaml = require('js-yaml');

            // Save to YAML Files
            fs.writeFileSync(ADS_X_FILE, yaml.dump(adsData.x_ads || [], { indent: 2, lineWidth: -1 }));
            fs.writeFileSync(ADS_IG_FILE, yaml.dump(adsData.ig_ads || [], { indent: 2, lineWidth: -1 }));
            fs.writeFileSync(ADS_TIKTOK_FILE, yaml.dump(adsData.tiktok_ads || [], { indent: 2, lineWidth: -1 }));
            console.log("Saved ads to YAML files.");

            // Save to DB
            saveAdsToDB(adsData.x_ads || [], 'x');
            saveAdsToDB(adsData.ig_ads || [], 'ig');
            saveAdsToDB(adsData.tiktok_ads || [], 'tiktok');
            console.log("Saved ads to SQLite database.");

            // Exit the function successfully
            return;

        } catch (error) {
            lastError = error;
            console.error(`❌ Model ${currentModel} failed:`, error.message);

            // If this isn't the last model, continue to next
            if (i < MODELS_TO_TRY.length - 1) {
                console.log(`Trying next model...`);
                continue;
            }
        }
    }

    // If we get here, all models failed
    console.error("All models failed. Last error:", lastError);
    throw new Error(`All ${MODELS_TO_TRY.length} models failed. Last error: ${lastError.message}`);
}

// Main execution
(async () => {
    try {
        await initDB();
        await generateAds();
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        db.close();
    }
})();
