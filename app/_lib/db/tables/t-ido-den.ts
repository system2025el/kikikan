'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { IdoDen } from '../types/t-ido-den-type';

/**
 * 移動伝票id最大値取得
 * @returns
 */
export const selectIdoDenMaxId = async () => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_den')
      .select('ido_den_id')
      .order('ido_den_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw new Error('[selectIdoDenMaxId] DBエラー:', { cause: e });
  }
};

/**
 * 移動伝票新規追加
 * @param data 移動伝票データ
 * @param connection
 */
export const insertIdoDen = async (data: IdoDen[], connection: PoolClient) => {
  const cols = Object.keys(data[0]) as (keyof (typeof data)[0])[];
  const values = data.flatMap((obj) => cols.map((col) => obj[col] ?? null));
  let placeholderIndex = 1;
  const placeholders = data
    .map(() => {
      const rowPlaceholders = cols.map(() => `$${placeholderIndex++}`);
      return `(${rowPlaceholders.join(', ')})`;
    })
    .join(', ');

  const query = `
    INSERT INTO
      ${SCHEMA}.t_ido_den (${cols.join(',')})
    VALUES 
      ${placeholders}
  `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[insertIdoDen] DBエラー:', { cause: e });
  }
};

/**
 * 移動伝票更新
 * @param data 移動伝票データ
 * @param connection
 */
export const updateIdoDen = async (data: IdoDen, connection: PoolClient) => {
  // 受注2列まで含めないと、同じ機材の別明細の行まで巻き込んで更新してしまう。
  // 手動追加行は 0 / 0 なので、呼び出し側は必ず両方を埋めて渡すこと
  const whereKeys = [
    'sagyo_kbn_id',
    'sagyo_siji_id',
    'sagyo_den_dat',
    'sagyo_id',
    'kizai_id',
    'juchu_head_id',
    'juchu_kizai_head_id',
  ] as const;

  const allKeys = Object.keys(data) as (keyof typeof data)[];

  const updateKeys = allKeys.filter(
    (key) => !(whereKeys as readonly string[]).includes(key) && !(key === 'ido_den_id')
  );

  if (updateKeys.length === 0) {
    throw new Error('No columns to update.');
  }

  // 受注2列は IdoDen 型では任意（DB側に DEFAULT 0 があるため）なので、
  // 渡し忘れても型では気づけない。undefined のまま WHERE に入ると NULL 比較になり、
  // エラーも出さず1行も更新しないまま終わる。ここで止める
  if (data.juchu_head_id === undefined || data.juchu_kizai_head_id === undefined) {
    throw new Error('[updateIdoDen] juchu_head_id / juchu_kizai_head_id は必須です（手動追加行は0を渡すこと）');
  }

  const allValues: (string | number | null | undefined)[] = [];
  let placeholderIndex = 1;

  const setClause = updateKeys
    .map((key) => {
      allValues.push(data[key]);
      return `${key} = $${placeholderIndex++}`;
    })
    .join(', ');

  const whereClause = whereKeys
    .map((key) => {
      allValues.push(data[key]);
      return `${key} = $${placeholderIndex++}`;
    })
    .join(' AND ');

  const query = `
      UPDATE
        ${SCHEMA}.t_ido_den
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw new Error('[updateIdoDen] DBエラー:', { cause: e });
  }
};

/**
 * 移動伝票削除（受注機材ヘッダー単位）
 *
 * 作業区分を絞っていないので、移動出庫(40)と移動入庫(50)の両方がまとめて消える。
 * 移動は「積んで運んで降ろす」で1セットなので、片側だけ残っても意味がないため。
 *
 * ★ 受注2列を必ず指定すること。省くと同じ機材の他の公演の明細まで消える。
 *   画面の削除ボタンは juchuFlg = 0 の行（手動追加・受注削除後）にしか出ないが、
 *   そこでも「その機材の全明細」ではなく「その明細だけ」を消すのが正しい。
 * @param deleteData 削除対象の明細キー
 * @param connection
 */
export const deleteIdoDen = async (
  deleteData: {
    sagyo_siji_id: number;
    sagyo_den_dat: string;
    kizai_id: number;
    juchu_head_id: number;
    juchu_kizai_head_id: number;
  },
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_ido_den
    WHERE
      sagyo_siji_id = $1
      AND sagyo_den_dat = $2
      AND kizai_id = $3
      AND juchu_head_id = $4
      AND juchu_kizai_head_id = $5
  `;

  const values = [
    deleteData.sagyo_siji_id,
    deleteData.sagyo_den_dat,
    deleteData.kizai_id,
    deleteData.juchu_head_id,
    deleteData.juchu_kizai_head_id,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteIdoDen] DBエラー:', { cause: e });
  }
};
