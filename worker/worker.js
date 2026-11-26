// =====================================================================
// وسيط المساعد الذكي (Cloudflare Worker)
// الصفحة بتبعت السؤال هنا ← الـ Worker يضيف مفتاح Gemini (محفوظ كـ Secret) ← يكلم Gemini ← يرجع الرد
// المفتاح عمره ما بيظهر في كود الصفحة ولا على GitHub
//
// الإعدادات (Settings → Variables and Secrets):
//   GEMINI_API_KEY   (Secret)  مفتاح Gemini من Google AI Studio
//   ALLOWED_ORIGINS  (Text)    المواقع المسموح لها، مفصولة بفاصلة — مثال: https://reemarafa23.github.io
//   GEMINI_MODEL     (Text, اختياري)  اسم الموديل — الافتراضي gemini-2.5-flash
// =====================================================================

const SYSTEM = `You are the assistant inside "Smart Fracture Triage" (فرز الكسور الذكي), an educational web page that sorts pediatric hand/wrist X-rays by fracture suspicion.
How the page works:
- A DenseNet121 model (trained on the GRAZPEDWRI-DX dataset of pediatric wrist X-rays) outputs a fracture probability.
- Colours: red = strong suspicion (urgent), yellow = uncertain (needs a doctor's look), green = likely normal. Thresholds are in context.model.levels.
- Grad-CAM heat map: shows where the model looked (illustrative, not an exact location).
- YOLOv8 draws red boxes where it sees the fracture, with a confidence percentage.
- The doctor reviews, chooses a decision (confirm fracture / no fracture / needs more imaging) and adds notes.
Rules:
- Answer in the user's language (context lang: "ar" = Arabic, "en" = English). Keep answers short and clear (max ~120 words), use simple bullets when helpful.
- Use the JSON context (open case, worklist, model metrics) to give specific answers. Never invent numbers that are not in the context.
- You do NOT diagnose and you never see the image. Always remind that the final decision is the doctor's when discussing a specific case.
- For urgent medical concerns, advise contacting a doctor or emergency services.
- Stay on topic (this page, X-ray triage, the models, fractures in general). Politely decline unrelated requests.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const ok = allowed.length === 0 || allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": ok ? origin || "*" : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8"
    };
    const reply = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: cors });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply({ error: "POST only" }, 405);
    if (!ok) return reply({ error: "origin not allowed" }, 403);              // مواقع تانية مش مسموح لها
    if (!env.GEMINI_API_KEY) return reply({ error: "GEMINI_API_KEY is not set" }, 500);

    let body;
    try { body = await request.json(); } catch { return reply({ error: "bad json" }, 400); }

    // آخر 12 رسالة بس، وكل رسالة بحد أقصى 1500 حرف (حماية من الإساءة والتكلفة)
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
      .filter(m => m && typeof m.text === "string" && m.text.trim())
      .map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text.slice(0, 1500) }] }));
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return reply({ error: "no question" }, 400);
    const context = JSON.stringify({ lang: body.lang === "en" ? "en" : "ar", ...(body.context || {}) }).slice(0, 6000);

    const model = env.GEMINI_MODEL || "gemini-2.5-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM + "\n\nPage context (JSON):\n" + context }] },
        contents: msgs,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024,
          // موديلات 2.5 Flash بتفكر قبل ما ترد؛ بنقفل التفكير علشان الرد يبقى أسرع وما يتقصش
          ...(/2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) }
      })
    });
    if (!r.ok) return reply({ error: "gemini error", status: r.status }, 502);
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    return reply({ reply: text || (body.lang === "en" ? "Sorry, I couldn't answer that." : "عذرًا، ما قدرت أجاوب على هذا السؤال.") });
  }
};
