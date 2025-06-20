export const vMHeader = [
  { key: 'check', label: '' },
  { key: 'vehicleType', label: '車両タイプ' },
  { key: 'memo', label: 'メモ' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
];

/**---------車両データ------------ */
type VehicleData = {
  id: number;
  vehicleType: string;
  memo: string;
};

export const vehicles: VehicleData[] = [
  {
    id: 1,
    vehicleType: '不明',
    memo: '',
  },
  {
    id: 2,
    vehicleType: '1t',
    memo: '',
  },
  {
    id: 3,
    vehicleType: '2t',
    memo: '',
  },
  {
    id: 4,
    vehicleType: '3t',
    memo: '',
  },
  {
    id: 5,
    vehicleType: '4t',
    memo: '',
  },
  {
    id: 6,
    vehicleType: '11t',
    memo: '',
  },
  {
    id: 7,
    vehicleType: 'ハイエース',
    memo: '',
  },
];
