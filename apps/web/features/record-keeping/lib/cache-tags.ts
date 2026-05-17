/** Cache tag for a student's lesson-record history — used by updateTag/unstable_cache. */
export const studentLessonRecordsTag = (studentId: string) =>
  `student-lesson-records:${studentId}`;

/** Cache tag for a classroom's attention summary. */
export const classroomAttentionTag = (schoolClassId: string) =>
  `classroom-attention:${schoolClassId}`;

/** Cache tag for a classroom's heatmap aggregate. */
export const classroomHeatmapTag = (schoolClassId: string) =>
  `classroom-heatmap:${schoolClassId}`;
