import { Box, Button, Grid2, Typography } from '@mui/material';

export const DialogContentsComponent = () => {
  return (
    <>
      <Grid2 container>
        <Grid2 size={1.5}>
          <Box></Box>
        </Grid2>
        <Grid2 size={10.5}>
          <Button size="large" sx={styles.areaButton} href="/new-order">
            戻る
          </Button>
        </Grid2>
      </Grid2>
      <Grid2 container>
        <Grid2 size={1.5}>
          <Box></Box>
        </Grid2>
        {area1List.map((area) => (
          <Grid2 key={area.name} size={area.size}>
            <Button variant="contained" size="large" sx={styles.areaButton}>
              {area.name}
            </Button>
          </Grid2>
        ))}
      </Grid2>
      <Grid2 container alignItems={'end'}>
        <Grid2 size={1.5} justifyItems={'center'}>
          <Typography>東北</Typography>
        </Grid2>
        {tohokuList.map((area) => (
          <Grid2 key={area.name} size={area.size}>
            <Button variant="contained" size="large" sx={styles.areaButton}>
              {area.name}
            </Button>
          </Grid2>
        ))}
      </Grid2>
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  areaButton: {
    minWidth: 90,
    maxWidth: 90,
    marginTop: 2,
  },
};
/** モック用データ */
type Area = {
  name: string;
  size: number;
};
const area1List: Area[] = [
  {
    name: '北海道',
    size: 1.5,
  },
  {
    name: '沖縄',
    size: 3,
  },
  {
    name: '全て',
    size: 1.5,
  },
];
const tohokuList: Area[] = [
  {
    name: '青森',
    size: 1.5,
  },
  {
    name: '秋田',
    size: 1.5,
  },
  {
    name: '山形',
    size: 1.5,
  },
  {
    name: '福島',
    size: 1.5,
  },
  {
    name: '宮城',
    size: 1.5,
  },
  {
    name: '岩手',
    size: 1.5,
  },
];
