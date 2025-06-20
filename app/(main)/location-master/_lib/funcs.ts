'use server';

import { supabase } from '@/app/_lib/supabase/supabase';

import { LocMasterTableValues } from './types';

export const GetAllLoc = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev3')
      .from('m_koenbasho')
      .select('koenbasho_id , koenbasho_nam, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem, disp_ord_num');
    if (!error) {
      console.log('I got a datalist from db', data);

      const theData: LocMasterTableValues[] = data.map((d) => ({
        locId: d.koenbasho_id,
        locNam: d.koenbasho_nam,
        adrShozai: d.adr_shozai,
        adrTatemono: d.adr_tatemono,
        adrSonota: d.adr_sonota,
        tel: d.tel,
        fax: d.fax,
        mem: d.mem,
        dspOrder: d.disp_ord_num,
      }));

      console.log(theData);
      return theData;
    } else {
      console.error('DBエラーです', error);
    }
  } catch (e) {
    console.log(e);
  }
};
