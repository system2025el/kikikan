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

import { selectElNumExists, selectOneRfid } from '@/app/_lib/db/tables/v-rfid';
import { useUserStore } from '@/app/_lib/stores/usestore';

import { FormBox, selectNone, SelectTypes } from '../../../../_ui/form-box';
import { Loading } from '../../../../_ui/loading';
import { FAKE_NEW_ID } from '../../../_lib/constants';
import { getRfidKizaiStsSelection, getShozokuSelection } from '../../../_lib/funcs';
import { MasterDialogTitle } from '../../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../../_ui/dialogs';
import { emptyRfid, formItems } from '../_lib/datas';
import { addNewRfid, getChosenRfid, updateRfid, updRfidDelFlg } from '../_lib/funcs';
import { RfidsMasterDialogSchema, RfidsMasterDialogValues } from '../_lib/types';

export const RfidMasterDialog = ({
  rfidId,
  kizaiId,
  handleClose,
  refetchRfids,
}: {
  rfidId: string;
  kizaiId: number;
  handleClose: () => void;
  refetchRfids: () => Promise<void>;
}) => {
  const user = useUserStore((state) => state.user);
  /* useState --------------------- */
  /* rfid更新前の */
  const [currentRfid, setCurrentRfid] = useState<RfidsMasterDialogValues>(emptyRfid);
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
    shozoku: SelectTypes[];
    sts: SelectTypes[];
  }>({ shozoku: [], sts: [] });
  /*  */
  const [tagMessage, setTagMessage] = useState<string>('');
  /*  */
  const [elMessage, setElMessage] = useState<string>('');

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
    defaultValues: emptyRfid,
    resolver: zodResolver(RfidsMasterDialogSchema),
  });

  const isDeleted = watch('delFlg');
  const name = watch('tagId');

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: RfidsMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    setTagMessage('');
    setElMessage('');
    if (rfidId === String(FAKE_NEW_ID)) {
      // 新規登録 -----------------------------
      const [tagResult, elNumResult] = await Promise.all([selectOneRfid(data.tagId), selectElNumExists(data.elNum!)]);
      console.log(tagResult, elMessage);
      if (tagResult.data) {
        setTagMessage('このRFIDはすでに存在しています');
      } else {
        setTagMessage('');
      }
      if (elNumResult.data) {
        setElMessage('このEL No.は既に存在しています');
      } else {
        setElMessage('');
      }
      if (!tagResult.data && !elNumResult.data) {
        await addNewRfid(data, kizaiId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchRfids();
      }
    } else {
      // 更新 -----------------------------
      const elNumResult = await selectElNumExists(data.elNum);
      if (elNumResult.data && currentRfid.elNum !== data.elNum) {
        setElMessage('このEL No.は既に存在しています');
      } else {
        setElMessage('');
      }
      if (!elNumResult.data || currentRfid.elNum === data.elNum) {
        if (action === 'save') {
          // 保存終了ボタン
          await updateRfid(currentRfid, data, kizaiId, user?.name ?? '');
          handleCloseDialog();
          setIsLoading(false);
          refetchRfids();
        } else if (action === 'delete') {
          setIsLoading(false);
          // 削除ボタン
          setDeleteOpen(true);
          return;
        } else if (action === 'restore') {
          // 有効化ボタン
          await updRfidDelFlg(getValues('tagId'), false, user?.name ?? '');
          handleCloseDialog();
          setIsLoading(false);
          refetchRfids();
        }
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
    setIsLoading(true);
    await updRfidDelFlg(getValues('tagId'), true, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    setIsLoading(false);
    await refetchRfids();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneRfid = async () => {
      const [shozoku, sts] = await Promise.all([getShozokuSelection(), getRfidKizaiStsSelection()]);
      setSelectOptions({ shozoku: shozoku, sts: sts });
      if (rfidId === String(FAKE_NEW_ID)) {
        // 新規追加モード
        reset(emptyRfid); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // 編集モード
        const rfid1 = await getChosenRfid(rfidId);
        if (rfid1) {
          setCurrentRfid(rfid1);
          reset(rfid1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneRfid();
  }, [rfidId, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'RFIDマスタ登録'}
          isNew={isNew}
          isDirty={isDirty}
          isDeleted={isDeleted!}
          push={isLoading}
          setAction={setAction}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                <TextFieldElement
                  name="tagId"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  sx={{
                    width: 300,
                    pointerEvents: !isNew ? 'none' : undefined, // クリック不可にする
                    backgroundColor: !isNew ? '#f5f5f5' : undefined, // グレー背景で無効っぽく
                    color: !isNew ? '#888' : undefined,
                  }}
                  disabled={editable ? false : true}
                  error={!!tagMessage}
                  helperText={tagMessage}
                  slotProps={{
                    input: { readOnly: !isNew ? true : false, onFocus: (e) => (!isNew ? e.target.blur() : {}) },
                    formHelperText: {
                      sx: (theme) => ({
                        color: theme.palette.error.main,
                      }),
                    },
                  }}
                />
              </FormBox>
              <FormBox formItem={formItems[1]} required>
                <TextFieldElement
                  name="elNum"
                  control={control}
                  label={editable ? formItems[1].exsample : ''}
                  sx={{
                    width: 120,
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
                  error={!!elMessage}
                  helperText={elMessage}
                  slotProps={{
                    formHelperText: {
                      sx: (theme) => ({
                        color: theme.palette.error.main,
                      }),
                    },
                  }}
                />
              </FormBox>
              <FormBox formItem={formItems[2]} required>
                <SelectElement
                  name="shozokuId"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  sx={{ width: 120 }}
                  disabled={editable ? false : true}
                  options={selectOptions.shozoku}
                />
              </FormBox>
              <FormBox formItem={formItems[3]} required>
                <SelectElement
                  name="rfidKizaiSts"
                  control={control}
                  label={editable ? formItems[3].exsample : ''}
                  sx={{ width: 300 }}
                  disabled={editable ? false : true}
                  options={selectOptions.sts}
                />
              </FormBox>
              <FormBox formItem={formItems[4]}>
                <TextFieldElement
                  name="mem"
                  control={control}
                  label={editable ? formItems[4].exsample : ''}
                  fullWidth
                  minRows={3}
                  maxRows={3}
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                  multiline
                />
                <Typography variant="body2" ml={2}>
                  {formItems[4].other}
                </Typography>
              </FormBox>
            </Grid2>
            <IsDirtyAlertDialog
              open={dirtyOpen}
              handleCloseDirty={() => setDirtyOpen(false)}
              handleCloseAll={handleCloseDialog}
            />
            <WillDeleteAlertDialog
              open={deleteOpen}
              data={name}
              push={isLoading}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleConfirmDelete={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
