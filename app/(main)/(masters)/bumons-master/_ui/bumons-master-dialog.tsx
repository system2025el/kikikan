import { zodResolver } from '@hookform/resolvers/zod';
import { CheckBox } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Container,
  Grid2,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CheckboxElement,
  SelectElement,
  TextareaAutosizeElement,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';

import { FormBox, FormItemsType } from '../../../_ui/form-box';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
import { bumonsList, emptyBumon, formItems } from '../_lib/datas';
import { BumonsMasterDialogSchema, BumonsMasterDialogValues } from '../_lib/types';
// import { Loading } from '../../../_ui/loading';

/**
 * 部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 部門マスタ詳細ダイアログコンポーネント
 */
export const BumonsMasterDialog = ({
  bumonId,
  handleClose,
  refetchBumons,
}: {
  bumonId: number;
  handleClose: () => void;
  refetchBumons: () => void;
}) => {
  /* useState -------------------------------------- */
  /* 部門 */
  const [bumon, setBumon] = useState<BumonsMasterDialogValues | undefined>();
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);

  /* useForm ----------------------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(BumonsMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',
      bumonNam: '',
      delFlg: false,
      daibumonId: 0,
      shukeibumonId: 0,
      mem: '',
    },
  });

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: BumonsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (bumonId === -100) {
    //   await addNewbumon(data);
    // } else {
    //   await updatebumon(data, bumonId);
    // }
    handleCloseDialog();
    // refetchBumons();
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
    const getThatOnebumon = async () => {
      if (bumonId === -100) {
        // 新規追加モード
        setBumon(emptyBumon);
        reset(); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const bumon1 = await getOnebumon(bumonId);
        // if (bumon1) {
        //   setbumon(bumon1);
        //   reset(bumon1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOnebumon();
    console.log('chaaaaaage : ', bumon);
  }, [bumonId]);
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
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required={true}>
                  <TextFieldElement
                    name="bumonNam"
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
              <Grid2>
                <FormBox formItem={formItems[3]}>
                  <SelectElement
                    name="daibumonId"
                    control={control}
                    label={formItems[3].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[4]}>
                  <SelectElement
                    name="shukeibumonId"
                    control={control}
                    label={formItems[4].exsample}
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
