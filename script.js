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

    // Load Daily Image for this type (if exists)
    loadDailyImageFromStorage(type);

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

            // Only attach listener if not already generated/loaded to avoid double binding or logic errors
            // But we need to update the 'ads' reference for the generator
            // So we just re-assign the onclick
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

        } else {
            // TikTok structured ad
            card.classList.add('tiktok-card');

            if (item.shot) {
                // New JSON format for Video AI
                const title = document.createElement('h3');
                title.textContent = '🎥 AI Video Prompt (JSON)';

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

                const directTitle = document.createElement('h3');
                directTitle.textContent = '🎬 الإخراج:';
                const directText = document.createElement('p');
                directText.textContent = item.directing;
                const directCopy = createCopyButton(item.directing);

                const promptTitle = document.createElement('h3');
                promptTitle.textContent = '🤖 Nano Banana Prompt:';
                const promptText = document.createElement('p');
                promptText.className = 'prompt-text';
                promptText.textContent = item.prompt;
                const promptCopy = createCopyButton(item.prompt);

                card.appendChild(ideaTitle);
                card.appendChild(ideaText);
                card.appendChild(ideaCopy);
                card.appendChild(document.createElement('hr'));
                card.appendChild(directTitle);
                card.appendChild(directText);
                card.appendChild(directCopy);
                card.appendChild(document.createElement('hr'));
                card.appendChild(promptTitle);
                card.appendChild(promptText);
                card.appendChild(promptCopy);
            }
        }

        container.appendChild(card);
    });

    // Add "Shuffle/Change" button if we have more ads
    // Only show if there are actually more ads to show
    if (currentAds.length > ADS_PER_PAGE) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-container';

        const shuffleBtn = document.createElement('button');
        shuffleBtn.className = 'action-btn shuffle-btn';
        shuffleBtn.innerHTML = '🔄 عرض إعلانات أخرى';
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
