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
const PRIMARY_MODEL = "x-ai/grok-4.1-fast:free";

const MODELS_TO_TRY = [
    "x-ai/grok-4.1-fast:free", // Primary free model
    "x-ai/grok-2-1212", // Fallback standard
    "google/gemini-2.0-flash-exp:free", // Free fallback
    "meta-llama/llama-3.3-70b-instruct:free" // Another free fallback
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
    قم بابتكار محتوى إعلاني احترافي جداً (Professional & High-End) يركز على "القيمة مقابل التكلفة" (Value for Money) ونمو الأعمال، كالتالي:

    1. **منصة X (تويتر):** 4 تغريدات.
       - الأسلوب: رسمي لكن قريب، يعتمد على الأرقام والحقائق، يخاطب العقل، ويقدم حلولاً لمشاكل التجار.
       - يجب استخدام الهاشتاق #تكلفة.
       - ركز على: التوفير، الكفاءة، النمو، والذكاء في الإدارة.

    2. **إنستقرام (Instagram):** 4 نصوص (Captions).
       - الأسلوب: بصري، ملهم، يركز على "أسلوب حياة التاجر الناجح" (Successful Merchant Lifestyle).
       - استخدم لغة راقية وقوية.
       - ركز على: التطور، الاحترافية، والتميز عن المنافسين.

    3. **تيك توك (TikTok):** 4 أفكار فيديوهات (Video Concepts) بصيغة JSON تفصيلية.
       - الهدف: كل فيديو يجب أن يكون له "هدف تجاري واضح" (Clear Business Goal) ورسالة قوية عن "التكلفة والعائد".
       - الأسلوب: تعليمي، قصص نجاح واقعية، أو نصائح بزنس سريعة.
       - تجنب الكوميديا المبتذلة، ركز على المحتوى القيمي (Educational/Value-based Content).

    ⛔ تحذيرات صارمة (Strict Rules):
    1. **الإملاء:** اكتب اسم التطبيق دائماً "تكلفة" (بالعربي).
    2. **اللغة:** عربية سعودية بيضاء، احترافية جداً (Professional Tone)، خالية من الأخطاء.
    3. **التركيز:** كلمة "تكلفة" ليست مجرد اسم، بل هي فلسفة (تقليل التكلفة = زيادة الربح). العب على هذا المعنى.
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
                "Objective": "الهدف التجاري (مثلاً: توعية، زيادة مبيعات، بناء ثقة)",
                "InputContent": {
                    "Scene": "وصف المشهد الافتتاحي بدقة",
                    "Text": "النص الظاهر على الشاشة (Hook)"
                },
                "PersonaDetails": {
                    "Audience": "الفئة المستهدفة (مثلاً: أصحاب المطاعم، تجار التجزئة)",
                    "Tone": "نبرة الصوت (مثلاً: خبير، موجه، ملهم)"
                },
                "TaskInstructions": [
                    "توجيه للممثل/المصمم 1",
                    "توجيه للممثل/المصمم 2"
                ],
                "ResponseFormat": {
                    "SceneDescription": "وصف تسلسل الفيديو",
                    "KeyMessage": "الرسالة الجوهرية (Core Message)",
                    "Hashtags": ["هاشتاقات"],
                    "CallToAction": "CTA قوي"
                },
                "SampleOutput": {
                    "SceneDescription": "سيناريو كامل للفيديو من البداية للنهاية",
                    "KeyMessage": "جملة تلخص الفائدة المالية/الإدارية (مثلاً: وفر 20% من تكاليفك)",
                    "Hashtags": ["تكلفة", "بزنس", "نصائح_تجارية"],
                    "CallToAction": "رابط التحميل في البايو"
                }
            }
        ]
    }
    
    ⚠️ ملاحظة هامة جداً:
    - يجب أن يكون عدد إعلانات TikTok بالضبط 4 إعلانات.
    - التزم بهيكل JSON أعلاه بدقة متناهية.
    - تأكد أن حقل "SampleOutput" يحتوي على سيناريو *كامل* ومفيد.
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/kaledh4/text_ads', // Optional, for OpenRouter rankings
                'X-Title': 'Taklifa Ads Generator'
            },
            body: JSON.stringify({
                model: PRIMARY_MODEL,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" } // Force JSON if supported
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

    } catch (error) {
        console.error("Generation failed:", error);
        process.exit(1);
    }
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
