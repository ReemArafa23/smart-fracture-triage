# 🦴 Smart Fracture Triage · فرز الكسور الذكي

A web page that sorts hand & wrist X-rays by fracture suspicion, so suspected fractures reach the doctor first.
Everything runs **inside the browser** — the image never leaves the device.

صفحة بترتب صور أشعة اليد والمعصم حسب اشتباه الكسر، علشان الحالات المشتبه فيها توصل للطبيب الأول. النموذج بيشتغل جوه المتصفح، والصورة ما بتطلعش من الجهاز.

## What's inside
| Part | Details |
|---|---|
| Classifier | DenseNet121 (transfer learning + fine-tuning), 384×384, TTA — TensorFlow.js (`model/`) |
| Explainability | Grad-CAM heat map computed in the browser |
| Localisation | YOLOv8s fracture boxes — ONNX Runtime Web (`yolo/`, split in four parts) |
| Settings | `config.json`: decision threshold and the red / yellow / green levels (chosen on validation) |
| Automation | Each result is POSTed as JSON to an n8n webhook; the `summary` returned is shown under the case |
| AI assistant | Chat that explains results using the open case's numbers (never the image). Runs through a Cloudflare Worker that holds the Gemini key (`worker/`); demo replies until it's connected |
| Interface | Arabic / English, light / dark mode toggle, works on mobile |

## Results (test set: 2,960 images from patients the model never saw)
- **Classifier:** AUC 0.969 · Accuracy 92.0% · Recall 92.8% · Precision 95.0% · Specificity 90.6% · F1 0.939
- **YOLO:** mAP50 0.936 · Precision 91.4% · Recall 87.0%

Data: GRAZPEDWRI-DX (Nagy et al., *Scientific Data* 9, 222, 2022), split by patient 70/15/15 with no patient in two splits.

## Webhook payload
```json
{"event":"new_case","case_id":5,"result":"fracture","confidence":0.91,"level":"red","uploaded_at":"2026-11-28T16:05:00+03:00"}
```
Also sent: `reviewed` and `doctor_decision` events. The webhook should reply with `{"summary": "..."}`.

## AI assistant setup
See `worker/README.md` (Gemini key + free Cloudflare Worker, about 7 minutes). Then add `"assistant_url": "https://….workers.dev"` to `config.json`.

## Run locally
Any static server, e.g. `python -m http.server` in this folder, then open `http://localhost:8000`.

> ⚠️ Educational model, not for clinical use. The final decision is always the doctor's.
> ⚠️ نموذج تعليمي، مو للاستخدام السريري. القرار النهائي دايمًا للطبيب.
