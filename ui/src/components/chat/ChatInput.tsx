import { useState } from "react"
import { Send } from "lucide-react"
import Input from "./../forms/Input"
import Button from "./../common/Button"

type ChatInputProps = {
  onSend: (text: string) => void
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(text)
    setText("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-[1em] p-[1em] border-t border-inherit bg-gray-50 dark:bg-gray-900"
    >
      <Input
        name="chatMessage"
        placeholder="Type your message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1"
      />

      <Button
        onClick={() => onSend(text)}
        type="submit"
        variant="icon"
        icon={Send}
        color="primary"
      />
    </form>
  )
}
