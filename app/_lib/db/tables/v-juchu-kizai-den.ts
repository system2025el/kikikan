import dayjs from 'dayjs';

import { SCHEMA, supabase } from '../supabase';

export const selectLoanJuchuData = async (kizaiId: number, date: Date) => {
  // 開始日から+90日した日付
  const strDat = dayjs(date).tz('Asia/Tokyo').startOf('day').toISOString();
  const endDat = dayjs(date).tz('Asia/Tokyo').add(90, 'day').endOf('day').toISOString();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_den')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, koen_nam, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, oya_juchu_kizai_head_id'
      )
      .eq('kizai_id', kizaiId)
      .neq('juchu_kizai_head_kbn', 3)
      .or(
        `and(kics_shuko_dat.gte.${strDat},kics_shuko_dat.lte.${endDat}),and(yard_shuko_dat.gte.${strDat},yard_shuko_dat.lte.${endDat}),and(kics_nyuko_dat.gte.${strDat},kics_nyuko_dat.lte.${endDat}),and(yard_nyuko_dat.gte.${strDat},yard_nyuko_dat.lte.${endDat})`
      );
  } catch (e) {
    throw new Error('[selectLoanJuchuData] DBエラー:', { cause: e });
  }
};
