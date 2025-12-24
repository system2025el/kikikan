import z from 'zod';

/**
 * 機材RFIDマスタ表エクセルインポートの型
 */
export type EqptImportType = z.infer<typeof eqptSchema>;

/**
 * 機材RFIDマスタ表エクセルインポートのzod Schema
 */
export const eqptSchema = z.object({
  rfid_tag_id: z.string(),
  rfid_kizai_sts: z.number().int(),
  del_flg: z.number().int().max(1).min(0),
  section_nam: z.string().optional(),
  kizai_nam: z.string(),
  el_num: z.number().int().nullish(),
  shozoku_id: z.number().int(),
  bld_cod: z.string().optional(),
  tana_cod: z.string().optional(),
  eda_cod: z.string().optional(),
  kizai_grp_cod: z.string().optional(),
  dsp_ord_num: z.number().int().nullish(),
  mem: z.string().optional(),
  dai_bumon_nam: z.string().optional(),
  bumon_nam: z.string().optional(),
  shukei_bumon_nam: z.string().optional(),
  dsp_flg: z.number().int().nullish(),
  ctn_flg: z.number().int().max(1).min(0).nullish(),
  def_dat_qty: z.number().nullish(),
  reg_amt: z.number().max(9999999999).int().nullish(),
  // rank_amt_1: z.number().nullish(),
  // rank_amt_2: z.number().nullish(),
  // rank_amt_3: z.number().nullish(),
  // rank_amt_4: z.number().nullish(),
  // rank_amt_5: z.number().nullish(),
});

/**
 * 機材RFIDマスタ表エクセルインポート時の配列の型
 */
export type EqptImportRowType = [
  string, // rfid_tag_id
  number, // rfid_kizai_sts
  number, // del_flg
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
  // number | null, // rank_amt_1
  // number | null, // rank_amt_2
  // number | null, // rank_amt_3
  // number | null, // rank_amt_4
  // number | null, // rank_amt_5
];

/**
 * 機材RFIDマスタ表エクセルから取得したデータをnumber | null型に変換
 */
export const parseNumber = (input: number | null) => {
  if (input === null || input === undefined) return null;
  const inputString = String(input);
  const normalizedString = inputString.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  const cleanString = normalizedString.replace(/[,\.]/g, '');
  if (cleanString === '') return null;
  const result = Number(cleanString);
  return isNaN(result) ? null : result;
};

/**
 * 機材RFIDマスタ表エクセルインポートで使うRFIDの型
 */
export type RfidImportTypes = {
  rfid_tag_id: string;
  kizai_nam: string;
  rfid_kizai_sts: number | null | undefined;
  del_flg: number | null | undefined;
  shozoku_id: number | null | undefined;
  el_num: number | null | undefined;
  mem?: string | null;
};

/**
 * 機材RFIDマスタ表エクセルインポートで使う機材マスタの型
 */
export type KizaiImportTypes = {
  kizai_nam: string;
  section_nam?: string | null;
  shozoku_id: number | null | undefined;
  bld_cod?: string | null;
  tana_cod?: string | null;
  eda_cod?: string | null;
  kizai_grp_cod?: string | null;
  dsp_ord_num?: number | null | undefined;
  mem?: string | null;
  bumon_nam?: string | null;
  shukei_bumon_nam?: string | null;
  dsp_flg?: number | null | undefined;
  ctn_flg?: number | null | undefined;
  def_dat_qty?: number | null | undefined;
  reg_amt?: number | null | undefined;
  // rank_amt_1?: number | null | undefined;
  // rank_amt_2?: number | null | undefined;
  // rank_amt_3?: number | null | undefined;
  // rank_amt_4?: number | null | undefined;
  // rank_amt_5?: number | null | undefined;
};

/**
 * 機材RFIDマスタ表エクセルインポートで使う棚番マスタの型
 */
export type TanabanImportTypes = { bld_cod?: string; tana_cod?: string; eda_cod?: string };
