import Image from 'next/image';
import Link from 'next/link';
import { links } from '@/lib/data';
import { getLatestVersionFromChangelog } from '@/lib/getChangelogVersion';
import logo from '@/public/image/logo.png';
import { buttonVariants } from './ui/button';

export default function Navbar() {
  const version = getLatestVersionFromChangelog();

  return (
    <header className='relative bg-teal-600 text-white'>
      <div>
        <div className='absolute inset-0 z-10 bg-black/20' />
        <div className='relative z-10 mx-auto flex items-center p-4 px-8'>
          <div className='flex w-1/2 items-center justify-between'>
            <Link href='/' className='flex items-center gap-2'>
              <Image src={logo} alt='TDP logo' className='w-14' />
              <h1 className='flex flex-wrap items-end font-semibold text-xl md:text-4xl'>
                Target Discovery Platform (TDP)
              </h1>
            </Link>
            <Link href='/docs/CHANGELOG' className='self-end font-semibold text-xs'>
              Version: {version ?? 'unknown'}
            </Link>
          </div>
          <nav className='hidden w-1/2 items-center justify-center space-x-4 md:flex'>
            {links.map(link => (
              <Link
                key={link.text}
                href={link.href}
                className={`${buttonVariants({ variant: 'navbar' })} font-semibold text-base`}
              >
                {link.text}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
