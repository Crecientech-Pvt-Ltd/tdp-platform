import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Navbar />
      <div className='flex-1 flex flex-col'>
        <main className='flex-1 overflow-y-auto'>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
