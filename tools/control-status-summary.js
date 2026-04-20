'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_OUTPUT_ROOT } = require('./course-dashboard-data');
const { buildCourseActionQueue } = require('./course-action-queue');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractLabeledCodeValue(markdown, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '- \\`' + escapedLabel + '\\`: \\`([^\\`]+)\\`';
  const match = new RegExp(pattern).exec(markdown);
  return match ? match[1] : null;
}

function extractSectionBulletItems(markdown, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escapedLabel}:\\n\\n((?:- .+\\n)+)`).exec(markdown);

  if (!match) {
    return [];
  }

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2));
}

function extractHeadingBulletItems(markdown, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?:\\n## |$)`).exec(markdown);

  if (!match) {
    return [];
  }

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2));
}

function extractMarkdownParagraph(markdown, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?:\\n## |$)`).exec(markdown);

  if (!match) {
    return null;
  }

  return match[1].trim();
}

function extractNextPhaseTarget(markdown) {
  const match = /Target next phase after exit:\n\n- `Phase`: `([^`]+)`/.exec(markdown);
  return match ? match[1] : null;
}

function buildControlStatusSummary({
  coursePath,
  weeklyPlanPath,
  outputRoot = DEFAULT_OUTPUT_ROOT
}) {
  const projectStatusPath = path.join(process.cwd(), 'PROJECT_STATUS.md');
  const phaseNotePath = path.join(process.cwd(), 'ARCHITECTURE_PHASE_NOTE.md');
  const nextTaskPath = path.join(process.cwd(), 'NEXT_TASK.md');

  const projectStatus = readFile(projectStatusPath);
  const phaseNote = readFile(phaseNotePath);
  const nextTask = readFile(nextTaskPath);
  const actionQueue = buildCourseActionQueue({
    coursePath,
    weeklyPlanPath,
    outputRoot
  });

  return {
    summary_type: 'control_status_summary_v1',
    generated_at: new Date().toISOString(),
    current_phase: {
      phase: extractLabeledCodeValue(phaseNote, 'Phase'),
      process: extractLabeledCodeValue(phaseNote, 'Process'),
      position: extractLabeledCodeValue(phaseNote, 'Position')
    },
    current_status: {
      completed_layers: extractSectionBulletItems(projectStatus, 'Completed layers'),
      in_progress: extractSectionBulletItems(projectStatus, 'In progress'),
      next_focus: extractSectionBulletItems(projectStatus, 'Next focus')
    },
    locked_task: {
      phase: extractLabeledCodeValue(nextTask, 'Phase'),
      process: extractLabeledCodeValue(nextTask, 'Process'),
      task_id: extractLabeledCodeValue(nextTask, 'Task ID'),
      task: extractMarkdownParagraph(nextTask, 'Task'),
      done_criteria: extractSectionBulletItems(nextTask, 'Done Criteria')
    },
    next_recommended_action: actionQueue.actions[0] || null,
    next_phase_target: {
      phase: extractNextPhaseTarget(phaseNote),
      exit_criteria: extractHeadingBulletItems(phaseNote, 'Exit Criteria For Next Phase')
    }
  };
}

function getControlStatusSummaryFilePath(outputRoot = DEFAULT_OUTPUT_ROOT) {
  return path.join(outputRoot, 'control-status-summary.json');
}

module.exports = {
  buildControlStatusSummary,
  getControlStatusSummaryFilePath
};
