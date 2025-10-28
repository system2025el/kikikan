import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Grid2, MenuItem, Select, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import {
  CheckboxElement,
  Controller,
  SelectElement,
  TextareaAutosizeElement,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { FormBox, selectNone, SelectTypes } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { FAKE_NEW_ID } from '../../_lib/constants';
import { getAllSelections } from '../../_lib/funcs';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyEqpt, formItems } from '../_lib/datas';
import { addNewEqpt, getChosenEqpt, updateEqpt } from '../_lib/funcs';
import { EqptsMasterDialogSchema, EqptsMasterDialogValues } from '../_lib/types';

export const EqMasterDialog = ({
  eqptId,
  handleClose,
  refetchEqpts,
}: {
  eqptId: number;
  handleClose: () => void;
  refetchEqpts: () => Promise<void>;
}) => {
  // ログインユーザ
  const user = useUserStore((state) => state.user);

  /* useState --------------------- */
  /* eqpt更新前の */
  const [currentEqpt, setCurrentEqpt] = useState<EqptsMasterDialogValues>(emptyEqpt);
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);
  /* 削除フラグ確認ダイアログ出すかどうか */
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* submit時のactions (save, delete) */
  const [action, setAction] = useState<'save' | 'delete' | 'restore' | undefined>(undefined);
  /* フォーム内のセレクトoptions */
  const [selectOptions, setSelectOptions] = useState<{
    d: SelectTypes[];
    s: SelectTypes[];
    b: SelectTypes[];
    shozoku: SelectTypes[];
  }>({ d: [], s: [], b: [], shozoku: [] });
  /* 保有数 */
  const [kizaiQty, setKizaiQty] = useState<{ all: number; ng: number }>({ all: 0, ng: 0 });

  /* useForm ------------------------- */
  const {
    control,
    formState: { isDirty },
    handleSubmit,
    reset,
    watch,
    getValues,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: emptyEqpt,
    resolver: zodResolver(EqptsMasterDialogSchema),
  });

  const isDeleted = watch('delFlg');
  const name = watch('kizaiNam');

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: EqptsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    // console.log(data.shukeibumonId, '::::', data.rankAmt1);
    if (eqptId === FAKE_NEW_ID) {
      // 新規登録
      await addNewEqpt(data, user?.name ?? '');
      handleCloseDialog();
      refetchEqpts();
    } else {
      // 更新
      if (action === 'save') {
        // 保存終了ボタン
        await updateEqpt(currentEqpt, data, eqptId, user?.name ?? '');
        handleCloseDialog();
        refetchEqpts();
      } else if (action === 'delete') {
        // 削除ボタン
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateEqpt(currentEqpt, { ...values, delFlg: false }, eqptId, user?.name ?? '');
        handleCloseDialog();
        refetchEqpts();
      }
    }
  };

  /* 詳細ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
  };

  /* ×ぼたんを押したとき */
  const handleClickClose = () => {
    console.log('isDirty : ', isDirty);
    if (isDirty) {
      setDirtyOpen(true);
    } else {
      handleCloseDialog();
    }
  };

  /* 削除確認ダイアログで削除選択時 */
  const handleConfirmDelete = async () => {
    const values = await getValues();
    await updateEqpt(currentEqpt, { ...values, delFlg: true }, eqptId, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchEqpts();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneEqpt = async () => {
      const a = await getAllSelections();
      setSelectOptions(a);
      console.log('pppppppppppppppppppppppppppppp', selectOptions);
      if (eqptId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyEqpt); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const eqpt1 = await getChosenEqpt(eqptId);
        if (eqpt1) {
          setKizaiQty(eqpt1.qty);
          setCurrentEqpt(eqpt1.data);
          reset(eqpt1.data); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneEqpt();
  }, [eqptId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'機材マスタ登録'}
          isNew={isNew}
          isDirty={isDirty}
          isDeleted={isDeleted!}
          setAction={setAction}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                <TextFieldElement
                  name="kizaiNam"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[1]}>
                <TextField value={kizaiQty.all ? String(kizaiQty.all) : ''} disabled />
                <Box ml={1}>
                  <Button
                    component="a"
                    href={`/rfid-master/${eqptId}`}
                    target="_blank" // 新しいタブで開く
                    rel="noopener noreferrer"
                  >
                    RFIDマスタ
                  </Button>
                </Box>
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextField value={kizaiQty.ng ? String(kizaiQty.ng) : ''} disabled />
              </FormBox>
              <FormBox formItem={formItems[3]}>
                <TextField value={kizaiQty ? String(kizaiQty.all - kizaiQty.ng) : ''} disabled />
              </FormBox>
              <FormBox formItem={formItems[4]}>
                <TextFieldElement
                  name="sectionNum"
                  control={control}
                  label={editable ? formItems[4].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '20%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  disabled={editable ? false : true}
                  type="number"
                />
                <Typography variant="body2" ml={2}>
                  {formItems[4].other}
                </Typography>
              </FormBox>
              <FormBox formItem={formItems[5]} required>
                <SelectElement
                  name="shozokuId"
                  control={control}
                  disabled={editable ? false : true}
                  sx={{ width: 250 }}
                  options={selectOptions.shozoku!}
                />
              </FormBox>
              <FormBox formItem={formItems[6]}>
                <TextFieldElement
                  name="bldCod"
                  control={control}
                  label={editable ? formItems[6].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[7]}>
                <TextFieldElement
                  name="tanaCod"
                  control={control}
                  label={editable ? formItems[7].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[8]}>
                <TextFieldElement
                  name="edaCod"
                  control={control}
                  label={editable ? formItems[8].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[9]}>
                <TextFieldElement
                  name="kizaiGrpCod"
                  control={control}
                  label={editable ? formItems[9].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[10]}>
                <TextFieldElement
                  name="dspOrdNum"
                  control={control}
                  label={editable ? formItems[10].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '20%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[11]}>
                <TextFieldElement
                  multiline
                  name="mem"
                  control={control}
                  label={editable ? formItems[11].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[12]}>
                <Controller
                  name="bumonId"
                  control={control}
                  disabled={editable ? false : true}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...selectOptions.b!].map((opt) => (
                        <MenuItem
                          key={opt.id}
                          value={opt.id}
                          sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormBox>
              <FormBox formItem={formItems[13]}>
                <Controller
                  name="shukeibumonId"
                  control={control}
                  disabled={editable ? false : true}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...selectOptions.s!].map((opt) => (
                        <MenuItem
                          key={opt.id}
                          value={opt.id}
                          sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormBox>
              <FormBox formItem={formItems[14]}>
                <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
              <FormBox formItem={formItems[15]}>
                <CheckboxElement name="ctnFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
              <FormBox formItem={formItems[16]} required>
                <TextFieldElement
                  name="regAmt"
                  control={control}
                  label={editable ? formItems[16].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '50%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                  disabled={editable ? false : true}
                />
              </FormBox>
              {/* <FormBox formItem={formItems[17]}>
                <TextFieldElement
                  name="rankAmt1"
                  control={control}
                  label={editable ? formItems[17].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '50%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[18]}>
                <TextFieldElement
                  name="rankAmt2"
                  control={control}
                  label={editable ? formItems[18].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '50%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[19]}>
                <TextFieldElement
                  name="rankAmt3"
                  control={control}
                  label={editable ? formItems[19].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '50%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[20]}>
                <TextFieldElement
                  name="rankAmt4"
                  control={control}
                  label={editable ? formItems[20].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '50%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[21]}>
                <TextFieldElement
                  name="rankAmt5"
                  control={control}
                  label={editable ? formItems[21].exsample : ''}
                  fullWidth
                  sx={{
                    maxWidth: '50%',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                  disabled={editable ? false : true}
                />
              </FormBox> */}
            </Grid2>
            <IsDirtyAlertDialog
              open={dirtyOpen}
              handleCloseDirty={() => setDirtyOpen(false)}
              handleCloseAll={handleCloseDialog}
            />
            <WillDeleteAlertDialog
              open={deleteOpen}
              data={name}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleCloseAll={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
