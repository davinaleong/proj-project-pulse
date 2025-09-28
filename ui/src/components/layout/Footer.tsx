// Footer.tsx
import Button from "./../common/Button"

type FooterProps = {
  year?: number
  company?: string
  onBackToTop?: () => void
  onPrivacyPolicy?: () => void
  onTermsAndConditions?: () => void
  className?: string
  color?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | "default"
    | "transparent"
    | "custom"
}

export default function Footer({
  year = new Date().getFullYear(),
  company = "Your Company",
  onBackToTop,
  onPrivacyPolicy,
  onTermsAndConditions,
  className,
  color = "default",
}: FooterProps) {
  const colorClasses = {
    primary: "bg-pp-teal-50 text-pp-teal-900 border-pp-teal-200",
    secondary: "bg-pp-gray-50 text-pp-gray-900 border-pp-gray-200",
    danger: "bg-red-50 text-red-900 border-red-200",
    success: "bg-green-50 text-green-900 border-green-200",
    warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
    info: "bg-blue-50 text-blue-900 border-blue-200",
    default: "bg-white text-gray-900 border-gray-200",
    transparent: "bg-transparent text-gray-900 border-gray-200",
    custom: "",
  }

  return (
    <footer
      className={`rounded-sm border shadow-sm hover:shadow-md active:shadow-inner transition-all duration-150 px-[1em] py-[0.5em] ${colorClasses[color]} ${className}`}
    >
      {/* Links */}
      <div className="flex items-center gap-[1em]">
        {/* Back to top */}
        <Button
          variant="link"
          onClick={
            onBackToTop ||
            (() => window.scrollTo({ top: 0, behavior: "smooth" }))
          }
        >
          Back to top
        </Button>

        <Button variant="link" onClick={onPrivacyPolicy || (() => {})}>
          Privacy Policy
        </Button>
        <Button variant="link" onClick={onTermsAndConditions || (() => {})}>
          Terms & Conditions
        </Button>
      </div>

      {/* Copyright */}
      <p className="text-sm text-gray-500 text-center">
        © {year} {company}. All rights reserved.
      </p>
    </footer>
  )
}
