import { StudentChatbot } from "@/features/student/chatbot";

/** Faculty-side Ask-Ed8AI. Reuses StudentChatbot — the server-side
 *  knowledge-graph builder swaps to the TeacherKnowledgeGraph based on
 *  the JWT role, so the same UI works for both. */
export default function TeacherChatbotPage() {
  return <StudentChatbot />;
}
