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
          "rounded-sm px-[1em] py-[0.5em] max-w-[80%] text-sm shadow-sm",
          bubbleColor
        )}
      >
        {text}
      </div>
    </div>
  )
}

export default ChatBubble
