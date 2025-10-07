import { useState, useRef, useEffect } from "react"
import ChatMessages from "./ChatMessages"
import ChatInput from "./ChatInput"
import Card from "../common/Card"

function ChatWindow() {
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([])

  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSend = (text: string) => {
    if (!text.trim()) return
    setMessages((prev) => [...prev, { role: "user", text }])
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "🤖 Got it! I’m still learning." },
      ])
    }, 800)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <Card
      color="default"
      className="w-[340px] sm:w-[380px] h-[480px] flex flex-col mb-[1em] shadow-xl overflow-hidden"
      expandable={false}
    >
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-[1em] py-[0.5em] flex flex-col gap-[1em] bg-white dark:bg-gray-800"
      >
        {messages.map((msg, idx) => (
          <ChatMessages key={idx} messages={[msg]} />
        ))}
      </div>

      {/* Input bar pinned to bottom */}
      <div className="border-t border-inherit bg-gray-50 dark:bg-gray-900 flex-none">
        <ChatInput onSend={handleSend} />
      </div>
    </Card>
  )
}

export default ChatWindow
