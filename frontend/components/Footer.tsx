import Image from 'next/image';
import { Link } from 'next-view-transitions';

export default function Footer() {
  return (
    <footer className='bg-primary text-white py-6 mt-auto'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-8'>
            <Link
              href='https://www.astrazeneca.com'
              target='_blank'
              rel='noopener noreferrer'
              className='hover:opacity-80 transition-opacity'
            >
              <Image
                src='/image/AstraZeneca.png'
                alt='AstraZeneca Logo'
                width={180}
                height={40}
                className='h-8 w-auto'
              />
            </Link>
            <Link
              href='https://alexion.com'
              target='_blank'
              rel='noopener noreferrer'
              className='hover:opacity-80 transition-opacity'
            >
              <Image src='/image/alexion.jpg' alt='Alexion Logo' width={120} height={40} className='h-8 w-auto' />
            </Link>
          </div>
          <div className='text-sm text-white/80'>
            © {new Date().getFullYear()} Target Discovery Platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
