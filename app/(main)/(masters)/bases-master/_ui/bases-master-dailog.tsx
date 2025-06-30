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
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '../../../_ui/form-box';
import { MasterDialogTitle } from '../../_ui/dialog-title';
// import { Loading } from '../../../_ui/loading';
import { basesList,BasesMasterDialogSchema, BasesMasterDialogValues } from '../_lib/types';

export const BasesMasterDialog = ({
  baseId,
  handleClose,
  editable,
  setEditable,
}: {
  baseId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  const [base, setBase] = useState<BasesMasterDialogValues | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const handleEditable = () => {
    setEditable(true);
  };
  const handleCloseDialog = () => {
    setEditable(false);
    handleClose();
  };

  const onSubmit = async (data: BasesMasterDialogValues) => {
    console.log('★★★★★★★★★ ', data);
    // handleCloseDialog();
    // await addNewBase(data!);
  };
  const { control, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(BasesMasterDialogSchema),
    defaultValues: {
      //DB   kyotenNam: '',
      //   delFlg: false,
      //   mem: '',
      kyotenId: base?.kyotenId,
      kyotenNam: base?.kyotenNam,
      delFlg: base?.delFlg,
      mem: base?.mem,
    },
  });

  //モック
  useEffect(() => {
    console.log('baseId : ', baseId, ' baseList : ', basesList);

    setBase(basesList[baseId - 1]);
    console.log('base : ', base);
  }, [base, baseId]);
  //DB
  // useEffect(() => {
  // if (baseId === -100) {
  //   setIsLoading(false);
  //   return;
  // } else {
  //   const getThatOneBase = async () => {
  //     const base1 = await getOneBase(baseId);
  //     reset(base1);
  //     console.log('baseId : ', baseId, ' kyotenId : ', base1?.kyotenNam);
  //     setBase(veh1!);
  //     setIsLoading(false);
  //   };
  //   getThatOneBase();
  // }
  // }, [baseId, reset]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          colorOfThis={colorOfThis}
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle="所属マスタ登録"
        />
        {/* {isLoading ? ( //DB
          <Loading />
        ) : ( */}
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
        </>
        {/* )} */}
      </form>
    </>
  );
};

const formItems: FormItemsType[] = [
  {
    label: '所属名',
    exsample: '例）YARD',
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
