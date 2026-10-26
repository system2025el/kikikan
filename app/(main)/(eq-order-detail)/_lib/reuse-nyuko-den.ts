/**
 * 返却・キープ明細で機材・コンテナを追加するときに、HT・ゲートが先に作った入庫伝票（受注明細の無いもの）の
 * 明細idを使い回すための選び出し関数を作る
 *
 * 親機材として読んだ分を送ると、送信RPCは親の表示順で入庫伝票だけを作る。その後に返却・キープ明細で同じ機材を
 * 追加すると、新しい明細idで別の伝票ができて同じ機材が2行になるため、同じ機材・同じ表示順の伝票があれば
 * その明細idで明細を作る（入庫伝票は upsert で作るので、既存の伝票に合流し、読取の実績も残る）。
 * 逆の順番（先に明細を追加し、後から送信）は送信RPCが既存の伝票に合流させるので、両方そろう。
 *
 * 1つの伝票の明細idは1回しか使わない（同じ機材・表示順の行を2つ追加しても、2つ目は新しい明細idになる）。
 * @param rows selectNyukoDenWithoutMeisaiTx の結果
 * @returns (コンテナか, 機材id, 表示順) から使い回す明細idを返す関数（無ければ null）
 */
export const createNyukoDenMeisaiIdPicker = (
  rows: { juchu_kizai_meisai_id: number; kizai_id: number; dsp_ord_num: number; ctn_flg: number }[]
) => {
  const remaining = [...rows];
  return (isCtn: boolean, kizaiId: number, dspOrdNum: number): number | null => {
    const index = remaining.findIndex(
      (r) => (r.ctn_flg === 1) === isCtn && r.kizai_id === kizaiId && r.dsp_ord_num === dspOrdNum
    );
    if (index < 0) return null;
    const [picked] = remaining.splice(index, 1);
    return picked.juchu_kizai_meisai_id;
  };
};
