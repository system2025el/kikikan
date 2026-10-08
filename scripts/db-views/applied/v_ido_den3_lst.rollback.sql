-- v_ido_den3_lst のロールバック。
-- 明細単位にする前の定義（= scripts/db-views/applied/v_ido_den3_lst.sql と同じ内容。
-- 本番適用済みの juchu_meisai 版）に戻す。
-- 列構成が変わる変更なので DROP → CREATE。権限が落ちるので末尾で付け直す。

DROP VIEW IF EXISTS public.v_ido_den3_lst;

CREATE VIEW public.v_ido_den3_lst WITH (security_invoker = on) AS
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

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_lst TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_lst TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.v_ido_den3_lst TO anon;
