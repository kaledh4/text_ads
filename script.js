/* -------------------------------------------------
   Daily Ads Viewer
   ------------------------------------------------- */

const container = document.getElementById('ad-container');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageModal = document.getElementById('image-modal');
const generatedImage = document.getElementById('generated-image');
const downloadBtn = document.getElementById('download-btn');
const closeImageModalBtn = document.getElementById('close-image-modal');

// Daily Image Elements
const dailyImageWrapper = document.getElementById('daily-image-wrapper');
const generateDailyBtn = document.getElementById('generate-daily-btn');

// Preload Logo
const logo = new Image();
logo.crossOrigin = "anonymous";
logo.src = 'taklifaplatform.png';

// Image Generation Style Prompt
const IMAGE_STYLE = "Professional corporate advertisement, modern minimalist design, high quality business photography, bright natural lighting, 4k resolution, photorealistic, elegant";

// Brand Context (Summary of text.txt)
const BRAND_CONTEXT = "Digital market app for shops and warehouses to reach customers, instant access, AI-powered product addition, sales growth, mobile application interface";

/* ---------- Initialization ---------- */
function init() {
    // Default to X ads
    loadAds('x');
    setupModalListeners();
}

/* ---------- Logic: Load from JSON ---------- */
async function loadAds(type) {
    renderLoading();

    // Update Theme Classes
    container.classList.remove('theme-x', 'theme-ig', 'theme-tiktok');
    container.classList.add(`theme-${type}`);

    // Reset Daily Image Section
    resetDailyImageSection();

    let fileName;
    if (type === 'x') fileName = 'ads_x.json';
    else if (type === 'ig') fileName = 'ads_ig.json';
    else fileName = 'ads_tiktok.json';

    try {
        // Add a timestamp to prevent caching
        const response = await fetch(`${fileName}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('ملف الإعلانات غير موجود');

        const ads = await response.json();
        renderAds(ads, type);

        // Setup Daily Image Button
        if (type === 'x' || type === 'ig') {
            document.getElementById('daily-image-section').style.display = 'block';
            generateDailyBtn.onclick = () => generateDailyImage(ads, type);
        } else {
            document.getElementById('daily-image-section').style.display = 'none';
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="loading" style="color:red">لم يتم العثور على إعلانات اليوم.<br>يرجى تشغيل سكريبت التوليد (generator.js).</div>`;
    }
}

/* ---------- State ---------- */
let currentAds = [];
let currentIndex = 0;
const ADS_PER_PAGE = 4;

/* ---------- Rendering ---------- */
function renderAds(ads, type) {
    currentAds = ads || [];
    currentIndex = 0;
    updateAdDisplay(type);
}

function updateAdDisplay(type) {
    container.innerHTML = '';

    if (currentAds.length === 0) {
        container.innerHTML = '<p style="text-align:center; opacity:0.7">لا توجد إعلانات متاحة.</p>';
        return;
    }

    // Slice the ads for the current view
    const visibleAds = currentAds.slice(currentIndex, currentIndex + ADS_PER_PAGE);

    visibleAds.forEach(item => {
        const card = document.createElement('div');
        card.className = 'ad-card';

        if (typeof item === 'string') {
            // Standard text ad (X or IG)
            const copyBtn = createCopyButton(item);
            const p = document.createElement('p');
            p.className = 'ad-text';
            p.textContent = item;

            card.appendChild(copyBtn);
            card.appendChild(p);
            // Removed per-ad generate button

        } else {
            // TikTok structured ad
            card.classList.add('tiktok-card');

            if (item.shot) {
                // New JSON format for Video AI
                const title = document.createElement('h3');
                title.textContent = '🎥 AI Video Prompt (JSON)';
                // ... (TikTok logic remains same) ...
                const desc = document.createElement('p');
                desc.style.fontSize = '0.9em';
                desc.style.color = '#555';
                desc.style.marginBottom = '10px';
                desc.textContent = (item.subject && item.subject.description)
                    ? item.subject.description.substring(0, 120) + '...'
                    : 'Video Generation Prompt';

                const copyBtn = createCopyButton(JSON.stringify(item, null, 2));
                copyBtn.textContent = '📋 نسخ كود JSON';
                copyBtn.style.width = '100%';
                copyBtn.style.marginTop = 'auto';

                const pre = document.createElement('pre');
                pre.style.maxHeight = '150px';
                pre.style.overflow = 'auto';
                pre.style.background = '#f4f4f4';
                pre.style.padding = '5px';
                pre.style.fontSize = '0.7em';
                pre.style.borderRadius = '4px';
                pre.textContent = JSON.stringify(item, null, 2);

                card.appendChild(title);
                card.appendChild(desc);
                card.appendChild(pre);
                card.appendChild(copyBtn);

            } else {
                // Old format
                const ideaTitle = document.createElement('h3');
                ideaTitle.textContent = '🎥 فكرة الفيديو:';
                const ideaText = document.createElement('p');
                ideaText.textContent = item.idea;
                const ideaCopy = createCopyButton(item.idea);
                // ... (rest of old tiktok format) ...
                card.appendChild(ideaTitle);
                card.appendChild(ideaText);
                card.appendChild(ideaCopy);
            }
        }

        container.appendChild(card);
    });

    // Add "Shuffle/Change" button if we have more ads
    if (currentAds.length > ADS_PER_PAGE) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-container';

        const shuffleBtn = document.createElement('button');
        shuffleBtn.className = 'action-btn shuffle-btn';
        shuffleBtn.innerHTML = '🔄 تغيير الإعلانات (لم يعجبني)';
        shuffleBtn.onclick = () => {
            currentIndex += ADS_PER_PAGE;
            if (currentIndex >= currentAds.length) {
                currentIndex = 0;
            }
            updateAdDisplay(type);
        };

        actionsDiv.appendChild(shuffleBtn);
        container.appendChild(actionsDiv);
    }
}

function renderLoading() {
    container.innerHTML = `
        <div class="loading">
            جاري تحميل الإعلانات... 📡
        </div>
    `;
}

function resetDailyImageSection() {
    dailyImageWrapper.innerHTML = '<div class="placeholder-image"><span>اضغط لتوليد صورة اليوم</span></div>';
    generateDailyBtn.disabled = false;
    generateDailyBtn.textContent = '✨ توليد صورة حصرية لليوم';
}

/* ---------- Daily Image Generation Logic ---------- */
async function generateDailyImage(ads, type) {
    // Set loading state
    dailyImageWrapper.innerHTML = '<div class="loading">جاري توليد صورة اليوم... 🎨</div>';
    generateDailyBtn.disabled = true;
    generateDailyBtn.textContent = '⏳ جاري المعالجة...';

    // Construct Prompt
    // We combine IMAGE_STYLE + BRAND_CONTEXT + A random seed based on date/type to ensure variety but consistency
    const dateSeed = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const randomSeed = Math.floor(Math.random() * 1000); // Add randomness for "Retry" feel if they click again (actually we reset on loadAds, so this button click is unique)

    // We can try to extract keywords from the first ad if it's text, but BRAND_CONTEXT is safer for quality.
    // Let's add a "vibe" keyword based on the type
    const platformVibe = type === 'x' ? "minimalist, twitter style" : "aesthetic, instagram style, vibrant";

    const prompt = encodeURIComponent(`${IMAGE_STYLE}, ${BRAND_CONTEXT}, ${platformVibe}`);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=1080&nologo=true&seed=${randomSeed}`;

    try {
        // Load generated image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Draw to Canvas for Logo Overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Dark Gradient Overlay
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(0,0,0,0.6)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 300);

        // Draw Logo
        const logoWidth = 250;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = 50;
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

        // Get Final Image Data
        const finalImageSrc = canvas.toDataURL('image/png');

        // Update UI
        const finalImgElement = document.createElement('img');
        finalImgElement.src = finalImageSrc;
        finalImgElement.alt = "Daily Generated Ad";

        dailyImageWrapper.innerHTML = '';
        dailyImageWrapper.appendChild(finalImgElement);

        // Change button to Download
        generateDailyBtn.textContent = '📥 حفظ الصورة';
        generateDailyBtn.disabled = false;
        generateDailyBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `taklifa-daily-${type}-${dateSeed}.png`;
            link.href = finalImageSrc;
            link.click();

            // Reset button after download to allow re-generation
            setTimeout(() => {
                generateDailyBtn.textContent = '🔄 توليد صورة أخرى';
                generateDailyBtn.onclick = () => generateDailyImage(ads, type);
            }, 2000);
        };

    } catch (error) {
        console.error('Image Generation Error:', error);
        dailyImageWrapper.innerHTML = '<p style="color:red; padding:1rem;">حدث خطأ. حاول مرة أخرى.</p>';
        generateDailyBtn.disabled = false;
        generateDailyBtn.textContent = '🔄 محاولة مجدداً';
    }
}

/* ---------- Modal Listeners ---------- */
function setupModalListeners() {
    closeImageModalBtn.addEventListener('click', () => {
        imageModal.classList.add('hidden');
    });

    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.classList.add('hidden');
        }
    });
}

/* ---------- Event Listeners ---------- */
// Tab switching
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        loadAds(btn.dataset.target);
    });
});

// Helper function for copy button
function createCopyButton(text) {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'نسخ';
    btn.onclick = () => {
        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = 'تم!';
            setTimeout(() => btn.textContent = 'نسخ', 1500);
        });
    };
    return btn;
}

// Start
init();

