import tdp_logo from '@/public/image/tdp_logo.png';
import { Link } from 'next-view-transitions';
import Image from 'next/image';

export default function Navbar() {
  return (
    <header className='relative text-white bg-primary shadow-md'>
      <div className='absolute inset-0 bg-black/10 z-10' />
      <div className='relative z-10 mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3'>
        <div className='flex items-center gap-4'>
          <Link href={'/'} className='flex items-center gap-4 hover:opacity-90 transition-opacity'>
            <Image src={tdp_logo} alt='TDP logo' className='w-12 h-12 sm:w-16 sm:h-16' />
            <h1 className='text-lg sm:text-2xl md:text-3xl font-bold tracking-tight'>
              Target Discovery Platform (TDP)
            </h1>
          </Link>
        </div>

        <div className='flex items-center gap-6'>
          <Link href={'/docs/CHANGELOG'} className='text-xs sm:text-sm hover:text-gray-200 transition-colors'>
            Version: 2.0.0-beta
          </Link>
        </div>
      </div>
    </header>
  );
}
