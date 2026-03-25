import MessageProvider from "@/components/messages/MessageProvider";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MessageProvider>{children}</MessageProvider>;
}
