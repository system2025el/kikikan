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

const testData = [
  {
    id: 1,
    name: 'SHARPY PLUS',
    memo: '',
    place: 'KICS',
    all: 148,
    order: 0,
    spare: 0,
    total: 0,
  },
  {
    id: 2,
    name: 'ROBIN T2 Profile',
    memo: '',
    place: 'KICS',
    all: 55,
    order: 0,
    spare: 0,
    total: 0,
  },
  {
    id: 3,
    name: 'Sharpy X Spot',
    memo: '',
    place: 'KICS',
    all: 26,
    order: 0,
    spare: 0,
    total: 0,
  },
  {
    id: 4,
    name: 'VL6000 Beam',
    memo: '',
    place: 'YARD',
    all: 27,
    order: 0,
    spare: 0,
    total: 0,
  },
  {
    id: 5,
    name: 'Arolla Profile MP',
    memo: '',
    place: 'YARD',
    all: 28,
    order: 0,
    spare: 0,
    total: 0,
  },
  {
    id: 6,
    name: '20D電源BOX 3相専用（12口）',
    memo: '',
    place: 'YARD',
    all: 44,
    order: 0,
    spare: 0,
    total: 0,
  },
  {
    id: 7,
    name: 'XXXXXXXXXXXX',
    memo: '',
    place: 'YARD',
    all: 45,
    order: 0,
    spare: 0,
    total: 0,
  },
];

const data = [
  {
    id: 1,
    data: ['SHARPY PLUS', '', 'KICS', 148, 0, 0, 0],
  },
  {
    id: 2,
    data: ['ROBIN T2 Profile', '', 'KICS', 55, 0, 0, 0],
  },
  {
    id: 3,
    data: ['Sharpy X Spot', '', 'KICS', 26, 0, 0, 0],
  },
  {
    id: 4,
    data: ['VL6000 Beam', '', 'YARD', 27, 0, 0, 0],
  },
  {
    id: 5,
    data: ['Arolla Profile MP', '', 'YARD', 28, 0, 0, 0],
  },
  {
    id: 6,
    data: ['20D電源BOX 3相専用（12口）', '', 'YARD', 44, 0, 0, 0],
  },
  {
    id: 7,
    data: ['XXXXXXXXXXXX', '', 'YARD', 45, 0, 0, 0],
  },
];

const stock = [148, 55, 26, 26, 26, 26, 26];

const cellWidths = ['65%', '5%', '5%', '5%', '5%', '5%', '5%', '5%'];

const header = ['機材名', 'メモ', '在庫場所', '全', '受注数', '予備数', '合計'];

const dateWidths = [''];

export { cellWidths, columns, data, dateWidths, header, rows, stock, testData };
