import Navbar from '@/components/Navbar';

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col justify-between'>
      <Navbar />
      {children}
    </div>
  );
}
