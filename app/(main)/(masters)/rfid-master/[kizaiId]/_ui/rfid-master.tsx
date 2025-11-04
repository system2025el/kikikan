'use client';

import SaveAsIcon from '@mui/icons-material/SaveAs';
import {
  Box,
  Button,
  Container,
  Divider,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { getRfidsOfTheKizai, updateRfidTagSts } from '../_lib/funcs';
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
  /** ログインユーザ */
  const user = useUserStore((state) => state.user);
  // useState
  /* 表示されるRFIDリスト */
  const [theRfids, setTheRfids] = useState<RfidsMasterTableValues[] | undefined>(rfids);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* 選択された機材のidのリスト */
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  /* 選ばれた機材ステータス */
  const [selectedSts, setSelectedSts] = useState<SelectTypes>();
  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');
  /* 保存されたあとのフラグ */
  const [saved, setSaved] = useState<boolean>(true);

  // /* 元のステータスと一致してるかどうか */
  //  const isAllSame = rfids?.every((original) => {
  //   const newItem = theRfids && theRfids.find((item) => item.rfidTagId === original.rfidTagId);
  //   if (!newItem) return false;
  //   return original.stsId === newItem.stsId && original.stsNam === newItem.stsNam;
  // });

  /* methods ------------------------------------------ */
  /** 適用ボタン押下時の処理 */
  const handleClickAdapt = (tagList: string[], selectedSts: SelectTypes) => {
    console.log('タグリスト', tagList, 'ステータス', selectedSts, '最初のリスト', theRfids);
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
    setSaved(false);
    // if (isAllSame) {
    //   setSnackBarMessage('保存済みの内容です。');
    //   setSnackBarOpen(true);
    // }
  };

  /** 保存ボタン押下時の処理 */
  const handleClickSave = async () => {
    if (!theRfids) return;
    // 更新される予定のRFIDマスタリスト
    const updateList = theRfids.filter((newItem) => {
      const currentItem = rfids?.find((current) => current.rfidTagId === newItem.rfidTagId);
      if (!currentItem) {
        return true;
      }
      return currentItem.stsId !== newItem.stsId || currentItem.stsNam !== newItem.stsNam;
    });
    console.log(updateList);
    if (updateList.length === 0) {
      setSnackBarMessage('保存済みの内容です。');
    }
    if (updateList.length > 0) {
      // 無効化フラグを変化させるタグ配列
      console.log('△△△△△△△', updateList, '←←←', rfids);
      const changeDelFlgList = updateList.reduce(
        (acc, l) => {
          const current = rfids?.find((c) => c.rfidTagId === l.rfidTagId);
          if (!current) {
            return acc;
          }
          if (current.stsId === null || current.stsId === undefined || l.stsId === null || l.stsId === undefined) {
            return acc;
          }

          // 無効化 : 元が101（NG） 以下 AND 新が101より大きい
          if (current.stsId <= 101 && l.stsId > 101) {
            acc.push({ rfidTagId: l.rfidTagId, delFlg: 1 });
          }
          // 有効化 : 元が101（NG）より大きい AND 新が101以下
          else if (current.stsId > 101 && l.stsId <= 101) {
            acc.push({ rfidTagId: l.rfidTagId, delFlg: 0 });
          }
          // 他は除外
          return acc;
        },
        [] as { rfidTagId: string; delFlg: number }[]
      );

      await updateRfidTagSts(
        updateList.map((d) => ({ tagId: d.rfidTagId, sts: d.stsId ?? 0, shozokuId: d.shozokuId })),
        user?.name ?? '',
        kizai.id,
        changeDelFlgList
      );
      setSnackBarMessage('保存しました');
      // 表更新
      setIsLoading(true);
      const updated = await getRfidsOfTheKizai(kizai.id);
      setTheRfids(updated);
      setIsLoading(false);
    }
    setSnackBarOpen(true);
    setSaved(true);
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
              disabled={!theRfids || rfids === theRfids || saved /*|| isAllSame*/}
            >
              <SaveAsIcon fontSize="small" sx={{ mr: 0.5 }} />
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
              value={selectedSts?.id ?? ''}
              onChange={(event) => {
                const selectedId = Number(event.target.value);
                const selectedObj = sts?.find((s) => Number(s.id) === selectedId);
                setSelectedSts(selectedObj ?? undefined);
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
              onClick={() => handleClickAdapt(selectedTags, selectedSts!)}
              disabled={typeof selectedSts?.id !== 'number' || selectedTags.length === 0}
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
        setRfid={setTheRfids}
        setPage={setPage}
        setIsLoading={setIsLoading}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
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
