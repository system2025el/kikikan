import { PoolClient } from 'pg';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import {
  KizaiImportTypes,
  RfidImportTypes,
  TanabanImportTypes,
} from '@/app/(main)/(settings)/import-master/_lib/types';

import { updateMasterUpdates } from './m-master-update';

/**
 * RFIDマスタ確認
 * @param list
 * @param connection
 * @returns
 */
export const checkRfid = async (list: RfidImportTypes[], connection: PoolClient) => {
  // 有効なデータがない場合は離脱
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  try {
    // インポートしたRFIDタグID
    const rfidTagIds = list.map((v) => v.rfid_tag_id);
    // m_rfidから既存のRFIDタグIDを取得
    const existingTagsResult = await connection.query(
      `SELECT rfid_tag_id FROM dev5.m_rfid WHERE rfid_tag_id = ANY($1::text[]);`,
      [rfidTagIds]
    );
    // 既存のRFIDタグIDを取得
    const existingRfidTags = new Set(existingTagsResult.rows.map((row) => row.rfid_tag_id));
    // 新規登録するデータ
    const insertList = list.filter((v) => !existingRfidTags.has(v.rfid_tag_id));
    console.log('新規登録対象', insertList.length, '件');

    // 新規登録するデータがあれば新規登録処理
    if (insertList.length > 0) {
      // 現材の時刻取得
      const addDat = toJapanTimeString();
      const addUser = 'excel_import';

      // 一時テーブルとして扱うインポートデータのカラムを定義
      const insertColumns = ['rfid_tag_id', 'kizai_nam', 'rfid_kizai_sts', 'del_flg', 'shozoku_id', 'mem'];

      const insertPlaceholders = insertList
        .map((_, index) => {
          const start = index * insertColumns.length + 1;
          return `(${insertColumns.map((_, i) => `$${start + i}`).join(',')})`;
        })
        .join(',');
      // 挿入する値
      const values = insertList.flatMap((v) => [
        v.rfid_tag_id,
        v.kizai_nam,
        v.rfid_kizai_sts,
        v.del_flg,
        v.shozoku_id,
        v.mem,
      ]);
      const insertQuery = `
          WITH imported_data(${insertColumns.join(',')}) AS (
            VALUES ${insertPlaceholders}
          )
          INSERT INTO dev5.m_rfid (
            rfid_tag_id,
            kizai_id,
            rfid_kizai_sts,
            del_flg,
            shozoku_id,
            mem,
            add_dat,
            add_user
          )
          SELECT
            id.rfid_tag_id,
            mk.kizai_id, -- JOINして取得したkizai_id
            CAST(id.rfid_kizai_sts AS integer),
            CAST(id.del_flg AS integer),
            CAST(id.shozoku_id AS integer),
            id.mem,
            $${values.length + 1}::timestamp, -- add_dat
            $${values.length + 2}  -- add_user
          FROM
            imported_data AS id
          LEFT JOIN
            dev5.m_kizai AS mk ON id.kizai_nam = mk.kizai_nam;
        `;

      // INSERT実行
      await Promise.all([connection.query(insertQuery, [...values, addDat, addUser]), updateMasterUpdates('m_rfid')]);
    }

    // 更新処理
    // 全データ比較準備
    const placeholders = list
      .map((_, index) => {
        const start = index * 6 + 1;
        return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5})`;
      })
      .join(',');
    // 差異があるデータ群の取得
    const differnces = await connection.query(
      `
        WITH imported_data(rfid_tag_id, kizai_nam, rfid_kizai_sts, del_flg, shozoku_id, mem) AS (
          VALUES ${placeholders}
        ),
        imported_only AS (
          SELECT
            id.rfid_tag_id,
            mk.kizai_id::integer,
            id.rfid_kizai_sts::integer,
            id.del_flg::integer,
            id.shozoku_id::integer,
            id.mem
          FROM imported_data AS id
          LEFT JOIN dev5.m_kizai AS mk ON id.kizai_nam = mk.kizai_nam
          EXCEPT ALL
          SELECT rfid_tag_id, kizai_id, rfid_kizai_sts, del_flg, shozoku_id, mem FROM dev5.m_rfid
        )
        SELECT rfid_tag_id, kizai_id, rfid_kizai_sts, del_flg, shozoku_id, mem FROM imported_only
        `,
      list.flatMap((v) => [v.rfid_tag_id, v.kizai_nam, v.rfid_kizai_sts, v.del_flg, v.shozoku_id, v.mem])
    );
    console.log('更新対象', differnces.rows);
    const updateList = differnces.rows;
    // 差異がある場合
    if (updateList && updateList.length > 0) {
      const updDat = toJapanTimeString();
      const updUser = 'excel_import';
      const updatePlaceholders = updateList
        .map((_, index) => {
          const start = index * 6 + 1;
          return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5})`;
        })
        .join(',');
      const updateValues = updateList.flatMap((v) => [
        v.rfid_tag_id,
        v.kizai_id,
        v.rfid_kizai_sts,
        v.del_flg,
        v.shozoku_id,
        v.del_flg === 1 ? v.mem : null,
      ]);
      const updateQuery = `
          UPDATE dev5.m_rfid AS mr
          SET
            kizai_id = d.kizai_id::integer,
            rfid_kizai_sts = d.rfid_kizai_sts::integer,
            del_flg = d.del_flg::integer,
            shozoku_id = d.shozoku_id::integer,
            mem = d.mem,
            upd_dat = $${updateValues.length + 1}::timestamp,
            upd_user = $${updateValues.length + 2}
          FROM (
            VALUES ${updatePlaceholders}
          ) AS d(rfid_tag_id, kizai_id, rfid_kizai_sts, del_flg, shozoku_id, mem)
          WHERE mr.rfid_tag_id = d.rfid_tag_id;`;

      //更新実行
      await Promise.all([
        connection.query(updateQuery, [...updateValues, updDat, updUser]),
        updateMasterUpdates('m_rfid'),
      ]);
    }

    console.log('RFIDマスタ処理した');
  } catch (e) {
    throw new Error('例外が発生：DBエラーrfid');
  }
};

/**
 * 機材マスタ確認
 * @param list
 * @param connection
 * @returns 新規登録された機材マスタの情報
 */
export const checkKizai = async (list: KizaiImportTypes[], connection: PoolClient) => {
  // 有効なデータがない場合は離脱
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  // 一時テーブル用のインポートしたデータ準備
  const allColumns = [
    'kizai_nam',
    'section_nam',
    'el_num',
    'shozoku_id',
    'bld_cod',
    'tana_cod',
    'eda_cod',
    'kizai_grp_cod',
    'dsp_ord_num',
    'mem',
    'bumon_nam',
    'shukei_bumon_nam',
    'dsp_flg',
    'ctn_flg',
    'def_dat_qty',
    'reg_amt',
    'rank_amt_1',
    'rank_amt_2',
    'rank_amt_3',
    'rank_amt_4',
    'rank_amt_5',
  ];
  const kizaiPlaceholders = list
    .map((_, index) => {
      const start = index * allColumns.length + 1;
      return `(${allColumns.map((_, i) => `$${start + i}`).join(',')})`;
    })
    .join(',');
  const kizaiValues = list.flatMap((v) =>
    allColumns.map((col) => {
      const value = v[col as keyof KizaiImportTypes];
      return value === undefined ? null : value;
    })
  );
  // 現在の日付とユーザー情報を取得
  const addDat = toJapanTimeString();
  const addUser = 'excel_import';

  try {
    // 既存の機材マスタの最大ID
    const maxKizaiIdResult = await connection.query(`SELECT COALESCE(MAX(kizai_id), 0) FROM dev5.m_kizai;`);
    const maxKizaiId = maxKizaiIdResult.rows[0].coalesce;

    // データ比較、新規登録、取得
    const data = await connection.query(
      `
        WITH imported_data(${allColumns.join(',')}) AS (
          VALUES ${kizaiPlaceholders}
        )
        INSERT INTO dev5.m_kizai (
          kizai_id,
          kizai_nam,
          section_num,
          el_num,
          shozoku_id,
          bld_cod,
          tana_cod,
          eda_cod,
          kizai_grp_cod,
          dsp_ord_num,
          mem,
          bumon_id,
          shukei_bumon_id,
          dsp_flg,
          ctn_flg,
          def_dat_qty,
          reg_amt,
          rank_amt_1,
          rank_amt_2,
          rank_amt_3,
          rank_amt_4,
          rank_amt_5,
          add_dat,
          add_user
        )
        SELECT
          ${maxKizaiId} + ROW_NUMBER() OVER (ORDER BY id.kizai_nam),
          id.kizai_nam,
          CAST(NULLIF(id.section_nam, '') AS integer),
          CAST(NULLIF(id.el_num, '') AS integer),
          CAST(NULLIF(id.shozoku_id, '') AS integer),
          id.bld_cod,
          id.tana_cod,
          id.eda_cod,
          id.kizai_grp_cod,
          CAST(NULLIF(id.dsp_ord_num, '') AS integer),
          id.mem,
          mb.bumon_id,
          ms.shukei_bumon_id,
          CAST(NULLIF(id.dsp_flg, '') AS integer),
          CAST(NULLIF(id.ctn_flg, '') AS integer),
          CAST(NULLIF(id.def_dat_qty, '') AS integer),
          CAST(NULLIF(id.reg_amt, '') AS integer),
          CAST(NULLIF(id.rank_amt_1, '') AS integer),
          CAST(NULLIF(id.rank_amt_2, '') AS integer),
          CAST(NULLIF(id.rank_amt_3, '') AS integer),
          CAST(NULLIF(id.rank_amt_4, '') AS integer),
          CAST(NULLIF(id.rank_amt_5, '') AS integer),
          $${kizaiValues.length + 1}::timestamp,
          $${kizaiValues.length + 2}
        FROM
          imported_data AS id
        LEFT JOIN
         dev5.m_bumon AS mb ON id.bumon_nam = mb.bumon_nam
        LEFT JOIN
         dev5.m_shukei_bumon AS ms ON id.shukei_bumon_nam = ms.shukei_bumon_nam
        WHERE
          NOT EXISTS (SELECT 1 FROM dev5.m_kizai AS mk WHERE mk.kizai_nam = id.kizai_nam)
        RETURNING *;
        `,
      [...kizaiValues, addDat, addUser]
    );

    if (data) {
      if (data.rowCount && data.rowCount > 0) {
        await updateMasterUpdates('m_kizai');
      }
      return data.rows;
    }
    return [];
  } catch (e) {
    console.log(e);
    throw new Error('例外が発生：DBエラーkizai');
  }
};
/**
 * 大部門マスタ確認
 * @param list
 * @param connection
 * @returns 新規登録された大部門マスタの情報
 */
export const checkDaibumon = async (list: string[], connection: PoolClient) => {
  // 有効なデータがない場合は離脱
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  const placeholders = list.map((_, index) => `($${index + 1})`).join(',');
  // 現在の日付とユーザー情報
  const addDat = toJapanTimeString();
  const addUser = 'excel_import';
  try {
    //  既存の大部門マスタの最大ID
    const maxIdResult = await connection.query(`
        SELECT COALESCE(MAX(dai_bumon_id), 0) FROM dev5.m_dai_bumon;
      `);
    const maxId = maxIdResult.rows[0].coalesce;
    // データ比較、新規登録、取得
    const data = await connection.query(
      `
        WITH imported_data(dai_bumon_nam) AS (
          VALUES ${placeholders}
        ),
        existing_data AS (
          SELECT dai_bumon_nam FROM dev5.m_dai_bumon
        )
        INSERT INTO dev5.m_dai_bumon (dai_bumon_id, dai_bumon_nam, add_dat, add_user)
        SELECT
          ${maxId} + ROW_NUMBER() OVER (ORDER BY id.dai_bumon_nam),
          id.dai_bumon_nam,
          $${list.length + 1}::timestamp,
          $${list.length + 2}
        FROM
          imported_data id
        WHERE
          id.dai_bumon_nam NOT IN (SELECT dai_bumon_nam FROM existing_data)
        RETURNING *;
      `,
      [...list, addDat, addUser]
    );
    if (data) {
      return data.rows;
    }
    return [];
  } catch (e) {
    throw new Error('例外が発生：DBエラーdaibumon');
  }
};

/**
 * 集計部門マスタ確認
 * @param list
 * @param connection
 * @returns 新規登録された集計部門マスタの情報
 */
export const checkShukeibumon = async (list: string[], connection: PoolClient) => {
  // 有効なデータがない場合は離脱
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  const placeholders = list.map((_, index) => `($${index + 1})`).join(',');
  // 現在の日付とユーザー情報
  const addDat = toJapanTimeString();
  const addUser = 'excel_import';

  try {
    //  既存の集計部門マスタの最大ID
    const maxIdResult = await connection.query(`
        SELECT COALESCE(MAX(shukei_bumon_id), 0) FROM dev5.m_shukei_bumon;
      `);
    const maxId = maxIdResult.rows[0].coalesce;
    // データ比較、新規登録、取得
    const data = await connection.query(
      `
        WITH imported_data(shukei_bumon_nam) AS (
          VALUES ${placeholders}
        ),
        existing_data AS (
          SELECT shukei_bumon_nam FROM dev5.m_shukei_bumon
        )
        INSERT INTO dev5.m_shukei_bumon (shukei_bumon_id, shukei_bumon_nam, add_dat, add_user)
        SELECT
          ${maxId} + ROW_NUMBER() OVER (ORDER BY id.shukei_bumon_nam),
          id.shukei_bumon_nam,
          $${list.length + 1}::timestamp,
          $${list.length + 2}
        FROM
          imported_data id
        WHERE
          id.shukei_bumon_nam NOT IN (SELECT shukei_bumon_nam FROM existing_data)
        RETURNING *;
      `,
      [...list, addDat, addUser]
    );
    if (data) {
      return data.rows;
    }
    return [];
  } catch (e) {
    throw new Error('例外が発生：DBエラーshukeibumon');
  }
};

/**
 * 部門マスタ確認
 * @param list
 * @param connection
 * @returns 新規登録された部門マスタの情報
 */
export const checkBumon = async (
  list: { bumon_nam: string; dai_bumon_nam: string; shukei_bumon_nam: string }[],
  connection: PoolClient
) => {
  // 有効なデータがない場合は離脱
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  // 一時テーブル用のインポートしたデータ準備
  const allColumns = ['bumon_nam', 'dai_bumon_nam', 'shukei_bumon_nam'];
  const bumonPlaceholders = list
    .map((_, index) => {
      const start = index * allColumns.length + 1;
      return `(${allColumns.map((_, i) => `$${start + i}`).join(',')})`;
    })
    .join(',');
  const bumonValues = list.flatMap((v) =>
    allColumns.map((col) => {
      const value = v[col as keyof { bumon_nam: string; dai_bumon_nam: string; shukei_bumon_nam: string }];
      return value === undefined ? null : value;
    })
  );
  // 現在の日付とユーザー情報を取得
  const addDat = toJapanTimeString();
  const addUser = 'excel_import';

  try {
    // 既存の部門マスタIDの最大値
    const maxBumonIdResult = await connection.query(`SELECT COALESCE(MAX(bumon_id), 0) FROM dev5.m_bumon;`);
    const maxBumonId = maxBumonIdResult.rows[0].coalesce;
    // データ比較、新規登録、取得
    const data = await connection.query(
      `
        WITH imported_data(${allColumns.join(',')}) AS (
          VALUES ${bumonPlaceholders}
        )
        INSERT INTO dev5.m_bumon (
          bumon_id,
          bumon_nam,
          dai_bumon_id,
          shukei_bumon_id,
          add_dat,
          add_user
        )
        SELECT
          ${maxBumonId} + ROW_NUMBER() OVER (ORDER BY id.bumon_nam),
          id.bumon_nam,
          CAST(md.dai_bumon_id AS integer),
          CAST(ms.shukei_bumon_id AS integer),
          $${bumonValues.length + 1}::timestamp,
          $${bumonValues.length + 2}
        FROM
          imported_data AS id
        LEFT JOIN
         dev5.m_dai_bumon AS md ON id.dai_bumon_nam = md.dai_bumon_nam
        LEFT JOIN
         dev5.m_shukei_bumon AS ms ON id.shukei_bumon_nam = ms.shukei_bumon_nam
        WHERE
          NOT EXISTS (SELECT 1 FROM dev5.m_bumon AS mb WHERE mb.bumon_nam = id.bumon_nam)
        RETURNING *;
        `,
      [...bumonValues, addDat, addUser]
    );

    if (data) {
      return data.rows;
    }
    return [];
  } catch (e) {
    throw new Error('例外が発生：DBエラーbumon');
  }
};

/**
 * 棚番マスタ確認
 * @param list
 * @param connection
 * @returns 新規登録された棚番マスタの情報
 */
export const checkTanaban = async (list: TanabanImportTypes[], connection: PoolClient) => {
  // 有効なデータがない場合は離脱
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  // プレースホルダーを動的に生成 e.g., ($1, $2, $3), ($4, $5, $6), ...
  const placeholders = list
    .map((_, index) => {
      const start = index * 3 + 1;
      return `($${start}, $${start + 1}, $${start + 2})`;
    })
    .join(',');

  // プレースホルダーに渡す値をフラットな配列に変換
  const values = list.flatMap((item) => [item.bld_cod, item.tana_cod, item.eda_cod]);

  // 現日時取得
  const addDate = toJapanTimeString();
  const addUser = 'excel_import';

  try {
    const result = await connection.query(
      `
        INSERT INTO dev5.m_tanaban (bld_cod, tana_cod, eda_cod, add_dat, add_user)
        SELECT
          t.bld_cod,
          t.tana_cod,
          t.eda_cod,
          $${values.length + 1}::timestamp,
          $${values.length + 2}
        FROM (
          VALUES ${placeholders}
        ) AS t(bld_cod, tana_cod, eda_cod)
        ON CONFLICT (bld_cod, tana_cod, eda_cod)
        DO NOTHING
        RETURNING bld_cod, tana_cod, eda_cod
        `,
      [...values, addDate, addUser]
    );

    return result.rows;
  } catch (e) {
    console.error('棚番マスタでエラー', e);
    throw new Error('例外が発生：DBエラーtanaban');
  }
};
