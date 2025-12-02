import Link from "next/link";

interface StaticButtonProps {
  children: React.ReactNode;
  href?: string;
  textColor?: string;
  bgColor?: string;
}

export default function StaticButton({
  children,
  href = "#",
  textColor = "text-white",
  bgColor = "bg-gray-800",
}: StaticButtonProps) {
    return (
        <Link
            href={href}
            className={`
            inline-flex gap-2 items-center px-4 py-2 rounded-sm 
            font-medium
            ${textColor} ${bgColor}
            hover:opacity-50
            `}
        >
            {children}
        </Link>
    )
}