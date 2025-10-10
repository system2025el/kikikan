'use client';

import SaveAsIcon from '@mui/icons-material/SaveAs';
import { Box, Button, Container, Divider, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { updateRfidTagSts } from '../_lib/funcs';
import { RfidsMasterTableValues } from '../_lib/types';
import { RfidMasterTable } from './rfid-master-table';

export const RfidMaster = ({
  rfids,
  sts,
  kizai,
}: {
  rfids: RfidsMasterTableValues[] | undefined;
  sts: SelectTypes[] | undefined;
  kizai: { id: number; nam: string };
}) => {
  const user = useUserStore((state) => state.user);
  // useState
  const [theRfids, setTheRfids] = useState<RfidsMasterTableValues[] | undefined>(rfids);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* 選択される機材のidのリスト */
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  /* */
  const [theSts, setTheSts] = useState<SelectTypes>();
  /* methods ------------------------------------------ */
  /* 適用ボタン押下時の処理 */
  const handleClickAdapt = (tagList: string[], selectedSts: SelectTypes) => {
    console.log('タグリスト', tagList, 'ステータス', selectedSts);
    const newList = theRfids
      ? theRfids.map((r) => {
          if (tagList.includes(r.rfidTagId)) {
            return {
              ...r,
              stsId: Number(selectedSts.id),
              stsNam: selectedSts.label,
            };
          }
          return r;
        })
      : [];
    setTheRfids(newList);
  };

  /* 保存ボタン押下時の処理 */
  const handleClickSave = async () => {
    if (!theRfids) return;
    // 更新される予定のRFIDマスタリスト
    const updateList = theRfids.filter((newItem) => {
      const originalItem = rfids?.find((original) => original.rfidTagId === newItem.rfidTagId);
      if (!originalItem) {
        return true;
      }
      return originalItem.stsId !== newItem.stsId || originalItem.stsNam !== newItem.stsNam;
    });
    console.log(updateList);
    if (updateList.length === 0) return;
    await updateRfidTagSts(
      updateList.map((d) => ({ tagId: d.rfidTagId, sts: d.stsId ?? 0 })),
      user?.name ?? ''
    );
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>機材詳細</Typography>
          <Box>
            <Button
              onClick={() => handleClickSave()}
              sx={{ alignItems: 'center' }}
              disabled={!theRfids || rfids === theRfids}
            >
              <SaveAsIcon fontSize="small" />
              保存
            </Button>
          </Box>
        </Box>
        <Divider />
        <Box width={'100%'} pb={1}>
          <Box sx={styles.container}>
            <Typography mr={3}>機材名</Typography>
            <TextField value={kizai.nam} disabled />
          </Box>
          <Box sx={styles.container}>
            <Typography mr={3}>機材ステータス一括変更</Typography>
            <Select
              value={theSts?.id ?? ''}
              onChange={(event) => {
                const selectedId = Number(event.target.value);
                const selectedObj = sts?.find((s) => Number(s.id) === selectedId);
                setTheSts(selectedObj ?? undefined);
              }}
              sx={{ width: 200 }}
            >
              {sts?.map((s) => (
                <MenuItem key={s.id} value={Number(s.id)}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
            <Button
              sx={{ ml: 1 }}
              onClick={() => handleClickAdapt(selectedTags, theSts!)}
              disabled={typeof theSts?.id !== 'number' || selectedTags.length === 0}
            >
              適用
            </Button>
          </Box>
        </Box>
      </Paper>
      <RfidMasterTable
        rfids={theRfids}
        kizaiId={kizai.id}
        page={page}
        isLoading={isLoading}
        setPage={setPage}
        setIsLoading={setIsLoading}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
    </Container>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 2,
    marginRight: 2,
    marginTop: 1,
  },
};
