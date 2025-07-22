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
import { addNewEqpt, getEqptsQty, getOneEqpt } from '../_lib/funcs';
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
  const [action, setAction] = useState<'save' | 'delete' | undefined>(undefined);
  /* フォーム内のセレクトoptions */
  const [selectOptions, setSelectOptions] = useState<SelectTypes[][]>([]);
  /* 保有数 */
  const [kizaiQty, setKizaiQty] = useState<number | undefined>(undefined);

  /* useForm ------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
    getValues,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {},
    resolver: zodResolver(EqptsMasterDialogSchema),
  });

  /*  */
  const regAmt = watch('regAmt'); // React Hook Formの場合

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: EqptsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (eqptId === -100) {
      await addNewEqpt(data);
      handleCloseDialog();
      refetchEqpts();
    } else {
      if (action === 'save') {
        // await updateEqpt(data, eqptId);
        handleCloseDialog();
        refetchEqpts();
      } else if (action === 'delete') {
        setDeleteOpen(true);
        return;
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
    // await updateEqpt({ ...values, delFlg: true }, eqptId);
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
      setKizaiQty(qty!);
      console.log('pppppppppppppppppppppppppppppp', kizaiQty, selectOptions);
      if (eqptId === -100) {
        // 新規追加モード
        reset(emptyEqpt); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const Eqpt1 = await getOneEqpt(eqptId);
        if (Eqpt1) {
          reset(Eqpt1); // 取得したデータでフォーム初期化
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
          handleClose={handleCloseDialog}
          dialogTitle={'機材マスタ登録'}
          isNew={isNew}
          isDirty={isDirty}
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
                    label={formItems[0].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[1]}>
                  <TextField value={kizaiQty ?? ''} disabled />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[2]}>
                  <TextFieldElement
                    name="sectionNum"
                    control={control}
                    label={formItems[2].exsample}
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
                    label={formItems[3].exsample}
                    fullWidth
                    sx={{ maxWidth: '20%' }}
                    disabled={editable ? false : true}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[5]} required>
                  {/* <Controller
                    name="shozokuId"
                    control={control}
                    defaultValue={0}
                    disabled={editable ? false : true}
                    render={({ field }) => (
                      <Select {...field} sx={{ width: 250 }}>
                        {[selectNone, ...selectOptions[0]!].map((opt) => (
                          <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  /> */}
                  <SelectElement
                    name="shozokuId"
                    control={control}
                    defaultValue={0}
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
                    label={formItems[6].exsample}
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
                    label={formItems[7].exsample}
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
                    label={formItems[8].exsample}
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
                    label={formItems[9].exsample}
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
                    label={formItems[10].exsample}
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
                    label={formItems[11].exsample}
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
                    defaultValue={0}
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
                    defaultValue={0}
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
                    label={formItems[16].exsample}
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
                    label={formItems[17].exsample}
                    fullWidth
                    sx={{ maxWidth: '50%' }}
                    disabled={editable ? false : true}
                    value={regAmt === 0 ? '' : regAmt}
                    type="number"
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[18]}>
                  <TextFieldElement
                    name="rankAmt1"
                    control={control}
                    label={formItems[18].exsample}
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
                    label={formItems[19].exsample}
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
                    label={formItems[20].exsample}
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
                    label={formItems[21].exsample}
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
                    label={formItems[22].exsample}
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
              handleCloseAll={handleClickClose}
            />
            <WillDeleteAlertDialog
              open={deleteOpen}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleCloseAll={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
