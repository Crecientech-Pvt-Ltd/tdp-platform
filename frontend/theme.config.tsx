import { Head, Image } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Layout, Navbar } from 'nextra-theme-docs';
import Footer from '@/components/Footer';

const navbar = (
  <Navbar
    logo={
      <>
        <Image src='/image/logo.png' alt='TDP Logo' width={40} height={40} />
        <span className='ml-2 font-bold'>TDP Help Manual</span>
      </>
    }
    logoLink='/'
  />
);

const footer = <Footer />;

export const DocsThemeHead = () => (
  <Head
    color={{
      hue: 180,
      saturation: 50,
      lightness: {
        dark: 60,
        light: 35,
      },
    }}
  />
);

export const DocsThemeLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <Layout darkMode={false} navbar={navbar} footer={footer} pageMap={await getPageMap()}>
      {children}
    </Layout>
  );
};
