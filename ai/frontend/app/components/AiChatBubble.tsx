interface AiChatBubbleProps {
  children: React.ReactNode;
  className?: string
}

export default function AiChatBubble({
    children,
    className = ""
}: AiChatBubbleProps) {
    return (
        <div className={`max-w-[60ch] p-2 rounded-sm text-slate-900 bg-white self-start ${className}`}>{children}</div>
    )
}