import { GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'set', headerName: 'セット(1)', width: 150 },
  { field: 'all', headerName: '全', editable: false },
  { field: 'orders', headerName: '受注数', editable: true },
  { field: 'spare', headerName: '入力欄', editable: true },
  { field: 'total', headerName: '合計', editable: false },
  { field: 'memo', headerName: '機材メモ', editable: true, width: 230 },
];

const rows = [
  { id: 1, set: 'SHARPY PLUS', all: 148, orders: 2, spare: 1, total: 3, memo: '' },
  { id: 2, set: 'ROBIN T2 Profile', all: 26, orders: 3, spare: 1, total: 4, memo: '' },
];

const data = [
  {
    id: 1,
    data: ['SHARPY PLUS', '148', '2', '1', '3', ''],
  },
  {
    id: 2,
    data: ['ROBIN T2 Profile', '26', '3', '1', '4', ''],
  },
];

const header = ['セット(1)', '全', '受注数', '予備数', '合計', '機材メモ'];

export { columns, data, header, rows };
