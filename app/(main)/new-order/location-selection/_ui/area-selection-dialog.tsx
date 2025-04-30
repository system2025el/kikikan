import { Box, Button, DialogContent, DialogTitle, Grid2, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

export const AreaSelectionDialog = () => {
  return (
    <>
      <DialogTitle bgcolor={grey[300]} display={'flex'} justifyContent={'space-between'}>
        地域選択
        <Button href="/new-order/location-selection">戻る</Button>
      </DialogTitle>
      <DialogContent></DialogContent>
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  areaButton: {
    minWidth: 90,
    maxWidth: 90,
    marginTop: 2,
  },
};
/** モック用データ */
type Area = {
  name: string;
  size: number;
};
const area1List: Area[] = [
  {
    name: '北海道',
    size: 1.5,
  },
  {
    name: '沖縄',
    size: 3,
  },
  {
    name: '全て',
    size: 1.5,
  },
];
const tohokuList: Area[] = [
  {
    name: '青森',
    size: 1.5,
  },
  {
    name: '秋田',
    size: 1.5,
  },
  {
    name: '山形',
    size: 1.5,
  },
  {
    name: '福島',
    size: 1.5,
  },
  {
    name: '宮城',
    size: 1.5,
  },
  {
    name: '岩手',
    size: 1.5,
  },
];
const tokyoList: Area[] = [
  {
    name: '東京',
    size: 1.5,
  },
  {
    name: '都下',
    size: 1.5,
  },
];
const kantoList: Area[] = [
  {
    name: '神奈川',
    size: 1.5,
  },
  {
    name: '埼玉',
    size: 1.5,
  },
  {
    name: '千葉',
    size: 1.5,
  },
  {
    name: '茨城',
    size: 1.5,
  },
  {
    name: '山梨',
    size: 1.5,
  },
  {
    name: '群馬',
    size: 1.5,
  },
  {
    name: '栃木',
    size: 1.5,
  },
];

const tokaiList: Area[] = [
  {
    name: '静岡',
    size: 1.5,
  },
  {
    name: '愛知',
    size: 1.5,
  },
  {
    name: '岐阜',
    size: 1.5,
  },
  {
    name: '三重',
    size: 1.5,
  },
];

const shinetsuList: Area[] = [
  {
    name: '新潟',
    size: 1.5,
  },
  {
    name: '長野',
    size: 1.5,
  },
];

const hokurikuList: Area[] = [
  {
    name: '富山',
    size: 1.5,
  },
  {
    name: '石川',
    size: 1.5,
  },
  {
    name: '福井',
    size: 1.5,
  },
];
const kinkiList: Area[] = [
  {
    name: '大阪',
    size: 1.5,
  },
  {
    name: '京都',
    size: 1.5,
  },
  {
    name: '兵庫',
    size: 1.5,
  },
  {
    name: '滋賀',
    size: 1.5,
  },
  {
    name: '奈良',
    size: 1.5,
  },
  {
    name: '和歌山',
    size: 1.5,
  },
];
const chugokuList: Area[] = [
  {
    name: '広島',
    size: 1.5,
  },
  {
    name: '岡山',
    size: 1.5,
  },
  {
    name: '山口',
    size: 1.5,
  },
  {
    name: '島根',
    size: 1.5,
  },
  {
    name: '鳥取',
    size: 1.5,
  },
];
const shiokokuList: Area[] = [
  {
    name: '徳島',
    size: 1.5,
  },
  {
    name: '高知',
    size: 1.5,
  },
  {
    name: '愛媛',
    size: 1.5,
  },
  {
    name: '香川',
    size: 1.5,
  },
];
const kyushuList: Area[] = [
  {
    name: '福岡',
    size: 1.5,
  },
  {
    name: '長崎',
    size: 1.5,
  },
  {
    name: '鹿児島',
    size: 1.5,
  },
  {
    name: '熊本',
    size: 1.5,
  },
  {
    name: '宮崎',
    size: 1.5,
  },
  {
    name: '大分',
    size: 1.5,
  },
  {
    name: '佐賀',
    size: 1.5,
  },
];
const area2List: Area[] = [
  {
    name: '船舶',
    size: 1.5,
  },
  {
    name: 'その他',
    size: 1.5,
  },
  {
    name: '海外',
    size: 7.5,
  },
];
