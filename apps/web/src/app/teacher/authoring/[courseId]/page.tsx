import { ModuleAuthoring } from "@/features/teacher/module-authoring";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <ModuleAuthoring courseId={courseId} />;
}
