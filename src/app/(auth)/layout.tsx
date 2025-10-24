import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
       <div className="absolute top-8">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold font-headline">Hey Manito!</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
