'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Button, DialogTitle, Grid2, Stack, Typography, useTheme } from '@mui/material';
import { JSX, useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
//DB import { addNewLoc, getOneLoc, updateLoc } from '../_lib/funcs';
import { LocMasterSchema, LocMasterValues, LocsMasterDialogSchema, LocsMasterDialogValues } from '../_lib/types';

/**
 * 公演場所マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 公演場所マスタの詳細ダイアログコンポーネント
 */
export const LocationsMasterDialog = ({ locationId, handleClose }: { locationId: number; handleClose: () => void }) => {
  /* useState --------------------- */
  /* 公演場所リストの配列 */
  const [location, setLocation] = useState<LocsMasterDialogValues>();
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);

  const [isNew, setIsNew] = useState(false);

  /* useForm ------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      dspFlg: true,
      // locId: location?.locId,
      // locNam: location?.locNam,
      // adrPost: location?.adrPost,
      // adrShozai: location?.adrShozai,
      // adrTatemono: location?.adrTatemono,
      // adrSonota: location?.adrSonota,
      // tel: location?.tel,
      // fax: location?.fax,
      // mem: location?.mem,
      // kana: location?.kana,
      // dspFlg: location?.dspFlg,
      // telMobile: location?.telMobile,
      // delFlg: location?.delFlg,
    },
    resolver: zodResolver(LocsMasterDialogSchema),
  });
  /* 関数 ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: LocMasterValues) => {
    // handleCloseDialog();
    console.log('isDarty : ', isDirty);
    console.log(data);
    //DB if (locationId === -100) {
    //   await addNewLoc(data);
    // } else {
    //   await updateLoc(data, locationId);
    // }
  };

  /* ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
  };

  // useEffect(() => {
  //   console.log('★★★★★★★★★★★★★★★★★★★★★');
  //   const getThatOneloc = async () => {
  //     const loc1 = await getOneLoc(locationId);
  //     console.log(locationId);
  //     console.log('useeffect : ', loc1);
  //     setLocation(loc1!);
  //     reset(loc1);
  //     setIsLoading(false);
  //   };
  //   getThatOneloc();
  //   console.log('chaaaaaage : ', location);
  // }, [locationId]);

  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneloc = async () => {
      if (locationId === -100) {
        // 新規追加モード
        setLocation(emptyLoc);
        reset(); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        //DB const loc1 = await getOneLoc(locationId);
        // if (loc1) {
        //   setLocation(loc1);
        //   reset(loc1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOneloc();
    console.log('chaaaaaage : ', location);
  }, [locationId, location, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          isNew={isNew}
          handleEditable={() => setEditable(true)}
          handleCloseDialog={handleCloseDialog}
          dialogTitle={'公演場所'}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]}>
                  <TextFieldElement
                    name="locNam"
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
                    name="kana"
                    control={control}
                    label={formItems[1].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>

              <Grid2>
                <FormBox formItem={formItems[2]}>
                  <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[3]}>
                  <TextFieldElement
                    name="adrPost"
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
                  <TextFieldElement
                    name="adrShozai"
                    control={control}
                    label={formItems[4].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[5]}>
                  <TextFieldElement
                    name="adrTatemono"
                    control={control}
                    label={formItems[5].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[6]}>
                  <TextFieldElement
                    name="adrSonota"
                    control={control}
                    label={formItems[6].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[7]}>
                  <TextFieldElement
                    name="tel"
                    control={control}
                    label={formItems[7].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[8]}>
                  <TextFieldElement
                    name="telMobile"
                    control={control}
                    label={formItems[8].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[9]}>
                  <TextFieldElement
                    name="fax"
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
                  <TextFieldElement
                    name="mail"
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
                  <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                    name="mem"
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
            </Grid2>
          </>
        )}
      </form>
    </>
  );
};

/* 移動する予定move */

const formItems: FormItemsType[] = [
  {
    label: '公演場所名',
    exsample: '例）渋谷公会堂',
    constraints: '100文字まで',
  },
  {
    label: '公演場所かな',
    exsample: '例）しぶやこうかいどう',
    constraints: '100文字まで',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: '公演場所住所（郵便番号）',
    exsample: '例）242-0018 ',
    constraints: '20文字まで',
  },
  {
    label: '公演場所住所（所在地）',
    exsample: '例）神奈川県大和市深見西9-99-99',
    constraints: '100文字まで',
  },
  {
    label: '公演場所住所（建物名）',
    exsample: '例）XXビル 11F',
    constraints: '100文字まで',
  },
  {
    label: '公演場所住所（その他）',
    exsample: 'その他の住所情報',
    constraints: '100文字まで',
  },
  {
    label: '代表電話',
    exsample: '例）046-999-1234',
    constraints: '20文字まで',
  },
  {
    label: '代表携帯',
    exsample: '例）070-9999-9999',
    constraints: '20文字まで',
  },
  {
    label: '代表FAX',
    exsample: '例）046-999-1235',
    constraints: '20文字まで',
  },
  {
    label: '代表メールアドレス',
    exsample: '例）abc@zzz.co.jp',
    constraints: '100文字まで',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  {
    label: '表示フラグ',
    exsample: '',
    constraints: '選択リストへの表示',
  },
];

// 初期化値（空の公演場所）
const emptyLoc: LocsMasterDialogValues = {
  locId: -100,
  locNam: '',
  adrPost: '',
  adrShozai: '',
  adrTatemono: '',
  adrSonota: '',
  tel: '',
  fax: '',
  mem: '',
  kana: '',
  dspFlg: true,
  telMobile: '',
  delFlg: false,
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {};
