import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
import { emptyBase, formItems } from '../_lib/data';
import { BasesMasterDialogSchema, BasesMasterDialogValues } from '../_lib/types';

/**
 * 拠点マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 拠点マスタ詳細ダイアログコンポーネント
 */
export const BasesMasterDialog = ({ baseId, handleClose }: { baseId: number; handleClose: () => void }) => {
  /* useState -------------------------------------- */
  /* 拠点 */
  const [base, setBase] = useState<BasesMasterDialogValues | undefined>();
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* useForm ----------------------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(BasesMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',

      kyotenNam: '',
      delFlg: false,
      mem: '',
    },
  });

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: BasesMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (baseId === -100) {
    //   await addNewBase(data);
    // } else {
    //   await updateBase(data, baseId);
    // }
    handleCloseDialog();
    // refetchBases();
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
    const getThatOneBase = async () => {
      if (baseId === -100) {
        // 新規追加モード
        setBase(emptyBase);
        reset(); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const base1 = await getOneBase(baseId);
        // if (base1) {
        //   setBase(base1);
        //   reset(base1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOneBase();
    console.log('chaaaaaage : ', base);
  }, [baseId]);
  /* eslint-enable react-hooks/exhaustive-deps */
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="所属マスタ登録"
          isDirty={isDirty}
          isNew={isNew}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required={true}>
                  <TextFieldElement
                    name="kyotenNam"
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
