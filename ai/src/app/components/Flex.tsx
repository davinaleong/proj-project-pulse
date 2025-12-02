interface FlexProps {
  children: React.ReactNode;
}

export default function Flex({ children }: FlexProps) {
    return (
        <div className="flex gap-2 flex-wrap">{children}</div>
    )
}