import { StudentChatbot } from "@/features/student/chatbot";

/** Admin/Principal Chat Sessions surface — currently the same chat UI as
 *  the other roles; the backend knowledge-graph builder selects
 *  AdminKnowledgeGraph by JWT role so replies are scoped to the
 *  institution. (A dedicated session-history view is tracked separately.) */
export default function AdminChatbotPage() {
  return <StudentChatbot />;
}
