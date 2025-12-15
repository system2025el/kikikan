import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { SetStateAction, useEffect, useMemo, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { Loading } from '@/app/(main)/_ui/loading';
import { getSelectedEqpts } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/funcs';
import { EqptSelection } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import { getEqptsForEqptSelection } from '../_lib/funcs';
import { IsshikisMasterDialogValues } from '../_lib/types';

export const EqptIsshikiSelectionDialog = ({
  open,
  isshikiId,
  currentEqptList,
  setOpen,
  setValue,
}: {
  open: boolean;
  isshikiId: number;
  currentEqptList: {
    id: number;
    nam: string;
    mem?: string | null | undefined;
  }[];
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  setValue: UseFormSetValue<IsshikisMasterDialogValues>;
}) => {
  /** ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /** 選択肢の機材リスト */
  const [options, setOptions] = useState<EqptSelection[]>([]);
  /** 選択制御用の機材の配列 */
  const [selected, setSelected] = useState<number[]>([]);
  /** 検索単語 */
  const [search, setSearch] = useState<string | null>(null);

  /* methods -------------------------------------------------------- */
  /** 行押下時（選択時）の処理 */
  const handleSelectEqpts = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  /** 確定ボタン押下時処理 */
  const handleClickCnfirm = async () => {
    const selectedList = await getSelectedEqpts(selected);
    const setList: { id: number; nam: string; mem: string | null }[] = selectedList.map((newItem) => {
      const match = currentEqptList.find((c) => c.id === newItem.kizaiId);
      return {
        id: newItem.kizaiId,
        nam: newItem.kizaiNam ?? match?.nam ?? '',
        mem: match?.mem ?? null,
      };
    });
    setValue('kizaiList', setList);
  };

  /* useMemo ------------------------------------------------ */
  /** 表示する機材リスト */
  const list = useMemo(
    () =>
      search && search.trim() !== ''
        ? options.filter((d) => d.kizaiNam.toLowerCase().includes(search.toLowerCase()))
        : options,
    [search, options]
  );

  /* useEffect --------------------------------------------- */
  useEffect(() => {
    const getEq = async () => {
      const o = await getEqptsForEqptSelection();
      setOptions(o);
      setSelected(currentEqptList.map((d) => d.id));
      setIsLoading(false);
    };
    getEq();
  }, [currentEqptList, isshikiId]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
        setSearch(null);
      }}
    >
      <DialogTitle display={'flex'} justifyContent={'space-between'}>
        一式機材選択
        <Box>
          <Button
            sx={{ mr: 3 }}
            onClick={() => {
              handleClickCnfirm();
              setSearch(null);
              setOpen(false);
            }}
          >
            確定
          </Button>
          <CloseMasterDialogButton
            handleCloseDialog={() => {
              setOpen(false);
              setSearch(null);
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box width={'100%'}>
          <Stack justifyContent={'center'}>
            <TextField
              value={search ?? ''}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(event.target.value);
              }}
            />
          </Stack>
          <TableContainer component={Paper} variant="outlined" square sx={{ width: 500, my: 1, maxHeight: '70vh' }}>
            {isLoading ? (
              <Loading />
            ) : (
              <Table stickyHeader padding="none">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>機材名</TableCell>
                    <TableCell>在庫場所</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {list!.map((row, index) => {
                    const isItemSelected = selected.includes(row.kizaiId);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    const nextRow = list![index + 1];
                    const rows = [];
                    rows.push(
                      <TableRow
                        hover
                        onClick={(event) => handleSelectEqpts(event, row.kizaiId)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row.kizaiId}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox color="primary" checked={isItemSelected} />
                        </TableCell>
                        <TableCell component="th" id={labelId} scope="row" padding="none">
                          {row.kizaiNam}
                        </TableCell>
                        <TableCell>{row.shozokuNam}</TableCell>
                      </TableRow>
                    );
                    // 次のkizaiGrpCodが異なるなら区切り行を追加
                    if (!nextRow || row.kizaiGrpCod !== nextRow.kizaiGrpCod) {
                      rows.push(
                        <TableRow key={`divider-${index}`}>
                          <TableCell colSpan={3}>
                            <Box height={10} width={'100%'} alignContent={'center'}>
                              <Divider
                                sx={{
                                  borderStyle: 'dashed',
                                  borderColor: 'CaptionText',
                                  borderBottomWidth: 2,
                                }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return rows;
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
