import { CourseModulesPage } from "@/features/lms/course-modules-page";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseModulesPage courseId={courseId} />;
}
