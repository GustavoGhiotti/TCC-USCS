import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-rose-50/50 font-sans text-stone-800">
      <aside className="hidden md:block md:w-64 md:shrink-0">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl px-4 py-5 sm:px-6 sm:py-8 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
