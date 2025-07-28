'use server';

import { supabase } from '@/app/_lib/supabase/supabase';

import { JuchuKizaiHeadValues } from '../eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

export const GetEqHeader = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: juchuKizaiHead, error: juchuKizaiHeadError } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_head')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, zei_kbn, nebiki_amt, mem, head_nam'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
    if (juchuKizaiHeadError) {
      console.error('GetEqHeader juchuKizaiHead error : ', juchuKizaiHeadError);
      return null;
    }

    const { data: juchuDate, error: juchuDateError } = await supabase
      .schema('dev2')
      .from('v_nyushuko_den2')
      .select('kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .limit(1);
    if (juchuDateError) {
      console.error('GetEqHeader juchuDate error : ', juchuDateError);
      return null;
    }

    const jucuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: juchuKizaiHead.juchu_head_id,
      juchuKizaiHeadId: juchuKizaiHead.juchu_kizai_head_id,
      juchuKizaiHeadKbn: juchuKizaiHead.juchu_kizai_head_kbn,
      juchuHonbanbiQty: juchuKizaiHead.juchu_honbanbi_qty,
      zeiKbn: juchuKizaiHead.zei_kbn,
      nebikiAmt: juchuKizaiHead.nebiki_amt,
      mem: juchuKizaiHead.mem,
      headNam: juchuKizaiHead.head_nam,
      kicsShukoDat: juchuDate[0].kics_shuko_dat,
      kicsNyukoDat: juchuDate[0].kics_nyuko_dat,
      yardShukoDat: juchuDate[0].yard_shuko_dat,
      yardNyukoDat: juchuDate[0].yard_nyuko_dat,
    };
    return jucuKizaiHeadData;
  } catch (e) {
    console.log(e);
  }
};
