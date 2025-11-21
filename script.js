/* -------------------------------------------------
   Daily Ads Viewer
   ------------------------------------------------- */

const container = document.getElementById('ad-container');

/* ---------- Initialization ---------- */
function init() {
    // Default to X ads
    loadAds('x');
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
        renderAds(ads);
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
function renderAds(ads) {
    currentAds = ads || [];
    currentIndex = 0;
    updateAdDisplay();
}

function updateAdDisplay() {
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
                copyBtn.style.marginTop = 'auto'; // Push to bottom

                // Add a pre tag to show a preview of the JSON (optional, but good for verification)
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
                // Idea Section
                const ideaTitle = document.createElement('h3');
                ideaTitle.textContent = '🎥 فكرة الفيديو:';
                const ideaText = document.createElement('p');
                ideaText.textContent = item.idea;
                const ideaCopy = createCopyButton(item.idea);

                // Directing Section
                const directTitle = document.createElement('h3');
                directTitle.textContent = '🎬 الإخراج:';
                const directText = document.createElement('p');
                directText.textContent = item.directing;
                const directCopy = createCopyButton(item.directing);

                // Prompt Section
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
            // Move to next batch, or loop back to start
            currentIndex += ADS_PER_PAGE;
            if (currentIndex >= currentAds.length) {
                currentIndex = 0;
            }
            updateAdDisplay();
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

/* ---------- Event Listeners ---------- */
// Tab switching
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        loadAds(btn.dataset.target);
    });
});

// Remove settings button logic if it exists in HTML (we will clean HTML next)
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) settingsBtn.style.display = 'none';

const modal = document.getElementById('settings-modal');
if (modal) modal.remove();

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

