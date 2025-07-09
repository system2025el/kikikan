'use server';

import { supabase } from '@/app/_lib/supabase/supabase';

import { NewOrderValues } from './types';

export const GetOrder = async (juchuHeadId: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev3')
      .from('t_juchu_head')
      .select(
        'juchu_head_id, del_flg, juchu_sts, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_tanto_nam, mem, nebiki_amt'
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
        juchuStrDat: data.juchu_str_dat,
        juchuEndDat: data.juchu_end_dat,
        nyuryokuUser: data.nyuryoku_user,
        koenNam: data.koen_nam,
        koenbashoNam: data.koenbasho_nam,
        kokyakuId: data.kokyaku_id,
        kokyakuTantoNam: data.kokyaku_tanto_nam,
        mem: data.mem,
        nebikiAmt: data.nebiki_amt,
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
