import { links } from '@/lib/data';
import { getLatestVersionFromChangelog } from '@/lib/getChangelogVersion';
import logo from '@/public/image/logo.png';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import { buttonVariants } from './ui/button';

export default function Navbar() {
  const version = getLatestVersionFromChangelog();

  return (
    <header className='relative text-white bg-teal-600'>
      <div>
        <div className='absolute inset-0 bg-black/20 z-10' />
        <div className='relative z-10 mx-auto flex items-center px-8 p-4'>
          <div className='w-1/2 flex items-center justify-between'>
            <Link href='/' className='flex items-center gap-2'>
              <Image src={logo} alt='TDP logo' className='w-14' />
              <h1 className='text-lg md:text-4xl font-bold flex items-end flex-wrap'>
                Target Discovery Platform (TDP)
              </h1>
            </Link>
            <Link href='/docs/CHANGELOG' className='text-xs self-end'>
              Version: {version ?? 'unknown'}
            </Link>
          </div>
          <nav className='hidden md:flex w-1/2 items-center justify-center space-x-4'>
            {links.map(link => (
              <Link key={link.text} href={link.href} className={buttonVariants({ variant: 'navbar' })}>
                {link.text}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
