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

export const EqMasterDialog = ({
  eqptId,
  handleClose,
  editable,
  setEditable,
}: {
  eqptId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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
    handleCloseDialog();
    // await addNewVehicle(data!);
  };
  const { control, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
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
              <FormBox formItem={formItems[0]} required={true}>
                <TextFieldElement
                  name="kizaiNam"
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
                <TextFieldElement
                  name="shozokuId"
                  control={control}
                  label={formItems[1].exsample}
                  fullWidth
                  sx={{ maxWidth: '20%' }}
                  disabled={editable ? false : true}
                />
                <Typography variant="body2" ml={1}>
                  {formItems[1].other}
                </Typography>
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  name="elNum"
                  control={control}
                  label={formItems[2].exsample}
                  fullWidth
                  sx={{ maxWidth: '20%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[3]}>
                <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[4]}>
                <TextFieldElement
                  name="bldCod"
                  control={control}
                  label={formItems[4].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[5]}>
                <TextFieldElement
                  name="tanaCod"
                  control={control}
                  label={formItems[5].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[6]}>
                <TextFieldElement
                  name="edaCod"
                  control={control}
                  label={formItems[6].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[7]}>
                <TextFieldElement
                  name="kizaiGrpCod"
                  control={control}
                  label={formItems[7].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[8]}>
                <TextFieldElement
                  name="dspOrdNum"
                  control={control}
                  label={formItems[8].exsample}
                  fullWidth
                  sx={{ maxWidth: '20%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[9]}>
                <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                  name="mem"
                  control={control}
                  label={formItems[9].exsample}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[10]}>
                <SelectElement
                  name="bumonId"
                  control={control}
                  label={formItems[10].exsample}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[11]}>
                <SelectElement
                  name="shukeibumonId"
                  control={control}
                  label={formItems[11].exsample}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[12]}>
                <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[13]}>
                <CheckboxElement name="ctnFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[14]}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="defDatQty"
                  control={control}
                  label={formItems[14].exsample}
                  fullWidth
                  sx={{ maxWidth: '20%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[15]} required>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="regAmt"
                  control={control}
                  label={formItems[15].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[16]}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt1"
                  control={control}
                  label={formItems[16].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[17]}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt2"
                  control={control}
                  label={formItems[17].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[18]}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt3"
                  control={control}
                  label={formItems[18].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[19]}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt4"
                  control={control}
                  label={formItems[19].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[20]}>
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="rankAmt5"
                  control={control}
                  label={formItems[20].exsample}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
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
    exsample: '例）MagicQ MQ70 Compact Console',
    constraints: '',
  },
  {
    label: '課',
    exsample: '例）1',
    constraints: '数字',
    other: '所属無[0]、Ⅰ課[1]、Ⅱ課[2]、Ⅲ課[3]、Ⅳ課[4]、Ⅴ課[5]',
  },
  {
    label: 'EL NO.',
    exsample: '例）1',
    constraints: '数字',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: '棟フロアコード',
    exsample: '例）A1',
    constraints: '20文字まで',
  },
  {
    label: '棚コード',
    exsample: '例）10000',
    constraints: '20文字まで',
  },
  {
    label: '枝コード',
    exsample: '例）1',
    constraints: '20文字まで',
  },
  {
    label: '機材グループコード',
    exsample: '例）10001',
    constraints: '10文字まで',
  },
  {
    label: 'グループ内表示順',
    exsample: '例）1',
    constraints: '数字',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  {
    label: '部門',
    exsample: '例）ムービングライト',
    constraints: 'リスト選択、または、入力（100文字まで）',
  },
  {
    label: '集計部門',
    exsample: '例）照明部',
    constraints: 'リスト選択、または、入力（100文字まで）',
  },
  {
    label: '表示フラグ',
    exsample: '',
    constraints: '選択リストへの表示',
  },
  {
    label: 'コンテナフラグ',
    exsample: '',
    constraints: 'コンテナ系の場合チェック（入出庫するザル、台車など）',
  },
  {
    label: 'デフォルト日数',
    exsample: '例）1',
    constraints: '数字　出庫前の移動に必要な日数',
  },
  {
    label: '定価',
    exsample: '例）10000',
    constraints: '円貨',
  },
  {
    label: '顧客ランク価格１',
    exsample: '例）10000',
    constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格2',
    exsample: '例）10000',
    constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格3',
    exsample: '例）10000',
    constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格4',
    exsample: '例）10000',
    constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
  {
    label: '顧客ランク価格5',
    exsample: '例）10000',
    constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  },
];
