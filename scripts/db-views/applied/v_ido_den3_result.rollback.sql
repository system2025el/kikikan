-- v_ido_den3_result のロールバック。適用直前の本番／ステージングの定義そのもの。
--
-- ★ CREATE OR REPLACE では戻せない（2026-10-07 実機で確認）
--   列を末尾に4本足した変更なので一見 CREATE OR REPLACE で戻せそうだが、
--   PostgreSQL は既存ビューから列を減らす REPLACE を許さず
--   「cannot drop columns from view」で失敗する。DROP → CREATE にする必要がある。
--   DROP すると権限が落ちるので、末尾で GRANT を付け直している。
--
-- ★ 子ビューは無い（pg_depend で確認済み）。読んでいるのは Web とゲートのアプリだけ。

\set ON_ERROR_STOP on

BEGIN;

DROP VIEW IF EXISTS public.v_ido_den3_result;

CREATE VIEW public.v_ido_den3_result WITH (security_invoker = on) AS
 SELECT DISTINCT t_ido_result.rfid_tag_id,
    v_rfid.shozoku_id AS rfid_shozoku_id,
    m_shozoku.shozoku_nam AS rfid_shozoku_nam,
    v_rfid.mem AS rfid_mem,
    t_ido_result.rfid_kizai_sts,
    m_sagyo_sts.sts_nam AS rfid_sts_nam,
    m_sagyo_sts.sts_nam_short AS rfid_sts_nam_short,
    v_rfid.del_flg AS rfid_del_flg,
    v_rfid.el_num AS rfid_el_num,
    t_ido_result.upd_dat AS rfid_dat,
    t_ido_result.upd_user::character varying AS rfid_user,
    t_ido_result.ido_den_id,
    t_ido_result.sagyo_siji_id,
        CASE
            WHEN t_ido_result.sagyo_siji_id = 1 THEN 'KICS→YARD'::text
            WHEN t_ido_result.sagyo_siji_id = 2 THEN 'YARD→KICS'::text
            ELSE ''::text
        END AS sagyo_siji_nam,
        CASE
            WHEN t_ido_result.sagyo_siji_id = 1 THEN 'K→Y'::text
            WHEN t_ido_result.sagyo_siji_id = 2 THEN 'Y→K'::text
            ELSE ''::text
        END AS sagyo_siji_nam_short,
    t_ido_result.kizai_id,
    v_ido_den_lst.kizai_nam,
    v_ido_den_lst.bld_cod,
    v_ido_den_lst.tana_cod,
    v_ido_den_lst.eda_cod,
    v_ido_den_lst.ctn_flg,
    v_ido_den_lst.kizai_grp_cod,
    v_ido_den_lst.dsp_ord_num,
    v_ido_den_lst.mem AS kizai_mem,
    v_ido_den_lst.bumon_id,
    v_ido_den_lst.shukei_bumon_id,
    v_ido_den_lst.def_dat_qty,
    t_ido_result.sagyo_id AS nyushuko_basho_id,
    v_ido_den_lst.shozoku_nam,
    t_ido_result.sagyo_den_dat AS nyushuko_dat,
    v_ido_den_lst.nyushuko_shubetu_id,
    t_ido_result.sagyo_kbn_id,
    v_ido_den_lst.sagyo_kbn_nam,
    v_ido_den_lst.sagyo_kbn_nam_short,
    v_ido_den_lst.plan_qty,
    v_ido_den_lst.result_qty,
    v_ido_den_lst.result_adj_qty
   FROM t_ido_result
     LEFT JOIN v_ido_den_lst ON v_ido_den_lst.sagyo_kbn_id = t_ido_result.sagyo_kbn_id AND v_ido_den_lst.nyushuko_dat = t_ido_result.sagyo_den_dat AND v_ido_den_lst.nyushuko_basho_id = t_ido_result.sagyo_id AND v_ido_den_lst.kizai_id = t_ido_result.kizai_id
     LEFT JOIN v_rfid ON t_ido_result.rfid_tag_id::text = v_rfid.rfid_tag_id::text AND t_ido_result.kizai_id = v_rfid.kizai_id AND v_ido_den_lst.kizai_id = v_rfid.kizai_id
     LEFT JOIN m_sagyo_sts ON t_ido_result.rfid_kizai_sts = m_sagyo_sts.sts_id
     LEFT JOIN m_shozoku ON v_rfid.shozoku_id = m_shozoku.shozoku_id
UNION ALL
 SELECT DISTINCT t_ido_ctn_result.rfid_tag_id,
    v_rfid.shozoku_id AS rfid_shozoku_id,
    m_shozoku.shozoku_nam AS rfid_shozoku_nam,
    v_rfid.mem AS rfid_mem,
    t_ido_ctn_result.rfid_kizai_sts,
    m_sagyo_sts.sts_nam AS rfid_sts_nam,
    m_sagyo_sts.sts_nam_short AS rfid_sts_nam_short,
    v_rfid.del_flg AS rfid_del_flg,
    v_rfid.el_num AS rfid_el_num,
    t_ido_ctn_result.upd_dat AS rfid_dat,
    t_ido_ctn_result.upd_user::character varying AS rfid_user,
    t_ido_ctn_result.ido_den_id,
    t_ido_ctn_result.sagyo_siji_id,
        CASE
            WHEN t_ido_ctn_result.sagyo_siji_id = 1 THEN 'KICS→YARD'::text
            WHEN t_ido_ctn_result.sagyo_siji_id = 2 THEN 'YARD→KICS'::text
            ELSE ''::text
        END AS sagyo_siji_nam,
        CASE
            WHEN t_ido_ctn_result.sagyo_siji_id = 1 THEN 'K→Y'::text
            WHEN t_ido_ctn_result.sagyo_siji_id = 2 THEN 'Y→K'::text
            ELSE ''::text
        END AS sagyo_siji_nam_short,
    t_ido_ctn_result.kizai_id,
    v_ido_den_lst.kizai_nam,
    v_ido_den_lst.bld_cod,
    v_ido_den_lst.tana_cod,
    v_ido_den_lst.eda_cod,
    v_ido_den_lst.ctn_flg,
    v_ido_den_lst.kizai_grp_cod,
    v_ido_den_lst.dsp_ord_num,
    v_ido_den_lst.mem AS kizai_mem,
    v_ido_den_lst.bumon_id,
    v_ido_den_lst.shukei_bumon_id,
    v_ido_den_lst.def_dat_qty,
    t_ido_ctn_result.sagyo_id AS nyushuko_basho_id,
    v_ido_den_lst.shozoku_nam,
    t_ido_ctn_result.sagyo_den_dat AS nyushuko_dat,
    v_ido_den_lst.nyushuko_shubetu_id,
    t_ido_ctn_result.sagyo_kbn_id,
    v_ido_den_lst.sagyo_kbn_nam,
    v_ido_den_lst.sagyo_kbn_nam_short,
    v_ido_den_lst.plan_qty,
    v_ido_den_lst.result_qty,
    v_ido_den_lst.result_adj_qty
   FROM t_ido_ctn_result
     LEFT JOIN v_ido_den_lst ON v_ido_den_lst.sagyo_kbn_id = t_ido_ctn_result.sagyo_kbn_id AND v_ido_den_lst.nyushuko_dat = t_ido_ctn_result.sagyo_den_dat AND v_ido_den_lst.nyushuko_basho_id = t_ido_ctn_result.sagyo_id AND v_ido_den_lst.kizai_id = t_ido_ctn_result.kizai_id
     LEFT JOIN v_rfid ON t_ido_ctn_result.rfid_tag_id::text = v_rfid.rfid_tag_id::text AND t_ido_ctn_result.kizai_id = v_rfid.kizai_id AND v_ido_den_lst.kizai_id = v_rfid.kizai_id
     LEFT JOIN m_sagyo_sts ON t_ido_ctn_result.rfid_kizai_sts = m_sagyo_sts.sts_id
     LEFT JOIN m_shozoku ON v_rfid.shozoku_id = m_shozoku.shozoku_id
  ORDER BY 9, 1;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_result TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_result TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.v_ido_den3_result TO anon;

COMMIT;
