import { Minus, Maximize2, X } from "lucide-react"
import Button from "../common/Button"

type ChatHeaderProps = {
  minimised: boolean
  setMinimised: (val: boolean) => void
  onClose: () => void
}

export default function ChatHeader({
  minimised,
  setMinimised,
  onClose,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-[1em] py-[0.5em] border-b border-inherit bg-pp-teal-600 text-white">
      {/* Left: Chat title */}
      <h3 className="font-semibold text-sm tracking-wide">AI Chat Assistant</h3>

      {/* Right: Controls (Minimise / Close) */}
      <div className="flex items-center gap-[1em">
        {/* Minimise / Maximise toggle */}
        <Button
          onClick={() => setMinimised(!minimised)}
          variant="icon"
          icon={minimised ? Maximize2 : Minus}
          color="transparent"
          className="text-white border-none bg-transparent hover:opacity-80 active:opacity-60"
        />

        {/* Close chat */}
        <Button
          onClick={onClose}
          variant="icon"
          icon={X}
          color="transparent"
          className="text-white border-none bg-transparent hover:opacity-80 active:opacity-60"
        />
      </div>
    </header>
  )
}
