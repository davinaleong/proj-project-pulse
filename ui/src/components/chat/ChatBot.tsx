import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import ChatWindow from "./ChatWindow"
import IconButton from "../common/IconButton"

export default function ChatBot() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-[1em] right-[1em] z-50 flex flex-col items-end">
      {/* Chat window */}
      {open && <ChatWindow onClose={() => setOpen(false)} />}

      {/* Floating chat icon button */}
      <IconButton
        icon={open ? X : MessageCircle}
        color="primary"
        tooltip={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
      />
    </div>
  )
}
