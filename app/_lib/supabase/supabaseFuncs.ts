'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  customerMasterDialogDetailsValues,
  CustomerMasterTableValues,
} from '@/app/(main)/(masters)/customers-master/_lib/types';
import {
  VehAllValues,
  VehMasterDialogSchema,
  VehMasterDialogValues,
  VehMasterTableValues,
} from '@/app/(main)/(masters)/vehicles-master/_lib/datas';

import { supabase } from './supabase';
/** ------------------------実験削除delete--------------------------- */
/**
 * 全ユーザー取得
 * @returns {data}
 */
export const fetchUsers = async () => {
  const { data, error } = await supabase.schema('public').from('s_users').select('*');
  if (error) {
    console.error('エラー:', error.message);
  } else {
    console.log('てすとーーーーーーーーーーーーーーーーーーー', data);
    return data;
  }
};
/**
 * ログイン処理つくった
 * @param email めあど
 * @param password ぱすわーど
 * @returns boolean ID とPass存在して一致したらtrue
 */
export const getLoginUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase
      .schema('public')
      .from('s_users')
      .select('password')
      .eq('email', email)
      .single();

    if (error) {
      console.error('エラーです:', error.message);
      return false;
    } else {
      const pas: string = data!.password;
      if (pas === null) {
        console.log('ヌルだね');
        return true;
      } else if (pas === password) {
        console.log('イケてるね:', pas);
        return true;
      } else {
        console.log(`違うね:${pas}&${password}`);
        revalidatePath('/');
        return false;
      }
    }
  } catch (e) {
    console.log('エラーだ', e);
  }
};

// /** ユーザー追加 */
export const addUsers = async (/*email: string, password: string,*/ user: { email: string; password: string }) => {
  console.log(user.email);
  try {
    const { data, error } = await supabase.schema('public').from('s_users').select('email').eq('email', user.email);

    if (error) {
      console.error('データベースエラー:', error.message);
      return;
    }

    if (data.length > 0) {
      console.log('すでに登録されています');
      return;
    }

    // ユーザーが存在しない場合のみ追加
    const { error: insertError } = await supabase
      .schema('public')
      .from('s_users')
      .insert({
        // email: user.email,
        // password: user.password, // 本番ならハッシュ化すべき！
        ...user,
      });

    if (insertError) {
      console.error('登録に失敗しました:', insertError.message);
    } else {
      console.log('ユーザーを登録しました : ', user);
    }
  } catch (error) {
    console.log(error);
  }
};

/**--------------------------------実験schema dev3--------------------------------delete削除 */
export const getEqpt = async () => {
  try {
    const { data, error } = await supabase.schema('dev3').from('m_kizai').select('kizai_nam');
    if (!error) {
      console.log('I got a datalist', data);
      return data;
    } else {
      console.error('DBエラーです', error);
      return error;
    }
  } catch (e) {
    console.log(e);
  }
};

// /**--------------------------------しがさんのSQL実験---------------------------delete削除 */
export type Eqpt = {
  calDat: Date;
  kizaiId: number;
  kizaiQty: number;
  planQty: number;
  zaikoQty: number;
};
// type EqptDb = {
//   cal_dat: Date;
//   kizai_id: number;
//   kizai_qty: number;
//   plan_qty: number;
//   zaiko_qty: number;
// };

// export const getShigasan = async () => {
//   try {
//     const { data, error } = await supabase.schema('dev3').rpc('get_eqpt');
//     if (!error) {
//       console.log('I got a datalist from db', data);
//       const theData: Eqpt[] | undefined = data.map((d: EqptDb) => ({
//         calDat: d.cal_dat,
//         kizaiId: d.kizai_id,
//         kizaiQty: d.kizai_qty,
//         planQty: d.plan_qty,
//         zaikoQty: d.zaiko_qty,
//       }));
//       return theData;
//     } else {
//       console.error('DBエラーです', error);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
/**
 * 選択された顧客の情報を取得する
 * @param id
 * @returns {customerMasterDialogDetailsValues}
 */
export const getOneCustomer = async (id: number) => {
  console.log(id, 'idddddddddddddddddddddddddddddddddddddddddd');
  try {
    const { data, error } = await supabase
      .schema('dev3')
      .from('m_kokyaku')
      .select(
        'kokyaku_id , kokyaku_nam, kana, kokyaku_rank, del_flg, keisho, dsp_ord_num, adr_post, adr_shozai, adr_tatemono, adr_sonota, tel, tel_mobile, fax, mail, mem, dsp_flg, close_day, site_day, kizai_nebiki_flg'
      )
      .eq('kokyaku_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data);
      const theData: customerMasterDialogDetailsValues = {
        kokyakuId: data.kokyaku_id,
        kokyakuNam: data.kokyaku_nam,
        kana: data.kana,
        kokyakuRank: data.kokyaku_rank,
        delFlg: data.del_flg,
        dspOrder: data.dsp_ord_num,
        keisho: data.keisho,
        adrPost: data.adr_post,
        adrShozai: data.adr_shozai,
        adrTatemono: data.adr_tatemono,
        adrSonota: data.adr_sonota,
        tel: data.tel,
        telMobile: data.tel_mobile,
        fax: data.fax,
        mail: data.mail,
        mem: data.mem,
        dspFlg: data.dsp_flg,
        closeDay: data.close_day,
        siteDay: data.site_day,
        kizaiNebikiFlg: data.kizai_nebiki_flg,
      };
      console.log(theData);
      return theData;
    } else {
      console.error('DBエラーです', error);
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * 全顧客マスタを表示する関数
 * @returns {CustomerMasterTableValues[]}
 */
export const getAllCustomers = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev3')
      .from('m_kokyaku')
      .select('kokyaku_id , kokyaku_nam, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem');
    if (!error) {
      console.log('I got a datalist from db. data[0] :', data[0]);

      const theData: CustomerMasterTableValues[] = data.map((d) => ({
        kokyakuId: d.kokyaku_id,
        kokyakuNam: d.kokyaku_nam,
        adrShozai: d.adr_shozai,
        adrTatemono: d.adr_tatemono,
        adrSonota: d.adr_sonota,
        tel: d.tel,
        fax: d.fax,
        mem: d.mem,
      }));

      console.log(theData[0]);
      return theData;
    } else {
      console.error('DBエラーです', error);
    }
  } catch (e) {
    console.log(e);
  }
};

/** 後削除 delete ---------------------------------------------------- */
export const getAllVehicles = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_sharyo')
      .select('sharyo_id , sharyo_nam, del_flg,  mem, dsp_flg');
    if (!error) {
      console.log('I got a datalist from db. data[0] :', data[0]);

      const theData: VehMasterTableValues[] = data.map((d) => ({
        sharyoId: d.sharyo_id,
        sharyoNam: d.sharyo_nam,
        delFlg: d.del_flg === 0 ? false : d.dsp_flg === 1 ? true : false,
        mem: d.mem,
        dspFlg: d.dsp_flg === 0 ? false : d.dsp_flg === 1 ? true : false,
      }));

      console.log(theData[0]);
      return theData;
    } else {
      console.error('DBエラーです', error);
    }
  } catch (e) {
    console.log(e);
  }
};

export const getOneVehicle = async (id: number | string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_sharyo')
      .select('sharyo_id, sharyo_nam, del_flg, mem, dsp_flg')
      .eq('sharyo_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db. data[0] :', data);
      const theData: VehMasterDialogValues = {
        sharyoNam: data!.sharyo_nam,
        delFlg: data!.del_flg === 0 ? false : 1 ? true : undefined,
        mem: data!.mem === null ? '' : data!.mem,
        dspFlg: data!.dsp_flg === 0 ? false : 1 ? true : undefined,
      };

      console.log(theData);
      return theData;
    } else {
      console.log(error);
    }
  } catch (e) {
    console.log('DB error::: ', e);
  }
};

const maxVehId = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_sharyo')
      .select('sharyo_id')
      .order('sharyo_id', {
        ascending: false,
      })
      .limit(1)
      .single();
    if (!error) {
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

// export const addNewVehicle = async (data: VehMasterDialogValues) => {
//   // Validate form using Zod
//   const validatedFields = VehMasterDialogSchema.safeParse({
//     // safeParse() will return an object containing either a success or error field
//     sharyoNam: data.sharyoNam,
//     delFlg: data.delFlg,
//     mem: data.mem,
//     dspFlg: data.dspFlg,
//   });
//   // If form validation fails, return errors early. Otherwise, continue.
//   if (!validatedFields.success) {
//     return {
//       errors: validatedFields.error.flatten().fieldErrors,
//       message: 'Missing fields. Failed to create invoice.',
//     };
//   }
//   console.log(validatedFields.success);
//   const missingData = {
//     sharyo_nam: data.sharyoNam,
//     del_flg: data.delFlg === false ? 0 : 1,
//     dsp_flg: data.dspFlg === false ? 0 : 1,
//     mem: data.mem,
//   };
//   console.log(missingData);
//   const date = new Date();
//   const currentMaxId = await maxVehId();
//   console.log('CurrentMaxId : ', currentMaxId?.sharyo_id);
//   const newId = (currentMaxId?.sharyo_id ?? 0) + 1;
//   const theData = {
//     ...missingData,
//     sharyo_id: newId,
//     add_dat: date,
//     add_user: 'test_user',
//     upd_dat: date,
//     upd_user: 'null',
//     dsp_order_num: newId,
//   };
//   console.log(theData, typeof theData.upd_user);
//   try {
//     await supabase
//       .schema('dev2')
//       .from('m_sharyo')
//       .insert({ sharyo_id: theData.sharyo_id, sharyo_nam: theData.sharyo_nam });
//     console.log({ sharyo_id: theData.sharyo_id, sharyo_nam: theData.sharyo_nam }, 'SUCCESS!!!!!!');
//   } catch (e) {
//     console.log('DB error::: ', e);
//   }
// };

export const addNewVehicle = async (data: VehMasterDialogValues) => {
  console.log(data.mem);
  const missingData = {
    sharyo_nam: data.sharyoNam,
    del_flg: data.delFlg === false ? 0 : 1,
    dsp_flg: data.dspFlg === false ? 0 : 1,
    mem: data.mem,
  };
  console.log(missingData);
  const date = new Date();
  const currentMaxId = await maxVehId();
  console.log('CurrentMaxId : ', currentMaxId?.sharyo_id);
  const newId = (currentMaxId?.sharyo_id ?? 0) + 1;
  const theData = {
    ...missingData,
    sharyo_id: newId,
    add_dat: date,
    add_user: 'test_user',
    upd_dat: null,
    upd_user: 'null',
    dsp_ord_num: newId,
  };
  console.log(theData, typeof theData.upd_user);
  try {
    const { error: insertError } = await supabase
      .schema('dev2')
      .from('m_sharyo')
      .insert({
        ...theData,
      });

    if (insertError) {
      console.error('登録に失敗しました:', insertError.message);
    } else {
      console.log('車両を登録しました : ', theData);
      revalidatePath('/vehicles-master');
      redirect('/vehicles-master');
    }
  } catch (error) {
    console.log(error);
  }
  revalidatePath('/vehicles-master');
  redirect('/vehicles-master');
};
