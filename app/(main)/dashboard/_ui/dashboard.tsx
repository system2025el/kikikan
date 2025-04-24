'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { grey } from '@mui/material/colors';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export const Dashboard = () => {
  return (
    <>
      <Typography variant="h5">ダッシュボード</Typography>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} id="info" sx={{ bgcolor: grey[400] }}>
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
          <Link href={'/dashboard'}>KICKS 返却日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
        <AccordionDetails>
          <Link href={'/dashboard'}>YARD 返却日時が近づいています　XXXXXX</Link>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} id="info" sx={{ bgcolor: grey[400] }}>
          <Typography variant="body1">在庫状況</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction={'row'}>
            <Link href={'/dashboard'}>少ない</Link>
            <Typography>1</Typography>
          </Stack>
        </AccordionDetails>
        <AccordionDetails>
          <Stack direction={'row'}>
            <Link href={'/dashboard'}>ゼロ</Link>
            <Typography>2</Typography>
          </Stack>
        </AccordionDetails>
        <AccordionDetails>
          <Stack direction={'row'}>
            <Link href={'/dashboard'}>マイナス</Link>
            <Typography>1</Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </>
  );
};
