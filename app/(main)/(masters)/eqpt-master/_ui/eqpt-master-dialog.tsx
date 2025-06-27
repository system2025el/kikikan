import { zodResolver } from '@hookform/resolvers/zod';
import { CheckBox } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Container,
  DialogTitle,
  Grid2,
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
import { Loading } from '../../../_ui/loading';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { EqptMasterDialogSchema, EqptMasterDialogValues } from '../_lib/types';

export const EqMasterDialog = (props: {
  eqptId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { eqptId, handleClose, editable, setEditable } = props;
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  const [veh, setVeh] = useState<EqptMasterDialogValues>();
  const [isLoading, setIsLoading] = useState(true);
  const handleEditable = () => {
    setEditable(true);
  };
  const handleCloseDialog = () => {
    setEditable(false);
    handleClose();
  };

  const onSubmit = async (data: EqptMasterDialogValues) => {
    console.log('★★★★★★★★★ ', data);
    // handleCloseDialog();
    // await addNewVehicle(data!);
  };
  const { control, handleSubmit, reset } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(EqptMasterDialogSchema),
    defaultValues: {},
  });

  //DB
  // useEffect(() => {
  // if (vehicleId === -100) {
  //   setIsLoading(false);
  //   return;
  // } else {
  //   const getThatOneCustomer = async () => {
  //     const veh1 = await getOneVehicle(vehicleId);
  //     reset(veh1);
  //     console.log('vehId : ', vehicleId, ' sharyoId : ', veh1?.sharyoNam);
  //     setVeh(veh1!);
  //     setIsLoading(false);
  //   };
  //   getThatOneCustomer();
  // }
  // }, [vehicleId, reset]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          colorOfThis={colorOfThis}
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle={'機材マスタ登録'}
        />
        {/* {isLoading ? ( //DB
          <Loading />
        ) : ( */}
        <>
          <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
            <Grid2>
              <FormBox label={formItems[0].label} required={true}>
                <TextFieldElement
                  name="kizaiNam"
                  control={control}
                  label={formItems[0].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[1].label}>
                <TextFieldElement
                  name="shozokuId"
                  control={control}
                  label={formItems[1].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[2].label}>
                <TextFieldElement
                  name="elNum"
                  control={control}
                  label={formItems[2].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[3].label}>
                <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[4].label}>
                <TextFieldElement
                  name="bldCod"
                  control={control}
                  label={formItems[4].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[5].label}>
                <TextFieldElement
                  name="tanaCod"
                  control={control}
                  label={formItems[5].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[6].label}>
                <TextFieldElement
                  name="edaCod"
                  control={control}
                  label={formItems[6].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[7].label}>
                <TextFieldElement
                  name="kizaiGrpCod"
                  control={control}
                  label={formItems[7].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[8].label}>
                <TextFieldElement
                  name="dspOrdNum"
                  control={control}
                  label={formItems[8].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[9].label}>
                <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                  name="mem"
                  control={control}
                  label={formItems[9].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[10].label}>
                <SelectElement
                  name="bumonId"
                  control={control}
                  label={formItems[10].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[11].label}>
                <SelectElement
                  name="shukeibumonId"
                  control={control}
                  label={formItems[11].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[12].label}>
                <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[13].label}>
                <CheckboxElement name="ctnFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[14].label}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="defDatQty"
                  control={control}
                  label={formItems[14].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[15].label} required>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="regAmt"
                  control={control}
                  label={formItems[15].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[16].label}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt1"
                  control={control}
                  label={formItems[16].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[17].label}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt2"
                  control={control}
                  label={formItems[17].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[18].label}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt3"
                  control={control}
                  label={formItems[18].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[19].label}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt4"
                  control={control}
                  label={formItems[19].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label={formItems[20].label}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt5"
                  control={control}
                  label={formItems[20].description}
                  fullWidth
                  sx={{ maxWidth: '80%' }}
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

/* 移動する予定move */

const formItems: FormItemsType[] = [
  {
    label: '機材名',
    description: '',
  },
  {
    label: '課',
    description: '所属無[0]、Ⅰ課[1]、Ⅱ課[2]、Ⅲ課[3]、Ⅳ課[4]、Ⅴ課[5]',
  },
  {
    label: 'EL NO.',
    description: '',
  },
  {
    label: '削除フラグ',
    description: '論理削除（データは物理削除されません）',
  },
  {
    label: '棟フロアコード',
    description: 'リスト選択、または、入力 20文字まで',
  },
  {
    label: '棚コード',
    description: 'リスト選択、または、入力 20文字まで',
  },
  {
    label: '枝コード',
    description: 'リスト選択、または、入力 20文字まで',
  },
  {
    label: '機材グループコード',
    description: '英数字 10文字まで',
  },
  {
    label: 'グループ内表示順',
    description: '数字',
  },
  {
    label: 'メモ',
    description: '200文字まで',
  },
  {
    label: '部門',
    description: 'リスト選択、または、入力',
  },
  {
    label: '集計部門',
    description: 'リスト選択、または、入力',
  },
  {
    label: '表示フラグ',
    description: '選択リストへの表示',
  },
  {
    label: 'コンテナフラグ',
    description: 'コンテナの場合（入出庫するザル、台車など）',
  },
  {
    label: 'デフォルト日数',
    description: '出庫前の移動に必要な日数',
  },
  {
    label: '定価',
    description: '円貨',
  },
  {
    label: '顧客ランク価格１',
    description: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格2',
    description: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格3',
    description: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格4',
    description: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格5',
    description: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
];
