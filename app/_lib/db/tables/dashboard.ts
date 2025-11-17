'use server';
import pool from '../postgres';

const SCHEMA = 'dev6';

/**
 * 出庫日未定（0時 or NULL）の機材データを取得する
 * @param startDate スケジュール開始日 (例: '2025-09-07')
 * @param totalDays 取得する合計日数
 * @returns
 */
export const selectshukoTimeList = async (startDate: string, totalDays: number) => {
  // totalDays から 1 を引いた値をパラメータとして渡す
  const daysParam = totalDays - 1;

  const query = `
  SELECT *
FROM (
  SELECT
    cal.cal_dat,
    juchu_kizai_head_lst.*
  FROM
  (
    SELECT
      *
    FROM
      ${SCHEMA}.v_juchu_kizai_head_lst
    WHERE
      -- １）出庫日一致 時刻が０：０：００のもの
      v_juchu_kizai_head_lst.kics_shuko_dat::time = '00:00:00'
      OR v_juchu_kizai_head_lst.yard_shuko_dat::time = '00:00:00'
      -- ２）NULLのもの
      OR v_juchu_kizai_head_lst.kics_shuko_dat IS NULL
      OR v_juchu_kizai_head_lst.yard_shuko_dat IS NULL
  ) AS juchu_kizai_head_lst
  RIGHT OUTER JOIN
  /* スケジュール生成して外部結合 */
  (
    -- スケジュールの生成範囲
    SELECT
      ($1::date + g.i) AS cal_dat -- $1 でパラメータ化
    FROM
      generate_series(0, $2) AS g(i) -- $2 でパラメータ化
  ) AS cal ON juchu_kizai_head_lst.kics_shuko_dat::date = cal.cal_dat
  OR juchu_kizai_head_lst.yard_shuko_dat::date = cal.cal_dat
  ORDER BY
    cal.cal_dat
    )AS test
WHERE test.juchu_head_id IS NOT NULL;
  `;
  try {
    return await pool.query(query, [startDate, daysParam]);
  } catch (e) {
    throw e;
  }
};

/**
 * 車両未設定データを取得する
 * @param startDate スケジュール開始日
 * @param totalDays 取得する合計日数
 * @returns
 */
export const selectVehiclesList = async (startDate: string, totalDays: number) => {
  // totalDays から 1 を引いた値をパラメータとして渡す
  const daysParam = totalDays - 1;

  const query = `
SELECT *
FROM (  
  SELECT
    cal.cal_dat,
    juchu_kizai_head_lst.*
  FROM
  (
    SELECT DISTINCT
      v_juchu_kizai_head_lst.juchu_head_id,
      v_juchu_kizai_head_lst.juchu_kizai_head_id, 
      v_juchu_kizai_head_lst.kics_shuko_dat,
      v_juchu_kizai_head_lst.yard_shuko_dat,
      v_juchu_kizai_head_lst.kics_nyuko_dat,
      v_juchu_kizai_head_lst.yard_nyuko_dat,
      v_juchu_kizai_head_lst.head_nam, 
      v_juchu_kizai_head_lst.koen_nam, 
      v_juchu_kizai_head_lst.koenbasho_nam,
      v_juchu_kizai_head_lst.kokyaku_nam
    FROM
      ${SCHEMA}.v_juchu_kizai_head_lst
    -- 受注車両の出庫
    LEFT OUTER JOIN ${SCHEMA}.v_juchu_sharyo_head_lst ON
      v_juchu_kizai_head_lst.juchu_head_id = v_juchu_sharyo_head_lst.juchu_head_id
      AND v_juchu_sharyo_head_lst.nyushuko_shubetu_id = 1 --出庫
      AND (
        (
          v_juchu_sharyo_head_lst.nyushuko_basho_id = 1 --KICS
          AND v_juchu_kizai_head_lst.kics_shuko_dat::date = v_juchu_sharyo_head_lst.nyushuko_dat::date --KICS
        )
        OR (
          v_juchu_sharyo_head_lst.nyushuko_basho_id = 2 --YARD
          AND v_juchu_kizai_head_lst.yard_shuko_dat::date = v_juchu_sharyo_head_lst.nyushuko_dat::date --YARD
        )
      )
    WHERE
      v_juchu_sharyo_head_lst.nyushuko_dat IS NULL --車両の出庫日がNULL
  ) AS juchu_kizai_head_lst
  RIGHT OUTER JOIN
  /* スケジュール生成して外部結合 */
  (
    -- スケジュールの生成範囲
    SELECT
      ($1::date + g.i) AS cal_dat -- $1 でパラメータ化
    FROM
      generate_series(0, $2) AS g(i) -- $2 でパラメータ化
  ) AS cal ON juchu_kizai_head_lst.kics_shuko_dat::date = cal.cal_dat
  OR juchu_kizai_head_lst.yard_shuko_dat::date = cal.cal_dat
  ORDER BY
    cal.cal_dat
)AS test
WHERE test.juchu_head_id IS NOT NULL;
  `;

  try {
    return await pool.query(query, [startDate, daysParam]);
  } catch (e) {
    throw e;
  }
};

/**
 * マイナス在庫を取得
 * @param startDate スケジュール開始日
 * @param totalDays 取得する合計日数
 * @returns
 */
export const selectMinusZaikoList = async (startDate: string, totalDays: number) => {
  // totalDays から 1 を引いた値をパラメータとして渡す
  const daysParam = totalDays - 1;
  const query = `
  SELECT 
      kizai_id
      ,kizai_nam
  FROM
  (
      SELECT 
          cal.cal_dat AS cal_dat --スケジュール日
          ,zaiko_kizai.kizai_id AS kizai_id
          ,zaiko_kizai.kizai_nam 
          ,zaiko_kizai.zaiko_qty  --在庫数
      FROM 
      (
          SELECT 
              v_zaiko_qty.plan_dat    --機材の使用日
              ,v_zaiko_qty.kizai_id   --機材ID
              ,v_zaiko_qty.zaiko_qty  --機材の在庫数
              ,m_kizai.kizai_nam
          FROM
              ${SCHEMA}.v_zaiko_qty
          
          LEFT OUTER JOIN ${SCHEMA}.m_kizai ON
              v_zaiko_qty.kizai_id = m_kizai.kizai_id

          WHERE
              v_zaiko_qty.zaiko_qty < 0

      ) AS zaiko_kizai

      RIGHT OUTER JOIN 
      /* スケジュール生成して外部結合 */
      (
          -- スケジュールの生成範囲
          SELECT
            ($1::date + g.i) AS cal_dat -- $1 でパラメータ化
          FROM
            generate_series(0, $2) AS g(i) -- $2 でパラメータ化

      ) AS cal ON 
          zaiko_kizai.plan_dat = cal.cal_dat    
      
      ORDER BY
          cal.cal_dat
  ) AS minus_zaiko
  
  WHERE
      kizai_id IS NOT NULL    --マイマス在庫の無い日は除外
  GROUP BY
      kizai_id
      ,kizai_nam
  ORDER BY
      kizai_nam
  ;
  `;
  try {
    return await pool.query(query, [startDate, daysParam]);
  } catch (e) {
    throw e;
  }
};
