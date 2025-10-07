import { Minus, Maximize2, X } from "lucide-react"

type ChatHeaderProps = {
  minimised: boolean
  setMinimised: (val: boolean) => void
  onClose: () => void
}

function ChatHeader({ minimised, setMinimised, onClose }: ChatHeaderProps) {
  return (
    <div className="flex justify-between items-center px-4 py-2 border-b border-inherit bg-pp-teal-600 text-white">
      <span className="font-semibold text-sm">AI Chat Assistant</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMinimised(!minimised)}
          className="hover:text-pp-teal-200 transition-colors"
          title={minimised ? "Maximise" : "Minimise"}
        >
          {minimised ? <Maximize2 size={16} /> : <Minus size={16} />}
        </button>
        <button
          onClick={onClose}
          className="hover:text-pp-teal-200 transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader
