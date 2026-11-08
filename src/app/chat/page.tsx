import { redirect } from "next/navigation";
import { ChatBox } from "@/components/chat-box";
import { currentUserId } from "@/lib/session";

export default async function ChatPage() {
  if (!(await currentUserId())) redirect("/");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Ask about your money</h1>
        <p className="mt-1 text-sm text-muted">Spending, budgets and true costs. Items family members marked private stay private.</p>
      </div>
      <ChatBox />
    </div>
  );
}
