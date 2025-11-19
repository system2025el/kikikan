import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox, SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyIsshiki, formItems } from '../_lib/datas';
import { addNewIsshiki, getChosenIsshiki, updateIsshiki } from '../_lib/funcs';
import { IsshikisMasterDialogSchema, IsshikisMasterDialogValues } from '../_lib/types';

/**
 * 一式マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 一式マスタ詳細ダイアログコンポーネント
 */
export const IsshikisMasterDialog = ({
  isshikiId,
  handleClose,
  refetchIsshikis,
}: {
  isshikiId: number;
  handleClose: () => void;
  refetchIsshikis: () => void;
}) => {
  // ログインユーザ
  const user = useUserStore((state) => state.user);

  /* useState -------------------------------------- */
  /* DBのローディング状態 */
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

  /** 表示する機材リスト */
  const [eqptList, setEqptLIst] = useState<SelectTypes[]>([]);
  /** 選択制御用の機材の配列 */
  const [selectedList, setSelectedList] = useState<SelectTypes[]>([]);

  /** 選択肢の機材リスト */
  const [options, setOptions] = useState<SelectTypes[]>([]);

  /* useForm ----------------------------------------- */
  const {
    control,
    formState: { isDirty },
    watch,
    handleSubmit,
    reset,
    getValues,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(IsshikisMasterDialogSchema),
    defaultValues: emptyIsshiki,
  });

  const isDeleted = watch('delFlg');
  const name = watch('isshikiNam');

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: IsshikisMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (isshikiId === FAKE_NEW_ID) {
      await addNewIsshiki(data, user?.name ?? '');
      handleCloseDialog();
      refetchIsshikis();
    } else {
      if (action === 'save') {
        await updateIsshiki(data, isshikiId, user?.name ?? '');
        handleCloseDialog();
        refetchIsshikis();
      } else if (action === 'delete') {
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateIsshiki({ ...values, delFlg: false }, isshikiId, user?.name ?? '');
        handleCloseDialog();
        refetchIsshikis();
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
    await updateIsshiki({ ...values, delFlg: true }, isshikiId, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchIsshikis();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneIsshiki = async () => {
      if (isshikiId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyIsshiki); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const isshiki1 = await getChosenIsshiki(isshikiId);
        if (isshiki1) {
          reset(isshiki1); // 取得したデータでフォーム初期化
          // }
          setIsLoading(false);
        }
      }
    };
    getThatOneIsshiki();
  }, [isshikiId, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="一式マスタ登録"
          isNew={isNew}
          isDirty={isDirty}
          setAction={setAction}
          isDeleted={isDeleted!}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                <TextFieldElement
                  name="isshikiNam"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[1]} required>
                <TextFieldElement
                  name="regAmt"
                  control={control}
                  label={editable ? formItems[1].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  multiline
                  name="mem"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
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
              handleCloseDelete={() => setDeleteOpen(false)}
              handleCloseAll={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
