interface FlexProps {
  children: React.ReactNode;
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export default function Flex({ children, justifyContent = 'start' }: FlexProps) {
    const justifyClass = `justify-${justifyContent}`;
    
    return (
        <div className={`flex gap-2 flex-wrap ${justifyClass}`}>{children}</div>
    )
}