'use strict';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTagList(items, className = 'tag-list') {
  if (!items || items.length === 0) {
    return '<span class="tag empty">None</span>';
  }

  return `<div class="${className}">${items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join('')}</div>`;
}

function renderProgress(runtimeSummary = {}) {
  const progressPercent = Number(runtimeSummary.progress_percent ?? 0);
  const status = runtimeSummary.status || 'not_started';
  const requiredSections = `${runtimeSummary.required_sections_completed ?? 0}/${runtimeSummary.required_sections_total ?? 0}`;
  const requiredActivities = `${runtimeSummary.required_activities_completed ?? 0}/${runtimeSummary.required_activities_total ?? 0}`;

  return `
    <section class="panel progress-panel">
      <div class="panel-header">
        <h2>Progress</h2>
        <span class="status-pill">${escapeHtml(status.replace(/_/g, ' '))}</span>
      </div>
      <div class="progress-meter" aria-label="Module progress">
        <div class="progress-fill" style="width:${progressPercent}%"></div>
      </div>
      <div class="progress-grid">
        <div class="metric">
          <span class="metric-label">Completion</span>
          <strong>${escapeHtml(`${progressPercent}%`)}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">Required sections</span>
          <strong>${escapeHtml(requiredSections)}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">Required activities</span>
          <strong>${escapeHtml(requiredActivities)}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderSectionCards(bundle) {
  const blockById = new Map((bundle.interactive_module.content_blocks || []).map((block) => [block.block_id, block]));
  const activityById = new Map((bundle.interactive_module.activities || []).map((activity) => [activity.activity_id, activity]));

  return `
    <section class="panel">
      <div class="panel-header">
        <h2>Learning Flow</h2>
        <span class="panel-meta">${escapeHtml(`${bundle.interactive_module.learning_flow.length} sections`)}</span>
      </div>
      <div class="section-stack">
        ${bundle.interactive_module.learning_flow.map((section, index) => `
          <article class="section-card">
            <div class="section-card-header">
              <span class="section-order">${escapeHtml(String(index + 1).padStart(2, '0'))}</span>
              <div>
                <h3>${escapeHtml(section.section_type)}</h3>
                <p>${escapeHtml(section.section_id)}</p>
              </div>
            </div>
            <div class="section-body">
              <div class="section-subblock">
                <h4>Blocks</h4>
                ${section.block_refs.map((blockId) => {
                  const block = blockById.get(blockId);
                  return `
                    <article class="content-card">
                      <header>
                        <strong>${escapeHtml(block?.type || 'unknown')}</strong>
                        <span>${escapeHtml(blockId)}</span>
                      </header>
                      <pre>${escapeHtml(block?.content || 'Missing block content')}</pre>
                    </article>
                  `;
                }).join('')}
              </div>
              <div class="section-subblock">
                <h4>Activities</h4>
                ${section.activity_refs.length === 0
                  ? '<p class="empty-copy">No activities in this section.</p>'
                  : section.activity_refs.map((activityId) => {
                      const activity = activityById.get(activityId);
                      return `
                        <article class="activity-card compact">
                          <header>
                            <strong>${escapeHtml(activityId)}</strong>
                            <span>${escapeHtml(activity?.type || 'unknown')}</span>
                          </header>
                          <div class="activity-meta">
                            ${renderTagList([activity?.clo_mapping?.primary, ...(activity?.clo_mapping?.secondary || [])].filter(Boolean))}
                          </div>
                        </article>
                      `;
                    }).join('')}
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderMaterials(materials) {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>Supplementary Materials</h2>
        <span class="panel-meta">${escapeHtml(`${materials.length} items`)}</span>
      </div>
      <div class="material-grid">
        ${materials.length === 0
          ? '<p class="empty-copy">No supplementary materials matched this week.</p>'
          : materials.map((item) => `
              <article class="material-card">
                <header>
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.type)}</span>
                </header>
                <p>${escapeHtml(item.description)}</p>
                ${renderTagList([item.topic, ...(item.tags || [])])}
              </article>
            `).join('')}
      </div>
    </section>
  `;
}

function renderSbraPayloads(payloads) {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>SBRA Payloads</h2>
        <span class="panel-meta">${escapeHtml(`${payloads.length} payloads`)}</span>
      </div>
      <div class="sbra-grid">
        ${payloads.length === 0
          ? '<p class="empty-copy">No SBRA payloads for this week.</p>'
          : payloads.map((payload) => `
              <article class="sbra-card">
                <header>
                  <strong>${escapeHtml(payload.activity_id)}</strong>
                  <span>${escapeHtml(payload.blueprint?.blueprint_id || 'no-blueprint')}</span>
                </header>
                <h3>${escapeHtml(payload.name)}</h3>
                <p>${escapeHtml(payload.blueprint?.problem || 'No blueprint problem attached.')}</p>
                <div class="sbra-meta">
                  ${renderTagList([
                    payload.clo_mapping?.primary,
                    ...(payload.clo_mapping?.secondary || []),
                    ...(payload.evidence_tags || [])
                  ].filter(Boolean))}
                </div>
              </article>
            `).join('')}
      </div>
    </section>
  `;
}

function renderWeekBundlePage(bundle, runtimeSummary = {}) {
  const moduleRoot = bundle.interactive_module;
  const title = `${moduleRoot.course_id} Week ${moduleRoot.week} - ${moduleRoot.title}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --bg: #f5f1e8;
        --paper: #fffdf8;
        --ink: #1f2a30;
        --muted: #5c696f;
        --line: #d8cfc2;
        --accent: #0f766e;
        --accent-soft: #d6f0ea;
        --warm: #a16207;
        --warm-soft: #f7e7bf;
        --shadow: 0 18px 50px rgba(31, 42, 48, 0.08);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(247, 231, 191, 0.9), transparent 32%),
          linear-gradient(180deg, #faf7f0 0%, var(--bg) 100%);
      }

      .page {
        width: min(1180px, calc(100vw - 32px));
        margin: 24px auto 48px;
      }

      .hero {
        background: linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(26, 54, 93, 0.92));
        color: white;
        border-radius: 28px;
        padding: 28px;
        box-shadow: var(--shadow);
      }

      .hero h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 5vw, 3.2rem);
        line-height: 1.05;
      }

      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 18px;
      }

      .hero-chip, .status-pill, .tag {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 0.92rem;
      }

      .hero-chip {
        background: rgba(255, 255, 255, 0.16);
      }

      .layout {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        gap: 20px;
        margin-top: 20px;
      }

      .sidebar, .main {
        display: grid;
        gap: 20px;
      }

      .panel {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 20px;
        box-shadow: var(--shadow);
      }

      .panel-header, .section-card-header, .activity-card header, .material-card header, .sbra-card header, .content-card header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .panel-header h2, .section-card h3, .sbra-card h3 {
        margin: 0;
      }

      .panel-meta, .metric-label, .section-card p, .activity-card header span, .material-card header span, .sbra-card header span, .content-card header span, .empty-copy {
        color: var(--muted);
      }

      .progress-meter {
        width: 100%;
        height: 14px;
        border-radius: 999px;
        background: #e7dfd2;
        overflow: hidden;
        margin: 16px 0;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--warm), var(--accent));
      }

      .progress-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .metric {
        background: #faf6ee;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 12px;
      }

      .status-pill {
        background: var(--accent-soft);
        color: var(--accent);
        text-transform: capitalize;
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tag {
        background: var(--warm-soft);
        color: #7a4e03;
      }

      .tag.empty {
        background: #f1ece4;
        color: var(--muted);
      }

      .section-stack, .material-grid, .sbra-grid {
        display: grid;
        gap: 16px;
      }

      .section-card {
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 16px;
        background: linear-gradient(180deg, #fffdf9, #f8f4ec);
      }

      .section-order {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: bold;
      }

      .section-body {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-top: 14px;
      }

      .section-subblock h4 {
        margin: 0 0 10px;
      }

      .content-card, .activity-card.compact, .material-card, .sbra-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px;
        background: white;
      }

      .content-card pre {
        margin: 10px 0 0;
        white-space: pre-wrap;
        font-family: "Courier New", monospace;
        font-size: 0.92rem;
        color: #21323c;
      }

      .activity-meta, .sbra-meta {
        margin-top: 10px;
      }

      @media (max-width: 920px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .section-body,
        .progress-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>${escapeHtml(moduleRoot.title)}</h1>
        <p>${escapeHtml(`Module ${moduleRoot.module_id} for course ${moduleRoot.course_id}`)}</p>
        <div class="hero-meta">
          <span class="hero-chip">${escapeHtml(`Week ${moduleRoot.week}`)}</span>
          <span class="hero-chip">${escapeHtml(`Primary CLO: ${moduleRoot.clo_focus.primary}`)}</span>
          <span class="hero-chip">${escapeHtml(`Secondary CLOs: ${(moduleRoot.clo_focus.secondary || []).join(', ') || 'None'}`)}</span>
        </div>
      </section>

      <div class="layout">
        <aside class="sidebar">
          ${renderProgress(runtimeSummary)}
          ${renderMaterials(bundle.supplementary_materials || [])}
          ${renderSbraPayloads(bundle.sbra_payloads || [])}
        </aside>

        <section class="main">
          ${renderSectionCards(bundle)}
        </section>
      </div>
    </main>
  </body>
</html>`;
}

module.exports = {
  renderWeekBundlePage
};
