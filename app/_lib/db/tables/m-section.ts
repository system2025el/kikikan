'use server';

import { toJapanTimeStampString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { SectionsMasterDialogValues } from '@/app/(main)/(masters)/sections-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MSectionDBValues } from '../types/m-section-type';

/**
 * DBから有効な課を取得する関数
 * @returns 有効な課のidと名前の配列
 */
export const selectActiveSections = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_section')
      .select('section_id, section_nam, section_nam_short')
      .neq('del_flg', 1)
      .order('section_id');
  } catch (e) {
    throw e;
  }
};

/**
 * section_namが一致する課を取得する関数
 * @param {string} query 課名
 * @returns section_nameで検索された課マスタの配列 検索無しなら全件
 */
export const selectFilteredSections = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_section')
    .select('section_id, section_nam, section_nam_short, mem, del_flg') // テーブルに表示するカラム
    .order('section_nam'); // 並び順

  if (query && query.trim() !== '') {
    builder.ilike('section_nam', `%${query}%`);
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * section_idが一致する課を取得する関数
 * @param id 探すsection_id
 * @returns section_idが一致する課
 */
export const selectOneSection = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_section')
      .select('section_nam, section_nam_short, del_flg, mem')
      .eq('section_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 課マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewSection = async (data: SectionsMasterDialogValues, user: string) => {
  const query = `
    INSERT INTO ${SCHEMA}.m_section (
      section_id, section_nam, section_nam_short, del_flg, dsp_ord_num,
      mem, add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(section_id),0) + 1 FROM ${SCHEMA}.m_section),
      $1, $2, $3,
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_section),
      $4, $5, $6
    );
  `;
  const date = toJapanTimeStampString();
  const values = [data.sectionNam, data.sectionNamShort, Number(data.delFlg), data.mem, date, user];

  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 課マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する課のsection_id
 */
export const upDateSectionDB = async (data: MSectionDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_section')
      .update({ ...data })
      .eq('section_id', data.section_id);
  } catch (e) {
    throw e;
  }
};
