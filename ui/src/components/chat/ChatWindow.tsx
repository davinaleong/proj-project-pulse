import { useState } from "react"
import ChatHeader from "./ChatHeader"
import ChatMessages from "./ChatMessages"
import ChatInput from "./ChatInput"
import Card from "../common/Card"

type ChatWindowProps = {
  onClose: () => void
}

function ChatWindow({ onClose }: ChatWindowProps) {
  const [minimised, setMinimised] = useState(false)
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([])

  const handleSend = (text: string) => {
    if (!text.trim()) return
    setMessages((prev) => [...prev, { role: "user", text }])
    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "🤖 Got it! I’m still learning." },
      ])
    }, 800)
  }

  return (
    <Card
      title="AI Chat Assistant"
      color="default"
      className="w-[340px] sm:w-[380px] h-[480px] flex flex-col mb-4 shadow-xl"
      expandable={false}
    >
      <ChatHeader
        minimised={minimised}
        setMinimised={setMinimised}
        onClose={onClose}
      />

      {!minimised && (
        <>
          <ChatMessages messages={messages} />
          <ChatInput onSend={handleSend} />
        </>
      )}
    </Card>
  )
}

export default ChatWindow
