# 🎓 Migration Guide — นำโปรเจกต์นี้ไปสร้างวิชาใหม่

> ไกด์นี้อธิบายวิธีนำ framework ของ `calculus1_thai` ไปปรับใช้กับวิชาอื่น
> (CLOs ใหม่ / หัวข้อใหม่ / โจทย์ใหม่) โดยใช้ซ้ำ design system + SBRA controller + XP system + game engine
>
> อ่านก่อนทำ: **โฟลเดอร์นี้ทั้งโฟลเดอร์** = เอกสาร ไม่ใช่โค้ด
> วางไว้ที่ไหนก็ได้ของ workspace วิชาใหม่ (แนะนำ `docs/`) แล้วอ่านตามลำดับ

---

## 1. ภาพรวม — ส่วนที่ใช้ซ้ำได้ (DON'T TOUCH)

Framework นี้มีองค์ประกอบที่ **agnostic ต่อวิชา** (เขียนครั้งเดียว ใช้ได้หลายวิชา):

| ไฟล์ | หน้าที่ | ต้องแก้ไหม? |
|---|---|---|
| `js/graph.js` | GraphCanvas คลาสวาดกราฟ HiDPI | ❌ ไม่ต้อง (ถ้าเป็นวิชาคณิตศาสตร์/สถิติ) |
| `js/xp.js` (ส่วน sanitize/load/save/toast) | localStorage + toast | ❌ แค่ rename XP_STORAGE_KEY |
| `js/missions.js` | SBRA controller (รันโจทย์ SBRA) | ❌ ไม่ต้อง |
| `js/nav.js` | Mobile drawer helpers | ❌ ไม่ต้อง |
| `css/main.css` (เฉพาะ tokens + layout + nav) | Design system | ❌ แค่สีถ้าอยาก |
| `css/mission.css` | SBRA UI | ❌ ไม่ต้อง |
| `css/game.css` | Guess/Match game UI | ❌ ไม่ต้องถ้าเก็บเกมไว้ |

**รวม ~7 ไฟล์** คือเนื้อหา "framework" ที่ใช้ซ้ำ — ไม่ต้องเขียนใหม่

---

## 2. ส่วนที่ต้องปรับ — รายไฟล์

### A. CLOs (เกือบทุกวิชาแก้ตรงนี้ก่อน)

**ไฟล์:** `js/mission-bank.js` บรรทัด ~468

```js
const REAL_CLOS = {
  CLO1: 'อธิบายและคำนวณลิมิต',         // ← เปลี่ยนเป็น CLO วิชาใหม่
  CLO2: 'ทดสอบและอธิบายความต่อเนื่อง',
  CLO3: 'คำนวณและตีความอนุพันธ์',
  CLO4: 'ใช้อนุพันธ์วิเคราะห์ฟังก์ชันและการประยุกต์',
  CLO5: 'คำนวณปริพันธ์จำกัดและไม่จำกัด',
  CLO6: 'ใช้ปริพันธ์ในการประยุกต์',
};
```

**หลักการ:** ตั้ง CLO ตามที่หลักสูตรเขียนไว้จริง (Outcome-Based Education) —
ไม่ต้องตรงกับระดับ Bloom (M1–M6) ระบบจะแยกกันอยู่แล้ว

---

### B. บัญชีโจทย์ (ส่วนที่ใหญ่ที่สุด)

**ไฟล์:** `js/mission-bank.js`

ต้องแก้ **ทั้ง 2 ส่วน** คู่กัน:

1. **Pool โจทย์ SBRA** — มี 4 pools ในวิชาปัจจุบัน (limits, cont, diff, int) เปลี่ยนเป็น pool ของวิชาใหม่
2. **Pool โจทย์ Bloom** — `POOL_L*_*`, `POOL_D*_*`, `POOL_I*_*` (6 ระดับ × หลายหัวข้อ)

**แนะนำ:**
- เริ่มจากเขียน SBRA ก่อน (fewer pools, higher impact)
- ใช้ scaffolder: `node tools/new-sbra.mjs sbra-xxx-newid CLOn 3`
- ดูตัวอย่างครบใน `docs/ADDING_PROBLEMS.md`

**ลบ/ย่อได้:**
- ถ้าวิชาใหม่ไม่มีเกม tap-answer → ลบ `guess-game.html` + `match-game.html` + `js/guess-game.js` + `js/match-game.js` ออกได้
- ถ้าไม่ใช้ SBRA → ลบ pool SBRA ทั้งหมด

---

### C. หน้า Topic lessons

**ไฟล์:** `lessons.html`, `continuity.html`, `differentiation.html`, `diff-app.html`, `integration.html`, `integrate-app.html`, `intro.html`

ตอนนี้แต่ละหน้า **calc-specific มาก** — ต้องเขียนเนื้อหาใหม่ทั้งหน้า
แต่โครง HTML (nav, main, card, .definition-block) เก็บไว้ได้

**แพทเทิร์นที่ reuse ได้:**
- `.card` + `.card-title` — กล่องเนื้อหา
- `.definition-block` — กล่องนิยาม (สีม่วง)
- `.tab-bar` + `.tab-btn` + `.tab-panel` — แถบแท็บในหน้าเดียว
- `.slider-row` — input slider พร้อม label + readout
- KaTeX delimiters — `$$...$$`, `\\(...\\)`, `$...$`

**เทคนิคย้ายเร็ว:**
1. Copy หน้า calc เดิม (เช่น `lessons.html`) เป็นหน้าแม่แบบ
2. แก้ `<title>`, `page-title`, เนื้อหาใน `.card`
3. แก้ไอดี canvas + import `js/<topic>.js`

---

### D. Badges & XP (สำคัญ)

**ไฟล์:** `js/xp.js`

**ต้องแก้ 3 จุด:**

```js
// 1. Storage key — ใช้คีย์ที่ไม่ชนกับวิชาอื่นถ้า host รวม
const XP_STORAGE_KEY = 'calc1_thai_xp';   // → 'linalg_th_xp' / 'stats_th_xp' ฯลฯ

// 2. BADGES — แก้ชื่อ/เงื่อนไขที่อ้างหัวข้อเฉพาะวิชา
const BADGES = [
  // starter/explorer/thinker/master — ส่วนใหญ่ reuse ได้
  { id: 'differentiator', emoji: '📐', name: 'นักหาอนุพันธ์',
    check: (s) => s.xp >= 600 && s.lessonsCompleted.includes('differentiation') },
  // ← เปลี่ยนเป็น badge หัวข้อเฉพาะของวิชาใหม่

  { id: 'grandmaster', ...
    check: (s) => s.xp >= 2500 &&
      ['continuity','differentiation','integration'].every(t => s.lessonsCompleted.includes(t)) },
      //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ — ใส่ topic id ของวิชาใหม่
];

// 3. ถ้าอยากให้ xp.js ใช้ซ้ำได้ — ย้าย BADGES ไปไว้ใน js/course-config.js
//    แล้ว import มาใน xp.js (ดูข้อ G ด้านล่าง)
```

---

### E. Nav labels (11 หน้า)

**ไฟล์:** ทุก `.html` (index/intro/lessons/continuity/…)

แต่ละหน้ามี nav block ซ้ำกัน (รูปแบบจากการ refactor PR 1):

```html
<div class="nav-group" data-title="📖 บทเรียน">
  <a href="lessons.html"        class="nav-link"><span class="nl-icon">📏</span>ลิมิต</a>
  <a href="continuity.html"     class="nav-link"><span class="nl-icon">🔗</span>ต่อเนื่อง</a>
  <a href="differentiation.html" class="nav-link"><span class="nl-icon">📐</span>อนุพันธ์</a>
  <a href="integration.html"    class="nav-link"><span class="nl-icon">∫</span>ปริพันธ์</a>
</div>
```

**เทคนิค:**
- หัวข้อกลุ่ม (`data-title`) แสดงเฉพาะ mobile — ปรับตามหมวดวิชาใหม่
- ไอคอน `nl-icon` แสดงเฉพาะ mobile
- เขียน node script คล้าย `_update_nav.js` (ที่เคยใช้) ให้รันทีเดียวเปลี่ยนทั้ง 11 ไฟล์

---

### F. หน้า `index.html` (โปรเจกต์ปัจจุบันปรับเยอะ)

**ไฟล์:** `index.html`

**ต้องแก้:**
- `<title>` และ nav brand
- Hero text / ชื่อวิชา / คำอธิบาย
- "🧭 วิธีใช้งานเบื้องต้น" — 4 ขั้น (อาจไม่เปลี่ยนหรือปรับเลกน้อย)
- การ์ด topic (`<a class="topic-card card-...">`) — เปลี่ยนลิงก์ + ไอคอน + ข้อความ
- Attribution: `แนวคิดโดย 'อาจารย์สิทธิโชค ทรงสอาด'` → ชื่อของอาจารย์ผู้ดูแลวิชาใหม่
- Badge showcase — auto-render จาก BADGES ที่แก้ใน xp.js อยู่แล้ว ✓

**ไม่ต้องแก้:**
- Identity card (โหลดจาก localStorage)
- XP ring CSS
- Responsive breakpoints

---

### G. (Optional) สร้าง `js/course-config.js`

**ปัจจุบัน** calc1 ไม่มีไฟล์นี้ — ค่าคงที่กระจายอยู่ใน xp.js, mission-bank.js, ฯลฯ
**แนะนำสำหรับวิชาใหม่**: สร้างไฟล์ centralized config เพื่อ port ง่ายขึ้นครั้งถัดไป:

```js
// js/course-config.js (new — ใส่เป็น <script> แรกในทุกหน้า)
'use strict';
const COURSE = {
  id:        'linalg_th',
  name:      'พีชคณิตเชิงเส้น',
  nameEn:    'Linear Algebra',
  teacher:   'อาจารย์ชื่อ-สกุล',
  xpKey:     'linalg_th_xp',
  topics: [
    { id:'vectors',  label:'เวกเตอร์',  emoji:'➡️' },
    { id:'matrices', label:'เมทริกซ์',   emoji:'▦' },
    { id:'eigen',    label:'ไอเกน',     emoji:'🌀' },
    // …
  ],
  clos: {
    CLO1: 'คำนวณเวกเตอร์และเมทริกซ์',
    CLO2: 'แก้ระบบสมการเชิงเส้น',
    // …
  },
};
```

แล้วให้ `xp.js`, `mission-bank.js`, `index.html` อ่านจาก `COURSE` แทนค่าฮาร์ดโค้ด

---

## 3. ขั้นตอนแนะนำ (เรียงลำดับ)

```bash
# 1. Clone / copy starter
cp -r calculus1_thai/ linalg_th/
cd linalg_th/
rm -rf .git notes/
git init

# 2. Rename XP key (ป้องกัน localStorage ชนกับวิชาเดิม)
#    แก้ XP_STORAGE_KEY ใน js/xp.js

# 3. เขียน CLOs ใหม่ใน js/mission-bank.js

# 4. ลบ pool เก่าใน mission-bank.js + เริ่มเขียน pool ใหม่ 1-2 ข้อ
node tools/new-sbra.mjs sbra-vec-dotprod CLO1 3 > /tmp/block1.txt

# 5. อัพเดต nav labels ทั้ง 11 หน้า
#    (เขียน _update_nav.js ใหม่โดยดู PR "feat(nav): redesign mobile drawer" เป็นตัวอย่าง)

# 6. อัพเดต index.html: hero, topic cards, attribution

# 7. อัพเดต BADGES ใน js/xp.js

# 8. Test: python -m http.server 8080 → เปิดทุกหน้า

# 9. Deploy ใหม่บน GitHub Pages (new repo)
```

---

## 4. ตัวอย่างสั้น: วิชา "สถิติเบื้องต้น"

สมมติอยากทำเวอร์ชันสถิติ:

| เรื่อง | ค่าเดิม (calc1) | ค่าใหม่ (stats) |
|---|---|---|
| `XP_STORAGE_KEY` | `calc1_thai_xp` | `stats_th_xp` |
| CLO1 | อธิบายและคำนวณลิมิต | สรุปข้อมูลด้วยสถิติเชิงพรรณนา |
| CLO2 | ทดสอบและอธิบายความต่อเนื่อง | คำนวณความน่าจะเป็นของเหตุการณ์ |
| CLO3 | คำนวณและตีความอนุพันธ์ | ประมาณค่าพารามิเตอร์ประชากร |
| Topics | limits, continuity, diff, int | descriptive, probability, inference, regression |
| SBRA id prefix | `sbra-lim-`, `sbra-int-` | `sbra-desc-`, `sbra-prob-`, `sbra-inf-` |
| Badge "นักหาอนุพันธ์" | `differentiator` | `probabilist` |
| Badge "นักหาปริพันธ์" | `integrator` | `inferrer` |
| Hero text | "แคลคูลัส 1 แบบอินเทอร์แอคทีฟ" | "สถิติพื้นฐานแบบอินเทอร์แอคทีฟ" |

---

## 5. ข้อควรระวัง

1. **localStorage key** — ถ้าต่างวิชา deploy แยก subdomain ไม่ชน; ถ้าอยู่ domain เดียวกัน **ต้อง rename ไม่งั้น XP ปนกัน**
2. **KaTeX** — ไลบรารี CDN ใช้ได้กับ non-math? ไม่จำเป็นถ้าไม่มีสูตร → ลบ `<script src=".../katex..."></script>` ออกจาก HTML
3. **math.js** — ใช้เฉพาะในหน้าที่มี expression evaluation (lessons, continuity, etc.) → ลบได้ถ้าไม่ใช้
4. **Canvas pages** — ถ้าไม่ใช่วิชาคณิต อาจไม่ต้อง `graph.js` เลย → ลบ
5. **Mobile responsiveness** — PR 1 ทำแล้ว PR 2-3 ยังไม่ได้ทำ (ดู `notes/MOBILE_RESPONSIVENESS_PLAN.md` ในวิชาเดิม) → แพทเทิร์นเดียวกันใช้กับวิชาใหม่ได้
6. **Attribution** — ลบ/แทน "อาจารย์สิทธิโชค ทรงสอาด" ใน `index.html` ด้วยชื่ออาจารย์ของวิชานั้น

---

## 6. Checklist สุดท้าย (สำหรับวิชาใหม่)

- [ ] Clone repo, `.git` และ `notes/` ถูกลบ, init ใหม่
- [ ] Rename `XP_STORAGE_KEY` ใน `js/xp.js`
- [ ] แทน `REAL_CLOS` ใน `js/mission-bank.js`
- [ ] ลบ pool SBRA เก่า + เขียนใหม่อย่างน้อย 10 ข้อ (ใช้ `tools/new-sbra.mjs`)
- [ ] ลบ pool Bloom เก่า + เขียน Bloom 6 ระดับอย่างน้อย 1 หัวข้อ
- [ ] เปลี่ยน nav labels + icons ทั้ง 11 หน้า
- [ ] เปลี่ยน nav brand text ทั้ง 11 หน้า
- [ ] อัพเดต `index.html`: hero, topic cards, วิธีใช้งาน, attribution
- [ ] อัพเดต `BADGES` ใน `js/xp.js` (รวม `grandmaster` check)
- [ ] เขียน / แก้เนื้อหา lesson pages (อย่างน้อย 1 หน้าก่อน deploy)
- [ ] ถ้าไม่มีเกม → ลบ `guess-game.*`, `match-game.*` (html + js)
- [ ] ถ้าไม่มีสูตรคณิต → ลบ katex + math.js CDN tags
- [ ] `python -m http.server 8080` ทดสอบทุกหน้า, เปิด DevTools เช็ค console error
- [ ] Commit + push repo ใหม่
- [ ] เปิด GitHub Pages → verify public URL ทำงาน
- [ ] ทดสอบบน mobile จริง

---

## 7. Future — ยังไม่ได้สร้างใน calc1 แต่แนะนำสำหรับวิชาใหม่

- `js/course-config.js` — centralized config (ดู G ด้านบน)
- `tools/init-new-course.mjs` — one-command: ถามชื่อวิชา/CLOs แล้วสร้างโครง
- `tools/validate-bank.mjs` — ตรวจ id ซ้ำ / CLO ขาด / strategy ไม่มีคู่
- `docs/ARCHITECTURE.md` — แผนผังการเรียกฟังก์ชันระหว่างไฟล์

ถ้าพัฒนาพร้อมกัน วิชาถัดไปจะ port เร็วขึ้นมาก — จาก ~2 วัน → ~2 ชม.

---

_เอกสารนี้อ้างอิงเวอร์ชัน `calculus1_thai` commit หลัง "chore(repo): organize workspace"_
