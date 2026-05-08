export { getLessonFiles, getLessonStarterFiles } from './load';

import { getLessonStarterFiles } from './load';

export function lessonHasFiles(slug: string): boolean {
  return getLessonStarterFiles(slug).length > 0;
}
