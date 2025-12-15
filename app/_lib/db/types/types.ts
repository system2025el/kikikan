// yarn run v1.22.22
// $ C:\workspace\kikikan\node_modules\.bin\supabase gen types typescript --project-id jimqcvyaoddsxbcrsnfs --schema dev2
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  dev7: {
    Tables: {
      m_bumon: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          bumon_id: number;
          bumon_nam: string;
          dai_bumon_id: number | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          shukei_bumon_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          bumon_id: number;
          bumon_nam: string;
          dai_bumon_id?: number | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          bumon_id?: number;
          bumon_nam?: string;
          dai_bumon_id?: number | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_dai_bumon: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dai_bumon_id: number;
          dai_bumon_nam: string;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dai_bumon_id: number;
          dai_bumon_nam: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dai_bumon_id?: number;
          dai_bumon_nam?: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_dic: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dic_id: number | null;
          dic_val: string | null;
          dsp_ord_num: number | null;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dic_id?: number | null;
          dic_val?: string | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dic_id?: number | null;
          dic_val?: string | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_honbanbi_color: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          clolor_id: number;
          color_nam: string;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          clolor_id: number;
          color_nam: string;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          clolor_id?: number;
          color_nam?: string;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_issiki: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          issiki_id: number;
          issiki_nam: string | null;
          mem: string | null;
          reg_amt: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          issiki_id: number;
          issiki_nam?: string | null;
          mem?: string | null;
          reg_amt?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          issiki_id?: number;
          issiki_nam?: string | null;
          mem?: string | null;
          reg_amt?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_issiki_set: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          issiki_id: number;
          kizai_id: number;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          issiki_id: number;
          kizai_id: number;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          issiki_id?: number;
          kizai_id?: number;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_juchu_sts: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id?: number;
          sts_nam?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_kizai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          def_dat_qty: number | null;
          del_flg: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          el_num: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number;
          kizai_nam: string;
          mem: string | null;
          rank_amt_1: number | null;
          rank_amt_2: number | null;
          rank_amt_3: number | null;
          rank_amt_4: number | null;
          rank_amt_5: number | null;
          reg_amt: number | null;
          section_num: number | null;
          shozoku_id: number;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string | null;
          bumon_id?: number | null;
          ctn_flg?: number | null;
          def_dat_qty?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string | null;
          el_num?: number | null;
          kizai_grp_cod?: string | null;
          kizai_id: number;
          kizai_nam: string;
          mem?: string | null;
          rank_amt_1?: number | null;
          rank_amt_2?: number | null;
          rank_amt_3?: number | null;
          rank_amt_4?: number | null;
          rank_amt_5?: number | null;
          reg_amt?: number | null;
          section_num?: number | null;
          shozoku_id: number;
          shukei_bumon_id?: number | null;
          tana_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string | null;
          bumon_id?: number | null;
          ctn_flg?: number | null;
          def_dat_qty?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string | null;
          el_num?: number | null;
          kizai_grp_cod?: string | null;
          kizai_id?: number;
          kizai_nam?: string;
          mem?: string | null;
          rank_amt_1?: number | null;
          rank_amt_2?: number | null;
          rank_amt_3?: number | null;
          rank_amt_4?: number | null;
          rank_amt_5?: number | null;
          reg_amt?: number | null;
          section_num?: number | null;
          shozoku_id?: number;
          shukei_bumon_id?: number | null;
          tana_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_kizai_his: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          def_dat_qty: number | null;
          del_flg: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          el_num: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number;
          kizai_id_his_num: number;
          kizai_nam: string;
          mem: string | null;
          rank_amt_1: number | null;
          rank_amt_2: number | null;
          rank_amt_3: number | null;
          rank_amt_4: number | null;
          rank_amt_5: number | null;
          reg_amt: number | null;
          section_num: number | null;
          shozoku_id: number;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string | null;
          bumon_id?: number | null;
          ctn_flg?: number | null;
          def_dat_qty?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string | null;
          el_num?: number | null;
          kizai_grp_cod?: string | null;
          kizai_id: number;
          kizai_id_his_num: number;
          kizai_nam: string;
          mem?: string | null;
          rank_amt_1?: number | null;
          rank_amt_2?: number | null;
          rank_amt_3?: number | null;
          rank_amt_4?: number | null;
          rank_amt_5?: number | null;
          reg_amt?: number | null;
          section_num?: number | null;
          shozoku_id: number;
          shukei_bumon_id?: number | null;
          tana_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string | null;
          bumon_id?: number | null;
          ctn_flg?: number | null;
          def_dat_qty?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string | null;
          el_num?: number | null;
          kizai_grp_cod?: string | null;
          kizai_id?: number;
          kizai_id_his_num?: number;
          kizai_nam?: string;
          mem?: string | null;
          rank_amt_1?: number | null;
          rank_amt_2?: number | null;
          rank_amt_3?: number | null;
          rank_amt_4?: number | null;
          rank_amt_5?: number | null;
          reg_amt?: number | null;
          section_num?: number | null;
          shozoku_id?: number;
          shukei_bumon_id?: number | null;
          tana_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_kizai_set: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          kizai_id: number;
          mem: string | null;
          set_kizai_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          kizai_id: number;
          mem?: string | null;
          set_kizai_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          kizai_id?: number;
          mem?: string | null;
          set_kizai_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_koenbasho: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          adr_post: string | null;
          adr_shozai: string | null;
          adr_sonota: string | null;
          adr_tatemono: string | null;
          del_flg: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          fax: string | null;
          kana: string;
          koenbasho_id: number;
          koenbasho_nam: string;
          mail: string | null;
          mem: string | null;
          tel: string | null;
          tel_mobile: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          adr_post?: string | null;
          adr_shozai?: string | null;
          adr_sonota?: string | null;
          adr_tatemono?: string | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          fax?: string | null;
          kana: string;
          koenbasho_id: number;
          koenbasho_nam: string;
          mail?: string | null;
          mem?: string | null;
          tel?: string | null;
          tel_mobile?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          adr_post?: string | null;
          adr_shozai?: string | null;
          adr_sonota?: string | null;
          adr_tatemono?: string | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          fax?: string | null;
          kana?: string;
          koenbasho_id?: number;
          koenbasho_nam?: string;
          mail?: string | null;
          mem?: string | null;
          tel?: string | null;
          tel_mobile?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_kokyaku: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          adr_post: string | null;
          adr_shozai: string | null;
          adr_sonota: string | null;
          adr_tatemono: string | null;
          close_day: number | null;
          del_flg: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          fax: string | null;
          kana: string;
          keisho: string | null;
          kizai_nebiki_flg: number | null;
          kokyaku_id: number;
          kokyaku_nam: string;
          kokyaku_rank: number;
          mail: string | null;
          mem: string | null;
          nebiki_rat: number | null;
          site_day: number | null;
          tel: string | null;
          tel_mobile: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          adr_post?: string | null;
          adr_shozai?: string | null;
          adr_sonota?: string | null;
          adr_tatemono?: string | null;
          close_day?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          fax?: string | null;
          kana: string;
          keisho?: string | null;
          kizai_nebiki_flg?: number | null;
          kokyaku_id: number;
          kokyaku_nam: string;
          kokyaku_rank: number;
          mail?: string | null;
          mem?: string | null;
          nebiki_rat?: number | null;
          site_day?: number | null;
          tel?: string | null;
          tel_mobile?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          adr_post?: string | null;
          adr_shozai?: string | null;
          adr_sonota?: string | null;
          adr_tatemono?: string | null;
          close_day?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          fax?: string | null;
          kana?: string;
          keisho?: string | null;
          kizai_nebiki_flg?: number | null;
          kokyaku_id?: number;
          kokyaku_nam?: string;
          kokyaku_rank?: number;
          mail?: string | null;
          mem?: string | null;
          nebiki_rat?: number | null;
          site_day?: number | null;
          tel?: string | null;
          tel_mobile?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_master_update: {
        Row: {
          master_nam: string;
          upd_dat: string | null;
        };
        Insert: {
          master_nam: string;
          upd_dat?: string | null;
        };
        Update: {
          master_nam?: string;
          upd_dat?: string | null;
        };
        Relationships: [];
      };
      m_mitu_sts: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id?: number;
          sts_nam?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_rfid: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          el_num?: number | null;
          kizai_id: number;
          mem: string | null;
          rfid_kizai_sts: number | null;
          rfid_tag_id: string;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          el_num?: number | null;
          kizai_id: number;
          mem?: string | null;
          rfid_kizai_sts?: number | null;
          rfid_tag_id: string;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          el_num?: number | null;
          kizai_id?: number;
          mem?: string | null;
          rfid_kizai_sts?: number | null;
          rfid_tag_id?: string;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_sagyo_kbn: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          sagyo_kbn_id: number;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sagyo_kbn_id: number;
          sagyo_kbn_nam?: string | null;
          sagyo_kbn_nam_short?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sagyo_kbn_id?: number;
          sagyo_kbn_nam?: string | null;
          sagyo_kbn_nam_short?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_sagyo_sts: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          sts_id: number;
          sts_nam: string;
          sts_nam_short: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id: number;
          sts_nam: string;
          sts_nam_short: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id?: number;
          sts_nam?: string;
          sts_nam_short?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_section: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          section_id: number;
          section_nam: string;
          section_nam_short: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          section_id: number;
          section_nam: string;
          section_nam_short: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          section_id?: number;
          section_nam?: string;
          section_nam_short?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_seikyu_jokyo_sts: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id?: number;
          sts_nam?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_seikyu_sts: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id: number;
          sts_nam: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          sts_id?: number;
          sts_nam?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_sharyo: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          sharyo_id: number;
          sharyo_nam: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          sharyo_id: number;
          sharyo_nam: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          sharyo_id?: number;
          sharyo_nam?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_shozoku: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          shozoku_id: number;
          shozoku_nam: string;
          shozoku_nam_short: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shozoku_id: number;
          shozoku_nam: string;
          shozoku_nam_short: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shozoku_id?: number;
          shozoku_nam?: string;
          shozoku_nam_short?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_shukei_bumon: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          shukei_bumon_id: number;
          shukei_bumon_nam: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id: number;
          shukei_bumon_nam: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id?: number;
          shukei_bumon_nam?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_tanaban: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          bld_cod: string;
          del_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string;
          mem: string | null;
          tana_cod: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod: string;
          mem?: string | null;
          tana_cod: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string;
          mem?: string | null;
          tana_cod?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_user: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mail_adr: string;
          mem: string | null;
          permission: number;
          shain_cod: string | null;
          upd_dat: string | null;
          upd_user: string | null;
          user_nam: string;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mail_adr: string;
          mem?: string | null;
          permission: number;
          shain_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          user_nam: string;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mail_adr?: string;
          mem?: string | null;
          permission?: number;
          shain_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          user_nam?: string;
        };
        Relationships: [];
      };
      m_zei: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
          zei_frac: number | null;
          zei_kbn: number;
          zei_nam: string | null;
          zei_rat: number;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_frac?: number | null;
          zei_kbn: number;
          zei_nam?: string | null;
          zei_rat: number;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_frac?: number | null;
          zei_kbn?: number;
          zei_nam?: string | null;
          zei_rat?: number;
        };
        Relationships: [];
      };
      t_ido_ctn_result: {
        Row: {
          ido_den_id: number;
          kizai_id: number;
          rfid_kizai_sts: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          ido_den_id: number;
          kizai_id: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          ido_den_id?: number;
          kizai_id?: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id?: string;
          sagyo_den_dat?: string;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          sagyo_siji_id?: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_ido_den: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          ido_den_id: number;
          kizai_id: number;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          ido_den_id: number;
          kizai_id: number;
          plan_qty?: number | null;
          result_adj_qty?: number | null;
          result_qty?: number | null;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          ido_den_id?: number;
          kizai_id?: number;
          plan_qty?: number | null;
          result_adj_qty?: number | null;
          result_qty?: number | null;
          sagyo_den_dat?: string;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          sagyo_siji_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_ido_den_juchu: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          ido_den_id: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          kizai_id: number;
          plan_qty: number | null;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          ido_den_id?: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          kizai_id: number;
          plan_qty?: number | null;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          ido_den_id?: number | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          kizai_id?: number;
          plan_qty?: number | null;
          sagyo_den_dat?: string;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          sagyo_siji_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_ido_fix: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          ido_den_id: number;
          sagyo_den_dat: string;
          sagyo_fix_flg: number | null;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          ido_den_id: number;
          sagyo_den_dat: string;
          sagyo_fix_flg?: number | null;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          ido_den_id?: number;
          sagyo_den_dat?: string;
          sagyo_fix_flg?: number | null;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          sagyo_siji_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_ido_result: {
        Row: {
          ido_den_id: number;
          kizai_id: number;
          rfid_kizai_sts: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          ido_den_id: number;
          kizai_id: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          sagyo_siji_id: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          ido_den_id?: number;
          kizai_id?: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id?: string;
          sagyo_den_dat?: string;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          sagyo_siji_id?: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_ctn_meisai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          indent_num: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          keep_qty: number | null;
          kizai_id: number;
          mem: string | null;
          plan_kizai_qty: number | null;
          shozoku_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          indent_num?: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          keep_qty?: number | null;
          kizai_id: number;
          mem?: string | null;
          plan_kizai_qty?: number | null;
          shozoku_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          indent_num?: number | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          juchu_kizai_meisai_id?: number;
          keep_qty?: number | null;
          kizai_id?: number;
          mem?: string | null;
          plan_kizai_qty?: number | null;
          shozoku_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_head: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          juchu_dat: string | null;
          juchu_end_dat: string | null;
          juchu_head_id: number;
          juchu_str_dat: string | null;
          juchu_sts: number | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_id: number | null;
          kokyaku_tanto_nam: string | null;
          mem: string | null;
          nebiki_amt: number | null;
          nyuryoku_user: string | null;
          upd_dat: string | null;
          upd_user: string | null;
          zei_kbn: number | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          juchu_dat?: string | null;
          juchu_end_dat?: string | null;
          juchu_head_id: number;
          juchu_str_dat?: string | null;
          juchu_sts?: number | null;
          koen_nam?: string | null;
          koenbasho_nam?: string | null;
          kokyaku_id?: number | null;
          kokyaku_tanto_nam?: string | null;
          mem?: string | null;
          nebiki_amt?: number | null;
          nyuryoku_user?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_kbn?: number | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          juchu_dat?: string | null;
          juchu_end_dat?: string | null;
          juchu_head_id?: number;
          juchu_str_dat?: string | null;
          juchu_sts?: number | null;
          koen_nam?: string | null;
          koenbasho_nam?: string | null;
          kokyaku_id?: number | null;
          kokyaku_tanto_nam?: string | null;
          mem?: string | null;
          nebiki_amt?: number | null;
          nyuryoku_user?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_kbn?: number | null;
        };
        Relationships: [];
      };
      t_juchu_kizai_head: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          head_nam: string | null;
          ht_kbn: number | null;
          juchu_head_id: number;
          juchu_honbanbi_qty: number | null;
          juchu_kizai_head_id: number;
          juchu_kizai_head_kbn: number;
          mem: string | null;
          nebiki_amt: number | null;
          nebiki_rat: number | null;
          oya_juchu_kizai_head_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          head_nam?: string | null;
          ht_kbn?: number | null;
          juchu_head_id: number;
          juchu_honbanbi_qty?: number | null;
          juchu_kizai_head_id: number;
          juchu_kizai_head_kbn: number;
          mem?: string | null;
          nebiki_amt?: number | null;
          nebiki_rat?: number | null;
          oya_juchu_kizai_head_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          head_nam?: string | null;
          ht_kbn?: number | null;
          juchu_head_id?: number;
          juchu_honbanbi_qty?: number | null;
          juchu_kizai_head_id?: number;
          juchu_kizai_head_kbn?: number;
          mem?: string | null;
          nebiki_amt?: number | null;
          nebiki_rat?: number | null;
          oya_juchu_kizai_head_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_kizai_honbanbi: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          juchu_head_id: number;
          juchu_honbanbi_add_qty: number | null;
          juchu_honbanbi_dat: string;
          juchu_honbanbi_shubetu_id: number;
          juchu_kizai_head_id: number;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id: number;
          juchu_honbanbi_add_qty?: number | null;
          juchu_honbanbi_dat: string;
          juchu_honbanbi_shubetu_id: number;
          juchu_kizai_head_id: number;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id?: number;
          juchu_honbanbi_add_qty?: number | null;
          juchu_honbanbi_dat?: string;
          juchu_honbanbi_shubetu_id?: number;
          juchu_kizai_head_id?: number;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_kizai_meisai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          indent_num: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          keep_qty: number | null;
          kizai_id: number;
          kizai_tanka_amt: number | null;
          mem: string | null;
          mem2: string | null;
          plan_kizai_qty: number | null;
          plan_yobi_qty: number | null;
          shozoku_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          indent_num?: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          keep_qty?: number | null;
          kizai_id: number;
          kizai_tanka_amt?: number | null;
          mem?: string | null;
          mem2?: string | null;
          plan_kizai_qty?: number | null;
          plan_yobi_qty?: number | null;
          shozoku_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          indent_num?: number | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          juchu_kizai_meisai_id?: number;
          keep_qty?: number | null;
          kizai_id?: number;
          kizai_tanka_amt?: number | null;
          mem?: string | null;
          mem2?: string | null;
          plan_kizai_qty?: number | null;
          plan_yobi_qty?: number | null;
          shozoku_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_kizai_meisai_his: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          his_kbn: number;
          his_num: number;
          indent_num: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          keep_qty: number | null;
          kizai_id: number;
          kizai_tanka_amt: number | null;
          mem: string | null;
          plan_kizai_qty: number | null;
          plan_yobi_qty: number | null;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          his_kbn: number;
          his_num: number;
          indent_num?: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          keep_qty?: number | null;
          kizai_id: number;
          kizai_tanka_amt?: number | null;
          mem?: string | null;
          plan_kizai_qty?: number | null;
          plan_yobi_qty?: number | null;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          his_kbn?: number;
          his_num?: number;
          indent_num?: number | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          juchu_kizai_meisai_id?: number;
          keep_qty?: number | null;
          kizai_id?: number;
          kizai_tanka_amt?: number | null;
          mem?: string | null;
          plan_kizai_qty?: number | null;
          plan_yobi_qty?: number | null;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_kizai_nyushuko: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          nyushuko_basho_id: number;
          nyushuko_dat: string;
          nyushuko_shubetu_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          nyushuko_basho_id: number;
          nyushuko_dat: string;
          nyushuko_shubetu_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          nyushuko_basho_id?: number;
          nyushuko_dat?: string;
          nyushuko_shubetu_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_sharyo_head: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          head_nam: string | null;
          juchu_head_id: number;
          juchu_sharyo_head_id: number;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          head_nam?: string | null;
          juchu_head_id: number;
          juchu_sharyo_head_id: number;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          head_nam?: string | null;
          juchu_head_id?: number;
          juchu_sharyo_head_id?: number;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_juchu_sharyo_meisai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          daisu: number | null;
          juchu_head_id: number;
          juchu_sharyo_head_id: number;
          juchu_sharyo_meisai_id: number;
          mem: string | null;
          nyushuko_basho_id: number;
          nyushuko_dat: string;
          nyushuko_shubetu_id: number | null;
          sharyo_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          daisu?: number | null;
          juchu_head_id: number;
          juchu_sharyo_head_id: number;
          juchu_sharyo_meisai_id: number;
          mem?: string | null;
          nyushuko_basho_id: number;
          nyushuko_dat: string;
          nyushuko_shubetu_id?: number | null;
          sharyo_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          daisu?: number | null;
          juchu_head_id?: number;
          juchu_sharyo_head_id?: number;
          juchu_sharyo_meisai_id?: number;
          mem?: string | null;
          nyushuko_basho_id?: number;
          nyushuko_dat?: string;
          nyushuko_shubetu_id?: number | null;
          sharyo_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_lock: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          head_id: number;
          lock_shubetu: number;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          head_id: number;
          lock_shubetu: number;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          head_id?: number;
          lock_shubetu?: number;
        };
        Relationships: [];
      };
      t_log: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          log_det: string | null;
          log_lev: string | null;
          log_nam: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          log_det?: string | null;
          log_lev?: string | null;
          log_nam?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          log_det?: string | null;
          log_lev?: string | null;
          log_nam?: string | null;
        };
        Relationships: [];
      };
      t_mitu_head: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          biko: string | null;
          chukei_mei: string | null;
          comment: string | null;
          del_flg: number | null;
          gokei_amt: number | null;
          gokei_mei: string | null;
          juchu_head_id: number | null;
          kizai_chukei_mei?: string | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_id: number | null;
          kokyaku_nam: string | null;
          kokyaku_tanto_nam: string | null;
          mitu_dat: string | null;
          mitu_end_dat: string | null;
          mitu_head_id: number;
          mitu_head_nam: string | null;
          mitu_honbanbi_qty: number | null;
          mitu_str_dat: string | null;
          mitu_sts: number | null;
          mitu_yuko_dat: string | null;
          nyuryoku_user: string | null;
          toku_nebiki_amt: number | null;
          toku_nebiki_mei: string | null;
          torihiki_hoho: string | null;
          upd_dat: string | null;
          upd_user: string | null;
          zei_amt: number | null;
          zei_rat: number | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          biko?: string | null;
          chukei_mei?: string | null;
          comment?: string | null;
          del_flg?: number | null;
          gokei_amt?: number | null;
          gokei_mei?: string | null;
          juchu_head_id?: number | null;
          kizai_chukei_mei?: string | null;
          koen_nam?: string | null;
          koenbasho_nam?: string | null;
          kokyaku_id?: number | null;
          kokyaku_nam?: string | null;
          kokyaku_tanto_nam?: string | null;
          mitu_dat?: string | null;
          mitu_end_dat?: string | null;
          mitu_head_id: number;
          mitu_head_nam?: string | null;
          mitu_honbanbi_qty?: number | null;
          mitu_str_dat?: string | null;
          mitu_sts?: number | null;
          mitu_yuko_dat?: string | null;
          nyuryoku_user?: string | null;
          toku_nebiki_amt?: number | null;
          toku_nebiki_mei?: string | null;
          torihiki_hoho?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_amt?: number | null;
          zei_rat?: number | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          biko?: string | null;
          chukei_mei?: string | null;
          comment?: string | null;
          del_flg?: number | null;
          gokei_amt?: number | null;
          gokei_mei?: string | null;
          juchu_head_id?: number | null;
          kizai_chukei_mei?: string | null;
          koen_nam?: string | null;
          koenbasho_nam?: string | null;
          kokyaku_id?: number | null;
          kokyaku_nam?: string | null;
          kokyaku_tanto_nam?: string | null;
          mitu_dat?: string | null;
          mitu_end_dat?: string | null;
          mitu_head_id?: number;
          mitu_head_nam?: string | null;
          mitu_honbanbi_qty?: number | null;
          mitu_str_dat?: string | null;
          mitu_sts?: number | null;
          mitu_yuko_dat?: string | null;
          nyuryoku_user?: string | null;
          toku_nebiki_amt?: number | null;
          toku_nebiki_mei?: string | null;
          torihiki_hoho?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_amt?: number | null;
          zei_rat?: number | null;
        };
        Relationships: [];
      };
      t_mitu_meisai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          meisai_honbanbi_qty: number;
          meisai_qty: number;
          meisai_tanka_amt: number;
          mitu_head_id: number;
          mitu_meisai_head_id: number;
          mitu_meisai_id: number;
          mitu_meisai_nam: string | null;
          shokei_amt: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          meisai_honbanbi_qty: number;
          meisai_qty: number;
          meisai_tanka_amt: number;
          mitu_head_id: number;
          mitu_meisai_head_id: number;
          mitu_meisai_id: number;
          mitu_meisai_nam?: string | null;
          shokei_amt?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          meisai_honbanbi_qty?: number;
          meisai_qty?: number;
          meisai_tanka_amt?: number;
          mitu_head_id?: number;
          mitu_meisai_head_id?: number;
          mitu_meisai_id?: number;
          mitu_meisai_nam?: string | null;
          shokei_amt?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_mitu_meisai_head: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          biko_1: string | null;
          biko_2: string | null;
          biko_3: string | null;
          dsp_ord_num: number | null;
          head_nam_dsp_flg: number | null;
          mitu_head_id: number;
          mitu_meisai_head_id: number;
          mitu_meisai_head_kbn: number;
          mitu_meisai_head_nam: string | null;
          nebiki_aft_amt: number | null;
          nebiki_aft_nam: string | null;
          nebiki_amt: number | null;
          nebiki_nam: string | null;
          shokei_mei: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          biko_1?: string | null;
          biko_2?: string | null;
          biko_3?: string | null;
          dsp_ord_num?: number | null;
          head_nam_dsp_flg?: number | null;
          mitu_head_id: number;
          mitu_meisai_head_id: number;
          mitu_meisai_head_kbn: number;
          mitu_meisai_head_nam?: string | null;
          nebiki_aft_amt?: number | null;
          nebiki_aft_nam?: string | null;
          nebiki_amt?: number | null;
          nebiki_nam?: string | null;
          shokei_mei?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          biko_1?: string | null;
          biko_2?: string | null;
          biko_3?: string | null;
          dsp_ord_num?: number | null;
          head_nam_dsp_flg?: number | null;
          mitu_head_id?: number;
          mitu_meisai_head_id?: number;
          mitu_meisai_head_kbn?: number;
          mitu_meisai_head_nam?: string | null;
          nebiki_aft_amt?: number | null;
          nebiki_aft_nam?: string | null;
          nebiki_amt?: number | null;
          nebiki_nam?: string | null;
          shokei_mei?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_nyushuko_ctn_result: {
        Row: {
          juchu_head_id: number;
          juchu_kizai_head_id: number | null;
          juchu_kizai_meisai_id: number | null;
          kizai_id: number;
          rfid_kizai_sts: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          juchu_head_id: number;
          juchu_kizai_head_id?: number | null;
          juchu_kizai_meisai_id?: number | null;
          kizai_id: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          juchu_head_id?: number;
          juchu_kizai_head_id?: number | null;
          juchu_kizai_meisai_id?: number | null;
          kizai_id?: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id?: string;
          sagyo_den_dat?: string;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_nyushuko_den: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          indent_num: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          kizai_id: number;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          indent_num?: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          kizai_id: number;
          plan_qty?: number | null;
          result_adj_qty?: number | null;
          result_qty?: number | null;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          indent_num?: number | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          juchu_kizai_meisai_id?: number;
          kizai_id?: number;
          plan_qty?: number | null;
          result_adj_qty?: number | null;
          result_qty?: number | null;
          sagyo_den_dat?: string;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_nyushuko_fix: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          sagyo_den_dat: string;
          sagyo_fix_flg: number | null;
          sagyo_id: number;
          sagyo_kbn_id: number;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          sagyo_den_dat: string;
          sagyo_fix_flg?: number | null;
          sagyo_id: number;
          sagyo_kbn_id: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          sagyo_den_dat?: string;
          sagyo_fix_flg?: number | null;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_nyushuko_result: {
        Row: {
          juchu_head_id: number;
          juchu_kizai_head_id: number | null;
          juchu_kizai_meisai_id: number | null;
          kizai_id: number;
          rfid_kizai_sts: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          juchu_head_id: number;
          juchu_kizai_head_id?: number | null;
          juchu_kizai_meisai_id?: number | null;
          kizai_id: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id: string;
          sagyo_den_dat: string;
          sagyo_id: number;
          sagyo_kbn_id: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          juchu_head_id?: number;
          juchu_kizai_head_id?: number | null;
          juchu_kizai_meisai_id?: number | null;
          kizai_id?: number;
          rfid_kizai_sts?: number | null;
          rfid_tag_id?: string;
          sagyo_den_dat?: string;
          sagyo_id?: number;
          sagyo_kbn_id?: number;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_rfid_status_result: {
        Row: {
          rfid_kizai_sts: number | null;
          rfid_tag_id: string;
          shozoku_id: number | null;
          upd_dat: string;
          upd_user: string | null;
        };
        Insert: {
          rfid_kizai_sts?: number | null;
          rfid_tag_id: string;
          shozoku_id?: number | null;
          upd_dat: string;
          upd_user?: string | null;
        };
        Update: {
          rfid_kizai_sts?: number | null;
          rfid_tag_id?: string;
          shozoku_id?: number | null;
          upd_dat?: string;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_seikyu_date_juchu_kizai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          seikyu_dat: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          seikyu_dat: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          juchu_head_id?: number;
          juchu_kizai_head_id?: number;
          seikyu_dat?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_seikyu_head: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          adr_post: string | null;
          adr_shozai: string | null;
          adr_sonota: string | null;
          adr_tatemono: string | null;
          chukei_mei: string | null;
          del_flg: number | null;
          kokyaku_id: number | null;
          kokyaku_nam: string | null;
          nyuryoku_user: string | null;
          seikyu_dat: string | null;
          seikyu_head_id: number;
          seikyu_head_nam: string | null;
          seikyu_sts: number | null;
          upd_dat: string | null;
          upd_user: string | null;
          zei_gokei_mei: string | null;
          zei_mei: string | null;
          zei_rat: number | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          adr_post?: string | null;
          adr_shozai?: string | null;
          adr_sonota?: string | null;
          adr_tatemono?: string | null;
          chukei_mei?: string | null;
          del_flg?: number | null;
          kokyaku_id?: number | null;
          kokyaku_nam?: string | null;
          nyuryoku_user?: string | null;
          seikyu_dat?: string | null;
          seikyu_head_id: number;
          seikyu_head_nam?: string | null;
          seikyu_sts?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_gokei_mei?: string | null;
          zei_mei?: string | null;
          zei_rat?: number | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          adr_post?: string | null;
          adr_shozai?: string | null;
          adr_sonota?: string | null;
          adr_tatemono?: string | null;
          chukei_mei?: string | null;
          del_flg?: number | null;
          kokyaku_id?: number | null;
          kokyaku_nam?: string | null;
          nyuryoku_user?: string | null;
          seikyu_dat?: string | null;
          seikyu_head_id?: number;
          seikyu_head_nam?: string | null;
          seikyu_sts?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_gokei_mei?: string | null;
          zei_mei?: string | null;
          zei_rat?: number | null;
        };
        Relationships: [];
      };
      t_seikyu_meisai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          meisai_honbanbi_qty: number;
          meisai_qty: number;
          meisai_tanka_amt: number;
          seikyu_head_id: number;
          seikyu_meisai_head_id: number;
          seikyu_meisai_id: number;
          seikyu_meisai_nam: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          meisai_honbanbi_qty: number;
          meisai_qty: number;
          meisai_tanka_amt: number;
          seikyu_head_id: number;
          seikyu_meisai_head_id: number;
          seikyu_meisai_id: number;
          seikyu_meisai_nam?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          meisai_honbanbi_qty?: number;
          meisai_qty?: number;
          meisai_tanka_amt?: number;
          seikyu_head_id?: number;
          seikyu_meisai_head_id?: number;
          seikyu_meisai_id?: number;
          seikyu_meisai_nam?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      t_seikyu_meisai_head: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dsp_ord_num: number | null;
          gokei_nam: string | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_tanto_nam: string | null;
          nebiki_amt: number | null;
          seikyu_end_dat: string | null;
          seikyu_head_id: number;
          seikyu_meisai_head_id: number;
          seikyu_meisai_head_nam: string | null;
          seikyu_str_dat: string | null;
          upd_dat: string | null;
          upd_user: string | null;
          zei_flg: number | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          gokei_nam?: string | null;
          juchu_head_id?: number | null;
          juchu_kizai_head_id?: number | null;
          koen_nam?: string | null;
          koenbasho_nam?: string | null;
          kokyaku_tanto_nam?: string | null;
          nebiki_amt?: number | null;
          seikyu_end_dat?: string | null;
          seikyu_head_id: number;
          seikyu_meisai_head_id: number;
          seikyu_meisai_head_nam?: string | null;
          seikyu_str_dat?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_flg?: number | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dsp_ord_num?: number | null;
          gokei_nam?: string | null;
          juchu_head_id?: number | null;
          juchu_kizai_head_id?: number | null;
          koen_nam?: string | null;
          koenbasho_nam?: string | null;
          kokyaku_tanto_nam?: string | null;
          nebiki_amt?: number | null;
          seikyu_end_dat?: string | null;
          seikyu_head_id?: number;
          seikyu_meisai_head_id?: number;
          seikyu_meisai_head_nam?: string | null;
          seikyu_str_dat?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          zei_flg?: number | null;
        };
        Relationships: [];
      };
      t_weekly: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          holiday_flg: number | null;
          mem: string | null;
          tanto_nam: string | null;
          upd_dat: string | null;
          upd_user: string | null;
          weekly_dat: string;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          holiday_flg?: number | null;
          mem?: string | null;
          tanto_nam?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          weekly_dat: string;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          holiday_flg?: number | null;
          mem?: string | null;
          tanto_nam?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
          weekly_dat?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_chk_oya_juchu_kizai: {
        Row: {
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          oya_juchu_kizai_head_id: number | null;
          oya_kizai_count: number | null;
          oya_kizai_id: number | null;
        };
        Relationships: [];
      };
      v_get_juchu_kizai_head: {
        Row: {
          head_namv: string | null;
          juchu_head_id: number | null;
          juchu_kizai_head_idv: string | null;
          juchu_kizai_head_kbn: number | null;
          juchu_kizai_head_kbnv: string | null;
          nyushuko_shubetu_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
        };
        Relationships: [];
      };
      v_get_juchu_kizai_section: {
        Row: {
          juchu_head_id: number | null;
          nyushuko_shubetu_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          section_namv: string | null;
        };
        Relationships: [];
      };
      v_honbanbi_calc: {
        Row: {
          juchu_head_id: number | null;
          juchu_honbanbi_add_qty: number | null;
          juchu_honbanbi_calc_qty: number | null;
          juchu_honbanbi_qty: number | null;
          juchu_kizai_head_id: number | null;
        };
        Relationships: [];
      };
      v_honbanbi_juchu_kizai: {
        Row: {
          juchu_head_id: number | null;
          juchu_honbanbi_shubetu_color: string | null;
          juchu_honbanbi_shubetu_id: number | null;
          juchu_kizai_head_id: number | null;
          kizai_id: number | null;
          plan_dat: string | null;
        };
        Relationships: [];
      };
      v_honbanbi_kasi_jokyo: {
        Row: {
          juchu_head_id: number | null;
          juchu_honbanbi_shubetu_color: string | null;
          juchu_honbanbi_shubetu_id: number | null;
          kizai_id: number | null;
          plan_dat: string | null;
        };
        Relationships: [];
      };
      v_honbanbi_zaiko_jokyo: {
        Row: {
          juchu_honbanbi_shubetu_color: string | null;
          juchu_honbanbi_shubetu_id: number | null;
          kizai_id: number | null;
          plan_dat: string | null;
        };
        Relationships: [];
      };
      v_ido_den: {
        Row: {
          ido_den_id: number | null;
          juchu_flg: number | null;
          nchk_sagyo_sts_id: number | null;
          nchk_sagyo_sts_nam: string | null;
          nchk_sagyo_sts_nam_short: string | null;
          nyuko_fix_flg: number | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          sagyo_siji_id: number | null;
          schk_sagyo_sts_id: number | null;
          schk_sagyo_sts_nam: string | null;
          schk_sagyo_sts_nam_short: string | null;
          shozoku_nam: string | null;
          shuko_fix_flg: number | null;
        };
        Relationships: [];
      };
      v_ido_den_juchu: {
        Row: {
          ido_den_id: number | null;
          juchu_flg: number | null;
          nchk_sagyo_sts_id: number | null;
          nchk_sagyo_sts_nam: string | null;
          nchk_sagyo_sts_nam_short: string | null;
          nyuko_fix_flg: number | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          sagyo_siji_id: number | null;
          schk_sagyo_sts_id: number | null;
          schk_sagyo_sts_nam: string | null;
          schk_sagyo_sts_nam_short: string | null;
          shozoku_nam: string | null;
          shuko_fix_flg: number | null;
        };
        Relationships: [];
      };
      v_ido_den_juchu_lst: {
        Row: {
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          def_dat_qty: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          ido_den_id: number | null;
          juchu_flg: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number | null;
          kizai_nam: string | null;
          mem: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          sagyo_siji_id: number | null;
          shozoku_nam: string | null;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_ido_den_lst: {
        Row: {
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          def_dat_qty: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          ido_den_id: number | null;
          juchu_flg: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number | null;
          kizai_nam: string | null;
          mem: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          sagyo_siji_id: number | null;
          shozoku_nam: string | null;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_ido_den2: {
        Row: {
          nchk_sagyo_sts_id: number | null;
          nchk_sagyo_sts_nam: string | null;
          nchk_sagyo_sts_nam_short: string | null;
          nyuko_fix_flg: number | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          schk_sagyo_sts_id: number | null;
          schk_sagyo_sts_nam: string | null;
          schk_sagyo_sts_nam_short: string | null;
          shozoku_nam: string | null;
          shuko_fix_flg: number | null;
        };
        Relationships: [];
      };
      v_ido_den2_juchu_lst: {
        Row: {
          bld_cod: string | null;
          ctn_flg: number | null;
          diff_qty: number | null;
          eda_cod: string | null;
          ido_den_id: number | null;
          juchu_flg: number | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          kizai_shozoku_id: number | null;
          kizai_shozoku_nam: string | null;
          kizai_shozoku_nam_short: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_juchu_qty: number | null;
          plan_low_qty: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          rfid_kics_qty: number | null;
          rfid_yard_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          shozoku_nam: string | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_ido_den2_lst: {
        Row: {
          bld_cod: string | null;
          ctn_flg: number | null;
          diff_qty: number | null;
          eda_cod: string | null;
          ido_den_id: number | null;
          juchu_flg: number | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          kizai_shozoku_id: number | null;
          kizai_shozoku_nam: string | null;
          kizai_shozoku_nam_short: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_juchu_qty: number | null;
          plan_low_qty: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          rfid_kics_qty: number | null;
          rfid_yard_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          shozoku_nam: string | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_ido_den2_union: {
        Row: {
          nchk_sagyo_sts_id: number | null;
          nchk_sagyo_sts_nam: string | null;
          nchk_sagyo_sts_nam_short: string | null;
          nyuko_fix_flg: number | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          schk_sagyo_sts_id: number | null;
          schk_sagyo_sts_nam: string | null;
          schk_sagyo_sts_nam_short: string | null;
          shozoku_nam: string | null;
          shuko_fix_flg: number | null;
        };
        Relationships: [];
      };
      v_ido_den2_union_lst: {
        Row: {
          bld_cod: string | null;
          ctn_flg: number | null;
          diff_qty: number | null;
          eda_cod: string | null;
          ido_den_id: number | null;
          juchu_flg: number | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          kizai_shozoku_id: number | null;
          kizai_shozoku_nam: string | null;
          kizai_shozoku_nam_short: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_juchu_qty: number | null;
          plan_low_qty: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          rfid_kics_qty: number | null;
          rfid_yard_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          shozoku_nam: string | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_ido_den3: {
        Row: {
          nchk_sagyo_sts_id: number | null;
          nchk_sagyo_sts_nam: string | null;
          nchk_sagyo_sts_nam_short: string | null;
          nyuko_fix_flg: number | null;
          nyushuko_dat: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          schk_sagyo_sts_id: number | null;
          schk_sagyo_sts_nam: string | null;
          schk_sagyo_sts_nam_short: string | null;
          shuko_fix_flg: number | null;
        };
        Relationships: [];
      };
      v_ido_den3_lst: {
        Row: {
          bld_cod: string | null;
          ctn_flg: number | null;
          diff_qty: number | null;
          eda_cod: string | null;
          ido_flg: number | null;
          juchu_flg: number | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          kizai_shozoku_id: number | null;
          kizai_shozoku_nam: string | null;
          kizai_shozoku_nam_short: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_juchu_qty: number | null;
          plan_low_qty: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          rfid_kics_qty: number | null;
          rfid_yard_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          shozoku_nam: string | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_ido_den3_result: {
        Row: {
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          def_dat_qty: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          ido_den_id: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          rfid_dat: string | null;
          rfid_del_flg: number | null;
          rfid_el_num: number | null;
          rfid_kizai_sts: number | null;
          rfid_mem: string | null;
          rfid_shozoku_id: number | null;
          rfid_shozoku_nam: string | null;
          rfid_sts_nam: string | null;
          rfid_sts_nam_short: string | null;
          rfid_tag_id: string | null;
          rfid_user: string | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          sagyo_siji_id: number | null;
          sagyo_siji_nam: string | null;
          sagyo_siji_nam_short: string | null;
          shozoku_nam: string | null;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_ido_fix_sts: {
        Row: {
          ido_den_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Insert: {
          ido_den_id?: number | null;
          sagyo_den_dat?: string | null;
          sagyo_id?: number | null;
          sagyo_kbn_id?: number | null;
          sagyo_sts_id?: never;
        };
        Update: {
          ido_den_id?: number | null;
          sagyo_den_dat?: string | null;
          sagyo_id?: number | null;
          sagyo_kbn_id?: number | null;
          sagyo_sts_id?: never;
        };
        Relationships: [];
      };
      v_ido_fix_total_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          ido_den_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_ido_fix_total_time_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          ido_den_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_ido_sts: {
        Row: {
          ido_den_id: number | null;
          kizai_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_ido_sts_juchu: {
        Row: {
          ido_den_id: number | null;
          kizai_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_ido_total_sts_juchu: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          ido_den_id: number | null;
          kizai_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_ido_total_time_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          ido_den_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_ido_total_time_sts_juchu: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          ido_den_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_juchu_ctn_meisai: {
        Row: {
          dsp_ord_num: number | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_meisai_id: number | null;
          kics_keep_qty: number | null;
          kics_plan_kizai_qty: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number | null;
          kizai_nam: string | null;
          mem: string | null;
          yard_keep_qty: number | null;
          yard_plan_kizai_qty: number | null;
        };
        Relationships: [];
      };
      v_juchu_kizai_dat_qty: {
        Row: {
          juchu_qty: number | null;
          kizai_id: number;
          plan_dat: string | null;
          plan_qty: number | null;
          yobi_qty: number | null;
        };
        Relationships: [];
      };
      v_juchu_kizai_dat_qty_kasi: {
        Row: {
          juchu_head_id: number | null;
          juchu_qty: number | null;
          kizai_id: number | null;
          plan_dat: string | null;
          plan_qty: number | null;
          yobi_qty: number | null;
        };
        Relationships: [];
      };
      v_juchu_kizai_den: {
        Row: {
          bld_cod: string | null;
          ctn_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          indent_num: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number | null;
          juchu_mem: string | null;
          juchu_sts: number | null;
          kics_nyuko_dat: string | null;
          kics_shuko_dat: string | null;
          kizai_id: number;
          kizai_nam: string | null;
          koen_nam: string;
          koenbasho_nam: string | null;
          kokyaku_id: number | null;
          kokyaku_nam: string | null;
          oya_juchu_kizai_head_id: number | null;
          plan_qty: number | null;
          tana_cod: string | null;
          yard_nyuko_dat: string | null;
          yard_shuko_dat: string | null;
        };
        Relationships: [];
      };
      v_juchu_kizai_head_lst: {
        Row: {
          dsp_ord_num: number | null;
          genebi: number | null;
          head_nam: string;
          honbanbi: number | null;
          ht_kbn: number | null;
          juchu_head_id: number;
          juchu_honbanbi_calc_qty: number | null;
          juchu_kizai_head_id: number;
          juchu_kizai_head_kbn: number;
          keikoku: string | null;
          kics_nyuko_dat: string | null;
          kics_shuko_dat: string | null;
          kics_shuko_fix_flg: number | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_id: number | null;
          kokyaku_nam: string | null;
          mem: string | null;
          nebiki_amt: number | null;
          nebiki_rat: number | null;
          nyuko_dat: string | null;
          oya_juchu_kizai_head_id: number | null;
          rihabi: number | null;
          sagyo_sts_nam: string | null;
          shokei: number | null;
          shuko_dat: string | null;
          sikomibi: number | null;
          yard_nyuko_dat: string | null;
          yard_shuko_dat: string | null;
          yard_shuko_fix_flg: number | null;
        };
        Relationships: [];
      };
      v_juchu_kizai_meisai: {
        Row: {
          dsp_ord_num: number | null;
          ido_den_id: number | null;
          indent_num: number | null;
          juchu_head_id: number;
          juchu_kizai_head_id: number;
          juchu_kizai_meisai_id: number;
          keep_qty: number | null;
          kizai_id: number;
          kizai_nam: string | null;
          kizai_qty: number | null;
          mem: string | null;
          mem2: string | null;
          oya_juchu_kizai_head_id: number | null;
          plan_kizai_qty: number | null;
          plan_qty: number | null;
          plan_yobi_qty: number | null;
          sagyo_den_dat: string | null;
          sagyo_siji_id: string | null;
          shozoku_id: number;
          shozoku_nam: string | null;
        };
        Relationships: [];
      };
      v_juchu_kizai_meisai_sum: {
        Row: {
          dsp_ord_num: number | null;
          ido_den_id: number | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          keep_qty: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number | null;
          kizai_nam: string | null;
          kizai_qty: number | null;
          mem: string | null;
          oya_juchu_kizai_head_id: number | null;
          plan_kizai_qty: number | null;
          plan_qty: number | null;
          plan_yobi_qty: number | null;
          sagyo_den_dat: string | null;
          sagyo_siji_id: string | null;
          shozoku_id: number | null;
          shozoku_nam: string | null;
        };
        Relationships: [];
      };
      v_juchu_kizai_qty: {
        Row: {
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_meisai_id: number | null;
          kizai_id: number | null;
          plan_kizai_qty: number | null;
          plan_qty: number | null;
          plan_yobi_qty: number | null;
        };
        Relationships: [];
      };
      v_juchu_lst: {
        Row: {
          juchu_dat: string | null;
          juchu_end_dat: string | null;
          juchu_head_id: number;
          juchu_str_dat: string | null;
          juchu_sts: number | null;
          juchu_sts_nam: string | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_id: number | null;
          kokyaku_nam: string | null;
          kokyaku_tanto_nam: string | null;
          mem: string | null;
          nebiki_amt: number | null;
          nebiki_rat: number | null;
          nyuko_dat: string | null;
          nyuryoku_user: string | null;
          nyushuko_sts: string | null;
          nyushuko_sts_nam: string | null;
          shuko_dat: string | null;
          zei_kbn: number | null;
          zei_nam: string | null;
        };
        Relationships: [];
      };
      v_juchu_sagyo_kbn: {
        Row: {
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          sagyo_kbn_id: number | null;
        };
        Relationships: [];
      };
      v_juchu_sharyo_head_lst: {
        Row: {
          head_nam: string | null;
          juchu_head_id: number | null;
          juchu_sharyo_head_id: number | null;
          mem: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          nyushuko_shubetu_nam: string | null;
          shozoku_nam: string | null;
        };
        Relationships: [];
      };
      v_juchu_sharyo_meisai: {
        Row: {
          daisu: number | null;
          head_nam: string | null;
          juchu_head_id: number | null;
          juchu_sharyo_head_id: number | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_id: number | null;
          kokyaku_nam: string | null;
          mem: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          nyushuko_shubetu_nam: string | null;
          sharyo_id: number | null;
          sharyo_nam: string | null;
          shozoku_nam: string | null;
          shozoku_nam_short: string | null;
        };
        Relationships: [];
      };
      v_kizai_lst: {
        Row: {
          bld_cod: string | null;
          bumon_id: number | null;
          bumon_nam: string | null;
          ctn_flg: number | null;
          dai_bumon_id: number | null;
          dai_bumon_nam: string | null;
          def_dat_qty: number | null;
          del_flg: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          kizai_del_qty: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number;
          kizai_nam: string | null;
          kizai_ng_qty: number | null;
          kizai_qty: number | null;
          mem: string | null;
          rank_amt_1: number | null;
          rank_amt_2: number | null;
          rank_amt_3: number | null;
          rank_amt_4: number | null;
          rank_amt_5: number | null;
          reg_amt: number | null;
          rfid_kics_qty: number | null;
          rfid_yard_qty: number | null;
          section_nam: string | null;
          section_num: number | null;
          shozoku_id: number | null;
          shozoku_nam: string | null;
          shozoku_nam_short: string | null;
          shukei_bumon_id: number | null;
          shukei_bumon_nam: string | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_kizai_qty: {
        Row: {
          del_flg: number | null;
          kizai_del_qty: number | null;
          kizai_id: number | null;
          kizai_nam: string | null;
          kizai_ng_qty: number | null;
          kizai_qty: number | null;
          rfid_kics_qty: number | null;
          rfid_yard_qty: number | null;
          shozoku_id: number | null;
          shozoku_nam: string | null;
          shozoku_nam_short: string | null;
        };
        Relationships: [];
      };
      v_mitu_kizai: {
        Row: {
          juchu_head_id: number | null;
          juchu_honbanbi_calc_qty: number | null;
          juchu_kizai_head_id: number | null;
          kizai_nam: string | null;
          kizai_tanka_amt: number | null;
          plan_kizai_qty: number | null;
        };
        Relationships: [];
      };
      v_mitu_kizai_issiki: {
        Row: {
          juchu_head_id: number | null;
          juchu_honbanbi_calc_qty: number | null;
          juchu_kizai_head_id: number | null;
          kizai_nam: string | null;
          kizai_tanka_amt: number | null;
          plan_kizai_qty: number | null;
        };
        Relationships: [];
      };
      v_mitu_kizai_meisai: {
        Row: {
          dsp_ord_num_meisai: number | null;
          indent_num: number | null;
          juchu_head_id: number | null;
          juchu_honbanbi_calc_qty: number | null;
          juchu_kizai_head_id: number | null;
          kizai_nam: string | null;
          kizai_tanka_amt: number | null;
          plan_kizai_qty: number | null;
        };
        Relationships: [];
      };
      v_mitu_kizai_meisai_issiki: {
        Row: {
          dsp_ord_num: number | null;
          indent_num: number | null;
          juchu_head_id: number | null;
          juchu_honbanbi_calc_qty: number | null;
          juchu_kizai_head_id: number | null;
          kizai_nam: string | null;
          kizai_tanka_amt: number | null;
          plan_kizai_qty: number | null;
        };
        Relationships: [];
      };
      v_mitu_lst: {
        Row: {
          juchu_head_id: number | null;
          koen_nam: string | null;
          kokyaku_nam: string | null;
          mitu_dat: string | null;
          mitu_head_id: number | null;
          mitu_head_nam: string | null;
          mitu_sts: number | null;
          nyuryoku_user: string | null;
          sts_nam: string | null;
        };
        Relationships: [];
      };
      v_nyushuko_den: {
        Row: {
          juchu_head_id: number | null;
          juchu_kizai_head_kbn: number | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_nam: string | null;
          nchk_sagyo_sts_id: number | null;
          nchk_sagyo_sts_nam: string | null;
          nchk_sagyo_sts_nam_short: string | null;
          nyuko_fix_flg: number | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          schk_sagyo_sts_id: number | null;
          schk_sagyo_sts_nam: string | null;
          schk_sagyo_sts_nam_short: string | null;
          shozoku_nam: string | null;
          shuko_fix_flg: number | null;
          sstb_sagyo_sts_id: number | null;
          sstb_sagyo_sts_nam: string | null;
          sstb_sagyo_sts_nam_short: string | null;
        };
        Relationships: [];
      };
      v_nyushuko_den_lst: {
        Row: {
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          def_dat_qty: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          dsp_ord_num_meisai: number | null;
          eda_cod: string | null;
          indent_num: number | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_head_kbn: number | null;
          juchu_kizai_meisai_id: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number | null;
          kizai_nam: string | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_nam: string | null;
          mem: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          oya_juchu_kizai_head_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          shozoku_nam: string | null;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_nyushuko_den2: {
        Row: {
          head_namv: string | null;
          juchu_head_id: number | null;
          juchu_kizai_head_idv: string | null;
          juchu_kizai_head_kbnv: string | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_nam: string | null;
          nchk_sagyo_sts_id: number | null;
          nchk_sagyo_sts_nam: string | null;
          nchk_sagyo_sts_nam_short: string | null;
          nyuko_fix_flg: number | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          schk_sagyo_sts_id: number | null;
          schk_sagyo_sts_nam: string | null;
          schk_sagyo_sts_nam_short: string | null;
          section_namv: string | null;
          shozoku_nam: string | null;
          shuko_fix_flg: number | null;
          sstb_sagyo_sts_id: number | null;
          sstb_sagyo_sts_nam: string | null;
          sstb_sagyo_sts_nam_short: string | null;
        };
        Relationships: [];
      };
      v_nyushuko_den2_lst: {
        Row: {
          bld_cod: string | null;
          ctn_flg: number | null;
          dsp_ord_num_meisai: number | null;
          eda_cod: string | null;
          head_namv: string | null;
          indent_num: number | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_head_idv: string | null;
          juchu_kizai_head_kbnv: string | null;
          juchu_kizai_meisai_id: number | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_nam: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          shozoku_nam: string | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_nyushuko_den2_lst_oyako: {
        Row: {
          bld_cod: string | null;
          ctn_flg: number | null;
          dsp_ord_num_meisai: number | null;
          eda_cod: string | null;
          head_namv: string | null;
          indent_num: number | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_head_idv: string | null;
          juchu_kizai_head_kbnv: string | null;
          juchu_kizai_meisai_id: number | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_nam: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          oya_juchu_kizai_head_id: number | null;
          oya_plan_qty: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          shozoku_nam: string | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_nyushuko_den2_result: {
        Row: {
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          def_dat_qty: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_meisai_id: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number | null;
          kizai_mem: string | null;
          kizai_nam: string | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_nam: string | null;
          nyushuko_basho_id: number | null;
          nyushuko_dat: string | null;
          nyushuko_shubetu_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          rfid_dat: string | null;
          rfid_del_flg: number | null;
          rfid_el_num: number | null;
          rfid_kizai_sts: number | null;
          rfid_mem: string | null;
          rfid_shozoku_id: number | null;
          rfid_shozoku_nam: string | null;
          rfid_sts_nam: string | null;
          rfid_sts_nam_short: string | null;
          rfid_tag_id: string | null;
          rfid_user: string | null;
          sagyo_kbn_id: number | null;
          sagyo_kbn_nam: string | null;
          sagyo_kbn_nam_short: string | null;
          shozoku_nam: string | null;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
        };
        Relationships: [];
      };
      v_nyushuko_fix_sts: {
        Row: {
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Insert: {
          juchu_head_id?: number | null;
          juchu_kizai_head_id?: number | null;
          sagyo_den_dat?: string | null;
          sagyo_id?: number | null;
          sagyo_kbn_id?: number | null;
          sagyo_sts_id?: never;
        };
        Update: {
          juchu_head_id?: number | null;
          juchu_kizai_head_id?: number | null;
          sagyo_den_dat?: string | null;
          sagyo_id?: number | null;
          sagyo_kbn_id?: number | null;
          sagyo_sts_id?: never;
        };
        Relationships: [];
      };
      v_nyushuko_fix_total_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_nyushuko_fix_total_time_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          juchu_head_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_nyushuko_sts: {
        Row: {
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_meisai_id: number | null;
          kizai_id: number | null;
          plan_qty: number | null;
          result_adj_qty: number | null;
          result_qty: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_nyushuko_total_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          juchu_kizai_meisai_id: number | null;
          kizai_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_nyushuko_total_time_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts2: number | null;
          juchu_head_id: number | null;
          sagyo_den_dat: string | null;
          sagyo_id: number | null;
          sagyo_kbn_id: number | null;
          sagyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_rfid: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          el_num: number | null;
          kizai_id: number | null;
          mem: string | null;
          rfid_kizai_sts: number | null;
          rfid_tag_id: string | null;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Relationships: [];
      };
      v_rfid_sagyo_sts: {
        Row: {
          rfid_kizai_sts: number | null;
          rfid_tag_id: string | null;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Relationships: [];
      };
      v_rfid_sts: {
        Row: {
          rfid_kizai_sts: number | null;
          rfid_tag_id: string | null;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Relationships: [];
      };
      v_seikyu_date_lst: {
        Row: {
          head_nam: string | null;
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          koen_nam: string | null;
          koenbasho_nam: string | null;
          kokyaku_id: number | null;
          kokyaku_nam: string | null;
          kokyaku_tanto_nam: string | null;
          nyuko_dat: string | null;
          nyuko_fix_flg: number | null;
          seikyu_dat: string | null;
          seikyu_jokyo_sts_id: number | null;
          seikyu_jokyo_sts_nam: string | null;
          seikyu_jokyo_total_sts_id: number | null;
          seikyu_jokyo_total_sts_nam: string | null;
          shuko_dat: string | null;
          shuko_fix_flg: number | null;
        };
        Relationships: [];
      };
      v_seikyu_jokyo_head_sts: {
        Row: {
          count_juchu_kizai_head_id: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts9: number | null;
          juchu_head_id: number | null;
          seikyu_jokyo_head_sts_id: number | null;
        };
        Relationships: [];
      };
      v_seikyu_jokyo_sts: {
        Row: {
          juchu_head_id: number | null;
          juchu_kizai_head_id: number | null;
          nyuko_dat: string | null;
          seikyu_dat: string | null;
          seikyu_jokyo_sts_id: number | null;
          shuko_dat: string | null;
        };
        Relationships: [];
      };
      v_seikyu_jokyo_total_sts: {
        Row: {
          count_all: number | null;
          count_sts0: number | null;
          count_sts1: number | null;
          count_sts9: number | null;
          juchu_head_id: number | null;
          seikyu_jokyo_sts_id: number | null;
        };
        Relationships: [];
      };
      v_seikyu_lst: {
        Row: {
          kokyaku_nam: string | null;
          kokyaku_tanto_nam: string | null;
          seikyu_dat: string | null;
          seikyu_head_id: number | null;
          seikyu_head_nam: string | null;
          seikyu_sts: number | null;
          sts_nam: string | null;
        };
        Relationships: [];
      };
      v_zaiko_qty: {
        Row: {
          juchu_qty: number | null;
          kizai_id: number | null;
          kizai_qty: number | null;
          plan_dat: string | null;
          plan_qty: number | null;
          yobi_qty: number | null;
          zaiko_qty: number | null;
        };
        Relationships: [];
      };
      v_zaiko_qty_kasi: {
        Row: {
          juchu_head_id: number | null;
          juchu_qty: number | null;
          kizai_id: number | null;
          kizai_qty: number | null;
          plan_dat: string | null;
          plan_qty: number | null;
          yobi_qty: number | null;
          zaiko_qty: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  dev5: {
    Tables: {
      m_bumon: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          bumon_id: number;
          bumon_nam: string;
          dai_bumon_id: number | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          shukei_bumon_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          bumon_id: number;
          bumon_nam: string;
          dai_bumon_id?: number | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          bumon_id?: number;
          bumon_nam?: string;
          dai_bumon_id?: number | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_dai_bumon: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          dai_bumon_id: number;
          dai_bumon_nam: string;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          dai_bumon_id: number;
          dai_bumon_nam: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          dai_bumon_id?: number;
          dai_bumon_nam?: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_kizai: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          bld_cod: string | null;
          bumon_id: number | null;
          ctn_flg: number | null;
          dai_bumon_id: number | null;
          def_dat_qty: number | null;
          del_flg: number | null;
          dsp_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string | null;
          el_num: number | null;
          kizai_grp_cod: string | null;
          kizai_id: number;
          kizai_nam: string;
          mem: string | null;
          rank_amt_1: number | null;
          rank_amt_2: number | null;
          rank_amt_3: number | null;
          rank_amt_4: number | null;
          rank_amt_5: number | null;
          reg_amt: number | null;
          section_num: number | null;
          shozoku_id: number;
          shukei_bumon_id: number | null;
          tana_cod: string | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string | null;
          bumon_id?: number | null;
          ctn_flg?: number | null;
          dai_bumon_id?: number | null;
          def_dat_qty?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string | null;
          el_num?: number | null;
          kizai_grp_cod?: string | null;
          kizai_id: number;
          kizai_nam: string;
          mem?: string | null;
          rank_amt_1?: number | null;
          rank_amt_2?: number | null;
          rank_amt_3?: number | null;
          rank_amt_4?: number | null;
          rank_amt_5?: number | null;
          reg_amt?: number | null;
          section_num?: number | null;
          shozoku_id: number;
          shukei_bumon_id?: number | null;
          tana_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string | null;
          bumon_id?: number | null;
          ctn_flg?: number | null;
          dai_bumon_id?: number | null;
          def_dat_qty?: number | null;
          del_flg?: number | null;
          dsp_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string | null;
          el_num?: number | null;
          kizai_grp_cod?: string | null;
          kizai_id?: number;
          kizai_nam?: string;
          mem?: string | null;
          rank_amt_1?: number | null;
          rank_amt_2?: number | null;
          rank_amt_3?: number | null;
          rank_amt_4?: number | null;
          rank_amt_5?: number | null;
          reg_amt?: number | null;
          section_num?: number | null;
          shozoku_id?: number;
          shukei_bumon_id?: number | null;
          tana_cod?: string | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_rfid: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          el_num?: number | null;
          del_flg: number | null;
          kizai_id: number;
          mem: string | null;
          rfid_kizai_sts: number | null;
          rfid_tag_id: string;
          shozoku_id: number | null;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          el_num?: number | null;
          del_flg?: number | null;
          kizai_id: number;
          mem?: string | null;
          rfid_kizai_sts?: number | null;
          rfid_tag_id: string;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          el_num?: number | null;
          del_flg?: number | null;
          kizai_id?: number;
          mem?: string | null;
          rfid_kizai_sts?: number | null;
          rfid_tag_id?: string;
          shozoku_id?: number | null;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_shukei_bumon: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          del_flg: number | null;
          dsp_ord_num: number | null;
          mem: string | null;
          shukei_bumon_id: number;
          shukei_bumon_nam: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id: number;
          shukei_bumon_nam: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          mem?: string | null;
          shukei_bumon_id?: number;
          shukei_bumon_nam?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
      m_tanaban: {
        Row: {
          add_dat: string | null;
          add_user: string | null;
          bld_cod: string;
          del_flg: number | null;
          dsp_ord_num: number | null;
          eda_cod: string;
          mem: string | null;
          tana_cod: string;
          upd_dat: string | null;
          upd_user: string | null;
        };
        Insert: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod: string;
          mem?: string | null;
          tana_cod: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Update: {
          add_dat?: string | null;
          add_user?: string | null;
          bld_cod?: string;
          del_flg?: number | null;
          dsp_ord_num?: number | null;
          eda_cod?: string;
          mem?: string | null;
          tana_cod?: string;
          upd_dat?: string | null;
          upd_user?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  dev6: {
    Enums: {},
  },
} as const;
