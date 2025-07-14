import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Grid2, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
import { emptyShukeibumon, formItems, shukeibumonsList } from '../_lib/datas';
import { ShukeibumonsMasterDialogSchema, ShukeibumonsMasterDialogValues } from '../_lib/type';

/**
 * 集計部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 集計部門マスタ詳細ダイアログ
 */
export const ShukeibumonsMasterDialog = ({
  shukeibumonId,
  handleClose,
  refetchShukeibumons,
}: {
  shukeibumonId: number;
  handleClose: () => void;
  refetchShukeibumons: () => void;
}) => {
  /* useState -------------------------------------- */
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true); /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);
  /* submit時のactions (save,) */
  const [action, setAction] = useState<'save' | 'delete' | undefined>(undefined);

  /* useForm ----------------------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(ShukeibumonsMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',
      shukeibumonNam: '',
      delFlg: false,
      mem: '',
    },
  });
  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: ShukeibumonsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (shukeibumonId === -100) {
    //   await addNewshukeibumon(data);
    // } else {
    // if (action === 'save') {
    //   await updateshukeibumon(data, shukeibumonId);
    // } else if (action === 'delete') {
    //   await updateshukeibumon({ ...data, delFlg: true }, shukeibumonId);
    // }
    // }
    handleCloseDialog();
    refetchShukeibumons();
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
    const getThatOneShukeibumon = async () => {
      if (shukeibumonId === -100) {
        // 新規追加モード
        reset(emptyShukeibumon); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const Shukeibumon1 = await getOneShukeibumon(ShukeibumonId);
        // if (Shukeibumon1) {
        //   setShukeibumon(Shukeibumon1);
        //   reset(Shukeibumon1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOneShukeibumon();
  }, [shukeibumonId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="集計部門マスタ登録"
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
                    name="shukeibumonNam"
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
                  <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[2]}>
                  <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                    name="mem"
                    control={control}
                    label={formItems[2].exsample}
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
