# 📦 Course Template Kit — วิธีใช้งาน

ชุดเริ่มต้น **พร้อมสั่ง Claude Code ทำงานต่อ** สำหรับสร้างวิชาใหม่โดยใช้ `calculus1_thai` เป็นฐาน
ไม่มีโค้ด — มีแค่ "คู่มือให้ Claude Code อ่านเอง" รวม ~4 ไฟล์

---

## 📂 สิ่งที่อยู่ในโฟลเดอร์นี้

| ไฟล์ | สำหรับใคร | อ่านเมื่อไร |
|---|---|---|
| `README.md` (ไฟล์นี้) | **อาจารย์** | อ่านก่อนเริ่ม |
| `START.md` | **Claude Code** | Claude Code อ่านเป็นไฟล์แรก |
| `INTERVIEW.md` | **Claude Code + อาจารย์** | Claude Code ใช้ถามข้อมูลวิชาใหม่จากอาจารย์ |
| `MIGRATION_GUIDE.md` | **Claude Code** (reference) | Claude Code เปิดดูเวลาต้องการรายละเอียด |

---

## 🚀 วิธีใช้ (3 ขั้น)

### ขั้นที่ 1 — โยนโฟลเดอร์เข้า workspace ใหม่

```bash
# สมมติอยากสร้างวิชา "พีชคณิตเชิงเส้น"
mkdir linalg_thai
cd linalg_thai

# copy โฟลเดอร์นี้ (ทั้งโฟลเดอร์) เข้ามา
cp -r /path/to/calculus1_thai/docs/new-course-template/ ./_kit/
```

หรือถ้าอยากแยก git repo ใหม่: `git init` ก่อน แล้วค่อย copy

### ขั้นที่ 2 — เปิด Claude Code ใน workspace ใหม่

```bash
cd linalg_thai
claude-code
```

### ขั้นที่ 3 — สั่ง Claude Code ให้อ่านและเริ่มทำงาน

พิมพ์ (copy-paste ไปได้เลย):

> **ช่วยอ่าน `_kit/START.md` แล้ว bootstrap วิชาใหม่ให้ผมตามขั้นตอนในนั้น**

Claude Code จะ:
1. อ่าน `START.md` เพื่อรับ role + แผนงาน
2. เปิด `INTERVIEW.md` ถามข้อมูลวิชาใหม่จากอาจารย์ (ชื่อวิชา, CLOs, หัวข้อ, ฯลฯ)
3. Clone `calculus1_thai` เป็น reference
4. Copy โครง framework มา workspace ใหม่
5. ปรับค่าทุกจุดตาม `MIGRATION_GUIDE.md`
6. ให้อาจารย์ review + push ขึ้น GitHub

---

## ⚠️ ก่อนเริ่มต้อง:

- มี `git` + `node` ติดตั้งแล้ว
- มีอินเทอร์เน็ต (Claude Code จะ clone จาก GitHub)
- ตัดสินใจไว้คร่าว ๆ:
  - ชื่อวิชา (ไทย/อังกฤษ)
  - จำนวน CLO (ปกติ 4–6 ตามหลักสูตร)
  - รายชื่อหัวข้อหลัก (3–5 หัวข้อ)
  - อยากเก็บเกม guess/match ไหม หรือลบออก?

หรือจะให้ Claude Code ถามทีละข้อก็ได้ — เตรียมคำตอบไว้ในใจก็พอ

---

## 💡 หลังเสร็จ

- workspace ใหม่จะพร้อม deploy GitHub Pages
- โฟลเดอร์ `_kit/` จะลบทิ้งได้ (หรือเก็บไว้อ้างอิงก็ได้)
- เก็บไว้เป็นแม่แบบสำหรับวิชาถัด ๆ ไปได้เลย

**ถ้ามีปัญหา:** โจทย์ฝังในโฟลเดอร์ต้นฉบับ (`calculus1_thai`) ดูได้ที่ GitHub
