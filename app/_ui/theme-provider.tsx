'use client';

import { blue, grey } from '@mui/material/colors';
import CssBaseline from '@mui/material/CssBaseline';
import { jaJP } from '@mui/material/locale';
import type { Palette } from '@mui/material/styles';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import type { TypographyOptions } from '@mui/material/styles/createTypography';
// import { useMediaQuery } from '@mui/material';

/** @type {TypographyOptions | ((palette: Palette) = TypographyOptions)} typography */
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
            '&.Mui-readOnly': {
              backgroundColor: grey[200], // 任意のカラー
            },
          },
          // ここを消すかcssVariablesを消すかのどちらかです。delete 。CSS 変数ベースのスタイリングとChrome の :-webkit-autofill の相性が不安定
          input: {
            '&:-webkit-autofill': {
              WebkitBoxShadow: '0 0 0 100px #e8eaf6 inset',
              WebkitTextFillColor: '#000000',
              caretColor: '#000000',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
          }),
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
        styleOverrides: {
          root: { padding: 2 },
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
// const darkTheme = createTheme({
//   typography,
//   cssVariables,
//   palette: {
//     mode: 'dark',
//   },
// });

/**
 * ThemeProvider
 * @param {React.ReactNode} children
 * @returns
 */
const ThemeProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  /* カラースキーム
  ---------------------------------------------------------------------------------------------------- */
  // const mode = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';

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
