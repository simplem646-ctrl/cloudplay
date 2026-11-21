// Registers the academic scenes with the scene registry. Boot code calls registerAcademicScenes().
import { registerScene } from '../registry.js';
import { ClassScene } from './class.js';
import { ExamScene } from './exam.js';
import { ReportCardScene } from './report_card.js';
import { StudyHomeScene, StudyLibraryScene } from './study.js';

export { ClassScene, ExamScene, ReportCardScene, StudyHomeScene, StudyLibraryScene };
export * from './logic.js';

export function registerAcademicScenes() {
  registerScene('class', (game, params) => new ClassScene(game, params));
  registerScene('exam', (game, params) => new ExamScene(game, params));
  registerScene('report_card', (game, params) => new ReportCardScene(game, params));
  registerScene('activity:study_home', (game, params) => new StudyHomeScene(game, params));
  registerScene('activity:study_library', (game, params) => new StudyLibraryScene(game, params));
}
