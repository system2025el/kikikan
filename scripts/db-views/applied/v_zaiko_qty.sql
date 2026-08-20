-- 適用状況: ステージング 日付不明（2026-08-19以前） / 本番 2026-08-19
-- =====================================================================
-- v_zaiko_qty 列追加版
--
-- 変更内容: 既存7列の末尾に8列を追加。v_juchu_kizai_dat_qty の所属別数量6列をそのまま通し、さらに kics_zaiko_qty = rfid_kics_qty - kics_plan_qty、yard_zaiko_qty = rfid_yard_qty - yard_plan_qty を算出する。既存7列の値は不変。v_juchu_kizai_dat_qty の列追加が前提なので、必ずそちらを先に適用すること。
-- 取得元  : ステージング jimqcvyaoddsxbcrsnfs / public スキーマ（適用済みの定義）
--
-- 注意: reloptions はステージング側の設定ではなく本番の現状に合わせて
--       security_invoker = on を明示している（ステージングでは未設定のものがある）。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_zaiko_qty
WITH (security_invoker = on) AS
 SELECT use.plan_dat,
    use.kizai_id,
    kizai.kizai_qty,
    use.juchu_qty,
    use.yobi_qty,
    use.plan_qty,
    kizai.kizai_qty - use.plan_qty AS zaiko_qty,
    use.kics_juchu_qty,
    use.kics_yobi_qty,
    use.kics_plan_qty,
    use.yard_juchu_qty,
    use.yard_yobi_qty,
    use.yard_plan_qty,
    kizai.rfid_kics_qty - use.kics_plan_qty AS kics_zaiko_qty,
    kizai.rfid_yard_qty - use.yard_plan_qty AS yard_zaiko_qty
   FROM v_juchu_kizai_dat_qty use
     LEFT JOIN v_kizai_qty kizai ON use.kizai_id = kizai.kizai_id
;
