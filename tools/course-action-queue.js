'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { DEFAULT_OUTPUT_ROOT, getCourseOutputFilePath } = require('./course-dashboard-data');
const { loadCourseBuildHistory } = require('./build-history');
const { buildCourseOutputRegistry } = require('./output-registry');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildCommand(coursePath, weeklyPlanPath, weeks) {
  return `node tools/run-demo-course-workflow.js ${coursePath} ${weeklyPlanPath} ${weeks.join(',')}`;
}

function buildCourseActionQueue({
  coursePath,
  weeklyPlanPath,
  outputRoot = DEFAULT_OUTPUT_ROOT,
  outputRegistry,
  buildHistory
}) {
  const resolvedCoursePath = path.resolve(process.cwd(), coursePath);
  const resolvedWeeklyPlanPath = path.resolve(process.cwd(), weeklyPlanPath);
  const course = readYaml(resolvedCoursePath);
  const courseRoot = course.course || {};
  const courseId = courseRoot.course_id;
  const registry = outputRegistry || buildCourseOutputRegistry({
    coursePath: resolvedCoursePath,
    weeklyPlanPath: resolvedWeeklyPlanPath,
    outputRoot
  });
  const history = buildHistory || loadCourseBuildHistory(courseId, { outputRoot });
  const weekNumbers = registry.weeks.map((item) => item.week);
  const starterWeeks = weekNumbers.slice(0, 3);
  const missingWeeks = registry.weeks.filter((item) => item.status === 'missing');
  const partialWeeks = registry.weeks.filter((item) => item.status === 'partial');
  const completeWeeks = registry.weeks.filter((item) => item.status === 'complete');
  const actions = [];

  if (history.runs.length === 0 || completeWeeks.length === 0) {
    actions.push({
      action_id: 'build_starter_course',
      priority: 'high',
      action_type: 'build_starter_course',
      title: 'สร้างชุดเริ่มต้นของรายวิชา',
      description: 'ยังไม่มี output ที่พร้อมใช้งานพอสำหรับดูภาพรวม ควรสร้างสัปดาห์เริ่มต้นก่อน',
      weeks: starterWeeks,
      command: buildCommand(coursePath, weeklyPlanPath, starterWeeks),
      rationale: 'สร้างฐาน output ชุดแรกเพื่อให้มี week, course, และ control outputs ที่ใช้งานได้ทันที'
    });
  }

  if (partialWeeks.length > 0) {
    actions.push({
      action_id: 'repair_partial_weeks',
      priority: 'high',
      action_type: 'repair_partial_weeks',
      title: 'ซ่อมสัปดาห์ที่ไฟล์ยังไม่ครบ',
      description: `พบ ${partialWeeks.length} สัปดาห์ที่มี output บางส่วนแต่ยังไม่ครบ`,
      weeks: partialWeeks.map((item) => item.week),
      command: buildCommand(coursePath, weeklyPlanPath, partialWeeks.map((item) => item.week)),
      rationale: 'สัปดาห์ที่มีไฟล์บางส่วนมีความเสี่ยงต่อความสับสนในการใช้งาน ควรซ่อมก่อนขยายต่อ'
    });
  }

  if (missingWeeks.length > 0) {
    const nextMissing = missingWeeks[0];
    actions.push({
      action_id: 'build_next_missing_week',
      priority: 'medium',
      action_type: 'build_next_missing_week',
      title: `สร้างสัปดาห์ถัดไปที่ยังไม่มี output`,
      description: `สัปดาห์ ${nextMissing.week} ยังไม่มี output พร้อมใช้งาน`,
      weeks: [nextMissing.week],
      command: buildCommand(coursePath, weeklyPlanPath, [nextMissing.week]),
      rationale: 'เดินหน้าแบบค่อยเป็นค่อยไปโดยเพิ่มสัปดาห์ถัดไปที่ยังขาด'
    });

    actions.push({
      action_id: 'build_all_missing_weeks',
      priority: 'medium',
      action_type: 'build_all_missing_weeks',
      title: 'สร้างทุกสัปดาห์ที่ยังขาด',
      description: `ยังมี ${missingWeeks.length} สัปดาห์ที่ไม่มี output`,
      weeks: missingWeeks.map((item) => item.week),
      command: buildCommand(coursePath, weeklyPlanPath, missingWeeks.map((item) => item.week)),
      rationale: 'ใช้เมื่ออยากยกระดับรายวิชาให้ใกล้คำว่า complete มากขึ้นในรอบเดียว'
    });
  }

  actions.push({
    action_id: 'refresh_full_course',
    priority: missingWeeks.length === 0 && partialWeeks.length === 0 ? 'medium' : 'low',
    action_type: 'refresh_full_course',
    title: 'รีเฟรช output ทั้งรายวิชา',
    description: 'สร้าง output ทั้งรายวิชาจาก weekly plan ปัจจุบันอีกครั้ง',
    weeks: weekNumbers,
    command: buildCommand(coursePath, weeklyPlanPath, weekNumbers),
    rationale: 'ใช้เมื่ออยากให้ทุก read-model และ published outputs กลับมาตรงกับ source ปัจจุบัน'
  });

  return {
    queue_type: 'course_action_queue_v1',
    generated_at: new Date().toISOString(),
    context: {
      course_id: courseId,
      course_code: courseRoot.course_code,
      course_title_th: courseRoot.course_title_th,
      total_weeks: weekNumbers.length
    },
    overview: {
      total_actions: actions.length,
      high_priority_actions: actions.filter((item) => item.priority === 'high').length,
      missing_week_count: missingWeeks.length,
      partial_week_count: partialWeeks.length,
      complete_week_count: completeWeeks.length,
      latest_run_at: history.runs[0]?.generated_at || null
    },
    actions
  };
}

function getCourseActionQueueFilePath(courseId, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return getCourseOutputFilePath(courseId, 'course-action-queue.json', outputRoot);
}

module.exports = {
  buildCourseActionQueue,
  getCourseActionQueueFilePath
};
