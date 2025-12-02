interface ChatAreaProps {
  children: React.ReactNode;
  className?: string
}

export default function ChatArea({
    children,
    className = ""
}: ChatAreaProps) {
    return (
        <div className={`h-full col-span-2 flex flex-col justify-end gap-2 ${className}`}>{children}</div>
    )
}