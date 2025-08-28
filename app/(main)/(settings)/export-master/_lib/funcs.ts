'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { utils } from 'xlsx';

import pool from '@/app/_lib/db/postgres';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

export const getAllEqptAndRfid = async () => {
  try {
    await pool.query(`SET search_path TO dev5;`);

    const query = `
        SELECT
          mr.rfid_tag_id, 
          mr.rfid_kizai_sts, 
          mr.del_flg, 
          mk.section_num, 
          mk.kizai_nam, 
          mk.el_num, 
          mr.shozoku_id,
          mk.bld_cod, 
          mk.tana_cod, 
          mk.eda_cod, 
          mk.kizai_grp_cod, 
          mk.dsp_ord_num, 
          mr.mem, 
          md.dai_bumon_nam, 
          mb.bumon_nam, 
          ms.shukei_bumon_nam,
          mk.dsp_flg, 
          mk.ctn_flg, 
          mk.def_dat_qty, 
          mk.reg_amt, 
          mk.rank_amt_1, 
          mk.rank_amt_2, 
          mk.rank_amt_3, 
          mk.rank_amt_4, 
          mk.rank_amt_5 
        FROM m_rfid AS mr
        LEFT JOIN m_kizai AS mk ON mr.kizai_id = mk.kizai_id
        LEFT JOIN m_bumon AS mb ON mk.bumon_id = mb.bumon_id
        LEFT JOIN m_dai_bumon AS md ON mk.dai_bumon_id = md.dai_bumon_id
        LEFT JOIN m_shukei_bumon AS ms ON mk.shukei_bumon_id = ms.shukei_bumon_id
        ORDER BY mr.rfid_tag_id
      `;

    const result = await pool.query(query);

    console.log('I got a datalist from db', result.rowCount);

    // データをAOAけいしきに
    if (result && result.rows) {
      const aoaData = result.rows.map((row) => [
        row.rfid_tag_id,
        row.rfid_kizai_sts,
        row.del_flg,
        row.section_nam,
        row.kizai_nam,
        row.el_num,
        row.shozoku_id,
        row.bld_cod,
        row.tana_cod,
        row.eda_cod,
        row.kizai_grp_cod,
        row.dsp_ord_num,
        row.mem,
        row.dai_bumon_nam,
        row.bumon_nam,
        row.shukei_bumon_nam,
        row.dsp_flg,
        row.ctn_flg,
        row.def_dat_qty,
        row.reg_amt,
        row.rank_amt_1,
        row.rank_amt_2,
        row.rank_amt_3,
        row.rank_amt_4,
        row.rank_amt_5,
      ]);
      // ヘッダーの日本語名
      const header = [
        'RFIDタグID ※必須',
        'RFID機材ステータス ※必須',
        '無効化フラグ ※必須',
        '[0]所属無、[1]Ⅰ課、[2]Ⅱ課、[3]Ⅲ課、[4]Ⅳ課、[5]Ⅴ課',
        '機材名 ※必須',
        'EL No.',
        '機材所属ID ※必須',
        '棟フロアコード',
        '棚コード',
        '枝コード',
        '機材グループコード',
        '機材グループ内表示順',
        '機材マスタメモ',
        '大部門名',
        '部門名',
        '集計部門名',
        '表示フラグ',
        'コンテナフラグ',
        'デフォルト日数',
        '定価',
        'ランク価格１',
        'ランク価格２',
        'ランク価格３',
        'ランク価格４',
        'ランク価格５',
      ];

      //  AOA (Array of Arrays) 形式でワークシートを作成
      const worksheet = utils.aoa_to_sheet([header, ...aoaData]);

      // ループ処理のためにセル範囲を出す
      const range = utils.decode_range(worksheet['!ref'] || '');
      // セルが文字列でいてほしいカラムのインデックス
      const targetCols = [0, 4, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22, 23, 24];
      for (let row = 1; row <= range.e.r; ++row) {
        for (const colIndex of targetCols) {
          if (colIndex > range.e.c) continue;
          const cellAddress = utils.encode_cell({ r: row, c: colIndex });
          const cell = worksheet[cellAddress];
          if (cell) {
            cell.t = 's';
            cell.z = '@';
          }
        }
      }

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      // 現在の日付を東京タイムゾーンで取得
      const now = dayjs().tz('Asia/Tokyo');
      const date = now.format('YYYYMMDDHHmmss');

      return { workbook, date };
    }
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};
