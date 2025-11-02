
import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export default function DiagnosticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-foreground -rotate-6">
            <Bot className="h-8 w-8 text-primary" />
            <div className="flex flex-col text-xl font-bold font-headline leading-none">
              <span>Hey</span>
              <span>Manito!</span>
            </div>
          </Link>
          <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
             <ArrowLeft className="h-4 w-4 mr-2"/> Volver al inicio
          </Link>
        </div>
      </header>
      <main className="py-12">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
