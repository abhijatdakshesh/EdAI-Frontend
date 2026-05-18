import { StudentChatbot } from "@/features/student/chatbot";

/** Parent-side Ask-Ed8AI. Reuses StudentChatbot — the server-side
 *  knowledge-graph builder swaps to the ParentKnowledgeGraph (child's
 *  data) based on JWT role. */
export default function ParentChatbotPage() {
  return <StudentChatbot />;
}
