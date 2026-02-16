'use client';
import {
  ChartColumnIcon,
  ClipboardIcon,
  MessageCircleIcon,
  SearchIcon,
  UploadIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { Button } from '@/components/ui/button';

export default function SideBarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const showFloatingChat = pathname === '/' || pathname === '/data-commons' || pathname === '/datacommons';

  return (
    <>
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
      {showFloatingChat && (
        <div className='pointer-events-none fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6'>
          {isChatOpen && (
            <div className='pointer-events-auto mb-3 h-[min(70vh,560px)] w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-white shadow-2xl'>
              <div className='flex h-full min-h-0 flex-col'>
                <div className='flex items-center justify-end border-b p-1.5'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => setIsChatOpen(false)}
                    aria-label='Close chat'
                  >
                    <XIcon className='size-4' />
                  </Button>
                </div>
                <div className='min-h-0 flex-1 p-2'>
                  <ChatInterface />
                </div>
              </div>
            </div>
          )}
          <Button
            variant='default'
            size='icon'
            className='pointer-events-auto h-12 w-12 rounded-full shadow-lg'
            onClick={() => setIsChatOpen(prev => !prev)}
            aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
          >
            {isChatOpen ? <XIcon className='size-5' /> : <MessageCircleIcon className='size-5' />}
          </Button>
        </div>
      )}
    </>
  );
}
