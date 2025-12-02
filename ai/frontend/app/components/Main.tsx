import Header from './Header'
import Footer from './Footer'
import Container from "./Container"

interface MainProps {
  children: React.ReactNode;
  className?: string
}

export default function Main({ children, className="" }: MainProps) {
  return (
    <div className="font-sans bg-ppai-slate-50 text-ppai-slate-900">
      <Container className="min-h-screen py-4 h-full flex flex-col gap-2">
        <Header />

        <main className={`flex-1 flex items-center justify-center ${className}`}>{children}</main>

        <Footer />
      </Container>
    </div>
  )
}
