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

function renderPresetCard(preset) {
  return `
    <article class="preset-card">
      <h3>${escapeHtml(preset.title)}</h3>
      <p>${escapeHtml(preset.description)}</p>
      <div class="preset-meta">
        <span>${escapeHtml(`สัปดาห์: ${preset.weeks.join(', ')}`)}</span>
      </div>
      <pre>${escapeHtml(preset.command)}</pre>
    </article>
  `;
}

function renderLatestRun(latestRun) {
  if (!latestRun) {
    return '<p class="empty-copy">ยังไม่มีการบันทึกการรันล่าสุดใน workflow ระดับรายวิชา</p>';
  }

  return `
    <div class="latest-run">
      <p>${escapeHtml(`รันล่าสุดสร้าง ${latestRun.generated_week_count} สัปดาห์: ${latestRun.generated_weeks.join(', ')}`)}</p>
      <ul class="link-list">
        <li><a href="./SMAC001/course-workflow-summary.md">สรุปการรันรายวิชา</a></li>
        <li><a href="./SMAC001/course-dashboard.html">แดชบอร์ดรายวิชา</a></li>
        <li><a href="./catalog-dashboard.html">แคตตาล็อกระบบ</a></li>
      </ul>
    </div>
  `;
}

function renderInstructorBuildControlPage(controlData) {
  const context = controlData.context || {};
  const courseOverview = controlData.output_snapshots?.course_dashboard_overview || {};
  const catalogOverview = controlData.output_snapshots?.catalog_dashboard_overview || {};

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(`ศูนย์ควบคุมการสร้างงาน ${context.course_id}`)}</title>
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
        width: min(1180px, calc(100vw - 32px));
        margin: 24px auto 48px;
      }
      .hero, .panel {
        border-radius: 28px;
        padding: 28px;
        box-shadow: var(--shadow);
      }
      .hero {
        color: white;
        background: linear-gradient(140deg, rgba(15, 118, 110, 0.98), rgba(19, 56, 74, 0.95));
      }
      .hero h1 {
        margin: 0 0 12px;
        font-size: clamp(2rem, 5vw, 3.2rem);
      }
      .hero p {
        margin: 0;
        line-height: 1.7;
        color: rgba(255,255,255,0.88);
      }
      .panel {
        margin-top: 22px;
        background: var(--paper);
        border: 1px solid var(--line);
      }
      .panel h2 {
        margin: 0 0 16px;
        font-size: 1.45rem;
      }
      .metric-grid, .preset-grid {
        display: grid;
        gap: 14px;
      }
      .metric-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      .preset-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }
      .metric-card, .preset-card {
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
      .metric-card-accent {
        background: var(--accent-soft);
        border-color: rgba(15, 118, 110, 0.18);
      }
      .metric-card-warm {
        background: var(--warm-soft);
        border-color: rgba(154, 103, 0, 0.18);
      }
      .metric-label {
        color: var(--muted);
      }
      .preset-card h3 {
        margin: 0 0 8px;
      }
      .preset-card p {
        margin: 0;
        line-height: 1.6;
        color: var(--muted);
      }
      .preset-meta {
        margin-top: 12px;
        color: var(--muted);
      }
      pre {
        margin: 14px 0 0;
        padding: 14px;
        overflow-x: auto;
        border-radius: 14px;
        background: #f3eee4;
        border: 1px solid var(--line);
        font-family: Menlo, Monaco, monospace;
        font-size: 0.9rem;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      .link-list {
        margin: 10px 0 0;
        padding-left: 18px;
      }
      .link-list li + li {
        margin-top: 6px;
      }
      a {
        color: var(--accent);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .empty-copy {
        color: var(--muted);
      }
      @media (max-width: 720px) {
        .page {
          width: min(100vw - 20px, 1180px);
          margin: 12px auto 28px;
        }
        .hero, .panel {
          padding: 20px;
          border-radius: 22px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>ศูนย์ควบคุมการสร้างงานสำหรับอาจารย์</h1>
        <p>${escapeHtml(`หน้านี้รวม preset สำหรับสร้าง output ของ ${context.course_title_th || context.course_id} พร้อมสรุปการรันล่าสุดและลิงก์ไปยัง output หลักของระบบ โดยหน้าแสดงผลเป็นภาษาไทยทั้งหมด`)}</p>
      </section>

      <section class="panel">
        <h2>ภาพรวมปัจจุบัน</h2>
        <div class="metric-grid">
          ${renderMetricCard('รายวิชา', context.course_id || 'ไม่มีข้อมูล', 'accent')}
          ${renderMetricCard('จำนวนสัปดาห์ทั้งหมด', String(context.total_weeks || 0), 'accent')}
          ${renderMetricCard('สัปดาห์ที่มี output', String(courseOverview.indexed_weeks || 0), 'warm')}
          ${renderMetricCard('ความคืบหน้าเฉลี่ยรายวิชา', `${courseOverview.average_progress_percent || 0}%`, 'warm')}
          ${renderMetricCard('จำนวนรายวิชาในแคตตาล็อก', String(catalogOverview.indexed_courses || 0))}
          ${renderMetricCard('จำนวนสัปดาห์สะสมในระบบ', String(catalogOverview.indexed_weeks || 0))}
        </div>
      </section>

      <section class="panel">
        <h2>ชุดคำสั่งแนะนำ</h2>
        <div class="preset-grid">
          ${controlData.presets.map((preset) => renderPresetCard(preset)).join('')}
        </div>
      </section>

      <section class="panel">
        <h2>การรันล่าสุด</h2>
        ${renderLatestRun(controlData.latest_run)}
      </section>

      <section class="panel">
        <h2>ทางเข้าหลัก</h2>
        <ul class="link-list">
          <li><a href="./build-control-data.json">ข้อมูลศูนย์ควบคุม JSON</a></li>
          <li><a href="./catalog-dashboard.html">แคตตาล็อกระบบ</a></li>
          <li><a href="./SMAC001/course-dashboard.html">แดชบอร์ดรายวิชา</a></li>
          <li><a href="./SMAC001/course-workflow-summary.md">สรุปการรันรายวิชา</a></li>
        </ul>
      </section>
    </main>
  </body>
</html>`;
}

module.exports = {
  renderInstructorBuildControlPage
};
