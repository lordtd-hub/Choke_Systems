# 📚 ADDING_CONTENT — คู่มือเพิ่มสื่อบทเรียน

> วิธีเพิ่มไฟล์ PDF / โน้ต / รูป / วิดีโอ / ลิงก์ลงในหน้า `content/`
> ไม่ต้องเขียน JS — แค่วางไฟล์ + แก้ `manifest.json`

---

## TL;DR (3 ขั้น)

```bash
# 1. วางไฟล์
cp mystuff.pdf content/limits/handouts/

# 2. เปิด content/manifest.json เพิ่ม entry ใหม่ใน "items": [ ... ]

# 3. Refresh หน้า content/ ในเบราว์เซอร์ — รายการใหม่จะโผล่
```

---

## โฟลเดอร์ไหนใส่อะไร

```
content/
├── limits/          ┐
│   ├── notes/       │  โน้ต .md / .html ขยายความ
│   ├── examples/    │  ตัวอย่างโจทย์/เฉลยเพิ่มเติม
│   ├── handouts/    │  PDF cheatsheet / สไลด์
│   └── media/       │  รูป diagram (.png/.svg)
├── continuity/      ← โครงเดียวกันทั้ง 4 หัวข้อ
├── differentiation/ ←
├── integration/    ←
└── shared/          ← สื่อข้ามหัวข้อ (สรุป notation, formula sheet รวม)
```

ถ้าไม่แน่ใจ — ใส่ `shared/` ไปก่อน แล้วค่อยย้ายทีหลัง

---

## Entry schema (ต้องใส่ใน `manifest.json`)

```json
{
  "id": "unique-kebab-case",
  "topic": "limits | continuity | differentiation | integration | shared",
  "title": "หัวข้อแสดงในการ์ด",
  "description": "คำอธิบายสั้น ๆ ≤ 160 ตัวอักษร",
  "type": "pdf | md | html | image | video | link | note",
  "path": "limits/handouts/foo.pdf",      // สำหรับไฟล์ในโฟลเดอร์
  "url":  "https://youtu.be/...",          // สำหรับ link/video
  "addedDate": "YYYY-MM-DD",
  "tags": ["optional", "keywords"],
  "author": "อ.ชื่อผู้สร้าง",                 // optional
  "duration": "8:42"                        // optional (ใช้กับ video)
}
```

**`id` ต้อง unique** และเป็น kebab-case (เช่น `limits-cheatsheet-v2`)
**ใช้ `path` XOR `url`** — path ถ้าไฟล์อยู่ในโฟลเดอร์, url ถ้าเป็นลิงก์ภายนอก
**`addedDate` ≤ 14 วัน** จะโชว์ป้าย `NEW` อัตโนมัติ

---

## ตัวอย่างแต่ละ type

### PDF (cheatsheet, สไลด์)
```json
{
  "id": "diff-rules-cheatsheet",
  "topic": "differentiation",
  "title": "สรุปกฎหาอนุพันธ์",
  "description": "หน้าเดียว — product/quotient/chain rule",
  "type": "pdf",
  "path": "differentiation/handouts/diff-rules.pdf",
  "addedDate": "2026-04-20"
}
```

### Markdown note (เขียนขยายความ)
```json
{
  "id": "limits-intuition",
  "topic": "limits",
  "title": "ลิมิตคืออะไรจริง ๆ?",
  "description": "คำอธิบายยาวแบบ narrative พร้อมตัวอย่าง 5 ข้อ",
  "type": "md",
  "path": "limits/notes/intuition.md",
  "addedDate": "2026-04-20"
}
```

> **หมายเหตุ:** ตอนนี้ type `md` จะเปิดไฟล์แบบ raw — ถ้าต้องการ rendered preview ต้องเพิ่ม markdown viewer (ยังไม่รวมใน framework)

### Image (diagram, screenshot)
```json
{
  "id": "epsilon-delta-visual",
  "topic": "limits",
  "title": "ภาพ ε-δ",
  "description": "diagram อธิบายนิยามทางการของลิมิต",
  "type": "image",
  "path": "limits/media/epsilon-delta.svg",
  "addedDate": "2026-04-20"
}
```

### Video (YouTube / Vimeo)
```json
{
  "id": "ftc-explained",
  "topic": "integration",
  "title": "FTC อธิบายใน 10 นาที",
  "description": "ทฤษฎีพื้นฐานของแคลคูลัส",
  "type": "video",
  "url": "https://www.youtube.com/watch?v=XXXX",
  "duration": "9:58",
  "addedDate": "2026-04-20"
}
```

### Link (แหล่งเรียนรู้ภายนอก)
```json
{
  "id": "3b1b-essence",
  "topic": "shared",
  "title": "Essence of Calculus — 3Blue1Brown",
  "description": "ซีรีส์วิดีโอแนะนำแคลคูลัสเชิงภาพ",
  "type": "link",
  "url": "https://www.3blue1brown.com/topics/calculus",
  "addedDate": "2026-04-20"
}
```

### Note (ข้อความสั้น ๆ ไม่มีไฟล์)
```json
{
  "id": "tip-lhopital",
  "topic": "limits",
  "title": "เคล็ดลับใช้ L'Hôpital",
  "description": "ต้องเช็กก่อนเสมอว่าอยู่ในรูป 0/0 หรือ ∞/∞",
  "type": "note",
  "body": "เวลาเจอลิมิตที่แทนค่าแล้วไม่ได้ — หยุดก่อน! เช็ก form ให้แน่ว่าเป็น indeterminate จริง ๆ (0/0, ∞/∞, 0·∞, ...) ก่อนใช้ L'Hôpital",
  "addedDate": "2026-04-20"
}
```

(Note ไม่มีไฟล์แยก — แสดง `body` ใต้ description เลย)

---

## กฎเหล็ก

1. **ชื่อไฟล์ kebab-case** — `limit-rules.pdf` ไม่ใช่ `Limit Rules.pdf`
2. **ห้ามภาษาไทยในชื่อไฟล์** — URL encoding บน GitHub Pages พัง
3. **ขนาดไฟล์** — PDF > 5 MB ได้ แต่ video ใหญ่ ๆ ให้ upload YouTube แล้วใส่เป็น `type: link`
4. **SVG > PNG** สำหรับ diagram (เบากว่า, คมชัดทุก zoom)
5. **อย่าลืม comma** ใน JSON — ถ้า syntax พัง manifest จะโหลดไม่ได้ทั้งก้อน
6. **Test ก่อน commit** — เปิด `python -m http.server 8080` → `localhost:8080/content/` ต้องเห็นรายการใหม่

---

## Tips & Patterns

### Link จากหน้า lesson มา content ของหัวข้อนั้น

ใน `lessons.html`, `continuity.html`, ฯลฯ — ใส่ปุ่มท้ายหน้า:
```html
<a class="btn btn-sm" href="content/?topic=limits">
  📚 สื่อเพิ่มเติมเรื่องลิมิต
</a>
```
query string `?topic=<name>` จะกรองให้เหลือเฉพาะหัวข้อนั้นโดยอัตโนมัติ

### ลบสื่อ

1. ลบไฟล์ออกจากโฟลเดอร์
2. ลบ entry ที่ตรงกันใน `manifest.json`
3. ถ้ามี entry หลายอันอ้างอิงไฟล์เดียวกัน — ต้องลบให้หมด

### Validate manifest.json

วิธีเร็วสุด — เปิดใน editor ที่ lint JSON (VS Code, WebStorm)
หรือรัน:
```bash
node -e "JSON.parse(require('fs').readFileSync('content/manifest.json','utf8'))" \
  && echo "✓ valid JSON"
```

---

## Troubleshooting

| อาการ | สาเหตุน่าจะเป็น | แก้ |
|---|---|---|
| รายการไม่โผล่ | `manifest.json` syntax พัง | validate ด้วยคำสั่งข้างบน |
| คลิกแล้ว 404 | `path` ผิด หรือไฟล์ยังไม่ได้ commit | เช็ก path + `git status` |
| ไอคอนผิด | `type` ไม่ตรง schema | ใช้ 1 ใน 7 ค่า (pdf/md/html/image/video/link/note) |
| ไม่โชว์ NEW | `addedDate` ผิด format | ใช้ `YYYY-MM-DD` |
| ภาษาไทยค้นหาไม่เจอ | search ใช้ `.toLowerCase()` ปกติ | ใส่คำที่คาดว่าคนจะค้นในชื่อ + description |

---

## Roadmap (อนาคต)

- [ ] Markdown preview inline (รองรับ `.md` rendered)
- [ ] Image lightbox
- [ ] YouTube embed แทนการเปิดแท็บใหม่
- [ ] Drag-and-drop uploader (client-only, ให้ teacher export JSON patch)

ตอนนี้ยัง — แต่ framework รองรับการขยายได้ (ไม่ต้อง refactor ใหญ่)
