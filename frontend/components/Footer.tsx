import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/image/logo.png';

export default function Footer() {
  return (
    <footer className='border-t bg-gray-50 dark:bg-gray-900'>
      <div className='mx-auto max-w-7xl px-6 py-12 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
          {/* Logo and Description */}
          <div className='col-span-1 md:col-span-2'>
            <div className='mb-4 flex items-center gap-3'>
              <Image src={logo} alt='TDP Logo' width={48} height={48} className='rounded-lg' />
              <div>
                <h3 className='font-bold text-gray-900 text-lg dark:text-white'>Target Discovery Platform</h3>
                <p className='text-gray-600 text-sm dark:text-gray-400'>Advanced Drug Target Discovery</p>
              </div>
            </div>
            <p className='max-w-md text-gray-600 text-sm dark:text-gray-400'>
              Empowering pharmaceutical research with cutting-edge bioinformatics tools for target identification and
              validation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='mb-4 font-semibold text-gray-900 text-sm dark:text-white'>Quick Links</h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href='/docs'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href='/tutorial-video'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  Tutorials
                </Link>
              </li>
              <li>
                <Link
                  href='/data-commons'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  Data Commons
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Resources */}
          <div>
            <h4 className='mb-4 font-semibold text-gray-900 text-sm dark:text-white'>Support & Resources</h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/feedback'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  Feedback
                </Link>
              </li>
              <li>
                <Link
                  href='/docs/faq'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href='/docs/contact'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href='/docs/use-cases-and-short-help-videos'
                  className='text-gray-600 text-sm transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
                >
                  Use Cases & Videos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='mt-8 border-gray-200 border-t pt-8 dark:border-gray-700'>
          <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
            <div className='flex items-center gap-4 text-gray-600 text-sm dark:text-gray-400'>
              <p>&copy; {new Date().getFullYear()} Alexion Pharmaceuticals. All rights reserved.</p>
            </div>
            <div className='flex items-center gap-4 text-sm'>
              <Link
                href='/docs/CHANGELOG'
                className='text-gray-600 transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
              >
                Version Updates
              </Link>
              <span className='text-gray-400'>|</span>
              <a
                href='https://www.alexion.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 transition-colors hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400'
              >
                Alexion Pharmaceuticals
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
