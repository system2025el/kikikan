'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
import { emptyManager, formItems } from '../_lib/data';
import { ManagersMasterDialogValues, managersMaterDialogSchema } from '../_lib/types';
/**
 * 担当者マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 担当者マスタの詳細ダイアログコンポーネント
 */
export const ManagerMasterDialog = ({
  managerId,
  handleClose,
  refetchManagers,
}: {
  managerId: number;
  handleClose: () => void;
  refetchManagers: () => void;
}) => {
  /* useState --------------------- */
  /** 担当者リストの配列 */
  const [manager, setManager] = useState<ManagersMasterDialogValues>();
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);

  /* useForm ------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { tantouId: 0, tantouNam: '' },
    resolver: zodResolver(managersMaterDialogSchema),
  });

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: ManagersMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (managerId === -100) {
    //   await addNewmanager(data);
    // } else {
    //   await updatemanager(data, managerId);
    // }
    handleCloseDialog();
    refetchManagers();
  };

  /* 詳細ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
  };

  /* 未保存ダイアログを閉じる */
  const handleCloseDirty = () => {
    setDirtyOpen(false);
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

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneManager = async () => {
      if (managerId === -100) {
        // 新規追加モード
        setManager(emptyManager);
        reset(); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const manager1 = await getOnemanager(managerId);
        // if (manager1) {
        //   setmanager(manager1);
        //   reset(manager1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOneManager();
    console.log('chaaaaaage : ', manager);
  }, [managerId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'担当者情報'}
          isNew={isNew}
          isDirty={isDirty}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required={true}>
                  <TextFieldElement
                    name="tantouNam"
                    control={control}
                    label={formItems[0].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
            </Grid2>
            <IsDirtyDialog open={dirtyOpen} handleCloseDirty={handleCloseDirty} handleCloseAll={handleCloseDialog} />
          </>
        )}
      </form>
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {};
