import { redirect } from "next/navigation";
import { ChatBox } from "@/components/chat-box";
import { currentUserId } from "@/lib/session";

export default async function ChatPage() {
  if (!(await currentUserId())) redirect("/");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ask PayHub</h1>
        <p className="text-sm text-muted">Questions about your spending, budgets, and true costs. Family members&apos; private items stay private.</p>
      </div>
      <ChatBox />
    </div>
  );
}
