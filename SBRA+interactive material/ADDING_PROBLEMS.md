# การเพิ่มโจทย์ใหม่ (Adding problems)

ไกด์นี้อธิบายโครงสร้างของ **บัญชีโจทย์** (mission bank) และวิธีเพิ่มโจทย์ใหม่โดยไม่ทำของเดิมพัง

> ไฟล์ที่เกี่ยวข้อง: `js/mission-bank.js` (บัญชีโจทย์ทั้งหมด) และ `js/missions.js` (ตัว controller)

---

## ภาพรวมโครงสร้าง

ภายใน `js/mission-bank.js` มีกลุ่มข้อมูล 3 แบบ

| กลุ่ม | ที่อยู่ (ประมาณ) | ใช้ทำอะไร |
|---|---|---|
| `REAL_CLOS` | บรรทัด ~468 | map CLO1–CLO6 → คำอธิบายไทย |
| `SBRA_STRATEGIES` | บรรทัด ~481 | ขั้น 🎯 วางแผน (เลือกเทคนิค + เหตุผล) ของแต่ละโจทย์ SBRA |
| `POOL_SBRA_*` | บรรทัด ~792, 1054, 1238, 1605 | โจทย์ SBRA แยกตาม ลิมิต / ต่อเนื่อง / อนุพันธ์ / ปริพันธ์ |
| `POOL_L/D/I*_*` | บรรทัด ~1986+ | โจทย์ Bloom 6 ระดับ (จำ / เข้าใจ / ประยุกต์เชิงตัวเลข / วิเคราะห์ / ประเมินค่า / สร้างสรรค์) |
| `MISSION_BANK` | บรรทัด ~2683 | ตัวรวม: map ภารกิจ → pool |

---

## การเพิ่มโจทย์ SBRA ใหม่ (recommended path)

**SBRA = Strategy → Branch → Reason → Answer**
รูปแบบ: นักศึกษาเห็นโจทย์ครั้งเดียว แล้วเลือกเทคนิค/เหตุผลทีละขั้น โดยไม่เห็นเฉลยจนกว่าจะทำครบทุกขั้น

### ขั้นที่ 1 — ตัดสินว่าโจทย์อยู่กลุ่มใด

| กลุ่ม | pool | id prefix |
|---|---|---|
| ลิมิต (CLO1) | `POOL_SBRA_LIMITS` | `sbra-lim-*` |
| ความต่อเนื่อง (CLO2) | `POOL_SBRA_CONT` | `sbra-cont-*` |
| อนุพันธ์ (CLO3/CLO4) | `POOL_SBRA_DIFF` | `sbra-diff-*` |
| ปริพันธ์ (CLO5/CLO6) | `POOL_SBRA_INT` | `sbra-int-*` |

### ขั้นที่ 2 — เขียน entry ลง pool

รูปแบบ (copy-paste):

```js
{ id:'sbra-lim-newid', clo:'CLO1',
  title:'ชื่อสั้น — \\(\\lim_{x\\to 0}\\sin(x)/x\\)',
  problem:'\\lim_{x\\to 0}\\dfrac{\\sin x}{x}',
  steps:[
    { id:'s1',
      prompt:'คำถามประจำขั้นที่ 1 (เขียนด้วย LaTeX ได้)',
      actions:[
        { id:'a', tex:'ตัวเลือกถูก', correct:true },
        { id:'b', tex:'ตัวเลือกผิด 1' },
        { id:'c', tex:'ตัวเลือกผิด 2' },
        { id:'d', tex:'ตัวเลือกผิด 3' },
      ],
      reasons:[
        { id:'r1', text:'เหตุผลที่ถูก — อธิบายว่าทำไม action a ถูก', correct:true },
        { id:'r2', text:'เหตุผลผิด 1' },
        { id:'r3', text:'เหตุผลผิด 2' },
        { id:'r4', text:'เหตุผลผิด 3' },
      ],
      commitText:'สรุปสั้น ๆ ของขั้นนี้ (หลังผู้เรียนยืนยัน)' },
    // เพิ่ม s2, s3, ... ได้ตามต้องการ
  ],
  finalAnswer:{ tex:'\\text{คำตอบสุดท้าย}', sayTH:'อ่านคำตอบเป็นภาษาไทย' } },
```

### ขั้นที่ 3 — เพิ่ม strategy step (บังคับ)

เพิ่มลง `SBRA_STRATEGIES` โดยใช้ id เดียวกับในขั้น 2:

```js
'sbra-lim-newid':{
  prompt:SBRA_STRATEGY_PROMPT,
  actions:[
    { id:'a', text:'เทคนิคหลัก (ถูก)', correct:true },
    { id:'b', text:'เทคนิคอื่น 1' },
    { id:'c', text:'เทคนิคอื่น 2' },
    { id:'d', text:'เทคนิคอื่น 3' },
  ],
  reasons:[
    { id:'r1', text:'เหตุผลที่เลือกเทคนิคนี้ (ถูก)', correct:true },
    { id:'r2', text:'เหตุผลอื่น 1' },
    { id:'r3', text:'เหตุผลอื่น 2' },
    { id:'r4', text:'เหตุผลอื่น 3' },
  ],
},
```

> ถ้าลืมขั้นนี้ controller จะยังรันได้ แต่ผู้เรียนไม่ได้ฝึก metacognition

### ขั้นที่ 4 — ตรวจสอบ

1. เปิด `python -m http.server 8080` จาก root
2. ไป `http://localhost:8080/missions.html`
3. ตั้งค่าของ localStorage ให้เลือก SBRA pool ของโจทย์ใหม่ หรือรัน SBRA ซ้ำ ๆ จนได้โจทย์ใหม่
4. ยืนยันว่า:
   - หน้า 🎯 วางแผน แสดง 4 ตัวเลือก action + 4 เหตุผล
   - แต่ละขั้นกด action → เลือก reason → commit ได้
   - ขั้นสุดท้ายแสดง finalAnswer ถูกต้อง

---

## กฎทองของ SBRA (จาก notes/CAULD_HANDOFF_NOTE.md)

1. **ขั้นแรกต้องเป็นการเลือกเทคนิค** (จากกลุ่ม `SBRA_STRATEGIES`) — ไม่ใช่การคำนวณ
2. **หนึ่งขั้น = หนึ่งการตัดสินใจ** ห้ามรวมหลายเรื่องในขั้นเดียว
3. **ตัวเลือกผิดต้องดูสมเหตุสมผล** (distractor plausible) — ไม่ใช่คำตอบที่เห็นปุ๊บรู้ว่าผิด
4. **ใช้ CLO จริง (CLO1–CLO6)** ไม่ใช่ Bloom level (M1–M6)
5. **เหตุผลต้องอธิบายว่า "ทำไม action ถูก"** ไม่ใช่แค่ลอกตัว action มาเขียนใหม่

---

## Scaffolder (ใช้ง่ายขึ้น)

```bash
node tools/new-sbra.mjs sbra-lim-newid CLO1
```

จะพิมพ์ template เปล่า ๆ ให้ copy-paste ลง `POOL_SBRA_*` และ `SBRA_STRATEGIES`
ดู `tools/README.md`
