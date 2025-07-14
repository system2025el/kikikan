import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Grid2, useTheme } from '@mui/material';
import { SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
import { BumonsMasterDialogValues } from '../../bumons-master/_lib/types';
import { emptyDaibumon, formItems } from '../_lib/datas';
import { DaibumonsMasterDialogSchema, DaibumonsMasterDialogValues } from '../_lib/types';

/**
 * 大部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 大部門マスタ詳細ダイアログコンポーネント
 */
export const DaibumonsMasterDialog = ({
  daibumonId,
  handleClose,
  refetchDaibumons,
}: {
  daibumonId: number;
  handleClose: () => void;
  refetchDaibumons: () => void;
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
    resolver: zodResolver(DaibumonsMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',
      daibumonNam: '',
      delFlg: false,
      mem: '',
    },
  });

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: DaibumonsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (daibumonId === -100) {
    //   await addNewDaibumon(data);
    // } else {
    // if (action === 'save') {
    //   await updateDaibumon(data, daibumonId);
    // } else if (action === 'delete') {
    //   await updateDaibumon({ ...data, delFlg: true }, daibumonId);
    // }
    // }
    handleCloseDialog();
    refetchDaibumons();
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
    const getThatOneDaibumon = async () => {
      if (daibumonId === -100) {
        // 新規追加モード
        reset(emptyDaibumon); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const daibumon1 = await getOneDaibumon(daibumonId);
        // if (daibumon1) {
        //   setDaibumon(daibumon1);
        //   reset(daibumon1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOneDaibumon();
  }, [daibumonId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="大部門マスタ登録"
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
                    name="daibumonNam"
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
