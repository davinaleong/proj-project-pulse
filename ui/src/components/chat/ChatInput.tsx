import { useState } from "react"
import { Send } from "lucide-react"

type ChatInputProps = {
  onSend: (text: string) => void
}

function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(text)
    setText("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 border-t border-inherit bg-gray-50 dark:bg-gray-900"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 rounded-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pp-teal-400"
      />
      <button
        type="submit"
        className="p-2 rounded-full bg-pp-teal-500 text-white hover:bg-pp-teal-600"
      >
        <Send size={16} />
      </button>
    </form>
  )
}

export default ChatInput
