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

function buildCourseRelativePath(courseId, fileName) {
  return `./${courseId}/${fileName}`;
}

function renderCourseCard(courseItem) {
  return `
    <article class="course-card">
      <div class="course-card-head">
        <div>
          <h3>${escapeHtml(courseItem.context.course_id)}</h3>
          <p>${escapeHtml(`มีข้อมูล ${courseItem.overview.indexed_weeks} สัปดาห์ และเสร็จสิ้นแล้ว ${courseItem.overview.completed_weeks} สัปดาห์`)}</p>
        </div>
      </div>
      <div class="course-metrics">
        <span>${escapeHtml(`ความคืบหน้าเฉลี่ย: ${courseItem.overview.average_progress_percent}%`)}</span>
        <span>${escapeHtml(`ผลประเมินสะสม: ${courseItem.overview.total_assessment_results}`)}</span>
        <span>${escapeHtml(`เหตุการณ์ analytics: ${courseItem.overview.total_analytics_events}`)}</span>
      </div>
      <div class="course-links">
        <a href="${escapeHtml(buildCourseRelativePath(courseItem.context.course_id, 'course-dashboard.html'))}">หน้าแดชบอร์ดรายวิชา</a>
        <a href="${escapeHtml(buildCourseRelativePath(courseItem.context.course_id, 'course-dashboard-data.json'))}">ข้อมูลรายวิชา JSON</a>
      </div>
    </article>
  `;
}

function renderCatalogDashboardPage(catalogDashboardData) {
  const overview = catalogDashboardData.overview || {};

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>แคตตาล็อกแดชบอร์ด</title>
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
      .metric-grid, .course-grid {
        display: grid;
        gap: 14px;
      }
      .metric-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      .course-grid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .metric-card, .course-card {
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
      .course-card h3 {
        margin: 0 0 8px;
        font-size: 1.2rem;
      }
      .course-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .course-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 14px;
        margin-top: 14px;
        color: var(--muted);
      }
      .course-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 16px;
        margin-top: 16px;
      }
      .course-links a {
        color: var(--accent);
        text-decoration: none;
      }
      .course-links a:hover {
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
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>แคตตาล็อกแดชบอร์ดระบบ</h1>
        <p>หน้านี้เป็นทางเข้าระดับบนสุดของระบบ โดย backend จะสแกนรายวิชาที่มี output อยู่แล้ว แล้วรวมเป็นแคตตาล็อกเดียวเพื่อเข้าถึง dashboard ของแต่ละรายวิชาได้จากหน้าเดียว</p>
      </section>

      <section class="panel">
        <h2>ภาพรวมทั้งระบบ</h2>
        <div class="metric-grid">
          ${renderMetricCard('จำนวนรายวิชาที่มีข้อมูล', String(overview.indexed_courses || 0), 'accent')}
          ${renderMetricCard('จำนวนสัปดาห์สะสม', String(overview.indexed_weeks || 0), 'accent')}
          ${renderMetricCard('สัปดาห์ที่เสร็จสิ้น', String(overview.completed_weeks || 0), 'warm')}
          ${renderMetricCard('ความคืบหน้าเฉลี่ยระดับรายวิชา', `${overview.average_course_progress_percent || 0}%`, 'warm')}
          ${renderMetricCard('ผลประเมินสะสม', String(overview.total_assessment_results || 0))}
          ${renderMetricCard('เหตุการณ์ analytics สะสม', String(overview.total_analytics_events || 0))}
        </div>
      </section>

      <section class="panel">
        <h2>ไฟล์หลักระดับระบบ</h2>
        <div class="course-links">
          <a href="./catalog-dashboard-data.json">ข้อมูลแคตตาล็อก JSON</a>
        </div>
      </section>

      <section class="panel">
        <h2>รายการรายวิชาที่มีข้อมูล</h2>
        <div class="course-grid">
          ${catalogDashboardData.courses.map((courseItem) => renderCourseCard(courseItem)).join('')}
        </div>
      </section>
    </main>
  </body>
</html>`;
}

module.exports = {
  renderCatalogDashboardPage
};
