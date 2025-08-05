import z from 'zod';

// 機材インポートタイプ
export type EqptImportType = z.infer<typeof eqptSchema>;

// 機材インポートタイプのZodスキーマ
export const eqptSchema = z.object({
  rfid_tag_id: z.string(),
  rfid_kizai_sts: z.number().nullable().optional(),
  del_flg: z.number().nullable().optional(),
  section_num: z.number().nullable().optional(),
  kizai_nam: z.string(),
  el_num: z.number().nullable().optional(),
  shozoku_id: z.number().nullable().optional(),
  bld_cod: z.string().optional(),
  tana_cod: z.string().optional(),
  eda_cod: z.string().optional(),
  kizai_grp_cod: z.string().optional(),
  dsp_ord_num: z.number().nullable().optional(),
  mem: z.string().optional(),
  dai_bumon_nam: z.string().optional(),
  bumon_nam: z.string().optional(),
  shukei_bumon_nam: z.string().optional(),
  dsp_flg: z.number().nullable().optional(),
  ctn_flg: z.number().nullable().optional(),
  def_dat_qty: z.number().nullable().optional(),
  reg_amt: z.number().nullable().optional(),
  rank_amt_1: z.number().nullable().optional(),
  rank_amt_2: z.number().nullable().optional(),
  rank_amt_3: z.number().nullable().optional(),
  rank_amt_4: z.number().nullable().optional(),
  rank_amt_5: z.number().nullable().optional(),
});

export type EqptImportRowType = [
  string, // rfid_tag_id
  number, // rfid_kizai_sts
  number | null, // del_flg
  number | null, // section_num
  string, // kizai_nam
  number | null, // el_num
  number, // shozoku_id
  string | undefined, // bld_cod
  string | undefined, // tana_cod
  string | undefined, // eda_cod
  string | undefined, // kizai_grp_cod
  number | null, // dsp_ord_num
  string | undefined, // mem
  string | undefined, // dai_bumon_nam
  string | undefined, //bumon_nam
  string | undefined, // shukei_bumon_nam
  number | null, // dsp_flg
  number | null, // ctn_flg
  number | null, // def_dat_qty
  number, // reg_amt
  number | null, // rank_amt_1
  number | null, // rank_amt_2
  number | null, // rank_amt_3
  number | null, // rank_amt_4
  number | null, // rank_amt_5
];

export const parseNumber = (input: number | null) => {
  if (input === null) return null;
  if (input === undefined) return null;
  const inputString = String(input);
  const normalizedString = inputString.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  const cleanString = normalizedString.replace(/[,\.]/g, '');
  if (cleanString === '') return null;

  const result = Number(cleanString);
  return isNaN(result) ? null : result;
};
