interface NavProps {
  children: React.ReactNode;
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export default function Flex({ children, justifyContent = 'start' }: NavProps

) {
    const justifyClass = `justify-${justifyContent}`;
    
    return (
        <nav className={`flex gap-2 flex-wrap ${justifyClass}`}>{children}</nav>
    )
}