import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import ChatWindow from "./ChatWindow"

function ChatBot() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-[1em] right-[1em] z-50 flex flex-col items-end">
      {open && <ChatWindow onClose={() => setOpen(false)} />}

      <button
        onClick={() => setOpen(!open)}
        className="bg-pp-teal-600 text-white p-[1em] rounded-full shadow-lg hover:bg-pp-teal-700 transition-all"
        aria-label="Toggle Chat"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  )
}

export default ChatBot
