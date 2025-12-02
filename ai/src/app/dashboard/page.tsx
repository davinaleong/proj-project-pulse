import Link from 'next/link';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

        <nav>
        <ul>
            <li>
                <Link href="/">Back</Link>
            </li>
            </ul>
        </nav>
    </div>
  );
}
