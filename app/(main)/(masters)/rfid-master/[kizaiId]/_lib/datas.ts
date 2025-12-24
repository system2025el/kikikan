import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { RfidsMasterDialogValues, RfidsMasterTableValues } from './types';

/*  */
export const emptyRfid: RfidsMasterDialogValues = {
  elNum: 0,
  delFlg: false,
  shozokuId: 0,
  mem: '',
  tagId: '',
  rfidKizaiSts: 0,
};

/*  */
export const formItems: FormItemsType[] = [
  {
    label: 'RFID',
    exsample: '',
    constraints: '24文字',
  },
  {
    label: 'EL No.',
    exsample: '',
    constraints: '1以上の整数',
  },
  {
    label: '入庫拠点',
    exsample: '',
    constraints: 'リスト選択',
  },
  {
    label: '機材ステータス',
    exsample: 'リスト選択',
    constraints: '',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
];
