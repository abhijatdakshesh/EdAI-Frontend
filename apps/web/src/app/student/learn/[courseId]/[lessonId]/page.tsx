import { LessonView } from "@/features/lms/lesson-view";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  return <LessonView courseId={courseId} lessonId={lessonId} />;
}
