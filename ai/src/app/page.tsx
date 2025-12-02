import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Project Pulse AI</h1>

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
