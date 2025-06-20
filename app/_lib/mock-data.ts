/** -------見積-------- */
const enum QuotationStatus {
  processing = '処理中',
  processed = '処理済み',
}

type QuotaionData = {
  id: number;
  quoteNumber: string;
  status: QuotationStatus;
  name: string;
  customerName: string;
  quotationDate: string;
  invoiceNumber: string;
  quotationmemo: string;
};

export const quotaionList: QuotaionData[] = [
  {
    id: 1,

    status: QuotationStatus.processed,
    name: 'A / Zepp Tour',
    customerName: '(株)シアターブレーン',
    quoteNumber: '81694',
    quotationDate: '2025/10/01',
    invoiceNumber: '',
    quotationmemo: 'XXXXXXXXXXXXX',
  },
  {
    id: 2,
    status: QuotationStatus.processing,
    name: 'A / Zepp Tour',
    customerName: '(株)シアターブレーン',
    quoteNumber: '81695',
    quotationDate: '2025/10/02',
    invoiceNumber: '9999999',
    quotationmemo: 'XXXXXXXX',
  },
  {
    id: 3,
    status: QuotationStatus.processed,
    name: '公演1',
    customerName: '顧客A',
    quoteNumber: '81696',
    quotationDate: '2025/10/03',
    invoiceNumber: '',
    quotationmemo: 'X',
  },
];
