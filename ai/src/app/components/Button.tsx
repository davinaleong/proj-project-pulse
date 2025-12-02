'use client';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  textColor?: string;
  bgColor?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  label,
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
        inline-block px-4 py-2 rounded-sm 
        font-medium
        cursor-pointer
        ${textColor} ${bgColor}
        hover:opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {label}
    </button>
  );
}