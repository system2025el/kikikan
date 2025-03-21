import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import React from 'react';

/**
 * Page
 * @returns
 */
const Page = () => {
  /* jsx
  ---------------------------------------------------------------------------------------------------- */
  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <Image src="/next.svg" alt="Next.js logo" width={180} height={38} priority />
        <Typography variant="h1">機材管理</Typography>
        <ol>
          <li>
            <Typography variant="body1">運のつく5つの経営姿勢</Typography>
          </li>
          <li>
            <Typography variant="body1">商人魂</Typography>
          </li>
          <li>
            <Typography variant="body1">人･地域とのご縁に感謝</Typography>
          </li>
          <li>
            <Typography variant="body1">4つの窓</Typography>
          </li>
          <li>
            <Typography variant="body1">変わり続ける､変え続ける</Typography>
          </li>
          <li>
            <Typography variant="body1">所属感･貢献感</Typography>
          </li>
          <li>
            <Typography variant="body1">多様性</Typography>
          </li>
        </ol>
        <Button sx={styles.button} variant="contained">
          先人たちから受け継いできた大切な在り方
        </Button>
      </main>
    </div>
  );
};
export default Page;

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100svh',
  },
  // メインコンテナ
  main: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '32px',
  },
  // ボタン
  button: {
    width: '100%',
  },
};
