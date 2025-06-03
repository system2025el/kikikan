'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alpha, Stack, useTheme } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export const Dashboard = () => {
  const theme = useTheme();
  const selectedBgColor = alpha(theme.palette.primary.main, 0.6);
  return (
    <>
      <Typography variant="h5">ダッシュボード</Typography>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} id="info" sx={{ bgcolor: selectedBgColor }}>
          <Typography variant="body1">お知らせ</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Link href={'/dashboard'}>KICKS 出庫日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
        <AccordionDetails>
          <Link href={'/dashboard'}>KICKS 出庫日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
        <AccordionDetails>
          <Link href={'/dashboard'}>KICKS 出庫日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
        <AccordionDetails>
          <Link href={'/dashboard'}>YARD 出庫日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
        <AccordionDetails>
          <Link href={'/dashboard'}>KICKS 入庫日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
        <AccordionDetails>
          <Link href={'/dashboard'}>YARD 入庫日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} id="info" sx={{ bgcolor: selectedBgColor }}>
          <Typography variant="body1">在庫状況</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack>
            <Link href={'/dashboard'}>マイナス</Link>
            <Typography>1件</Typography>
          </Stack>
          <Typography>機材名</Typography>
          <Link href={'/'}>SHARPY PLUS</Link>
          <br />
          <Link href={'/'}>JDC</Link>
        </AccordionDetails>
      </Accordion>
    </>
  );
};
