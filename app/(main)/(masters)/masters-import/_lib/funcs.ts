'use server';

import { ZodError, ZodIssue } from 'zod';

import pool from '@/app/_lib/db/postgres';
import {
  checkBumon,
  checkDaibumon,
  checkKizai,
  checkRfid,
  checkShukeibumon,
  checkTanaban,
} from '@/app/_lib/db/tables/masters-import';

import { EqptImportType, KizaiImportTypes, RfidImportTypes, TanabanImportTypes } from './types';

/**
 * 機材RFIDマスタ表インポート
 */

/**
 * エクセルインポートしたものをDBに収納する処理
 * @param data エクセルから取得したデータの配列
 */
export const ImportEqptRfidData = async (data: EqptImportType[], user: string) => {
  // console.log(data);
  console.log('=================== インポートするよ ====================');
  // 現在時刻
  const now = new Date().toISOString();

  console.log('=================== データの整理開始 ====================');
  /* 重複のない棚番用データ */
  const tanabanList: TanabanImportTypes[] = Array.from(
    new Map(
      data
        .filter(({ bld_cod, del_flg }) => bld_cod && bld_cod.trim() !== '' && del_flg === 0)
        .map(({ bld_cod, tana_cod, eda_cod }) => ({ bld_cod, tana_cod, eda_cod }))
        .map((d) => [`${d.bld_cod}-${d.tana_cod}-${d.eda_cod}`, d])
    ).values()
  );
  /* 重複のない大部門用データ */
  const daibumonNamList = [
    ...new Set(
      data
        .filter((d) => d.dai_bumon_nam && d.dai_bumon_nam.trim() !== '' && d.del_flg === 0)
        .map((d) => d.dai_bumon_nam!)
    ),
  ];
  /* 重複のない集計部門用データ */
  const shukeibumonNamList = [
    ...new Set(
      data
        .filter((d) => d.shukei_bumon_nam && d.shukei_bumon_nam.trim() !== '' && d.del_flg === 0)
        .map((d) => d.shukei_bumon_nam!)
    ),
  ];
  /* 重複のない部門用データ */
  const bumonNamList = Array.from(
    new Map(
      data
        .filter((d) => d.bumon_nam && d.bumon_nam.trim() !== '' && d.del_flg === 0)
        .map((d) => ({
          bumon_nam: d.bumon_nam!,
          dai_bumon_nam: d.dai_bumon_nam!,
          shukei_bumon_nam: d.shukei_bumon_nam!,
        }))
        .map((v) => [v.bumon_nam, v])
    ).values()
  );
  /* 重複のない機材マスタ用データ */
  const kizaiMasterList: KizaiImportTypes[] = Array.from(
    new Map(
      data
        .filter((d) => d.kizai_nam && d.kizai_nam.trim() !== '' && d.del_flg === 0)
        .map((d) => ({
          kizai_nam: d.kizai_nam,
          section_nam: d.section_nam,
          shozoku_id: d.shozoku_id,
          bld_cod: d.bld_cod,
          tana_cod: d.tana_cod,
          eda_cod: d.eda_cod,
          kizai_grp_cod: d.kizai_grp_cod,
          dsp_ord_num: d.dsp_ord_num,
          mem: d.mem,
          bumon_nam: d.bumon_nam,
          shukei_bumon_nam: d.shukei_bumon_nam,
          dsp_flg: d.dsp_flg,
          ctn_flg: d.ctn_flg,
          def_dat_qty: d.def_dat_qty,
          reg_amt: d.reg_amt,
          // rank_amt_1: d.rank_amt_1,
          // rank_amt_2: d.rank_amt_2,
          // rank_amt_3: d.rank_amt_3,
          // rank_amt_4: d.rank_amt_4,
          // rank_amt_5: d.rank_amt_5,
        }))
        .map((v) => [v.kizai_nam, v])
    ).values()
  );
  /* 重複のないRFID用データ */
  const rfidList: RfidImportTypes[] = Array.from(
    new Map(
      data
        .map((d) => ({
          rfid_tag_id: d.rfid_tag_id,
          kizai_nam: d.kizai_nam,
          rfid_kizai_sts: d.rfid_kizai_sts,
          del_flg: d.del_flg,
          shozoku_id: d.shozoku_id,
          el_num: d.el_num,
          mem: d.del_flg === 1 ? d.mem : null,
        }))
        .filter((d) => d.rfid_tag_id && d.rfid_tag_id.trim() !== '')
        .map((v) => [v.rfid_tag_id, v])
    ).values()
  );

  console.log('=================== データの整理終了 ====================');

  /* トランザクション */
  const connection = await pool.connect();

  try {
    // トランザクション開始
    await connection.query('BEGIN');

    const tanabans = await checkTanaban(tanabanList, connection, user, now);
    console.log('棚番', tanabans.length, '件追加');
    const daibumons = await checkDaibumon(daibumonNamList, connection, user, now);
    console.log('大部門', daibumons.length, '件追加');
    const shukeibumons = await checkShukeibumon(shukeibumonNamList, connection, user, now);
    console.log('集計部門', shukeibumons.length, '件追加');
    const bumons = await checkBumon(bumonNamList, connection, user, now);
    console.log('部門', bumons.length, '件追加');
    const kizais = await checkKizai(kizaiMasterList, connection, user, now);
    console.log('機材マスタ', kizais.length, '件追加');
    await checkRfid(rfidList, connection, user, now);
    // すべて成功でコミット
    await connection.query('COMMIT');
  } catch (e) {
    console.error('例外が発生', e);
    // エラーでロールバック
    await connection.query('ROLLBACK');
    console.log('インポートエラー', e);
    throw new Error('例外が発生：DBエラー,ROLLBACK');
  } finally {
    // なんにしてもpool解放
    connection.release();
  }
};

/**
 * エラー出力関数
 * @param index エラーのある行番
 * @param error エラー内容
 */
export const sendLogServer = async (index: number, error: ZodIssue[]) => {
  console.log(`${index} 行目でバリデーションエラー:`, error);
};
