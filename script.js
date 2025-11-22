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

// Preload Logo
const logo = new Image();
logo.crossOrigin = "anonymous";
logo.src = 'taklifaplatform.png';

// Image Generation Style Prompt
// This prompt defines the visual style of the generated images.
// It is combined with the ad text to create the final prompt.
const IMAGE_STYLE = "Professional corporate advertisement, modern minimalist design, high quality business photography, bright natural lighting, 4k resolution, photorealistic, elegant";

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

            // Add Generate Image Button for X and IG
            if (type === 'x' || type === 'ig') {
                const genBtn = document.createElement('button');
                genBtn.className = 'generate-btn';
                genBtn.innerHTML = '🎨 توليد صورة للإعلان';
                genBtn.onclick = () => generateAdImage(item);
                card.appendChild(genBtn);
            }

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

/* ---------- Image Generation Logic ---------- */
async function generateAdImage(text) {
    // Show loading state in modal
    generatedImage.src = ''; // Clear previous
    imageModal.classList.remove('hidden');
    generatedImage.parentElement.innerHTML = '<div class="loading">جاري توليد الصورة... 🎨</div>';

    // Prepare Prompt (Translate roughly or just use text + keywords)
    // Using Pollinations.ai
    // We combine the global style with the specific ad text
    const prompt = encodeURIComponent(`${IMAGE_STYLE}, ${text}`);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=1080&nologo=true`;

    try {
        // Load generated image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Draw to Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Generated Image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Draw Dark Gradient Overlay (for text readability if we added text, but here just for style)
        // Optional: Add a subtle overlay at the top for the logo
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(0,0,0,0.6)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 300);

        // 3. Draw Logo (Upper Center)
        // Logo size: let's say 200px wide
        const logoWidth = 250;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = 50; // Padding from top

        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

        // 4. Update Modal with Result
        const finalImage = canvas.toDataURL('image/png');
        const previewContainer = document.querySelector('.image-preview-container');
        previewContainer.innerHTML = '';
        generatedImage.src = finalImage;
        previewContainer.appendChild(generatedImage);

        // Setup Download Button
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = 'taklifa-ad.png';
            link.href = finalImage;
            link.click();
        };

    } catch (error) {
        console.error('Image Generation Error:', error);
        document.querySelector('.image-preview-container').innerHTML = '<p style="color:red; padding:1rem;">حدث خطأ أثناء توليد الصورة. حاول مرة أخرى.</p>';
    }
}

/* ---------- Modal Listeners ---------- */
function setupModalListeners() {
    closeImageModalBtn.addEventListener('click', () => {
        imageModal.classList.add('hidden');
    });

    // Close on click outside
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

