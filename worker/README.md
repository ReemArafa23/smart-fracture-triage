# المساعد الذكي: تشغيل الوسيط (Cloudflare Worker)

الصفحة بتبعت السؤال + ملخص الحالة (من غير الصورة) للـ Worker، والـ Worker بيضيف مفتاح Gemini ويرد.
المفتاح محفوظ **جوه Cloudflare بس**، مش في كود الصفحة ولا على GitHub.

## 1) مفتاح Gemini (دقيقتين)
1. ادخل https://aistudio.google.com وسجّل بحساب Google.
2. **Get API key ← Create API key**.
3. انسخ المفتاح (بيبدأ بـ `AIza...`).

## 2) الـ Worker (5 دقايق)
1. اعمل حساب مجاني على https://dash.cloudflare.com
2. **Workers & Pages ← Create ← Create Worker** ← سمّيه مثلاً `fracture-assistant` ← **Deploy**.
3. **Edit code** ← امسح الكود اللي فيه والزق محتوى `worker.js` ← **Deploy**.
4. **Settings ← Variables and Secrets ← Add**:
   - `GEMINI_API_KEY` ← نوعه **Secret** ← الصق المفتاح.
   - `ALLOWED_ORIGINS` ← نوعه **Text** ← `https://reemarafa23.github.io` (أو رابط الموقع الجديد).
   - (اختياري) `GEMINI_MODEL` ← `gemini-2.5-flash`.
5. انسخ رابط الـ Worker (شكله `https://fracture-assistant.xxxx.workers.dev`).

## 3) الربط بالصفحة
**أسهل طريقة (لكل اللي يفتح الموقع):** ضيف السطر ده في `config.json`:
`"assistant_url": "https://fracture-assistant.xxxx.workers.dev"`

أو لجهاز واحد بس: افتح الصفحة ← **الإعدادات** ← الصق الرابط في **رابط المساعد الذكي** ← **حفظ**.
لو الخانة فاضية، المساعد بيشتغل بردود تجريبية جاهزة.

> المجاني في Cloudflare: 100,000 طلب في اليوم. والـ Worker بيرفض أي طلب من موقع غير اللي في `ALLOWED_ORIGINS`.
