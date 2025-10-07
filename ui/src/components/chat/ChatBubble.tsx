import clsx from "clsx"
import { getColorClasses } from "../../utils/colors"

type ChatBubbleProps = {
  role: "user" | "bot"
  text: string
}

function ChatBubble({ role, text }: ChatBubbleProps) {
  const bubbleColor =
    role === "user" ? getColorClasses("primary") : getColorClasses("secondary")

  const align = role === "user" ? "items-end" : "items-start"

  return (
    <div className={clsx("flex w-full", align)}>
      <div
        className={clsx(
          "rounded-2xl px-3 py-2 max-w-[80%] text-sm shadow-sm",
          bubbleColor
        )}
      >
        {text}
      </div>
    </div>
  )
}

export default ChatBubble
