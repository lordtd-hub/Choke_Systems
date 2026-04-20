'use strict';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMetricCard(label, value, tone = 'default') {
  return `
    <article class="metric-card metric-card-${escapeHtml(tone)}">
      <span class="metric-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderLinkCard(title, description, href) {
  return `
    <a class="link-card" href="${escapeHtml(href)}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(description)}</span>
    </a>
  `;
}

function formatRuntimeStatus(value) {
  const labels = {
    not_started: 'ยังไม่เริ่ม',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น'
  };

  return labels[value] || value || 'ไม่มีข้อมูล';
}

function renderTeacherDashboardPage(summary, bundle) {
  const moduleRoot = bundle.interactive_module;
  const runtimeSummary = summary.runtime_summary || {};
  const secondaryClos = (moduleRoot.clo_focus.secondary || []).join(', ') || 'ไม่มี';

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(`แดชบอร์ด ${moduleRoot.module_id}`)}</title>
    <style>
      :root {
        --bg: #f7f2e8;
        --paper: #fffdf8;
        --ink: #24323a;
        --muted: #66757c;
        --line: #ddd1bf;
        --accent: #0f766e;
        --accent-soft: #d5f0eb;
        --warm: #9a6700;
        --warm-soft: #f7e6c0;
        --rose: #a53b52;
        --shadow: 0 24px 70px rgba(36, 50, 58, 0.1);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(247, 230, 192, 0.92), transparent 32%),
          linear-gradient(180deg, #fbf8f1 0%, var(--bg) 100%);
      }

      .page {
        width: min(1120px, calc(100vw - 32px));
        margin: 24px auto 48px;
      }

      .hero {
        padding: 32px;
        border-radius: 28px;
        color: white;
        background:
          linear-gradient(140deg, rgba(15, 118, 110, 0.98), rgba(19, 56, 74, 0.95));
        box-shadow: var(--shadow);
      }

      .hero h1 {
        margin: 0 0 12px;
        font-size: clamp(2rem, 5vw, 3.1rem);
        line-height: 1.04;
      }

      .hero p {
        margin: 0;
        max-width: 760px;
        font-size: 1.02rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.88);
      }

      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 20px;
      }

      .hero-chip {
        border-radius: 999px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.16);
        font-size: 0.95rem;
      }

      .panel {
        margin-top: 22px;
        border-radius: 24px;
        padding: 24px;
        background: var(--paper);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
      }

      .panel h2 {
        margin: 0 0 16px;
        font-size: 1.45rem;
      }

      .panel-copy {
        margin: 0 0 18px;
        color: var(--muted);
        line-height: 1.7;
      }

      .metric-grid,
      .link-grid {
        display: grid;
        gap: 14px;
      }

      .metric-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .link-grid {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .metric-card,
      .link-card {
        border-radius: 20px;
        padding: 18px;
        background: #fffaf2;
        border: 1px solid var(--line);
      }

      .metric-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .metric-card strong {
        font-size: 1.45rem;
      }

      .metric-card-default strong { color: var(--ink); }
      .metric-card-accent {
        background: var(--accent-soft);
        border-color: rgba(15, 118, 110, 0.18);
      }
      .metric-card-accent strong { color: var(--accent); }
      .metric-card-warm {
        background: var(--warm-soft);
        border-color: rgba(154, 103, 0, 0.18);
      }
      .metric-card-warm strong { color: var(--warm); }

      .metric-label {
        color: var(--muted);
        font-size: 0.95rem;
      }

      .link-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-decoration: none;
        color: inherit;
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }

      .link-card:hover {
        transform: translateY(-2px);
        border-color: rgba(15, 118, 110, 0.28);
        box-shadow: 0 16px 36px rgba(36, 50, 58, 0.08);
      }

      .link-card strong {
        font-size: 1.05rem;
      }

      .link-card span {
        color: var(--muted);
        line-height: 1.6;
      }

      .detail-list {
        margin: 0;
        padding-left: 20px;
        line-height: 1.8;
      }

      .detail-list li + li {
        margin-top: 4px;
      }

      .footer-note {
        margin-top: 22px;
        color: var(--muted);
        font-size: 0.95rem;
      }

      @media (max-width: 720px) {
        .page {
          width: min(100vw - 20px, 1120px);
          margin: 12px auto 28px;
        }

        .hero,
        .panel {
          padding: 20px;
          border-radius: 22px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>แดชบอร์ดภาพรวมรายสัปดาห์</h1>
        <p>${escapeHtml(`ใช้หน้านี้เป็นทางเข้าหลักสำหรับตรวจงานของ ${moduleRoot.module_id} ในรายวิชา ${moduleRoot.course_id} โดยรวมบทเรียน รายงาน CQI และสรุปสถานะงานไว้ในหน้าเดียว`)}</p>
        <div class="hero-meta">
          <span class="hero-chip">${escapeHtml(`สัปดาห์ที่ ${moduleRoot.week}`)}</span>
          <span class="hero-chip">${escapeHtml(`ชื่อหน่วย: ${moduleRoot.title}`)}</span>
          <span class="hero-chip">${escapeHtml(`CLO หลัก: ${moduleRoot.clo_focus.primary}`)}</span>
          <span class="hero-chip">${escapeHtml(`CLO รอง: ${secondaryClos}`)}</span>
        </div>
      </section>

      <section class="panel">
        <h2>สรุปสถานะการเรียนรู้</h2>
        <p class="panel-copy">ส่วนนี้สรุปผลจาก workflow ตัวอย่างที่สร้าง bundle, ประเมินกิจกรรม, บันทึกหลักฐาน และสรุปรายงาน CQI อัตโนมัติสำหรับสัปดาห์นี้</p>
        <div class="metric-grid">
          ${renderMetricCard('สถานะโมดูล', formatRuntimeStatus(runtimeSummary.status), 'accent')}
          ${renderMetricCard('ความคืบหน้า', `${runtimeSummary.progress_percent ?? 0}%`, 'accent')}
          ${renderMetricCard('ส่วนที่ทำเสร็จ', `${runtimeSummary.required_sections_completed ?? 0}/${runtimeSummary.required_sections_total ?? 0}`, 'warm')}
          ${renderMetricCard('กิจกรรมที่ทำเสร็จ', `${runtimeSummary.required_activities_completed ?? 0}/${runtimeSummary.required_activities_total ?? 0}`, 'warm')}
        </div>
      </section>

      <section class="panel">
        <h2>ทางเข้าหลัก</h2>
        <p class="panel-copy">กดจากหน้านี้เพื่อเข้าไปดูหน้าบทเรียน รายงานคุณภาพการเรียนรู้ และไฟล์สรุปที่ระบบสร้างไว้แล้ว</p>
        <div class="link-grid">
          ${renderLinkCard('เปิดหน้าบทเรียน', 'ดู week bundle แบบหน้า HTML สำหรับอ่านภาพรวมการเรียนรู้', './week-bundle.html')}
          ${renderLinkCard('เปิดรายงาน CQI', 'ดูรายงานคุณภาพราย CLO ในรูปแบบ Markdown ภาษาไทย', './cqi-report.md')}
          ${renderLinkCard('เปิดสรุป workflow', 'ดูรายการไฟล์และสถานะผลลัพธ์ที่ระบบสร้างในรอบนี้', './workflow-summary.md')}
        </div>
      </section>

      <section class="panel">
        <h2>ไฟล์ข้อมูลที่ระบบบันทึก</h2>
        <p class="panel-copy">ส่วนนี้คือไฟล์ข้อมูลสำหรับระบบหรือการพัฒนาต่อ เช่นการทำ dashboard จริง, persistence, หรือเชื่อมต่อ API ในอนาคต</p>
        <ul class="detail-list">
          <li>${escapeHtml(`ไฟล์ข้อมูลบทเรียน JSON: ${summary.files.week_bundle_json}`)}</li>
          <li>${escapeHtml(`ไฟล์สถานะการเรียน JSON: ${summary.files.runtime_state_json}`)}</li>
          <li>${escapeHtml(`ไฟล์ผลการประเมิน JSON: ${summary.files.assessment_results_json}`)}</li>
          <li>${escapeHtml(`ไฟล์เหตุการณ์วิเคราะห์การเรียนรู้ JSON: ${summary.files.analytics_events_json}`)}</li>
          <li>${escapeHtml(`ไฟล์รายงาน CQI JSON: ${summary.files.cqi_report_json}`)}</li>
        </ul>
      </section>

      <p class="footer-note">หมายเหตุ: หน้านี้เป็น product-style dashboard สำหรับ prototype ปัจจุบัน และสามารถใช้เป็นฐานต่อไปสู่ frontend แบบเต็มระบบได้</p>
    </main>
  </body>
</html>`;
}

module.exports = {
  renderTeacherDashboardPage
};
