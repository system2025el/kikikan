-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_juchu_kizai_dat_qty  事前準備の引き当て（準備日〜出庫日の前日に準備数）を加える（列構成・型は不変）
--
-- 変更内容: 機材明細の部分（UNION ALL の1つ目）を、明細×使用日に「事前準備×準備日〜出庫日の前日」を UNION ALL したものから集計する形にした。
--   ・事前準備の行: t_juchu_kizai_jizen × 明細（出庫場所 shozoku_id）× t_juchu_kizai_nyushuko（出庫・その場所）。
--     日付は準備日時・出庫日時を JST の日付にして、準備日〜出庫日の前日を1日1行にする。準備数は juchu_qty（予備 0）に入れる。
--   ・その受注機材ヘッダーに使用日（t_juchu_kizai_honbanbi）がある日は除く（その日は明細の合計数で引き当て済み。準備数 ≤ 合計数）。
--   ・受注の del_flg = 0 だけ。出庫日時が未設定なら行は出ない（Web で出庫日時が無い明細には準備日時を入れられない）。
--   ・同じ機材・日付の行は1行に集計する（v_zaiko_qty はこのビューを集計せずに使うので、別の UNION ALL の行にすると2行になる）。
--
-- 依存しているビュー: v_zaiko_qty（列構成を変えないので作り直し不要）
-- reloptions: なし（ステージングで確認。このビューだけ security_invoker を付けていない）
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前準備が無い状態で全列・行数（334,527）とも差分0。
--   テストの受注で、準備日〜出庫日の前日だけ在庫が準備数ぶん減り、出庫日以降は変わらないこと、v_zaiko_qty に同じ機材・日付の行が2行出ないことを確認。
--   在庫表相当（v_zaiko_qty、200機材×40日）: 約 0.29秒で変わらず。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_juchu_kizai_dat_qty AS
 SELECT src.plan_dat,
    src.kizai_id,
    sum(COALESCE(src.plan_kizai_qty, 0)) AS juchu_qty,
    sum(COALESCE(src.plan_yobi_qty, 0)) AS yobi_qty,
    sum(COALESCE(src.plan_kizai_qty, 0)) + sum(COALESCE(src.plan_yobi_qty, 0)) AS plan_qty,
    sum(
        CASE
            WHEN src.shozoku_id = 1 THEN COALESCE(src.plan_kizai_qty, 0)
            ELSE 0
        END) AS kics_juchu_qty,
    sum(
        CASE
            WHEN src.shozoku_id = 1 THEN COALESCE(src.plan_yobi_qty, 0)
            ELSE 0
        END) AS kics_yobi_qty,
    sum(
        CASE
            WHEN src.shozoku_id = 1 THEN COALESCE(src.plan_kizai_qty, 0) + COALESCE(src.plan_yobi_qty, 0)
            ELSE 0
        END) AS kics_plan_qty,
    sum(
        CASE
            WHEN src.shozoku_id = 2 THEN COALESCE(src.plan_kizai_qty, 0)
            ELSE 0
        END) AS yard_juchu_qty,
    sum(
        CASE
            WHEN src.shozoku_id = 2 THEN COALESCE(src.plan_yobi_qty, 0)
            ELSE 0
        END) AS yard_yobi_qty,
    sum(
        CASE
            WHEN src.shozoku_id = 2 THEN COALESCE(src.plan_kizai_qty, 0) + COALESCE(src.plan_yobi_qty, 0)
            ELSE 0
        END) AS yard_plan_qty
   FROM ( SELECT t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
            t_juchu_kizai_meisai.kizai_id,
            t_juchu_kizai_meisai.plan_kizai_qty,
            t_juchu_kizai_meisai.plan_yobi_qty,
            t_juchu_kizai_meisai.shozoku_id
           FROM t_juchu_head
             LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
             LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id
             LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_honbanbi_1.juchu_head_id,
                    t_juchu_kizai_honbanbi_1.juchu_kizai_head_id,
                    t_juchu_kizai_honbanbi_1.juchu_honbanbi_dat
                   FROM t_juchu_kizai_honbanbi t_juchu_kizai_honbanbi_1) t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
          WHERE t_juchu_head.del_flg = 0
        UNION ALL
         SELECT jizen_dat.plan_dat,
            t_juchu_kizai_jizen.kizai_id,
            t_juchu_kizai_jizen.jizen_qty AS plan_kizai_qty,
            0 AS plan_yobi_qty,
            t_juchu_kizai_meisai.shozoku_id
           FROM t_juchu_kizai_jizen
             JOIN t_juchu_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND t_juchu_head.del_flg = 0
             JOIN t_juchu_kizai_meisai ON t_juchu_kizai_meisai.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND t_juchu_kizai_meisai.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND t_juchu_kizai_meisai.juchu_kizai_meisai_id = t_juchu_kizai_jizen.juchu_kizai_meisai_id AND t_juchu_kizai_meisai.kizai_id = t_juchu_kizai_jizen.kizai_id
             JOIN t_juchu_kizai_nyushuko shuko ON shuko.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND shuko.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND shuko.nyushuko_shubetu_id = 1 AND shuko.nyushuko_basho_id = t_juchu_kizai_meisai.shozoku_id
             CROSS JOIN LATERAL ( SELECT g.g::date AS plan_dat
                   FROM generate_series((t_juchu_kizai_jizen.jizen_dat AT TIME ZONE 'Asia/Tokyo'::text)::date::timestamp without time zone, ((shuko.nyushuko_dat AT TIME ZONE 'Asia/Tokyo'::text)::date - 1)::timestamp without time zone, '1 day'::interval) g(g)) jizen_dat
          WHERE NOT (EXISTS ( SELECT 1
                   FROM t_juchu_kizai_honbanbi h
                  WHERE h.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND h.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND h.juchu_honbanbi_dat = jizen_dat.plan_dat))) src
  GROUP BY src.kizai_id, src.plan_dat
UNION ALL
 SELECT t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
    t_juchu_ctn_meisai.kizai_id,
    sum(COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)) AS juchu_qty,
    0 AS yobi_qty,
    sum(COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)) AS plan_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 1 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS kics_juchu_qty,
    0 AS kics_yobi_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 1 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS kics_plan_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 2 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS yard_juchu_qty,
    0 AS yard_yobi_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 2 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS yard_plan_qty
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id
     LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_honbanbi_1.juchu_head_id,
            t_juchu_kizai_honbanbi_1.juchu_kizai_head_id,
            t_juchu_kizai_honbanbi_1.juchu_honbanbi_dat
           FROM t_juchu_kizai_honbanbi t_juchu_kizai_honbanbi_1) t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_juchu_head.del_flg = 0 AND t_juchu_ctn_meisai.kizai_id IS NOT NULL
  GROUP BY t_juchu_ctn_meisai.kizai_id, t_juchu_kizai_honbanbi.juchu_honbanbi_dat
  ORDER BY 2, 1;
