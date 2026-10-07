-- 適用状況: ステージング 2026-09-24 / 本番 2026-10-07
--
-- タグ一覧に「そのタグがどの公演・どの明細のものか」を追加する。
--
-- 変更内容
--   末尾に juchu_head_id / juchu_kizai_head_id / koen_nam / head_nam の4列を追加（41列 → 45列）。
--   既存41列の値は不変。粒度も変えない（1行 = 1タグ）。
--   受注に紐づかないタグ（手動追加の機材、予定外に読まれたタグ）は 0 / 0 / NULL / NULL。
--
--   列を末尾に足すだけなので CREATE OR REPLACE で置き換えられる（DROP 不要 = 権限も維持される）。
--
-- なぜタグ単位で持つ必要があるか
--   「同じ機材が複数の公演にあるとき、読んだデータがどの公演のものか分かるようにしたい」
--   という要件はタグ単位の帰属。伝票の読取数（カウント）だけでは
--   「17本ぶんが A公演」までしか言えず「どの17本か」が出せない。
--
-- 読んでいるのは Web（移動機材詳細画面）とゲート（Models/IdoDen3Result.cs）。
-- ゲートは列を明示的にマッピングしているので、末尾に足す分には影響しない。
--
-- ★ juchu_kizai_head_id は受注内の連番で単独ではユニークではない。
--   t_juchu_kizai_head への JOIN は必ず juchu_head_id とのペアで行うこと。
--
-- 関連: app/_lib/db/tables/v-ido-den3-result.ts
--       scripts/db-migration/ddl/20260924-ido-juchu-meisai.sql

CREATE OR REPLACE VIEW public.v_ido_den3_result WITH (security_invoker = on) AS
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
    v_ido_den_lst.result_adj_qty,
    t_ido_result.juchu_head_id,
    t_ido_result.juchu_kizai_head_id,
    jh.koen_nam,
    jkh.head_nam
   FROM t_ido_result
     LEFT JOIN v_ido_den_lst ON v_ido_den_lst.sagyo_kbn_id = t_ido_result.sagyo_kbn_id AND v_ido_den_lst.nyushuko_dat = t_ido_result.sagyo_den_dat AND v_ido_den_lst.nyushuko_basho_id = t_ido_result.sagyo_id AND v_ido_den_lst.kizai_id = t_ido_result.kizai_id
     LEFT JOIN v_rfid ON t_ido_result.rfid_tag_id::text = v_rfid.rfid_tag_id::text AND t_ido_result.kizai_id = v_rfid.kizai_id AND v_ido_den_lst.kizai_id = v_rfid.kizai_id
     LEFT JOIN m_sagyo_sts ON t_ido_result.rfid_kizai_sts = m_sagyo_sts.sts_id
     LEFT JOIN m_shozoku ON v_rfid.shozoku_id = m_shozoku.shozoku_id
     LEFT JOIN t_juchu_head jh ON jh.juchu_head_id = t_ido_result.juchu_head_id AND jh.del_flg = 0
     LEFT JOIN t_juchu_kizai_head jkh ON jkh.juchu_head_id = t_ido_result.juchu_head_id AND jkh.juchu_kizai_head_id = t_ido_result.juchu_kizai_head_id
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
    v_ido_den_lst.result_adj_qty,
    t_ido_ctn_result.juchu_head_id,
    t_ido_ctn_result.juchu_kizai_head_id,
    jh.koen_nam,
    jkh.head_nam
   FROM t_ido_ctn_result
     LEFT JOIN v_ido_den_lst ON v_ido_den_lst.sagyo_kbn_id = t_ido_ctn_result.sagyo_kbn_id AND v_ido_den_lst.nyushuko_dat = t_ido_ctn_result.sagyo_den_dat AND v_ido_den_lst.nyushuko_basho_id = t_ido_ctn_result.sagyo_id AND v_ido_den_lst.kizai_id = t_ido_ctn_result.kizai_id
     LEFT JOIN v_rfid ON t_ido_ctn_result.rfid_tag_id::text = v_rfid.rfid_tag_id::text AND t_ido_ctn_result.kizai_id = v_rfid.kizai_id AND v_ido_den_lst.kizai_id = v_rfid.kizai_id
     LEFT JOIN m_sagyo_sts ON t_ido_ctn_result.rfid_kizai_sts = m_sagyo_sts.sts_id
     LEFT JOIN m_shozoku ON v_rfid.shozoku_id = m_shozoku.shozoku_id
     LEFT JOIN t_juchu_head jh ON jh.juchu_head_id = t_ido_ctn_result.juchu_head_id AND jh.del_flg = 0
     LEFT JOIN t_juchu_kizai_head jkh ON jkh.juchu_head_id = t_ido_ctn_result.juchu_head_id AND jkh.juchu_kizai_head_id = t_ido_ctn_result.juchu_kizai_head_id
  ORDER BY 9, 1;
