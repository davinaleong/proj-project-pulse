import Link from 'next/link';
import Header from './components/Header'

export default function Home() {
  return (
    <div className="font-sans bg-ppai-slate-50 text-ppai-slate-900 min-h-screen p-4">
      <Header />
      
      <nav>
        <ul>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/chatbot">Chatbot</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
