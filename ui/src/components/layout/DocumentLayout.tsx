// components/layout/DocumentLayout.tsx
import Container from "./Container"
import Footer from "./Footer"

type DocumentLayoutProps = {
  title: string
  description?: string
  children: React.ReactNode
}

export default function DocumentLayout({
  title,
  description,
  children,
}: DocumentLayoutProps) {
  return (
    <Container>
      <article className="flow">
        {/* Document Title */}
        <header className="flow">
          <h1 className="text-2xl font-bold text-center">{title}</h1>
          {description && (
            <p className="text-gray-600 text-center">{description}</p>
          )}
        </header>

        {/* Document Body */}
        <section className="prose max-w-none flow">{children}</section>

        <Footer year={2024} company="Davina Leong" />
      </article>
    </Container>
  )
}
