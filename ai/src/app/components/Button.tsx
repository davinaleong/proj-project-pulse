'use client';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  textColor?: string;
  bgColor?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  textColor = "text-white",
  bgColor = "bg-gray-800",
  disabled = false,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        button inline-flex gap-2 items-center px-4 py-2 rounded-sm 
        font-medium
        ${textColor} ${bgColor}
        hover:opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );
}