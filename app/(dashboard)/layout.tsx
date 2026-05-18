import { NexaChatUI } from "@/components/chat/nexa-chat-ui";
import { CommandPalette } from "@/components/layout/command-palette";
import { AuthGate } from "@/components/common/auth-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <NexaChatUI>{children}</NexaChatUI>
      <CommandPalette />
    </AuthGate>
  );
}
