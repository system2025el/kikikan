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

import { FormBox, FormItemsType } from '../../../_ui/form-box';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { bumonsList, BumonsMasterDialogSchema, BumonsMasterDialogValues } from '../_lib/types';
// import { Loading } from '../../../_ui/loading';

/**
 * 部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 部門マスタ詳細ダイアログコンポーネント
 */
export const BumonsMasterDialog = ({
  bumonId,
  handleClose,
  editable,
  setEditable,
}: {
  bumonId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* useState -------------------------------------- */
  /* 部門 */
  const [bumon, setBumon] = useState<BumonsMasterDialogValues | undefined>();
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* useForm ----------------------------------------- */
  const { control, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(BumonsMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',
      bumonNam: bumon?.bumonNam,
      delFlg: bumon?.delFlg,
      daibumonId: bumon?.daibumonId,
      shukeibumonId: bumon?.shukeibumonId,
      mem: bumon?.mem,
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
  const onSubmit = async (data: BumonsMasterDialogValues) => {
    console.log('★★★★★★★★★ ', data);
    // handleCloseDialog();
    // await addNewBumon(data!);
  };

  //モック
  useEffect(() => {
    console.log('bumonId : ', bumonId, ' bumonList : ', bumonsList);

    setBumon(bumonsList[bumonId - 1]);
    console.log('bumon : ', bumon);
  }, [bumon, bumonId]);
  //DB
  // useEffect(() => {
  // if (bumonId === -100) {
  //   setIsLoading(false);
  //   return;
  // } else {
  //   const getThatOnebumon = async () => {
  //     const bumon1 = await getOnebumon(bumonId);
  //     reset(bumon1);
  //     console.log('bumonId : ', bumonId, ' kyotenId : ', bumon1?.kyotenNam);
  //     setbumon(veh1!);
  //     setIsLoading(false);
  //   };
  //   getThatOnebumon();
  // }
  // }, [bumonId, reset]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle="集計部門マスタ登録
"
        />
        {/* {isLoading ? ( //DB
          <Loading />
        ) : ( */}
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
        </>
        {/* )} */}
      </form>
    </>
  );
};

const formItems: FormItemsType[] = [
  {
    label: '部門名',
    exsample: '例）ムービングライト',
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
  {
    label: '大部門',
    exsample: '例）ムービング ゴボ',
    constraints: 'リスト選択、または、入力（100文字まで）',
  },
  {
    label: '集計部門',
    exsample: '例）証明部',
    constraints: 'リスト選択、または、入力（100文字まで）',
  },
];
