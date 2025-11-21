# إعلانات يومية لتطبيقك – static site

## ما هو المشروع؟
موقع ثابت يُظهر 8 إعلانات عربية يومية لتغريدات X و4 إعلانات إنستقرام، مع زر نسخ جاهز. لا يحتاج إلى خادم، ويمكن استضافته مجانًا على **GitHub Pages**.

## خطوات النشر (دون أي تكلفة)

1. **إنشاء مستودع جديد على GitHub**
   - اسم المستودع (مثلاً `daily-ads`).
   - لا تقم بإنشاء ملف README جديد إذا تريد استبداله بالملفات الموجودة.

2. **دفع الملفات إلى المستودع**
   ```bash
   cd "C:\Users\Administrator\Desktop\VIDEOADS"
   git init
   git remote add origin https://github.com/USERNAME/daily-ads.git
   git add .
   git commit -m "Initial commit – static ad site"
   git push -u origin master
   ```

3. **تفعيل GitHub Pages**
   - افتح المستودع على GitHub → **Settings** → **Pages**.
   - تحت **Source** اختر `Branch: main` (أو `master`) و **Folder: /**.
   - احفظ. سيظهر لك رابط مثل `https://USERNAME.github.io/daily-ads/`.

4. **التحقق**
   - افتح الرابط في المتصفح. يجب أن ترى الواجهة العربية الفاخرة مع الإعلانات.
   - كلما غيرت التاريخ على جهازك، سيظهر مجموعة إعلانات جديدة (مستندة إلى `localStorage`).

## تخصيص النصوص أو إضافة “AI حقيقي”

إذا وجدت خدمة مجانية لتوليد النصوص (مثل نموذج 🤗 HuggingFace المجاني)، استبدل الدالة `generateAd()` في `script.js` بـ:

```js
async function generateAd() {
    const response = await fetch('https://api-inference.huggingface.co/models/your-model', {
        method: 'POST',
        headers: { Authorization: 'Bearer YOUR_TOKEN' },
        body: JSON.stringify({ inputs: "اكتب إعلان عربي لتطبيق..." })
    });
    const data = await response.json();
    return data[0].generated_text;
}
```

ثم أعد بناء الموقع (ليس هناك خطوة بناء فعلية؛ فقط أعد رفع الملفات إلى GitHub).

## ملاحظات إضافية
- **اللغة العربية**: تم اختيار خط “Cairo” من Google Fonts لدعم الحروف العربية بوضوح.
- **الخصوصية**: لا يتم إرسال أي بيانات إلى خوادم خارجية (إلا إذا قمت بتبديل `generateAd` إلى API خارجي).
- **الأداء**: كل شيء يُحمَّل من ملفات ثابتة صغيرة، لذا زمن التحميل < 1 ثانية على معظم الشبكات.
