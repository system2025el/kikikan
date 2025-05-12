import { Box, Button, DialogContentText, DialogTitle, Grid2, Stack } from '@mui/material';
import { grey } from '@mui/material/colors';

import { customers } from '../../../_lib/mock-data';

export const CustomerDialogContents = (props: { customerId: number; handleClose: () => void }) => {
  // const customer =
  //   props.customerId !== undefined
  //     ? { ...customers[props.customerId - 1] }
  //     : {
  //         id: '',
  //         name: '',
  //         nameKana: '',
  //         postnum: '',
  //         addressA: '',
  //         addressB: '',
  //         tel: '',
  //         fax: '',
  //         mail: '',
  //         keishou: '',
  //         memo: '',
  //       };

  const customer = { ...customers[props.customerId - 1] };

  return (
    <>
      <DialogTitle justifyContent={'space-between>'} display={'flex'} bgcolor={grey[300]}>
        顧客情報
        <Stack ml={'50%'}>
          <Button onClick={() => props.handleClose()}>保存</Button>
          <Button>編集</Button>
        </Stack>
        <Box></Box>
      </DialogTitle>
      <Box bgcolor={grey[200]} p={5}>
        {/** 1段目　敬称（前後）略称 ------------------------------------------------------- */}
        <Grid2 container spacing={1} justifyContent={'space-between'}>
          <Grid2 container spacing={1} size={{ lg: 7 }} sx={styles.justContentBox}>
            <Grid2 size={{ lg: 6 }} sx={styles.justContentBox}>
              <DialogContentText>敬称(前)</DialogContentText>
              <Box sx={styles.greyBox} minWidth={{ lg: 220 }}>
                {customer.keishou}
              </Box>
            </Grid2>
            <Grid2 size={{ lg: 6 }} sx={styles.justContentBox}>
              <DialogContentText>敬称(後)</DialogContentText>
              <Box sx={styles.greyBox} minWidth={{ lg: 220 }}>
                {customer.keishou}
              </Box>
            </Grid2>
          </Grid2>

          <Grid2 container spacing={1} size={{ lg: 4 }} sx={styles.justContentBox} justifyContent={'flex-end'}>
            <Grid2 sx={styles.justContentBox}>
              <Button variant="outlined" size="small" sx={{ maxHeight: 30 }}>
                略称変更
              </Button>
              <Box sx={styles.justContentBox}>
                <DialogContentText sx={{ ml: 1 }}>略称</DialogContentText>
                <Box sx={styles.greyBox} minWidth={{ lg: 180 }}>
                  {customer.keishou}
                </Box>
              </Box>
            </Grid2>
          </Grid2>
        </Grid2>

        {/** 2段目　かな -------------------------------------------------------- */}
        <Grid2 container spacing={1} justifyContent={'space-between'}>
          <Grid2 container size={{ lg: 12 }} sx={styles.margintop1}>
            <Grid2 size={{ lg: 0.5 }}>
              <DialogContentText>かな</DialogContentText>
            </Grid2>
            <Grid2 size={{ lg: 'grow' }}>
              <Box sx={styles.greyBox}>{customer.nameKana}</Box>
            </Grid2>
          </Grid2>
        </Grid2>

        {/** 3段目　社名 ------------------------------------------------------- */}
        <Grid2 container spacing={1} justifyContent={'space-between'}>
          <Grid2 container size={{ lg: 12 }} sx={styles.margintop1}>
            <Grid2 size={{ lg: 0.5 }}>
              <DialogContentText>社名</DialogContentText>
            </Grid2>
            <Grid2 size={{ lg: 'grow' }}>
              <Box sx={styles.greyBox}>{customer.name}</Box>
            </Grid2>
          </Grid2>
        </Grid2>

        {/** 4段目　郵便番号　敬称------------------------------------------------ */}
        <Grid2 container spacing={1} sx={styles.margintop1} justifyContent={'space-between'}>
          <Grid2 size={{ lg: 6 }} sx={styles.justContentBox}>
            <DialogContentText>郵便番号</DialogContentText>
            <Box sx={styles.greyBox} minWidth={{ lg: 220 }}>
              {customer.postnum}
            </Box>
          </Grid2>

          <Grid2 container spacing={1} size={{ lg: 4 }} sx={styles.justContentBox} justifyContent={'flex-end'}>
            <Grid2 sx={styles.justContentBox}>
              <DialogContentText sx={{ ml: 1 }}>敬称</DialogContentText>
              <Box sx={styles.greyBox} minWidth={{ sm: 200, md: 100, lg: 180 }}>
                {customer.keishou}
              </Box>
            </Grid2>
          </Grid2>
        </Grid2>
        {/** 5,6段目　住所 --------------------------------------------------------- */}
        <Grid2 container spacing={1} justifyContent={'space-between'}>
          <Grid2 container size={{ lg: 12 }} sx={styles.margintop1}>
            <Grid2 size={{ lg: 0.5 }}>
              <DialogContentText>住所</DialogContentText>
            </Grid2>
            <Grid2 size={{ lg: 'grow' }}>
              <Box sx={styles.greyBox}>{customer.addressA}</Box>
            </Grid2>
          </Grid2>
        </Grid2>
        <Grid2 container spacing={1} justifyContent={'flex-end'}>
          <Grid2 container size={{ lg: 11.5 }} sx={styles.margintop1}>
            <Grid2 size={{ lg: 12 }}>
              <Box sx={styles.greyBox}>{customer.addressB}</Box>
            </Grid2>
          </Grid2>
        </Grid2>
        {/** 7段目　電話番号　FAX　ランク ------------------------------------------ */}
        <Grid2 container spacing={1} sx={styles.margintop1} justifyContent={'space-between'}>
          <Grid2 container spacing={1} size={{ lg: 7 }} sx={styles.justContentBox}>
            <Grid2 size={{ lg: 6 }} sx={styles.justContentBox}>
              <DialogContentText>電話番号</DialogContentText>
              <Box sx={styles.greyBox} minWidth={{ lg: 220 }}>
                {customer.tel}
              </Box>
            </Grid2>
            <Grid2 size={{ lg: 6 }} sx={styles.justContentBox}>
              <DialogContentText>FAX</DialogContentText>
              <Box sx={styles.greyBox} minWidth={{ lg: 220 }}>
                {customer.fax}
              </Box>
            </Grid2>
          </Grid2>

          <Grid2 container spacing={1} size={{ lg: 4 }} sx={styles.justContentBox} justifyContent={'flex-end'}>
            <Grid2 sx={styles.justContentBox}>
              <DialogContentText sx={{ ml: 1 }}>敬称</DialogContentText>
              <Box sx={styles.greyBox} minWidth={{ lg: 180 }}>
                {customer.keishou}
              </Box>
            </Grid2>
          </Grid2>
        </Grid2>
        {/** 8段目　メアド --------------------------------------------- */}
        <Grid2 container spacing={1} justifyContent={'space-between'}>
          <Grid2 container size={{ lg: 12 }} sx={styles.margintop1}>
            <Grid2 size={{ lg: 0.5 }}>
              <DialogContentText>Mail</DialogContentText>
            </Grid2>
            <Grid2 size={{ lg: 'grow' }}>
              <Box sx={styles.greyBox}>{customer.mail}</Box>
            </Grid2>
          </Grid2>
        </Grid2>
        {/** 9段目　メモ --------------------------------------------- */}
        <Grid2 container spacing={1} justifyContent={'space-between'}>
          <Grid2 container size={{ lg: 12 }} sx={styles.margintop1}>
            <Grid2 size={{ lg: 0.5 }}>
              <DialogContentText>メモ</DialogContentText>
            </Grid2>
            <Grid2 size={{ lg: 'grow' }}>
              <Box sx={styles.greyBoxMemo}>{customer.memo}</Box>
            </Grid2>
          </Grid2>
        </Grid2>
        <Grid2 container sx={styles.margintop1}>
          <Grid2 size={{ lg: 4 }} sx={styles.justContentBox}>
            <DialogContentText> 締め日</DialogContentText>
            <Box sx={styles.greyBox}>15</Box>
            <DialogContentText>日</DialogContentText>
          </Grid2>
          <Grid2 size={{ lg: 4 }} sx={styles.justContentBox}>
            <DialogContentText>入金までの日数</DialogContentText>
            <Box sx={styles.greyBox}>666</Box>
            <DialogContentText>日</DialogContentText>
          </Grid2>
        </Grid2>
      </Box>
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  greyBox: {
    border: 1,
    borderColor: grey[500],
    backgroundColor: grey[300],
    paddingLeft: 1,
    marginLeft: 1,
    paddingRight: 1,
    minHeight: '30px',
    maxHeight: '30px',
  },
  greyBoxMemo: {
    border: 1,
    borderColor: grey[500],
    backgroundColor: grey[300],
    paddingLeft: 1,
    marginLeft: 1,
    paddingRight: 1,
    minHeight: '150px',
    maxHeight: '150px',
  },
  margintop1: {
    marginTop: 1,
  },
  justContentBox: {
    display: 'flex',
  },
};
