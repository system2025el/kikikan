import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Grid2, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '@/app/(main)/_ui/form-box';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { shukeibumonsList, ShukeibumonsMasterDialogSchema, ShukeibumonsMasterDialogValues } from '../_lib/type';

/**
 * 集計部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 集計部門マスタ詳細ダイアログ
 */
export const ShukeibumonsMasterDialog = ({
  shukeibumonId,
  handleClose,
  editable,
  setEditable,
}: {
  shukeibumonId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* useTheme */
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  /* useState -------------------------------------- */
  /* 集計部門リスト */
  const [shukeibumon, setshukeibumon] = useState<ShukeibumonsMasterDialogValues | undefined>();
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* useForm ----------------------------------------- */
  const { control, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(ShukeibumonsMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',
      shukeibumonNam: shukeibumon?.shukeibumonNam,
      shukeibumonId: shukeibumon?.shukeibumonId,
      delFlg: shukeibumon?.delFlg,
      mem: shukeibumon?.mem,
    },
  });
  /* methods ---------------------------------------- */
  /* ダイアログ内を編集モードにする */
  const handleEditable = () => {
    setEditable(true);
  };
  /* ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    handleClose();
  };
  /* フォームを送信 */
  const onSubmit = async (data: ShukeibumonsMasterDialogValues) => {
    console.log('★★★★★★★★★ ', data);
    // handleCloseDialog();
    // await addNewshukeibumon(data!);
  };

  //モック
  useEffect(() => {
    console.log('shukeibumonId : ', shukeibumonId, ' shukeibumonList : ', shukeibumonsList);

    setshukeibumon(shukeibumonsList[shukeibumonId - 1]);
    console.log('shukeibumon : ', shukeibumon);
  }, [shukeibumon, shukeibumonId]);
  //DB
  // useEffect(() => {
  // if (shukeibumonId === -100) {
  //   setIsLoading(false);
  //   return;
  // } else {
  //   const getThatOneshukeibumon = async () => {
  //     const shukeibumon1 = await getOneshukeibumon(shukeibumonId);
  //     reset(shukeibumon1);
  //     console.log('shukeibumonId : ', shukeibumonId, ' kyotenId : ', shukeibumon1?.kyotenNam);
  //     setshukeibumon(veh1!);
  //     setIsLoading(false);
  //   };
  //   getThatOneshukeibumon();
  // }
  // }, [shukeibumonId, reset]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          colorOfThis={colorOfThis}
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle="集計部門マスタ登録"
        />
        {/* {isLoading ? ( //DB
            <Loading />
          ) : ( */}
        <>
          <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
            <Grid2>
              <FormBox formItem={formItems[0]} required={true}>
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
        </>
        {/* )} */}
      </form>
    </>
  );
};

const formItems: FormItemsType[] = [
  {
    label: '集計部門名',
    exsample: '例）照明部',
    constraints: '100文字まで',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
];
