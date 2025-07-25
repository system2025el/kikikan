import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2, MenuItem, Select, TextField, Typography } from '@mui/material';
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

import { FormBox, selectNone, SelectTypes } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import {
  getBumonsSelection,
  getDaibumonsSelection,
  getShozokuSelection,
  getShukeibumonsSelection,
} from '../../_lib/funs';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyEqpt, formItems } from '../_lib/datas';
import { addNewEqpt, createEqptHistory, getEqptsQty, getOneEqpt, updateEqpt } from '../_lib/funcs';
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
  const [selectOptions, setSelectOptions] = useState<SelectTypes[][]>([]);
  /* 保有数 */
  const [kizaiQty, setKizaiQty] = useState<number | string>('');

  /* useForm ------------------------- */
  const {
    control,
    formState: { isDirty },
    handleSubmit,
    reset,
    watch,
    getValues,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: emptyEqpt,
    resolver: zodResolver(EqptsMasterDialogSchema),
  });

  const isDeleted = watch('delFlg');
  const name = watch('kizaiNam');

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: EqptsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (eqptId === -100) {
      // 新規登録
      await addNewEqpt(data);
      handleCloseDialog();
      refetchEqpts();
    } else {
      // 更新
      if (action === 'save') {
        // 保存終了ボタン
        await createEqptHistory(currentEqpt, eqptId);
        await updateEqpt(data, eqptId);
        handleCloseDialog();
        refetchEqpts();
      } else if (action === 'delete') {
        // 削除ボタン
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateEqpt({ ...values, delFlg: false }, eqptId);
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
    await createEqptHistory(currentEqpt, eqptId);
    await updateEqpt({ ...values, delFlg: true }, eqptId);
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchEqpts();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneEqpt = async () => {
      const a = await getShozokuSelection();
      const b = await getBumonsSelection();
      const c = await getShukeibumonsSelection();
      setSelectOptions([a!, b!, c!]);
      const qty = await getEqptsQty(eqptId);
      setKizaiQty(typeof qty === 'number' ? qty : '');
      console.log('pppppppppppppppppppppppppppppp', kizaiQty, selectOptions);
      if (eqptId === -100) {
        // 新規追加モード
        reset(emptyEqpt); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const eqpt1 = await getOneEqpt(eqptId);
        if (eqpt1) {
          setCurrentEqpt(eqpt1);
          reset(eqpt1); // 取得したデータでフォーム初期化
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
              <Grid2>
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
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[1]}>
                  <TextField value={kizaiQty != null ? String(kizaiQty) : ''} disabled />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[2]}>
                  <TextFieldElement
                    name="sectionNum"
                    control={control}
                    label={editable ? formItems[2].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '20%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                  <Typography variant="body2" ml={2}>
                    {formItems[2].other}
                  </Typography>
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[3]}>
                  <TextFieldElement
                    name="elNum"
                    control={control}
                    label={editable ? formItems[3].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '20%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[5]} required>
                  <SelectElement
                    name="shozokuId"
                    control={control}
                    disabled={editable ? false : true}
                    sx={{ width: 250 }}
                    options={selectOptions[0]!}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
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
              </Grid2>
              <Grid2>
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
              </Grid2>
              <Grid2>
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
              </Grid2>
              <Grid2>
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
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[10]}>
                  <TextFieldElement
                    name="dspOrdNum"
                    control={control}
                    label={editable ? formItems[10].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '20%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[11]}>
                  <TextareaAutosizeElement
                    name="mem"
                    control={control}
                    label={editable ? formItems[11].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[12]}>
                  <Controller
                    name="bumonId"
                    control={control}
                    disabled={editable ? false : true}
                    render={({ field }) => (
                      <Select {...field} sx={{ width: 250 }}>
                        {[selectNone, ...selectOptions[1]!].map((opt) => (
                          <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[13]}>
                  <Controller
                    name="shukeibumonId"
                    control={control}
                    disabled={editable ? false : true}
                    render={({ field }) => (
                      <Select {...field} sx={{ width: 250 }}>
                        {[selectNone, ...selectOptions[2]!].map((opt) => (
                          <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[14]}>
                  <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[15]}>
                  <CheckboxElement name="ctnFlg" control={control} size="medium" disabled={editable ? false : true} />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[16]}>
                  <TextFieldElement
                    name="defDatQty"
                    control={control}
                    label={editable ? formItems[16].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '20%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[17]} required>
                  <TextFieldElement
                    name="regAmt"
                    control={control}
                    label={editable ? formItems[17].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '50%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[18]}>
                  <TextFieldElement
                    name="rankAmt1"
                    control={control}
                    label={editable ? formItems[18].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '50%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[19]}>
                  <TextFieldElement
                    name="rankAmt2"
                    control={control}
                    label={editable ? formItems[19].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '50%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[20]}>
                  <TextFieldElement
                    name="rankAmt3"
                    control={control}
                    label={editable ? formItems[20].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '50%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[21]}>
                  <TextFieldElement
                    name="rankAmt4"
                    control={control}
                    label={editable ? formItems[21].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '50%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[22]}>
                  <TextFieldElement
                    name="rankAmt5"
                    control={control}
                    label={editable ? formItems[22].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '50%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
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
