import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Grid2, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '@/app/(main)/_ui/form-box';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { daibumonsList, DaibumonsMasterDialogSchema, DaibumonsMasterDialogValues } from '../_lib/types';

/**
 * 大部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 大部門マスタ詳細ダイアログコンポーネント
 */
export const DaibumonsMasterDialog = ({
  daibumonId,
  handleClose,
  editable,
  setEditable,
}: {
  daibumonId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* useState -------------------------------------- */
  /* 大部門 */
  const [daibumon, setdaibumon] = useState<DaibumonsMasterDialogValues | undefined>();
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* useForm ----------------------------------------- */
  const { control, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(DaibumonsMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',
      daibumonNam: daibumon?.daibumonNam,
      daibumonId: daibumon?.daibumonId,
      delFlg: daibumon?.delFlg,
      mem: daibumon?.mem,
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
  const onSubmit = async (data: DaibumonsMasterDialogValues) => {
    console.log('★★★★★★★★★ ', data);
    handleCloseDialog();
    // await addNewdaibumon(data!);
  };
  //モック
  useEffect(() => {
    console.log('daibumonId : ', daibumonId, ' daibumonList : ', daibumonsList);

    setdaibumon(daibumonsList[daibumonId - 1]);
    console.log('daibumon : ', daibumon);
  }, [daibumon, daibumonId]);
  //DB
  // useEffect(() => {
  // if (daibumonId === -100) {
  //   setIsLoading(false);
  //   return;
  // } else {
  //   const getThatOnedaibumon = async () => {
  //     const daibumon1 = await getOnedaibumon(daibumonId);
  //     reset(daibumon1);
  //     console.log('daibumonId : ', daibumonId, ' kyotenId : ', daibumon1?.kyotenNam);
  //     setdaibumon(veh1!);
  //     setIsLoading(false);
  //   };
  //   getThatOnedaibumon();
  // }
  // }, [daibumonId, reset]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle="大部門マスタ登録"
        />
        {/* {isLoading ? ( //DB
            <Loading />
          ) : ( */}
        <>
          <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
            <Grid2>
              <FormBox formItem={formItems[0]} required={true}>
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
        </>
        {/* )} */}
      </form>
    </>
  );
};

const formItems: FormItemsType[] = [
  {
    label: '大部門名',
    exsample: '例）照明',
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
