# 🤖 START — Briefing สำหรับ Claude Code

> ไฟล์นี้ = **prompt สำหรับตัวคุณเอง (Claude Code)**
> อาจารย์จะสั่งให้คุณอ่านไฟล์นี้เพื่อ bootstrap วิชาใหม่
> อ่านให้จบแล้วเริ่มทำทีละ phase

---

## Role

คุณคือ **ผู้ช่วยย้าย framework** จากวิชา `calculus1_thai` ไปยังวิชาใหม่ที่อาจารย์กำลังจะสอน
โจทย์ไม่เหมือนกัน CLO ไม่เหมือนกัน แต่ **design system / SBRA controller / XP system** ใช้ซ้ำได้

เป้าหมายผลลัพธ์:
- Workspace ใหม่ที่ deploy บน GitHub Pages ได้ทันที
- CLOs / หัวข้อ / badge / โจทย์ → ของวิชาใหม่
- Framework core (graph.js, missions.js, xp.js helpers, nav.js, CSS) → **ไม่แตะ**

---

## Prerequisites ที่ต้องเช็คก่อน

รันเงียบ ๆ (ไม่ต้องรายงานถ้าผ่าน):

```bash
git --version
node --version
curl -s -o /dev/null -w "%{http_code}" https://github.com
```

ถ้าอย่างใดไม่ผ่าน — แจ้งอาจารย์แล้วหยุด

---

## Phase 1 — Interview (เก็บข้อมูลก่อน)

อ่าน `INTERVIEW.md` ในโฟลเดอร์เดียวกันนี้
ถามอาจารย์ **ทีละข้อ ตามลำดับ** ห้ามเดาคำตอบ

**สำคัญ:** หลังเก็บคำตอบครบ เขียนสรุปเป็น Markdown list แล้วถามอาจารย์ยืนยันว่า
> "ข้อมูลนี้ถูกต้องใช่ไหมครับ? ถ้าถูกจะเริ่ม clone framework และ customize เลย"

รอ "ใช่/ok/yes" ก่อนไป Phase 2

---

## Phase 2 — Clone & layout framework

```bash
# 1. Clone source repo เป็น scratch เพื่ออ่านไฟล์
git clone --depth 1 https://github.com/lordtd-hub/calculus1-thai.git _ref

# 2. Copy โครง framework เข้ามา workspace root
#    เฉพาะไฟล์ที่ไม่ต้องแตะ + ไฟล์ที่จะแก้ — ห้าม copy .git, notes/, .claude/
cp -r _ref/css ./
cp -r _ref/js ./
cp _ref/*.html ./
cp _ref/.gitignore ./
cp -r _ref/tools ./
cp -r _ref/docs ./       # เอา ADDING_PROBLEMS.md + MIGRATION_GUIDE.md มาด้วย

# 3. ลบ scratch
rm -rf _ref
```

รายงานให้อาจารย์ทราบ: "framework copy เสร็จ — x ไฟล์"

---

## Phase 3 — Customize

ทำตามลำดับนี้ (อ่าน `MIGRATION_GUIDE.md` เป็น reference รายละเอียด):

### 3.1 Rename XP storage key

แก้ใน `js/xp.js` บรรทัด ~4:
```js
const XP_STORAGE_KEY = 'calc1_thai_xp';    // → <course_id>_xp จากคำตอบ Interview
```

### 3.2 เขียน REAL_CLOS ใหม่

แก้ใน `js/mission-bank.js` ณ บรรทัดที่ `REAL_CLOS = {...}` อยู่
ใส่ CLO ของวิชาใหม่ (จำนวน CLO อาจไม่ใช่ 6 — ปรับให้ตรงกับหลักสูตร)

### 3.3 ล้าง pool โจทย์เก่า

ใน `js/mission-bank.js` ตัดเนื้อใน pool เหล่านี้ออก (เหลือ `[]` ก่อน):
- `POOL_SBRA_LIMITS`, `POOL_SBRA_CONT`, `POOL_SBRA_DIFF`, `POOL_SBRA_INT`
- `POOL_L*_*`, `POOL_D*_*`, `POOL_I*_*`
- `SBRA_STRATEGIES = { }`

อย่าลบตัวแปร — แค่ทำให้ว่าง (controller ต้องเจอตัวแปร)
บันทึก commit "chore: clear calc-specific problem banks"

### 3.4 Rename topic IDs & pool names

อาจารย์ระบุหัวข้อวิชาใหม่ใน Interview — รายชื่อนั้นจะแทน `limits / cont / diff / int`

ตัดสินใจ:
- **ถ้าจำนวนหัวข้อ ≤ 4**: rename pool SBRA เป็นหัวข้อใหม่ (e.g. `POOL_SBRA_VECTORS`, `POOL_SBRA_MATRICES`)
- **ถ้า > 4 หรือ < 4**: ปรับจำนวน pool ตามนั้น + แก้ `MISSION_BANK` ที่อ้างอิง

ถามอาจารย์ยืนยันก่อน rename ถ้าไม่แน่ใจ

### 3.5 Update BADGES

แก้ใน `js/xp.js`:
- badge `differentiator`, `integrator` → เปลี่ยนเป็น badge หัวข้อหลักของวิชาใหม่ (2–3 badge)
- badge `master` ชื่อ 'อาจารย์แคลคูลัส' → 'อาจารย์<ชื่อวิชา>'
- badge `grandmaster` → check ต้องอ้าง topic ids ของวิชาใหม่

### 3.6 Update nav labels (11 HTML files)

เขียน script เฉพาะกิจแบบเดียวกับ `_update_nav.js` ที่เคยใช้ใน calc1 (ดู git log ของ `calculus1_thai` หา commit "feat(nav): redesign mobile drawer")

ถ้าไม่แน่ใจ — แก้ไฟล์เดียวก่อน (เช่น `index.html`) แล้วให้อาจารย์ review โครง

รายการที่ต้อง rename ใน nav:
- nav brand (`∫ Calculus 1 TH` → `<emoji> <ชื่อวิชา> TH`)
- nav-group data-title (ถ้ามีการจัดกลุ่มต่าง)
- nav-link text + nl-icon ของแต่ละ topic

### 3.7 Update index.html

- `<title>`
- Hero text
- Card "🧭 วิธีใช้งานเบื้องต้น" — ปรับไม่มาก หรือเก็บไว้
- topic-card ทั้งหมด (href, icon, title, description)
- Attribution "แนวคิดโดย..." → ชื่ออาจารย์ที่ได้จาก Interview
- Remove topic-card ของหัวข้อที่ไม่มีในวิชาใหม่

### 3.8 Lesson pages (decision time)

วิธีจัดการ lesson pages (`intro.html`, `lessons.html`, `continuity.html`, `differentiation.html`, `diff-app.html`, `integration.html`, `integrate-app.html`):

**Option A (เร็ว — แนะนำสำหรับ port รอบแรก):**
- เก็บไฟล์ที่ map กับหัวข้อใหม่ (rename ให้ตรง), ลบไฟล์ที่ไม่ใช้
- ใส่ placeholder content ใน card แต่ละใบ: `<p>กำลังเตรียมเนื้อหา</p>`
- อาจารย์จะมาเขียนเนื้อหาเองทีหลัง

**Option B (เต็ม):**
- Rewrite content ของทุกหน้า (ใช้เวลามาก)

ถามอาจารย์เลือก A/B

### 3.9 Games (guess-game, match-game)

ถาม: เก็บไหม?
- **เก็บ**: ล้าง `QBANK` ใน `js/guess-game.js` + `pickPairs()` ใน `js/match-game.js` + ให้อาจารย์เขียนใหม่
- **ไม่เก็บ**: ลบ 4 ไฟล์ (`guess-game.html`, `match-game.html`, `js/guess-game.js`, `js/match-game.js`) + ลบ nav link + ลบ topic-card

### 3.10 CDN cleanup (ถ้าไม่ใช่วิชาคณิต)

ถ้าวิชาใหม่ไม่มีสูตรคณิต (เช่น วิชาโปรแกรมมิ่ง / ชีววิทยา):
- ลบ `<script src=".../katex..."></script>` จากทุก HTML
- ลบ `<script src=".../mathjs..."></script>`
- ลบ `<link rel="stylesheet" href=".../katex.min.css">`
- ลบ `js/graph.js` + `<script src="js/graph.js">` ออกทุกหน้า

---

## Phase 4 — Verify & commit

```bash
# Smoke test
python -m http.server 8765 &
sleep 2

# เช็คว่าแต่ละหน้า serve 200 OK
for p in index intro lessons continuity differentiation diff-app integration integrate-app guess-game match-game missions; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8765/$p.html)
  echo "$p.html → $code"
done

kill %1 2>/dev/null
```

รายงานผลให้อาจารย์ — ถ้ามี 404 (หน้าที่ลบไป) ต้องแก้ nav ด้วย

### Git init + commit

```bash
[ -d .git ] || git init
git add .
git commit -m "feat(bootstrap): port calculus1_thai framework to <course_id>"
```

### ถามอาจารย์เรื่อง GitHub

- "อยาก push ขึ้น GitHub ตอนนี้ไหมครับ? ถ้าใช่ ขอ repo URL ด้วย"
- **ห้าม** สร้าง GitHub repo เอง (ข้อจำกัด: Claude ไม่ได้รับอนุญาตให้สร้าง account / repo)

---

## Phase 5 — Handoff

สรุปให้อาจารย์:
1. สิ่งที่ทำเสร็จแล้ว (checklist จาก `MIGRATION_GUIDE.md` ข้อ 6)
2. สิ่งที่อาจารย์ต้องทำต่อเอง:
   - เขียนเนื้อหา lesson pages (ถ้าเลือก Option A)
   - เขียนโจทย์ SBRA (ใช้ `node tools/new-sbra.mjs <id> <CLO> <steps>`)
   - Upload ขึ้น GitHub Pages
   - ทดสอบบน mobile จริง
3. ไฟล์ reference ที่เหลือใน `_kit/` — บอกว่าเก็บได้หรือจะลบทิ้งก็ได้
4. Optional: "อยากให้ผมเขียน validate-bank.mjs หรือ course-config.js centralized ให้ไหมครับ?"

---

## ⚠️ Guardrails

- **ห้าม** แก้ไฟล์ใน `css/main.css` ส่วนนอก `@media` เดิม (breaks desktop)
- **ห้าม** แก้ `js/graph.js`, `js/missions.js` (controllers — agnostic)
- **ห้าม** commit `notes/` หรือ `.claude/`
- **ต้อง** ถามอาจารย์ก่อนลบไฟล์ใดก็ตาม
- **ต้อง** รายงานทุก end-of-phase ให้อาจารย์ทราบก่อนเริ่ม phase ถัดไป
- ใช้ **Thai** ในการคุยกับอาจารย์ (เว้นแต่อาจารย์ตอบภาษาอังกฤษ)

---

## หน้ารวม reference

| ต้องการรายละเอียดเรื่อง | เปิดไฟล์ |
|---|---|
| คำถามที่ต้องถามอาจารย์ | `INTERVIEW.md` |
| ไฟล์ไหนแก้ยังไงบรรทัดไหน | `MIGRATION_GUIDE.md` |
| วิธีเขียน SBRA problem ใหม่ | `docs/ADDING_PROBLEMS.md` (ใน framework ที่ copy มา) |
| ใช้ scaffolder | `tools/README.md` |

---

_อ่านจบแล้วเริ่มที่ **Phase 1 — Interview** ได้เลย ห้ามข้าม phase_
