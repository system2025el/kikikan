import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { Loading } from '@/app/(main)/_ui/loading';

import { FormBox } from '../../../_ui/form-box';
import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptySection, formItems } from '../_lib/datas';
import { addNewSection, getChosenSection, updateSection } from '../_lib/funcs';
import { SectionsMasterDialogSchema, SectionsMasterDialogValues } from '../_lib/types';

/**
 * 部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 部門マスタ詳細ダイアログコンポーネント
 */
export const SectionsMasterDialog = ({
  sectionId,
  handleClose,
  refetchSections,
}: {
  sectionId: number;
  handleClose: () => void;
  refetchSections: () => void;
}) => {
  // ログインユーザ
  const user = useUserStore((state) => state.user);

  /* useState -------------------------------------- */
  /* 部門 */
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
    resolver: zodResolver(SectionsMasterDialogSchema),
    defaultValues: emptySection,
  });

  const isDeleted = watch('delFlg');
  const name = watch('sectionNam');

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: SectionsMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (sectionId === FAKE_NEW_ID) {
      // 新規の時
      await addNewSection(data, user?.name ?? '');
      handleCloseDialog();
      setIsLoading(false);
      refetchSections();
    } else {
      // 更新の時
      if (action === 'save') {
        // 保存終了ボタン押したとき
        await updateSection(data, sectionId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchSections();
      } else if (action === 'delete') {
        setIsLoading(false);
        // 削除ボタン押したとき
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateSection({ ...values, delFlg: false }, sectionId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchSections();
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
    const values = await getValues();
    await updateSection({ ...values, delFlg: true }, sectionId, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    setIsLoading(false);
    await refetchSections();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneSection = async () => {
      if (sectionId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptySection); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const section1 = await getChosenSection(sectionId);
        if (section1) {
          reset(section1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneSection();
  }, [sectionId, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="部門マスタ登録"
          isNew={isNew}
          isDirty={isDirty}
          push={isLoading}
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
                  name="sectionNam"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[1]} required>
                <TextFieldElement
                  name="sectionNamShort"
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
                  minRows={3}
                  maxRows={3}
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
