'use server';

import { supabase } from '@/app/_lib/supabase/supabase';

import { JuchuHeadValues, NewOrderValues } from './types';

export const GetOrder = async (juchuHeadId: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .select(
        'juchu_head_id, del_flg, juchu_sts, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_tanto_nam, mem, nebiki_amt, zei_kbn'
      )
      .eq('juchu_head_id', juchuHeadId)
      .single();
    if (!error) {
      console.log('GetOrder data : ', data);

      const order: NewOrderValues = {
        juchuHeadId: data.juchu_head_id,
        delFlg: data.del_flg,
        juchuSts: data.juchu_sts,
        juchuDat: data.juchu_dat,
        juchuRange: [data.juchu_str_dat, data.juchu_end_dat],
        nyuryokuUser: data.nyuryoku_user,
        koenNam: data.koen_nam,
        koenbashoNam: data.koenbasho_nam,
        kokyakuId: data.kokyaku_id,
        kokyakuTantoNam: data.kokyaku_tanto_nam,
        mem: data.mem,
        nebikiAmt: data.nebiki_amt,
        zeiKbn: data.zei_kbn,
      };
      console.log(order);

      return order;
    } else {
      console.error('GetOrder error : ', error);
      return null;
    }
  } catch (e) {
    console.log(e);
  }
};

export const GetMaxId = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .select('juchu_head_id')
      .order('juchu_head_id', {
        ascending: false,
      })
      .limit(1)
      .single();
    if (!error) {
      console.log('GetMaxId data : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

export const AddNewOrder = async (id: number) => {
  const newData = {
    juchu_head_id: id,
    del_flg: 0,
    juchu_sts: 0,
    juchu_dat: null,
    juchu_str_dat: null,
    juchu_end_dat: null,
    nyuryoku_user: 'test_user',
    koen_nam: null,
    koenbasho_nam: null,
    kokyaku_id: null,
    kokyaku_tanto_nam: null,
    mem: null,
    nebiki_amt: undefined,
    zei_kbn: 2,
    add_dat: new Date(),
    add_user: 'test_user',
    upd_dat: null,
    upd_user: null,
  };

  try {
    const { error: insertError } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .insert({
        ...newData,
      });

    if (!insertError) {
      console.log('New order added successfully:', newData);
    } else {
      console.error('Error adding new order:', insertError.message);
    }
  } catch (e) {
    console.error('Exception while adding new order:', e);
  }
};
