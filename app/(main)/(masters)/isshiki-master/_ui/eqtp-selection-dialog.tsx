import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { SetStateAction, useEffect, useState } from 'react';
import { UseFieldArrayReturn, UseFormSetValue } from 'react-hook-form';

import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { getSelectedEqpts } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/funcs';
import { EqptSelection } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import { EqptSetsMasterDialogValues } from '../../eqpt-set-master/_lib/types';
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
  currentEqptList: number[];
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
    setValue(
      'kizaiList',
      selectedList.map((d) => ({ id: d.kizaiId, nam: d.kizaiNam }))
    );
  };

  /* useEffect --------------------------------------------- */
  useEffect(() => {
    const getEq = async () => {
      const o = await getEqptsForEqptSelection(isshikiId);
      setOptions(o);
      setSelected(currentEqptList);
      setIsLoading(false);
    };
    getEq();
  }, [currentEqptList, isshikiId]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle display={'flex'} justifyContent={'space-between'}>
        一式機材選択
        <Box>
          <Button
            sx={{ mr: 3 }}
            onClick={() => {
              handleClickCnfirm();
              setOpen(false);
            }}
          >
            確定
          </Button>
          <CloseMasterDialogButton
            handleCloseDialog={() => {
              setOpen(false);
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <TableContainer sx={{ width: 500, my: 1, maxHeight: '80vh' }}>
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
                {options!.map((row, index) => {
                  const isItemSelected = selected.includes(row.kizaiId);
                  const labelId = `enhanced-table-checkbox-${index}`;
                  const nextRow = options![index + 1];
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
      </DialogContent>
    </Dialog>
  );
};
