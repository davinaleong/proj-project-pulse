import Header from './components/Header'
import Footer from './components/Footer'
import Container from "./components/Container"

export default function Home() {
  return (
    <div className="font-sans bg-ppai-slate-50 text-ppai-slate-900">
      <Container className="min-h-screen py-4 h-full flex flex-col">
        <Header />

        <div className="flex-1 flex items-center justify-center">
          Navigation here  
        </div>

        <Footer />
      </Container>
    </div>
  );
}
