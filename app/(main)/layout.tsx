//import '/globals.css';

import 'rsuite/dist/rsuite-no-reset.min.css';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from 'next';
import React from 'react';
import { CustomProvider } from 'rsuite';
import { jaJP } from 'rsuite/esm/locales';

import { notoSansJp } from '@/app/_ui/fonts';
import ThemeProvider from '@/app/_ui/theme-provider';

import { DirtyProvider } from './_ui/dirty-context';
import Sidebar from './_ui/sidebar';

/** @type {Metadata} metadata */
export const metadata: Metadata = {
  title: '機材管理',
  description: '',
};

/**
 * Layout
 * @param {React.ReactNode} children
 * @returns
 */
const Layout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  /* jsx
  ---------------------------------------------------------------------------------------------------- */
  return (
    <CustomProvider locale={jaJP}>
      <DirtyProvider>
        <Sidebar>{children}</Sidebar>
      </DirtyProvider>
    </CustomProvider>
  );
};
export default Layout;
