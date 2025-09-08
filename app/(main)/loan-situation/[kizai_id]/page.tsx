import { addDays, subDays } from 'date-fns';

import { confirmJuchuHeadId, getLoanJuchuData, getLoanKizaiData, getLoanStockData, getLoanUseData } from './_lib/funcs';
import { LoanStockTableValues, LoanUseTableValues } from './_lib/types';
import { LoanSituation } from './_ui/loan-situation';

const Page = async (props: { params: Promise<{ kizai_id: number }> }) => {
  const params = await props.params;
  const kizaiId = Number(params.kizai_id);

  const kizaiData = await getLoanKizaiData(kizaiId);
  console.log('-------------------kizaiData-----------------', kizaiData);
  if (!kizaiData) {
    return <div>選択された機材が存在しません。</div>;
  }

  // ヘッダー開始日
  const strDat = subDays(new Date(), 1);
  // 機材在庫データ
  const eqStockData: LoanStockTableValues[] = await getLoanStockData(kizaiId, strDat);
  // ヘッダー開始日から終了日までに該当する受注ヘッダーidリスト
  const confirmJuchuHeadIds = await confirmJuchuHeadId(strDat);
  // 貸出受注データ
  const loanJuchuData = await getLoanJuchuData(kizaiId);

  // 該当する受注ヘッダーidリストに含まれる貸出受注データのみ抽出
  const filterLoanJuchuData = loanJuchuData.filter((d) => confirmJuchuHeadIds.includes(d.juchuHeadId));

  if (filterLoanJuchuData.length === 0) {
    return <LoanSituation kizaiData={kizaiData} loanJuchuData={[]} eqUseData={[]} eqStockData={eqStockData} />;
  }

  filterLoanJuchuData.sort((a, b) => {
    const dateA = a.shukoDat ? new Date(a.shukoDat).getTime() : null;
    const dateB = b.shukoDat ? new Date(b.shukoDat).getTime() : null;

    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;

    return dateA - dateB;
  });

  const juchuHeadIds = filterLoanJuchuData.map((d) => d.juchuHeadId);

  const eqUseData: LoanUseTableValues[][] = [];
  for (const juchuHeadId of juchuHeadIds) {
    const data: LoanUseTableValues[] = await getLoanUseData(juchuHeadId, kizaiId, strDat);
    eqUseData.push(data);
  }

  return (
    <LoanSituation
      kizaiData={kizaiData}
      loanJuchuData={filterLoanJuchuData}
      eqUseData={eqUseData}
      eqStockData={eqStockData}
    />
  );
};

export default Page;
