'use client';

import { useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import type { Palette } from '@mui/material/styles';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import type { TypographyOptions } from '@mui/material/styles/createTypography';

/** @type {TypographyOptions | ((palette: Palette) => TypographyOptions)} typography */
const typography: TypographyOptions | ((palette: Palette) => TypographyOptions) = {
  fontFamily: 'var(--font-noto-sans-jp)',
};
/** @type {boolean} cssVariables */
const cssVariables = true;

/** @type {Theme} lightTheme */
const lightTheme = createTheme({
  typography,
  cssVariables,
  palette: {
    mode: 'light',
  },
});

/** @type {Theme} darkTheme */
const darkTheme = createTheme({
  typography,
  cssVariables,
  palette: {
    mode: 'dark',
  },
});

/**
 * ThemeProvider
 * @param {React.ReactNode} children
 * @returns
 */
const ThemeProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  /* カラースキーム
  ---------------------------------------------------------------------------------------------------- */
  const mode = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';

  /* jsx
  ---------------------------------------------------------------------------------------------------- */
  return (
    // <MuiThemeProvider theme={lightTheme}>
    <MuiThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
export default ThemeProvider;
