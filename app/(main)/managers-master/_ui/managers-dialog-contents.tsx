'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Button, DialogTitle, Grid2, Stack, Typography, useTheme } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';
import { CheckboxElement, SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox } from '@/app/(main)/_ui/form-box';

import { ManagerMasterDialogDetailsValues, managerMaterDialogDetailsSchema } from '../_lib/types';

export const ManagerDialogContents = (props: {
  managerId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  const { managerId, handleClose, editable, setEditable } = props;

  const handleEditable = () => {
    setEditable(true);
  };

  const [manager, setManager] = useState<ManagerMasterDialogDetailsValues>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: manager,
    resolver: zodResolver(managerMaterDialogDetailsSchema),
  });

  const onSubmit = (data: ManagerMasterDialogDetailsValues) => {
    handleClose();
    console.log(isDirty);
    console.log(data);
  };

  // useEffect(() => {
  //   const getThatOneCustomer = async () => {
  //     const customer1 = await getOneCustomer(customerId);
  //     console.log(customerId);
  //     console.log('?????????????????????????????????????????????????????', customer1);
  //     setCustomer(customer1!);
  //   };
  //   getThatOneCustomer();
  //   console.log('chaaaaaaaaaaaaaaaaaaaaaange', customer);
  // }, [customerId]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle display={'flex'} justifyContent={'space-between'} alignItems={'center'} bgcolor={colorOfThis}>
          担当者情報
          {editable && <Typography>編集モード</Typography>}
          <Stack>
            <Button /*type="submit"*/ onClick={() => handleClose()}>保存</Button>
            <Button
              onClick={() => {
                handleEditable();
                console.log('pushpushpush');
              }}
            >
              編集
            </Button>
          </Stack>
        </DialogTitle>

        <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
          <Grid2>
            <FormBox label={formItems[0].label} description={formItems[0].description} required={true}>
              <TextFieldElement
                name="Nam"
                control={control}
                label={formItems[0].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
        </Grid2>
      </form>
    </>
  );
};

/* 移動する予定move */
type formItemsType = { label: string; description: string };
const formItems: formItemsType[] = [
  {
    label: '担当者名',
    description: '担当者名',
  },
  {
    label: '顧客かな',
    description: 'かな名',
  },
  {
    label: '顧客ランク',
    description: '１～５',
  },
  {
    label: '削除フラグ',
    description: '論理削除（データは物理削除されません）',
  },
  {
    label: '顧客敬称',
    description: '例）御中、様',
  },
  {
    label: '顧客住所（郵便番号）',
    description: '例）242-0018 ',
  },
  {
    label: '顧客住所（所在地）',
    description: '例）神奈川県大和市深見西9-99-99',
  },
  {
    label: '顧客住所（建物名）',
    description: '例）XXビル 11F',
  },
  {
    label: '顧客住所（その他）',
    description: 'その他の住所情報',
  },
  {
    label: '電話',
    description: '例）046-999-1234',
  },
  {
    label: '携帯',
    description: '例）070-9999-9999',
  },
  {
    label: 'FAX',
    description: '例）046-999-1235',
  },
  {
    label: 'メールアドレス',
    description: '例）abc@zzz.co.jp',
  },
  {
    label: 'メモ',
    description: '200文字まで',
  },
  {
    label: '表示フラグ',
    description: '選択リストへの表示',
  },
  {
    label: '月締日',
    description: '例）31、15　※月末締めの場合31を指定',
  },
  {
    label: '支払サイト日数',
    description: '例）月末締め翌月末払いの場合30、翌々月末払いは60を指定',
  },
  {
    label: '機材値引き対象フラグ',
    description: '',
  },
];

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  greyBox: {
    border: 1,
    borderColor: grey[500],
    backgroundColor: grey[300],
    paddingLeft: 1,
    marginLeft: 1,
    paddingRight: 1,
    minHeight: '30px',
    maxHeight: '30px',
  },
  greyBoxMemo: {
    border: 1,
    borderColor: grey[500],
    backgroundColor: grey[300],
    paddingLeft: 1,
    marginLeft: 1,
    paddingRight: 1,
    minHeight: '150px',
    maxHeight: '150px',
  },
  margintop1: {
    marginTop: 1,
  },
  justContentBox: {
    display: 'flex',
  },
};
