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

    const fileName = type === 'x' ? 'ads_x.json' : 'ads_ig.json';

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

    visibleAds.forEach(text => {
        const card = document.createElement('div');
        card.className = 'ad-card';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'نسخ';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.textContent = 'تم!';
                setTimeout(() => copyBtn.textContent = 'نسخ', 1500);
            });
        };

        const p = document.createElement('p');
        p.className = 'ad-text';
        p.textContent = text;

        card.appendChild(copyBtn);
        card.appendChild(p);
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

// Start
init();

