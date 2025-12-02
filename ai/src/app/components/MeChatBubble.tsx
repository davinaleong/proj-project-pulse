interface MeChatBubbleProps {
  children: React.ReactNode;
  className?: string
}


export default function MeChatBubble({
    children,
    className = ""
}: MeChatBubbleProps) {
    return (
        <div className={`max-w-[60ch] p-2 rounded-sm text-slate-900 bg-teal-200 self-end ${className}`}>{children}</div>
    )
}