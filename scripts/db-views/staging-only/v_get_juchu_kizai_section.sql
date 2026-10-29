-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_get_juchu_kizai_section  入出庫種別（nyushuko_shubetu_id）の CASE に 80/90 → 3（事前）を追加（列構成は不変）
--
-- リポジトリに定義が無かったビュー。2026-10-21 にステージングの pg_get_viewdef から起こした。
-- セクション名（section_namv）は、受注・作業日時・場所・作業区分ごとにまとめる。事前の行は機材ヘッダーで分けていないので、
-- 同じ準備日時・場所に事前準備のヘッダーが2つあると、セクション名は2つのヘッダーの分をまとめたものになる（表示だけの差。行は増えない）。
-- 依存しているビュー: v_nyushuko_den2, v_nyushuko_den2_head（列構成を変えないので作り直し不要）
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で全列・行数（3,586）とも差分0
-- =====================================================================

CREATE OR REPLACE VIEW public.v_get_juchu_kizai_section WITH (security_invoker = on) AS
 SELECT DISTINCT t_nyushuko_den.juchu_head_id,
    t_nyushuko_den.sagyo_den_dat,
    t_nyushuko_den.sagyo_id,
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END AS nyushuko_shubetu_id,
    array_to_string(array_agg(DISTINCT
        CASE
            WHEN m_section.section_nam_short IS NOT NULL THEN m_section.section_nam_short::text
            ELSE m_kizai.section_num::text
        END), ' '::text) AS section_namv,
    t_juchu_kizai_head.juchu_kizai_head_kbn
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kizai ON m_kizai.kizai_id = t_nyushuko_den.kizai_id
     LEFT JOIN m_section ON m_section.section_id = COALESCE(m_kizai.section_num, 0) AND m_section.del_flg = 0
  WHERE t_nyushuko_den.juchu_kizai_meisai_id <> 0 AND t_nyushuko_den.kizai_id <> 0
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, t_nyushuko_den.sagyo_kbn_id, t_juchu_kizai_head.juchu_kizai_head_kbn
  ORDER BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END);
