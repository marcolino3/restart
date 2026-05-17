/** Cache tag for a student's lesson-record history — used by updateTag/unstable_cache. */
export const studentLessonRecordsTag = (studentId: string) =>
  `student-lesson-records:${studentId}`;
