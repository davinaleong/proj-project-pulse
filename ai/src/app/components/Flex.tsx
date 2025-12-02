interface FlexProps {
  children: React.ReactNode;
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
}

export default function Flex({ children, alignItems = 'start' }: FlexProps) {
    const alignClass = `items-${alignItems}`;
    
    return (
        <div className={`flex gap-2 flex-wrap ${alignClass}`}>{children}</div>
    )
}