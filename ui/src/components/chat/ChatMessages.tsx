import ChatBubble from "./ChatBubble"

type ChatMessagesProps = {
  messages: { role: "user" | "bot"; text: string }[]
}

function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-[1em] py-[0.5em] space-y-[1em] bg-white dark:bg-gray-800">
      {messages.map((msg, idx) => (
        <ChatBubble key={idx} role={msg.role} text={msg.text} />
      ))}
    </div>
  )
}

export default ChatMessages
