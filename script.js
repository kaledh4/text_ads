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

/* ---------- PWA Installation ---------- */
// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Check if banner already exists
    if (document.querySelector('.install-banner')) return;

    // Create Banner
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `
        <div class="install-content">
            <div class="install-actions">
                <button id="pwa-install-btn" class="install-btn-confirm">تثبيت</button>
                <button id="pwa-close-btn" class="install-btn-cancel">✕</button>
            </div>
            <div class="install-info">
                <h3>تثبيت تطبيق تكلفة</h3>
                <p>احصل على وصول أسرع للإعلانات اليومية</p>
            </div>
            <div class="install-icon">📱</div>
        </div>
    `;

    document.body.appendChild(banner);

    // Trigger animation
    setTimeout(() => banner.classList.add('visible'), 100);

    // Handle Install
    document.getElementById('pwa-install-btn').addEventListener('click', () => {
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 400);

        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    });

    // Handle Close
    document.getElementById('pwa-close-btn').addEventListener('click', () => {
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 400);
    });
});

/* ---------- Simple YAML Parser Fallback ---------- */
function parseYAMLorJSON(text) {
    // Try JSON first
    try {
        return JSON.parse(text);
    } catch (e) {
        // Continue to YAML
    }

    // If we have js-yaml loaded, use it FIRST (for complex nested structures)
    if (typeof jsyaml !== 'undefined') {
        try {
            const result = jsyaml.load(text);
            console.log('Parsed with jsyaml, result length:', Array.isArray(result) ? result.length : 'not an array');
            return result;
        } catch (e) {
            console.warn('jsyaml parsing failed:', e.message);
        }
    } else if (typeof YAML !== 'undefined') {
        try {
            const result = YAML.load(text);
            console.log('Parsed with YAML, result length:', Array.isArray(result) ? result.length : 'not an array');
            return result;
        } catch (e) {
            console.warn('YAML parsing failed:', e.message);
        }
    }

    // Simple YAML parser for simple arrays (fallback only)
    try {
        if (text.trim().startsWith('- ')) {
            const lines = text.split('\n');
            const result = [];
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('- ')) {
                    let content = trimmed.substring(2);
                    if (content.startsWith('"') && content.endsWith('"')) {
                        content = content.slice(1, -1);
                    }
                    result.push(content);
                }
            }
            return result;
        }
    } catch (simpleYamlError) {
        console.warn('Simple YAML parsing failed:', simpleYamlError.message);
    }

    console.warn('All YAML parsing methods failed, returning empty array');
    return [];
}

/* ---------- Initialization ---------- */
async function init() {
    console.log('Initializing...');
    console.log('YAML library check:', typeof jsyaml !== 'undefined' ? 'jsyaml available' : (typeof YAML !== 'undefined' ? 'YAML available' : 'No YAML library'));

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

    let fileName;
    if (type === 'x') fileName = 'ads_x.yaml';
    else if (type === 'ig') fileName = 'ads_ig.yaml';
    else fileName = 'ads_tiktok.yaml';

    try {
        // Add a timestamp to prevent caching
        const response = await fetch(`${fileName}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('ملف الإعلانات غير موجود');

        const text = await response.text();
        let ads = parseYAMLorJSON(text);

        renderAds(ads, type);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="loading" style="color:red">لم يتم العثور على إعلانات اليوم.<br>يرجى تشغيل سكريبت التوليد (generator.js).</div>`;
    }
}

/* ---------- Rendering ---------- */
function renderAds(ads, type) {
    container.innerHTML = '';

    if (!ads || ads.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد إعلانات متاحة حالياً.</div>';
        return;
    }

    // Show all ads
    ads.forEach((ad, index) => {
        const adCard = document.createElement('div');
        adCard.className = 'ad-card';

        if (type === 'tiktok') {
            // Handle TikTok ads (complex JSON objects)
            const ordinals = ['الاول', 'الثاني', 'الثالث', 'الرابع'];
            const ordinal = ordinals[index] || (index + 1);

            let displayText;
            let copyText;

            if (typeof ad === 'object') {
                // Format the JSON nicely for display
                displayText = JSON.stringify(ad, null, 2);
                copyText = JSON.stringify(ad, null, 2);
            } else {
                displayText = ad;
                copyText = ad;
            }

            adCard.innerHTML = `
                <div class="ad-header">
                    <h3>الاعلان ${ordinal} 🎥</h3>
                </div>
                <div class="ad-content">
                    <pre style="white-space: pre-wrap; font-family: 'Cairo', sans-serif; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; overflow-x: auto; direction: ltr; text-align: left;">${displayText}</pre>
                </div>
                <div class="ad-actions">
                    <button class="action-btn copy-btn-${index}" data-text="${encodeURIComponent(copyText)}">📋 نسخ</button>
                </div>
            `;

            // Add click handler after element is added to DOM
            container.appendChild(adCard);

            const copyBtn = adCard.querySelector(`.copy-btn-${index}`);
            copyBtn.addEventListener('click', function () {
                const text = decodeURIComponent(this.getAttribute('data-text'));
                copyToClipboard(text, this);
            });
        } else {
            // Handle X and Instagram ads
            const ordinals = ['الاول', 'الثاني', 'الثالث', 'الرابع'];
            const ordinal = ordinals[index] || (index + 1);

            adCard.innerHTML = `
                <div class="ad-header">
                    <h3>الاعلان ${ordinal} ${type === 'x' ? '🐦' : '📸'}</h3>
                </div>
                <div class="ad-content">
                    <p>${ad}</p>
                </div>
                <div class="ad-actions">
                    <button class="action-btn" onclick="copyToClipboard('${encodeURIComponent(ad)}', this)">📋 نسخ</button>
                </div>
            `;

            container.appendChild(adCard);
        }
    });
}

function renderLoading() {
    container.innerHTML = `
        <div class="loading">
            جاري تحميل الإعلانات... 📡
        </div>
    `;
}

/* ---------- Storage Logic ---------- */
function loadDailyImageFromStorage(type) {
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_image_${type}_${today}`;
    const savedImage = localStorage.getItem(key);

    if (savedImage) {
        // Render saved image
        const imgElement = document.createElement('img');
        imgElement.src = savedImage;
        imgElement.alt = "Daily Generated Ad (Saved)";

        dailyImageWrapper.innerHTML = '';
        dailyImageWrapper.appendChild(imgElement);

        generateDailyBtn.textContent = '🔄 توليد صورة جديدة (استبدال)';
        generateDailyBtn.disabled = false;

        // Add Download Button
        const downloadSavedBtn = document.createElement('button');
        downloadSavedBtn.className = 'action-btn download-saved-btn';
        downloadSavedBtn.style.marginTop = '10px';
        downloadSavedBtn.style.fontSize = '0.9rem';
        downloadSavedBtn.innerHTML = '📥 تحميل الصورة المحفوظة';
        downloadSavedBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `taklifa-daily-${type}-${today}.png`;
            link.href = savedImage;
            link.click();
        };

        // Clear previous buttons if any
        const existingDownload = dailyImageWrapper.parentElement.querySelector('.download-saved-btn');
        if (existingDownload) existingDownload.remove();

        dailyImageWrapper.parentElement.appendChild(downloadSavedBtn);

    } else {
        resetDailyImageSection();
    }
}

function saveDailyImageToStorage(type, dataUrl) {
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_image_${type}_${today}`;
    localStorage.setItem(key, dataUrl);
}

function resetDailyImageSection() {
    dailyImageWrapper.innerHTML = '<div class="placeholder-image"><span>اضغط لتوليد صورة اليوم</span></div>';
    generateDailyBtn.disabled = false;
    generateDailyBtn.textContent = '✨ توليد صورة حصرية لليوم';

    // Remove download button if exists
    const existingDownload = dailyImageWrapper.parentElement.querySelector('.download-saved-btn');
    if (existingDownload) existingDownload.remove();
}

/* ---------- Daily Image Generation Logic ---------- */
async function generateDailyImage(ads, type) {
    // Set loading state
    dailyImageWrapper.innerHTML = '<div class="loading">جاري توليد صورة اليوم... 🎨</div>';
    generateDailyBtn.disabled = true;
    generateDailyBtn.textContent = '⏳ جاري المعالجة...';

    // Remove download button if exists during generation
    const existingDownload = dailyImageWrapper.parentElement.querySelector('.download-saved-btn');
    if (existingDownload) existingDownload.remove();

    // Construct Prompt
    const dateSeed = new Date().toISOString().split('T')[0];
    const randomSeed = Math.floor(Math.random() * 1000);
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

        // Save to Storage
        saveDailyImageToStorage(type, finalImageSrc);

        // Update UI
        const finalImgElement = document.createElement('img');
        finalImgElement.src = finalImageSrc;
        finalImgElement.alt = "Daily Generated Ad";

        dailyImageWrapper.innerHTML = '';
        dailyImageWrapper.appendChild(finalImgElement);

        // Change button to Download
        generateDailyBtn.textContent = '🔄 توليد صورة جديدة (استبدال)';
        generateDailyBtn.disabled = false;

        // Add Download Button
        const downloadSavedBtn = document.createElement('button');
        downloadSavedBtn.className = 'action-btn download-saved-btn';
        downloadSavedBtn.style.marginTop = '10px';
        downloadSavedBtn.style.fontSize = '0.9rem';
        downloadSavedBtn.innerHTML = '📥 حفظ الصورة';
        downloadSavedBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `taklifa-daily-${type}-${dateSeed}.png`;
            link.href = finalImageSrc;
            link.click();
        };
        dailyImageWrapper.parentElement.appendChild(downloadSavedBtn);

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

// Global copy function for onclick handlers
function copyToClipboard(textOrEncoded, button) {
    // Handle both encoded and plain text
    let text;
    try {
        // Try to decode - if it fails, use as-is
        text = decodeURIComponent(textOrEncoded);
    } catch (e) {
        text = textOrEncoded;
    }

    const original = button.innerHTML;
    navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = '✅ تم النسخ!';
        setTimeout(() => {
            button.innerHTML = original;
        }, 1500);
    }).catch(err => {
        console.error('فشل النسخ:', err);
        button.innerHTML = '❌ خطأ';
        setTimeout(() => {
            button.innerHTML = original;
        }, 1500);
    });
}

// Start
init();
