import { Box, Button, DialogContent, DialogTitle, Grid2, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { areaCate, areaList } from '../_lib/data';

export const AreaSelectionDialog = () => {
  return (
    <>
      <DialogTitle bgcolor={grey[300]} display={'flex'}>
        地域選択
        <Button href="/new-order/location-selection" sx={{ ml: '90%' }}>
          戻る
        </Button>
      </DialogTitle>
      <Box bgcolor={grey[300]} pl={'30%'}>
        <Typography>地域名を選択してください。</Typography>
      </Box>
      <DialogContent>
        <Grid2 container borderBottom={1}>
          <Grid2 size={5} textAlign={'center'}>
            地域分類
          </Grid2>
          <Grid2 size={7}>地域名</Grid2>
        </Grid2>
        {areaCate.map((cate) => (
          <Grid2 key={cate.id} container borderBottom={1}>
            <Grid2 size={5} textAlign={'center'}>
              {cate.name}
            </Grid2>
            <Grid2 size={7}>
              {areaList
                .filter((area) => area.cateId === cate.id)
                .map((area) => (
                  <Box key={area.name}>
                    <Button variant="text" size="large">
                      {area.name}
                    </Button>
                  </Box>
                ))}
            </Grid2>
          </Grid2>
        ))}
      </DialogContent>
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
