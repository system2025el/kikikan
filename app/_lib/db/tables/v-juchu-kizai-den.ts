import dayjs from 'dayjs';

import { SCHEMA, supabase } from '../supabase';

export const selectLoanJuchuData = async (kizaiId: number, date: Date) => {
  // 開始日
  const strDat = dayjs(date).tz('Asia/Tokyo').startOf('day').toISOString();
  // 開始日から+90日した日付
  const endDat = dayjs(date).tz('Asia/Tokyo').add(90, 'day').endOf('day').toISOString();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_den')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, koen_nam, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, oya_juchu_kizai_head_id'
      )
      .eq('kizai_id', kizaiId)
      .eq('juchu_kizai_head_kbn', 1)
      // 出庫日がカレンダー最終日以下
      .or(`kics_shuko_dat.lte.${endDat},yard_shuko_dat.lte.${endDat}`)
      // 入庫日がカレンダー開始日以上
      .or(`kics_nyuko_dat.gte.${strDat},yard_nyuko_dat.gte.${strDat}`);
  } catch (e) {
    throw new Error('[selectLoanJuchuData] DBエラー:', { cause: e });
  }
};

export const selectLoanJuchuReturnData = async (kizaiId: number, date: Date) => {
  // 開始日から+90日した日付
  const endDat = dayjs(date).tz('Asia/Tokyo').add(90, 'day').endOf('day').toISOString();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_den')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, koen_nam, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, oya_juchu_kizai_head_id'
      )
      .eq('kizai_id', kizaiId)
      .eq('juchu_kizai_head_kbn', 2)
      // 入庫日がカレンダー開始日以上
      .or(`kics_nyuko_dat.lte.${endDat},yard_nyuko_dat.lte.${endDat}`);
  } catch (e) {
    throw new Error('[selectLoanJuchuData] DBエラー:', { cause: e });
  }
};
