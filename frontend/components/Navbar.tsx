import logo from '@/public/image/logo.png';
import { Link } from 'next-view-transitions';
import Image from 'next/image';

export default function Navbar() {
  return (
    <header className='relative text-white bg-teal-600'>
      <div className='absolute inset-0 bg-black/20 z-10' />
      <div className='relative z-10 mx-auto flex items-center px-8 p-4'>
        <Link href={'/'} className='flex items-center gap-2'>
          <Image src={logo} alt='TDP logo' className='w-40' />
          <h1 className='text-lg md:text-4xl font-bold flex items-end flex-wrap'>Target Discovery Platform (TDP)</h1>
        </Link>
        <Link href={'/docs/CHANGELOG'} className='text-xs self-end'>
          Version: {process.env.NEXT_PUBLIC_VERSION || '2.0.0-beta'}
        </Link>
      </div>
    </header>
  );
}
