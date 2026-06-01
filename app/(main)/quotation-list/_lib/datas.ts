import { SelectTypes } from '@/app/(main)/_ui/form-box';

export const quotation = [
  { label: '（株）シアターブレーン', id: 1 },
  { label: '（株）リファクト', id: 2 },
];

export const terms = [{ label: 'aaa', id: 1 }];

export const quotationHeaders = [
  { key: 'name', label: '名称' },
  { key: 'unitprice', label: '単価' },
  { key: 'quantity', label: '数量' },
  { key: 'spare', label: '予備数' },
  { key: 'days', label: '日数' },
  { key: 'price', label: '価格' },
  { key: 'tax', label: '税' },
  { key: 'memo', label: '機材メモ' },
];

export const quotationLaborSelectItems: SelectTypes[] = [
  { id: 'チーフ', label: 'チーフ' },
  { id: 'サブチーフ', label: 'サブチーフ' },
  { id: 'システム', label: 'システム' },
  { id: '機材テク', label: '機材テク' },
  { id: '卓OP', label: '卓OP' },
  { id: '卓ケア', label: '卓ケア' },
  { id: 'PINチーフ', label: 'PINチーフ' },
  { id: 'PIN', label: 'PIN' },
  { id: 'ROBOテク', label: 'ROBOテク' },
  { id: '現地', label: '現地' },
];

export const quotationRows = [
  {
    id: 1,
    name: 'SHARPY',
    unitprice: 12000,
    quantity: 2,
    spare: 1,
    days: 3,
    price: 72000,
    tax: '外税',
    memo: 'XXX',
  },
  {
    id: 2,
    name: 'SHARPY',
    unitprice: 25000,
    quantity: 3,
    spare: 1,
    days: 4,
    price: 300000,
    tax: '外税',
    memo: 'XXX',
  },
  {
    id: 3,
    name: 'SHARPY',
    unitprice: 12000,
    quantity: 2,
    spare: 1,
    days: 3,
    price: 72000,
    tax: '外税',
    memo: 'XXX',
  },
  {
    id: 4,
    name: 'SHARPY',
    unitprice: 12000,
    quantity: 2,
    spare: 1,
    days: 3,
    price: 72000,
    tax: '外税',
    memo: 'XXX',
  },
  {
    id: 5,
    name: 'SHARPY',
    unitprice: 12000,
    quantity: 2,
    spare: 1,
    days: 3,
    price: 72000,
    tax: '外税',
    memo: 'XXX',
  },
];
