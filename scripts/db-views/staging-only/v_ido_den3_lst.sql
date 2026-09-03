-- 適用状況: ステージング 2026-09-01 / 本番 未適用
--
-- 変更内容
--   末尾に `juchu_meisai`（jsonb）の1列を追加（31→32列）。既存30列の値は不変。
--   1行（= 作業区分・作業指示・日付・場所・機材IDの5キー）に紐づく受注明細を
--   [{juchu_head_id, juchu_kizai_head_id, koen_nam, head_nam, plan_qty}, ...] の
--   JSON配列で返す。並びは plan_qty の降順（同数なら公演名→明細名→ID順）。
--   紐づく受注が無い行（juchu_flg = 0）は `[]`（空配列）。
--
--   あわせて juchu_flg の算出方法を変更。
--   旧: v_ido_den_juchu_lst への相関 EXISTS（SELECT句とORDER BY句で計2回評価）
--   新: 上記 juchu_meisai を作る集約サブクエリを LEFT JOIN し、ヒットの有無で判定
--   どちらも「t_ido_den_juchu に t_juchu_head.del_flg = 0 で紐づく行が存在するか」で
--   同値。相関サブクエリ2回がハッシュ結合1回に置き換わるので実行計画上も有利。
--
-- 注意点
--   ★ juchu_kizai_head_id は単独ではユニークではない。
--     t_juchu_kizai_head の主キーは (juchu_head_id, juchu_kizai_head_id) の複合キーで、
--     juchu_kizai_head_id は受注内の連番でしかない（本番実データで 2,332行 / distinct 28）。
--     JOIN は必ず2キー両方で行うこと。片方だけだと巨大なカーテシアン積になる。
--
--   ・LEFT JOIN する側は5キーで GROUP BY 済みなので1キー1行。行数は増えない。
--   ・t_juchu_head は del_flg = 0 の INNER JOIN。既存の v_ido_den_juchu_lst と同条件で、
--     これが juchu_flg の同値性を担保している。
--   ・plan_qty の合計は既存列 plan_juchu_qty と一致する（同じ t_ido_den_juchu.plan_qty を
--     5キー単位で合計したものが plan_juchu_qty のため）。画面では内訳として使う。
--
-- 検証（ステージング・本番データとも）
--   既存31列で EXCEPT ALL 双方向の差分0・行数不変を確認済み。
--
-- 関連: app/_lib/db/tables/v-ido-den3-lst.ts / ido-list の移動明細画面

CREATE OR REPLACE VIEW public.v_ido_den3_lst WITH (security_invoker = on) AS
SELECT base.ido_den_id,
    base.ido_flg,
        CASE
            WHEN jm.kizai_id IS NULL THEN 0
            ELSE 1
        END AS juchu_flg,
    base.nyushuko_shubetu_id,
    base.sagyo_kbn_id,
    base.sagyo_kbn_nam,
    base.sagyo_kbn_nam_short,
    base.sagyo_siji_id,
    base.sagyo_siji_nam,
    base.sagyo_siji_nam_short,
    base.nyushuko_dat,
    base.nyushuko_basho_id,
    base.shozoku_nam,
    base.kizai_id,
    base.kizai_nam,
    base.bld_cod,
    base.tana_cod,
    base.eda_cod,
    base.ctn_flg,
    base.kizai_mem,
    base.kizai_shozoku_id,
    base.kizai_shozoku_nam,
    base.kizai_shozoku_nam_short,
    base.rfid_yard_qty,
    base.rfid_kics_qty,
    base.plan_juchu_qty,
    base.plan_low_qty,
    base.plan_qty,
    base.result_qty,
    base.result_adj_qty,
    base.diff_qty,
    COALESCE(jm.juchu_meisai, '[]'::jsonb) AS juchu_meisai
   FROM ( SELECT v_ido_den2_union_lst.ido_den_id,
            v_ido_den2_union_lst.ido_flg,
            v_ido_den2_union_lst.nyushuko_shubetu_id,
            v_ido_den2_union_lst.sagyo_kbn_id,
            v_ido_den2_union_lst.sagyo_kbn_nam,
            v_ido_den2_union_lst.sagyo_kbn_nam_short,
            v_ido_den2_union_lst.sagyo_siji_id,
            v_ido_den2_union_lst.sagyo_siji_nam,
            v_ido_den2_union_lst.sagyo_siji_nam_short,
            v_ido_den2_union_lst.nyushuko_dat,
            v_ido_den2_union_lst.nyushuko_basho_id,
            v_ido_den2_union_lst.shozoku_nam,
            v_ido_den2_union_lst.kizai_id,
            v_ido_den2_union_lst.kizai_nam,
            v_ido_den2_union_lst.bld_cod,
            v_ido_den2_union_lst.tana_cod,
            v_ido_den2_union_lst.eda_cod,
            v_ido_den2_union_lst.ctn_flg,
            v_ido_den2_union_lst.kizai_mem,
            v_ido_den2_union_lst.kizai_shozoku_id,
            v_ido_den2_union_lst.kizai_shozoku_nam,
            v_ido_den2_union_lst.kizai_shozoku_nam_short,
            v_ido_den2_union_lst.rfid_yard_qty,
            v_ido_den2_union_lst.rfid_kics_qty,
            v_ido_den2_union_lst.plan_juchu_qty,
            v_ido_den2_union_lst.plan_low_qty,
            sum(v_ido_den2_union_lst.plan_qty) AS plan_qty,
            sum(v_ido_den2_union_lst.result_qty) AS result_qty,
            sum(v_ido_den2_union_lst.result_adj_qty) AS result_adj_qty,
            sum(v_ido_den2_union_lst.diff_qty) AS diff_qty
           FROM v_ido_den2_union_lst
          WHERE NOT (v_ido_den2_union_lst.sagyo_kbn_id = 50 AND v_ido_den2_union_lst.plan_qty = 0::numeric)
          GROUP BY v_ido_den2_union_lst.ido_den_id, v_ido_den2_union_lst.ido_flg, v_ido_den2_union_lst.nyushuko_shubetu_id, v_ido_den2_union_lst.sagyo_kbn_id, v_ido_den2_union_lst.sagyo_kbn_nam, v_ido_den2_union_lst.sagyo_kbn_nam_short, v_ido_den2_union_lst.sagyo_siji_id, v_ido_den2_union_lst.sagyo_siji_nam, v_ido_den2_union_lst.sagyo_siji_nam_short, v_ido_den2_union_lst.nyushuko_dat, v_ido_den2_union_lst.nyushuko_basho_id, v_ido_den2_union_lst.shozoku_nam, v_ido_den2_union_lst.kizai_id, v_ido_den2_union_lst.kizai_nam, v_ido_den2_union_lst.bld_cod, v_ido_den2_union_lst.tana_cod, v_ido_den2_union_lst.eda_cod, v_ido_den2_union_lst.ctn_flg, v_ido_den2_union_lst.kizai_mem, v_ido_den2_union_lst.kizai_shozoku_id, v_ido_den2_union_lst.kizai_shozoku_nam, v_ido_den2_union_lst.kizai_shozoku_nam_short, v_ido_den2_union_lst.rfid_yard_qty, v_ido_den2_union_lst.rfid_kics_qty, v_ido_den2_union_lst.plan_juchu_qty, v_ido_den2_union_lst.plan_low_qty) base
     LEFT JOIN ( SELECT idj.sagyo_kbn_id,
            idj.sagyo_siji_id,
            idj.sagyo_den_dat AS nyushuko_dat,
            idj.sagyo_id AS nyushuko_basho_id,
            idj.kizai_id,
            jsonb_agg(jsonb_build_object('juchu_head_id', idj.juchu_head_id, 'juchu_kizai_head_id', idj.juchu_kizai_head_id, 'koen_nam', jh.koen_nam, 'head_nam', jkh.head_nam, 'plan_qty', COALESCE(idj.plan_qty, 0)) ORDER BY (COALESCE(idj.plan_qty, 0)) DESC, jh.koen_nam, jkh.head_nam, idj.juchu_head_id, idj.juchu_kizai_head_id) AS juchu_meisai
           FROM t_ido_den_juchu idj
             JOIN t_juchu_head jh ON jh.juchu_head_id = idj.juchu_head_id AND jh.del_flg = 0
             LEFT JOIN t_juchu_kizai_head jkh ON jkh.juchu_head_id = idj.juchu_head_id AND jkh.juchu_kizai_head_id = idj.juchu_kizai_head_id
          GROUP BY idj.sagyo_kbn_id, idj.sagyo_siji_id, idj.sagyo_den_dat, idj.sagyo_id, idj.kizai_id) jm
       ON jm.sagyo_kbn_id = base.sagyo_kbn_id AND jm.sagyo_siji_id = base.sagyo_siji_id AND jm.nyushuko_dat = base.nyushuko_dat AND jm.nyushuko_basho_id = base.nyushuko_basho_id AND jm.kizai_id = base.kizai_id
  ORDER BY base.nyushuko_dat, base.sagyo_kbn_id, (
        CASE
            WHEN jm.kizai_id IS NULL THEN 0
            ELSE 1
        END) DESC;
