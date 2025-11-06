import { MenuIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { links } from '@/lib/data';
import { getLatestVersionFromChangelog } from '@/lib/getChangelogVersion';
import logo from '@/public/image/logo.png';
import { Button, buttonVariants } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export default function Navbar() {
  const version = getLatestVersionFromChangelog();

  return (
    <header className='relative bg-teal-600 text-white'>
      <div>
        <div className='absolute inset-0 z-10 bg-black/20' />
        <div className='relative z-10 mx-auto flex items-center p-4 px-8'>
          {/* Left: Logo + Title */}
          <div className='flex min-w-0 items-center gap-3'>
            <Link href='/' className='flex min-w-0 items-center gap-2'>
              <Image src={logo} alt='TDP logo' className='w-12 shrink-0 sm:w-14' />
              <h1 className='wrap-break-word font-semibold text-[clamp(1rem,2vw+0.5rem,2.25rem)] leading-tight tracking-tight'>
                Target Discovery Platform (TDP)
              </h1>
            </Link>
            {/* Version link (hide on very small screens to give title room) */}
            <Link href='/docs/CHANGELOG' className='self-end font-semibold text-xs'>
              Version: {version ?? 'unknown'}
            </Link>
          </div>

          {/* Right: Desktop nav + Version + Mobile menu */}
          <div className='ml-auto flex items-center gap-3'>
            {/* Desktop navigation */}
            <nav className='hidden items-center justify-center gap-2 md:flex'>
              {links.map(link => (
                <Link
                  key={link.text}
                  href={link.href}
                  className={`${buttonVariants({ variant: 'navbar' })} font-semibold text-base`}
                >
                  {link.icon}
                  {link.text}
                </Link>
              ))}
            </nav>

            {/* Mobile dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type='button'
                  aria-label='Open menu'
                  variant={'navbar'}
                  className={'inline-flex items-center gap-2 md:hidden'}
                >
                  <MenuIcon className='size-5' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                {links.map(link => (
                  <DropdownMenuItem key={link.text} asChild>
                    <Link href={link.href} className='flex items-center gap-2'>
                      {link.icon}
                      {link.text}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
