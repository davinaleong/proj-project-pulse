import Link from "next/link";

interface StaticButtonProps {
    label: string;
    href?: string;
  textColor?: string;
  bgColor?: string;
}

export default function StaticButton({
  label,
  href = "#",
  textColor = "text-white",
  bgColor = "bg-gray-800",
}: StaticButtonProps) {
    return (
        <Link
            href={href}
            className={`
            inline-block px-4 py-2 rounded-sm 
            font-medium
            ${textColor} ${bgColor}
            hover:opacity-50
            `}
        >
            {label}
        </Link>
    )
}