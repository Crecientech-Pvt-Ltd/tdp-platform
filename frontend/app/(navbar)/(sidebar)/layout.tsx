'use client';
import { ChartColumnIcon, ClipboardIcon, SearchIcon, UploadIcon, VideoIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideBarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='container mx-auto p-4'>
      <div className='flex w-full flex-col gap-8 md:flex-row'>
        <div className='relative w-full rounded-md shadow-md shadow-teal-900 md:w-[25%]'>
          <div className='absolute inset-0 z-10 rounded-md bg-black/40' />
          <Image src='/image/sideBarBg.jpg' alt='sideBarBg' priority className='rounded-md object-cover' fill />
          <ul className='relative z-10 grid gap-2 p-4 font-semibold text-white'>
            <li
              className={`rounded border border-transparent p-2 transition-colors ${pathname === '/' ? 'bg-white text-primary' : 'hover:bg-white/20 focus:bg-white/30'}`}
            >
              <Link href='/' className='flex items-center outline-none'>
                <SearchIcon size={20} className='mr-2' /> Search By Proteins
              </Link>
            </li>
            <li
              className={`rounded border border-transparent p-2 transition-colors ${pathname === '/upload-network' ? 'bg-white text-primary' : 'hover:bg-white/20 focus:bg-white/30'}`}
            >
              <Link href='/upload-network' className='flex items-center outline-none'>
                <UploadIcon size={20} className='mr-2' /> Upload Network
              </Link>
            </li>
            <li
              className={`rounded border border-transparent p-2 transition-colors ${pathname === '/tutorial-video' ? 'bg-white text-primary' : 'hover:bg-white/20 focus:bg-white/30'}`}
            >
              <Link href='/tutorial-video' className='flex items-center outline-none'>
                <VideoIcon size={20} className='mr-2' /> Tutorial Video
              </Link>
            </li>
            <li
              className={`rounded border border-transparent p-2 transition-colors ${pathname === '/docs' ? 'bg-white text-primary' : 'hover:bg-white/20 focus:bg-white/30'}`}
            >
              <Link href='/docs' className='flex items-center outline-none'>
                <ClipboardIcon size={20} className='mr-2' /> Documentation
              </Link>
            </li>
            <li
              className={`rounded border border-transparent p-2 transition-colors ${pathname === '/data-commons' ? 'bg-white text-primary' : 'hover:bg-white/20 focus:bg-white/30'}`}
            >
              <Link href='/data-commons' className='flex items-center outline-none'>
                <ChartColumnIcon size={20} className='mr-2' /> ALXN Data Common
              </Link>
            </li>
          </ul>
        </div>
        <div className='container min-h-[80vh]'>{children}</div>
      </div>
    </div>
  );
}
