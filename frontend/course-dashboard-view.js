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

function formatRuntimeStatus(value) {
  const labels = {
    not_started: 'ยังไม่เริ่ม',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น'
  };

  return labels[value] || value || 'ไม่มีข้อมูล';
}

function buildWeekRelativePath(weekItem, fileName) {
  return `./${weekItem.context.module_id}/week-${String(weekItem.context.week).padStart(2, '0')}/${fileName}`;
}

function renderWeekCard(weekItem) {
  return `
    <article class="week-card">
      <div class="week-card-head">
        <div>
          <h3>${escapeHtml(`สัปดาห์ที่ ${weekItem.context.week}`)}</h3>
          <p>${escapeHtml(weekItem.module.title)}</p>
        </div>
        <span class="status-chip">${escapeHtml(formatRuntimeStatus(weekItem.runtime_summary.status))}</span>
      </div>
      <div class="week-metrics">
        <span>${escapeHtml(`โมดูล: ${weekItem.context.module_id}`)}</span>
        <span>${escapeHtml(`ความคืบหน้า: ${weekItem.runtime_summary.progress_percent}%`)}</span>
        <span>${escapeHtml(`CLO บรรลุ: ${weekItem.cqi_summary.attained_clos}/${weekItem.cqi_summary.total_clos}`)}</span>
      </div>
      <div class="week-links">
        <a href="${escapeHtml(buildWeekRelativePath(weekItem, 'dashboard.html'))}">หน้าแดชบอร์ดสัปดาห์</a>
        <a href="${escapeHtml(buildWeekRelativePath(weekItem, 'dashboard-data.json'))}">ข้อมูลแดชบอร์ด JSON</a>
        <a href="${escapeHtml(buildWeekRelativePath(weekItem, 'week-bundle.html'))}">หน้าบทเรียน</a>
        <a href="${escapeHtml(buildWeekRelativePath(weekItem, 'cqi-report.md'))}">รายงาน CQI</a>
      </div>
    </article>
  `;
}

function renderCourseDashboardPage(courseDashboardData) {
  const overview = courseDashboardData.overview || {};

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(`แดชบอร์ดรายวิชา ${courseDashboardData.context.course_id}`)}</title>
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
        width: min(1160px, calc(100vw - 32px));
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
      .metric-grid, .week-grid {
        display: grid;
        gap: 14px;
      }
      .metric-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      .week-grid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .metric-card, .week-card {
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
      .week-card-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }
      .week-card h3 {
        margin: 0 0 6px;
        font-size: 1.2rem;
      }
      .week-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .status-chip {
        border-radius: 999px;
        padding: 8px 12px;
        background: var(--accent-soft);
        color: var(--accent);
        white-space: nowrap;
      }
      .week-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 14px;
        margin-top: 14px;
        color: var(--muted);
      }
      .week-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 16px;
        margin-top: 16px;
      }
      .week-links a {
        color: var(--accent);
        text-decoration: none;
      }
      .week-links a:hover {
        text-decoration: underline;
      }
      @media (max-width: 720px) {
        .page {
          width: min(100vw - 20px, 1160px);
          margin: 12px auto 28px;
        }
        .hero, .panel {
          padding: 20px;
          border-radius: 22px;
        }
        .week-card-head {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>แดชบอร์ดภาพรวมรายวิชา</h1>
        <p>${escapeHtml(`หน้านี้เป็นทางเข้าระดับรายวิชาสำหรับ ${courseDashboardData.context.course_id} โดย backend จะรวมข้อมูลจากหลายสัปดาห์ที่ถูกสร้างไว้แล้ว เพื่อให้เห็นความคืบหน้า ภาพรวม CQI และลิงก์เข้าหน้าแต่ละสัปดาห์จากจุดเดียว`)}</p>
      </section>

      <section class="panel">
        <h2>ภาพรวมทั้งรายวิชา</h2>
        <div class="metric-grid">
          ${renderMetricCard('จำนวนสัปดาห์ที่มีข้อมูล', String(overview.indexed_weeks || 0), 'accent')}
          ${renderMetricCard('สัปดาห์ที่เสร็จสิ้น', String(overview.completed_weeks || 0), 'accent')}
          ${renderMetricCard('ความคืบหน้าเฉลี่ย', `${overview.average_progress_percent || 0}%`, 'warm')}
          ${renderMetricCard('อัตราการบรรลุ CLO เฉลี่ย', `${overview.average_attainment_rate_percent || 0}%`, 'warm')}
          ${renderMetricCard('ผลประเมินสะสม', String(overview.total_assessment_results || 0))}
          ${renderMetricCard('เหตุการณ์ analytics สะสม', String(overview.total_analytics_events || 0))}
        </div>
      </section>

      <section class="panel">
        <h2>ไฟล์หลักระดับรายวิชา</h2>
        <div class="week-links">
          <a href="./course-dashboard-data.json">ข้อมูลภาพรวมรายวิชา JSON</a>
        </div>
      </section>

      <section class="panel">
        <h2>รายการสัปดาห์ที่มีข้อมูล</h2>
        <div class="week-grid">
          ${courseDashboardData.weeks.map((weekItem) => renderWeekCard(weekItem)).join('')}
        </div>
      </section>
    </main>
  </body>
</html>`;
}

module.exports = {
  renderCourseDashboardPage
};
