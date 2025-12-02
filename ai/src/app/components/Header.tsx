import Link from 'next/link';
import Image from 'next/image';

import Flex from "./Flex";
import StaticButton from "./StaticButton";

import Logo from './../assets/images/logo.svg';

export default function Header() {
    return (
      <header className="text-center flow">
        <Link href="/" className="hover:opacity-50">
          <h1 className="text-2xl font-sans font-bold flex items-center justify-center gap-1">
            <Image src={Logo} alt="Project Pulse AI Logo" className="inline-block w-8 h-8 mr-2" />
            Project Pulse AI
          </h1>
        </Link>

        <Flex justifyContent="center">
          <StaticButton href="/">Home</StaticButton>
          <StaticButton href="/chatbot">Chatbot</StaticButton>
          <StaticButton href="/dashboard">Dashboard</StaticButton>
        </Flex>
      </header>
    )
}