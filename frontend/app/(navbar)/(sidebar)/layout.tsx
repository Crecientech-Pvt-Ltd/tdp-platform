'use client';
import { Clipboard, Search, Upload, Video } from 'lucide-react';
import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';

export default function SideBarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='container mx-auto p-4'>
      <div className='w-full flex gap-8 flex-col md:flex-row'>
        <div className='md:w-[280px] md:h-screen md:sticky md:top-4 w-full bg-[#5EA7CC] rounded-lg shadow-sm bg-[url("/image/dna.png")] bg-cover bg-center bg-no-repeat relative before:content-[""] before:absolute before:inset-0 before:bg-black/55 before:rounded-lg'>
          <div className='absolute inset-0 rounded-lg'></div>
          <ul className='p-4 grid gap-1 font-medium relative z-10'>
            <li>
              <Link
                href='/'
                className={`flex items-center p-3 rounded-lg transition-all duration-200
                  ${pathname === '/' ? 'bg-white text-[#2B5876] shadow-sm' : 'text-white border border-white border-opacity-70 bg-[#2B5876]/40 hover:bg-[#2B5876]/60'}`}
              >
                <Search size={20} className='mr-3' /> Search By Proteins
              </Link>
            </li>
            <li>
              <Link
                href='/upload-network'
                className={`flex items-center p-3 rounded-lg transition-all duration-200
                  ${
                    pathname === '/upload-network'
                      ? 'bg-white text-[#2B5876] shadow-sm'
                      : 'text-white border border-white border-opacity-70 hover:bg-[#2B5876]/60'
                  }`}
              >
                <Upload size={20} className='mr-3' /> Upload Network
              </Link>
            </li>
            <li>
              <Link
                href='/tutorial-video'
                className={`flex items-center p-3 rounded-lg transition-all duration-200
                  ${
                    pathname === '/tutorial-video'
                      ? 'bg-white text-[#2B5876] shadow-sm'
                      : 'text-white border border-white border-opacity-70 hover:bg-[#2B5876]/60'
                  }`}
              >
                <Video size={20} className='mr-3' /> Tutorial Video
              </Link>
            </li>
            <li>
              <Link
                href='/docs'
                className={`flex items-center p-3 rounded-lg transition-all duration-200
                  ${
                    pathname === '/docs'
                      ? 'bg-white text-[#2B5876] shadow-sm'
                      : 'text-white border border-white border-opacity-70 hover:bg-[#2B5876]/60'
                  }`}
              >
                <Clipboard size={20} className='mr-3' /> Documentation
              </Link>
            </li>
          </ul>
        </div>
        <div className='flex-1 min-h-[80vh]'>{children}</div>
      </div>
    </div>
  );
}
