'use client';

import { useMediaQuery } from '@mui/material';
import { grey } from '@mui/material/colors';
import CssBaseline from '@mui/material/CssBaseline';
import { jaJP } from '@mui/material/locale';
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
const lightTheme = createTheme(
  {
    typography,
    cssVariables,
    palette: {
      text: { disabled: 'black' },
      mode: 'light',
    },
    components: {
      MuiTypography: {
        defaultProps: {
          whiteSpace: 'nowrap',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              backgroundColor: grey[200], // 任意のカラー
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiInputLabel: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiRadio: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiButton: {
        defaultProps: {
          size: 'small',
          variant: 'contained',
          sx: { whiteSpace: 'nowrap', minWidth: 'max-content' },
        },
      },
      MuiStack: {
        defaultProps: {
          direction: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          spacing: 1,
        },
      },
      MuiCheckbox: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
          sx: {
            bgcolor: 'white',
          },
        },
      },
      MuiPagination: {
        defaultProps: {
          size: 'small',
          variant: 'outlined',
          shape: 'rounded',
        },
      },
    },
  },
  jaJP
);

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
    // <MuiThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
    <MuiThemeProvider theme={lightTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
export default ThemeProvider;
