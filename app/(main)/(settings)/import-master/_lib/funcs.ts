'use server';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { EqptImportType, KizaiImportTypes, RfidImportTypes, TanabanImportTypes } from './types';

/**
 * 機材RFIDマスタ表インポート
 */

/**
 * エクセルインポートしたものをDBに収納する処理
 * @param data エクセルから取得したデータの配列
 */
export const ImportEqptRfidData = async (data: EqptImportType[]) => {
  console.log(data);
  /* 棚番用データ */
  const tanabanList: TanabanImportTypes[] = data
    .map((d) => ({
      bld_cod: d.bld_cod,
      tana_cod: d.tana_cod,
      eda_cod: d.eda_cod,
    }))
    .filter((d) => d.bld_cod || d.bld_cod !== '');
  /* 大部門用データ */
  const daibumonNamList = data.map((d) => d.dai_bumon_nam!).filter((d) => d || d !== '');
  /* 集計部門用データ */
  const shukeibumonNamList = data.map((d) => d.shukei_bumon_nam!).filter((d) => d || d !== '');
  /* 部門用データ */
  const bumonNamList = data
    .map((d) => ({ bumon_nam: d.bumon_nam!, dai_bumon_nam: d.dai_bumon_nam!, shukei_bumon_nam: d.shukei_bumon_nam! }))
    .filter((d) => d.bumon_nam || d.bumon_nam !== '');
  /* 機材マスタ用データ */
  const kizaiMasterList: KizaiImportTypes[] = data.map((d) => ({
    kizai_nam: d.kizai_nam,
    section_nam: d.section_nam,
    el_num: d.el_num,
    shozoku_id: d.shozoku_id,
    bld_cod: d.bld_cod,
    tana_cod: d.tana_cod,
    eda_cod: d.eda_cod,
    kizai_grp_cod: d.kizai_grp_cod,
    dsp_ord_num: d.dsp_ord_num,
    mem: d.mem,
    dai_bumon_nam: d.dai_bumon_nam,
    bumon_nam: d.bumon_nam,
    shukei_bumon_nam: d.shukei_bumon_nam,
    dsp_flg: d.dsp_flg,
    ctn_flg: d.ctn_flg,
    def_dat_qty: d.def_dat_qty,
    reg_amt: d.reg_amt,
    rank_amt_1: d.rank_amt_1,
    rank_amt_2: d.rank_amt_2,
    rank_amt_3: d.rank_amt_3,
    rank_amt_4: d.rank_amt_4,
    rank_amt_5: d.rank_amt_5,
  }));
  /* RFID用データ */
  const rfidList: RfidImportTypes[] = data.map((d) => ({
    rfid_tag_id: d.rfid_tag_id,
    kizai_nam: d.kizai_nam,
    rfid_kizai_sts: d.rfid_kizai_sts,
    del_flg: d.del_flg,
    shozoku_id: d.shozoku_id,
    mem: d.mem,
  }));

  try {
    const tanabans = await checkTanaban(tanabanList);
    console.log('棚番', tanabans.length, '件追加');
    const daibumons = await checkDaibumon(daibumonNamList);
    console.log('大部門', daibumons.length, '件追加');
    const shukeibumons = await checkShukeibumon(shukeibumonNamList);
    console.log('集計部門', shukeibumons.length, '件追加');
    const bumons = await checkBumon(bumonNamList);
    console.log('部門', bumons.length, '件追加');
    const kizais = await checkKizai(kizaiMasterList);
    console.log('機材マスタ', kizais.length, '件追加');
    await checkRfid(rfidList);
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};

/**
 * RFIDマスタ確認
 * @param list
 * @returns
 */
const checkRfid = async (list: RfidImportTypes[]) => {
  // listが空の場合離脱
  if (list.length === 0) {
    return [];
  }
  // 重複を削除したリスト
  const uniqueList = Array.from(new Map(list.map((v) => [v.rfid_tag_id, v])).values());
  // トランザクション
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query(`SET search_path TO dev5;`);

    // インポートしたRFIDタグID
    const rfidTagIds = uniqueList.map((v) => v.rfid_tag_id);
    // m_rfidから既存のRFIDタグIDを取得
    const existingTagsResult = await client.query(
      `SELECT rfid_tag_id FROM m_rfid WHERE rfid_tag_id = ANY($1::text[]);`,
      [rfidTagIds]
    );
    // 既存のRFIDタグIDを取得
    const existingRfidTags = new Set(existingTagsResult.rows.map((row) => row.rfid_tag_id));
    // 新規登録するデータ
    const insertList = uniqueList.filter((v) => !existingRfidTags.has(v.rfid_tag_id));

    // 新規登録するデータがあれば新規登録処理
    if (insertList.length > 0) {
      // INSERT用のデータ準備
      const addDat = toJapanTimeString(new Date());
      const addUser = 'excel_import';
      const insertPlaceholders = insertList
        .map((_, index) => {
          const start = index * 6 + 1;
          return `(
            $${start},
            (SELECT kizai_id FROM m_kizai WHERE kizai_nam = $${start + 1}),
            $${start + 2},
            $${start + 3},
            $${start + 4},
            $${start + 5},
            $${insertList.length * 6 + 1}::timestamp,
            $${insertList.length * 6 + 2}
          )`;
        })
        .join(',');
      const insertValues = insertList.flatMap((v) => [
        v.rfid_tag_id,
        v.kizai_nam,
        v.rfid_kizai_sts,
        v.del_flg,
        v.shozoku_id,
        v.mem,
      ]);
      const insertQuery = `
        INSERT INTO m_rfid (
          rfid_tag_id,
          kizai_id,
          rfid_kizai_sts,
          del_flg,
          shozoku_id,
          mem,
          add_dat,
          add_user
        ) VALUES ${insertPlaceholders};
      `;
      // INSERT実行
      await client.query(insertQuery, [...insertValues, addDat, addUser]);
    }

    // 更新処理
    // 全データ比較準備
    const placeholders = uniqueList
      .map((_, index) => {
        const start = index * 6 + 1;
        return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5})`;
      })
      .join(',');
    // 差異があるデータ群の取得
    const differnces = await client.query(
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
        LEFT JOIN m_kizai AS mk ON id.kizai_nam = mk.kizai_nam
        EXCEPT ALL
        SELECT rfid_tag_id, kizai_id, rfid_kizai_sts, del_flg, shozoku_id, mem FROM m_rfid
      )
      SELECT rfid_tag_id, kizai_id, rfid_kizai_sts, del_flg, shozoku_id, mem FROM imported_only
      `,
      uniqueList.flatMap((v) => [v.rfid_tag_id, v.kizai_nam, v.rfid_kizai_sts, v.del_flg, v.shozoku_id, v.mem])
    );
    console.log(differnces.rows);
    const updateList = differnces.rows;
    // 差異がある場合
    if (differnces.rowCount && differnces.rowCount > 0) {
      const updDat = toJapanTimeString(new Date());
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
        v.mem,
      ]);
      const updateQuery = `
        UPDATE m_rfid AS mr
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
      await client.query(updateQuery, [...updateValues, updDat, updUser]);
    }

    await client.query('COMMIT;');
    console.log('RFIDマスタ処理した');
  } catch (e) {
    await client.query('ROLLBACK;');
    throw e;
  } finally {
    client.release(); // 接続をpoolに返却
  }
};

/**
 * 機材マスタ確認
 * @param list
 * @returns 新規登録された機材マスタの情報
 */
const checkKizai = async (list: KizaiImportTypes[]) => {
  // listが空の場合離脱
  if (list.length === 0) {
    return [];
  }
  // 重複を削除したリスト
  const uniqueList = Array.from(new Map(list.map((v) => [v.kizai_nam, v])).values());

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
    'dai_bumon_nam',
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
  const kizaiPlaceholders = uniqueList
    .map((_, index) => {
      const start = index * allColumns.length + 1;
      return `(${allColumns.map((_, i) => `$${start + i}`).join(',')})`;
    })
    .join(',');
  const kizaiValues = uniqueList.flatMap((v) =>
    allColumns.map((col) => {
      const value = v[col as keyof KizaiImportTypes];
      return value === undefined ? null : value;
    })
  );

  try {
    await pool.query(`SET search_path TO dev5;`);
    // 既存の機材マスタの最大ID
    const maxKizaiIdResult = await pool.query(`SELECT COALESCE(MAX(kizai_id), 0) FROM m_kizai;`);
    const maxKizaiId = maxKizaiIdResult.rows[0].coalesce;
    // 現在の日付とユーザー情報を取得
    const addDat = new Date();
    const addUser = 'excel_import';
    // データ比較、新規登録、取得
    const data = await pool.query(
      `
      WITH imported_data(${allColumns.join(',')}) AS (
        VALUES ${kizaiPlaceholders}
      )
      INSERT INTO m_kizai (
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
        dai_bumon_id,
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
        md.dai_bumon_id,
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
        m_bumon AS mb ON id.bumon_nam = mb.bumon_nam
      LEFT JOIN
        m_dai_bumon AS md ON id.dai_bumon_nam = md.dai_bumon_nam
      LEFT JOIN
        m_shukei_bumon AS ms ON id.shukei_bumon_nam = ms.shukei_bumon_nam
      WHERE
        NOT EXISTS (SELECT 1 FROM m_kizai AS mk WHERE mk.kizai_nam = id.kizai_nam)
      RETURNING *;
      `,
      [...kizaiValues, addDat, addUser]
    );

    if (data) {
      return data.rows;
    }
    return [];
  } catch (e) {
    throw e;
  }
};
/**
 * 大部門マスタ確認
 * @param list
 * @returns 新規登録された大部門マスタの情報
 */
const checkDaibumon = async (list: string[]) => {
  // listが空の場合離脱
  if (list.length === 0) {
    return [];
  }
  // 重複を削除したリスト
  const uniqueList = [...new Set(list)];
  const placeholders = uniqueList.map((_, index) => `($${index + 1})`).join(',');

  try {
    await pool.query(`SET search_path TO dev5;`);
    // 現在の日付とユーザー情報
    const addDat = new Date();
    const addUser = 'excel_import';
    //  既存の大部門マスタの最大ID
    const maxIdResult = await pool.query(`
      SELECT COALESCE(MAX(dai_bumon_id), 0) FROM m_dai_bumon;
    `);
    const maxId = maxIdResult.rows[0].coalesce;
    // データ比較、新規登録、取得
    const data = await pool.query(
      `
      WITH imported_data(dai_bumon_nam) AS (
        VALUES ${placeholders}
      ),
      existing_data AS (
        SELECT dai_bumon_nam FROM m_dai_bumon
      )
      INSERT INTO m_dai_bumon (dai_bumon_id, dai_bumon_nam, add_dat, add_user)
      SELECT
        ${maxId} + ROW_NUMBER() OVER (ORDER BY id.dai_bumon_nam),
        id.dai_bumon_nam,
        $${uniqueList.length + 1}::timestamp,
        $${uniqueList.length + 2}
      FROM
        imported_data id
      WHERE
        id.dai_bumon_nam NOT IN (SELECT dai_bumon_nam FROM existing_data)
      RETURNING *;
    `,
      [...uniqueList, addDat, addUser]
    );
    if (data) {
      return data.rows;
    }
    return [];
  } catch (e) {
    throw e;
  }
};

/**
 * 集計部門マスタ確認
 * @param list
 * @returns 新規登録された集計部門マスタの情報
 */
const checkShukeibumon = async (list: string[]) => {
  // listが空の場合離脱
  if (list.length === 0) {
    return [];
  }
  // 重複を削除したリスト
  const uniqueList = [...new Set(list)];
  const placeholders = uniqueList.map((_, index) => `($${index + 1})`).join(',');
  try {
    await pool.query(`SET search_path TO dev5;`);
    // 現在の日付とユーザー情報
    const addDat = new Date();
    const addUser = 'excel_import';
    //  既存の集計部門マスタの最大ID
    const maxIdResult = await pool.query(`
      SELECT COALESCE(MAX(shukei_bumon_id), 0) FROM m_shukei_bumon;
    `);
    const maxId = maxIdResult.rows[0].coalesce;
    // データ比較、新規登録、取得
    const data = await pool.query(
      `
      WITH imported_data(shukei_bumon_nam) AS (
        VALUES ${placeholders}
      ),
      existing_data AS (
        SELECT shukei_bumon_nam FROM m_shukei_bumon
      )
      INSERT INTO m_shukei_bumon (shukei_bumon_id, shukei_bumon_nam, add_dat, add_user)
      SELECT
        ${maxId} + ROW_NUMBER() OVER (ORDER BY id.shukei_bumon_nam),
        id.shukei_bumon_nam,
        $${uniqueList.length + 1}::timestamp,
        $${uniqueList.length + 2}
      FROM
        imported_data id
      WHERE
        id.shukei_bumon_nam NOT IN (SELECT shukei_bumon_nam FROM existing_data)
      RETURNING *;
    `,
      [...uniqueList, addDat, addUser]
    );
    if (data) {
      return data.rows;
    }
    return [];
  } catch (e) {
    throw e;
  }
};

/**
 * 部門マスタ確認
 * @param list
 * @returns 新規登録された部門マスタの情報
 */
const checkBumon = async (list: { bumon_nam: string; dai_bumon_nam: string; shukei_bumon_nam: string }[]) => {
  // listが空の場合離脱
  if (list.length === 0) {
    return [];
  }
  // 重複を削除したリスト
  const uniqueList = Array.from(new Map(list.map((v) => [v.bumon_nam, v])).values());

  // 一時テーブル用のインポートしたデータ準備
  const allColumns = ['bumon_nam', 'dai_bumon_nam', 'shukei_bumon_nam'];
  const bumonPlaceholders = uniqueList
    .map((_, index) => {
      const start = index * allColumns.length + 1;
      return `(${allColumns.map((_, i) => `$${start + i}`).join(',')})`;
    })
    .join(',');
  const bumonValues = uniqueList.flatMap((v) =>
    allColumns.map((col) => {
      const value = v[col as keyof { bumon_nam: string; dai_bumon_nam: string; shukei_bumon_nam: string }];
      return value === undefined ? null : value;
    })
  );

  try {
    await pool.query(`SET search_path TO dev5;`);

    // 現在の日付とユーザー情報を取得
    const addDat = new Date();
    const addUser = 'excel_import';
    // 既存の部門マスタIDの最大値
    const maxBumonIdResult = await pool.query(`SELECT COALESCE(MAX(bumon_id), 0) FROM m_bumon;`);
    const maxBumonId = maxBumonIdResult.rows[0].coalesce;
    // データ比較、新規登録、取得
    const data = await pool.query(
      `
      WITH imported_data(${allColumns.join(',')}) AS (
        VALUES ${bumonPlaceholders}
      )
      INSERT INTO m_bumon (
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
        m_dai_bumon AS md ON id.dai_bumon_nam = md.dai_bumon_nam
      LEFT JOIN
        m_shukei_bumon AS ms ON id.shukei_bumon_nam = ms.shukei_bumon_nam
      WHERE
        NOT EXISTS (SELECT 1 FROM m_bumon AS mb WHERE mb.bumon_nam = id.bumon_nam)
      RETURNING *;
      `,
      [...bumonValues, addDat, addUser]
    );

    if (data) {
      return data.rows;
    }
    return [];
  } catch (e) {
    throw e;
  }
};

/**
 * 棚番マスタ確認
 * @param list
 * @returns 新規登録された棚番マスタの情報
 */
const checkTanaban = async (list: TanabanImportTypes[]) => {
  try {
    // データ比較、新規登録、取得
    const { data, error } = await supabase
      .schema('dev5')
      .from('m_tanaban')
      .upsert(list, {
        onConflict: 'bld_cod, tana_cod, eda_cod',
        ignoreDuplicates: true,
        // 既存のレコードは無視
      })
      .select('bld_cod, tana_cod, eda_cod');
    if (!error) {
      return data;
    }
    return [];
  } catch (e) {
    throw e;
  }
};
