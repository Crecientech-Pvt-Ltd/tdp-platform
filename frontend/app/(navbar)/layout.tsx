import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='h-screen flex flex-col overflow-hidden'>
      <Navbar />
      <div className='flex-1 flex flex-col'>
        <main className='flex-1'>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
