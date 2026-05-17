/** Cache tag for a student's enrollment list — used by updateTag/unstable_cache. */
export const studentEnrollmentsTag = (studentId: string) =>
  `student-enrollments:${studentId}`;
