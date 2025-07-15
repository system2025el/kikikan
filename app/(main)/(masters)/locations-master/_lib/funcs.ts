'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { supabase } from '@/app/_lib/supabase/supabase';

import { LocsMasterDialogValues, LocsMasterTableValues } from './types';

export const GetAllLoc = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .select(
        'koenbasho_id , koenbasho_nam, del_flg, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem, dsp_ord_num, dsp_flg'
      )
      .neq('del_flg', 1)
      .order('dsp_ord_num');
    if (!error) {
      console.log('I got a datalist from db', data.length);

      const theData: LocsMasterTableValues[] = data.map((d) => ({
        locId: d.koenbasho_id,
        locNam: d.koenbasho_nam,
        adrShozai: d.adr_shozai,
        adrTatemono: d.adr_tatemono,
        adrSonota: d.adr_sonota,
        tel: d.tel,
        fax: d.fax,
        mem: d.mem,
        delFlg: d.del_flg,
        dspOrdNum: d.dsp_ord_num,
        dspFlg: d.dsp_flg,
      }));

      console.log(theData.length);
      return theData;
    } else {
      console.error('DBエラーです', error.message);
    }
  } catch (e) {
    console.log(e);
  }
  revalidatePath('/locations-master');
  redirect('/location-master');
};

export const GetFilteredLocs = async (query: string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .select(
        'koenbasho_id , koenbasho_nam, del_flg, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem, dsp_ord_num, dsp_flg'
      )
      .like('koenbasho_nam', `%${query}%`)
      .neq('del_flg', 1)
      .order('dsp_ord_num');
    if (!error) {
      console.log('I got a datalist from db', data.length);

      const theData: LocsMasterTableValues[] = data.map((d) => ({
        locId: d.koenbasho_id,
        locNam: d.koenbasho_nam,
        adrShozai: d.adr_shozai,
        adrTatemono: d.adr_tatemono,
        adrSonota: d.adr_sonota,
        tel: d.tel,
        fax: d.fax,
        mem: d.mem,
        dspOrdNum: d.dsp_ord_num,
        delFlg: d.del_flg === 0 ? false : true,
        dspFlg: d.dsp_flg,
      }));

      console.log(theData.length);
      return theData;
    } else {
      console.error('DBエラーです', error.message);
    }
  } catch (e) {
    console.log(e);
  }
  revalidatePath('/locations-master');
};

export const getOneLoc = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .select(
        'koenbasho_id, koenbasho_nam, kana, del_flg, adr_post, adr_shozai, adr_tatemono, adr_sonota, tel, tel_mobile, fax, mail,  mem, dsp_flg'
      )
      .eq('koenbasho_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const theData: LocsMasterDialogValues = {
        locNam: data.koenbasho_nam,
        adrPost: data.adr_post,
        adrShozai: data.adr_shozai,
        adrTatemono: data.adr_tatemono,
        adrSonota: data.adr_sonota,
        tel: data.tel,
        fax: data.fax,
        mem: data.mem,
        kana: data.kana,
        dspFlg: data.dsp_flg === 0 ? false : true,
        telMobile: data.tel_mobile,
        delFlg: data.del_flg === 0 ? false : true,
      };

      console.log(theData.delFlg);
      return theData;
    } else {
      console.error('DBエラーです', error.message);
    }
  } catch (e) {
    console.log(e);
  }
};
const maxLocId = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .select('koenbasho_id')
      .order('koenbasho_id', {
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

export const addNewLoc = async (data: LocsMasterDialogValues) => {
  console.log(data.mem);
  const missingData = {
    koenbasho_nam: data.locNam,
    kana: data.kana,
    del_flg: data.delFlg ? 1 : 0,
    adr_post: data.adrPost,
    adr_shozai: data.adrShozai,
    adr_tatemono: data.adrTatemono,
    adr_sonota: data.adrSonota,
    tel: data.tel,
    tel_mobile: data.telMobile,
    fax: data.fax,
    mail: data.mail,
    mem: data.mem,
    dsp_flg: data.dspFlg ? 1 : 0,
  };
  console.log(missingData.del_flg);
  const date = new Date();
  const currentMaxId = await maxLocId();
  console.log('CurrentMaxId : ', currentMaxId?.koenbasho_id);
  const newId = (currentMaxId?.koenbasho_id ?? 0) + 1;
  const theData = {
    ...missingData,
    koenbasho_id: newId,
    add_dat: date,
    add_user: 'test_user',
    upd_dat: null,
    upd_user: 'null',
    dsp_ord_num: newId,
  };
  console.log(theData.del_flg);
  try {
    const { error: insertError } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .insert({
        ...theData,
      });

    if (insertError) {
      console.error('登録に失敗しました:', insertError.message);
      throw insertError;
    } else {
      console.log('車両を登録しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
  await revalidatePath('/locations-master');
};

export const updateLoc = async (data: LocsMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    koenbasho_nam: data.locNam,
    kana: data.kana,
    del_flg: data.delFlg ? 1 : 0,
    adr_post: data.adrPost,
    adr_shozai: data.adrShozai,
    adr_tatemono: data.adrTatemono,
    adr_sonota: data.adrSonota,
    tel: data.tel,
    tel_mobile: data.telMobile,
    fax: data.fax,
    mail: data.mail,
    mem: data.mem,
    dsp_flg: data.dspFlg ? 1 : 0,
  };
  console.log(missingData.del_flg);
  const date = new Date();

  const theData = {
    ...missingData,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(theData.del_flg);
  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .update({ ...theData })
      .eq('koenbasho_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('車両を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
  revalidatePath('/locations-master');
};
