import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, Stack, Typography } from '@mui/material';
import { CheckboxElement, Control, TextFieldElement, UseFieldArrayReturn } from 'react-hook-form-mui';

import { QuotHeadValues } from '../_lib/types';

export const MeisaiTblHeader = ({
  index,
  sectionNam,
  control,
  sectionFields,
}: {
  index: number;
  sectionNam: 'kizai' | 'labor' | 'other';
  control: Control<QuotHeadValues>;
  sectionFields: UseFieldArrayReturn<QuotHeadValues>;
}) => {
  /* 明細テーブルの順番を帰るボタン押下時 */
  const moveRow = (index: number, direction: number) => {
    sectionFields.move(index, index + direction);
  };
  return (
    <>
      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 size={1} />
        <Grid2 size={5} display={'flex'} alignItems={'base-line'}>
          <TextFieldElement name={`meisaiHeads.${sectionNam}.${index}.mituMeisaiHeadNam`} control={control} />
          <CheckboxElement
            name={`meisaiHeads.${sectionNam}.${index}.headNamDspFlg`}
            control={control}
            sx={{ ml: 1 }}
            label="タイトルを見積書に出力する"
            rules={{}}
          />
        </Grid2>
        <Grid2 size={'grow'} justifyItems={'end'}>
          <Box>
            <Button
              color="error"
              onClick={() => {
                sectionFields.remove(index);
              }}
            >
              <DeleteIcon fontSize="small" />
              削除
            </Button>
          </Box>
        </Grid2>
        <Grid2 size={1} justifyItems={'end'}>
          <Stack spacing={1}>
            <Button disabled={index === 0} onClick={() => moveRow(index, -1)}>
              <ArrowUpwardIcon fontSize="small" />
            </Button>
            <Button disabled={index === sectionFields.fields.length - 1} onClick={() => moveRow(index, 1)}>
              <ArrowDownwardIcon fontSize="small" />
            </Button>
          </Stack>
        </Grid2>
      </Grid2>
      <Grid2
        container
        px={2}
        my={0.5}
        sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}
        alignItems={'end'}
        spacing={0.5}
      >
        <Grid2 size={0.5} />
        <Grid2 size={'grow'}>
          <Typography variant="body2" fontWeight={500}>
            名称
          </Typography>
        </Grid2>
        <Grid2 size={1}>
          <Typography variant="body2" fontWeight={500}>
            数量
          </Typography>
        </Grid2>
        <Grid2 size={0.8}>
          <Typography variant="body2" fontWeight={500}>
            仕様日
          </Typography>
        </Grid2>
        <Grid2 size={1.5}>
          <Typography variant="body2" fontWeight={500}>
            単価
          </Typography>
        </Grid2>
        <Grid2 size={2}>
          <Typography variant="body2" fontWeight={500}>
            小計
          </Typography>
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
    </>
  );
};
