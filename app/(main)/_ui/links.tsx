import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StopSharpIcon from '@mui/icons-material/StopSharp';
import {
  alpha,
  Box,
  Collapse,
  Divider,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';

import { useDirty } from './dirty-context';

/* サイドバーの中身のタイプ */
type MenuItem = {
  name: string;
  url: string;
};
/* 受注管理リスト */
const orderList: MenuItem[] = [
  { name: '新規受注', url: '/order/0/edit' },
  { name: '受注一覧', url: '/order-list' },
  { name: '在庫確認', url: '/stock' },
  { name: '機材一覧', url: '/loan-situation' },
  { name: '見積一覧', url: '/quotation-list' },
  { name: '請求一覧', url: '/bill-list' },
  { name: '請求状況一覧', url: '/billing-sts-list' },
];
/* マスタ管理リスト */
const masterList: MenuItem[] = [
  { name: '機材マスタ', url: '/eqpt-master' },
  { name: '顧客マスタ', url: '/customers-master' },
  { name: '車両マスタ', url: '/vehicles-master' },
  { name: '公演場所マスタ', url: '/locations-master' },
  { name: '大部門マスタ', url: '/daibumons-master' },
  { name: '集計部門マスタ', url: '/shukeibumons-master' },
  { name: '部門マスタ', url: '/bumons-master' },
  // { name: '拠点マスタ', url: '/bases-master' },
  { name: '権限マスタ', url: '/' },
  { name: '一式マスタ', url: '/' },
  { name: '担当者マスタ', url: '/users-master' },
  { name: '機材セットマスタ', url: '/eqpt-bundle-master' },
  { name: 'マスタインポート', url: '/masters-import' },
  { name: 'マスタエクスポート', url: '/masters-export' },
];
/* 設定リスト */
const settingList: MenuItem[] = [];
/* 入出庫管理リスト */
const stockIOList: MenuItem[] = [
  { name: '出庫', url: '/shuko-list' },
  { name: '入庫', url: '/nyuko-list' },
  { name: '移動', url: '/ido-list' },
  { name: 'Weeklyスケジュール', url: '/' },
];
/* ログアウトリスト */
// const loginList: MenuItem[] = [{ name: 'ログアウト', url: '/' }];

/**
 * サイドバー
 * @returns サイドバーのコンポーネント
 */
export default function NavLinks() {
  /* 現在のページの色 */
  const theme = useTheme();
  const currentPgColor = alpha(theme.palette.primary.light, 0.2);
  /* 現在のページのpath */
  const pathname = usePathname();
  /*  */
  const router = useRouter();
  const { isDirty } = useDirty();
  const { requestNavigation } = useDirty();

  /* useState -------------------------------------------- */
  /* 受注管理開閉 */
  const [orderOpen, setorderOpen] = useState(true);
  /* プリントアウト開閉 */
  const [printOpen, setprintOpen] = useState(true);
  /* マスタ管理開閉 */
  const [masterOpen, setmasterOpen] = useState(true);
  /* 設定開閉 */
  const [settingOpen, setsettingOpen] = useState(true);
  /* 入出庫管理開閉 */
  const [stockIOOpen, setStockIOOpen] = useState(true);
  /* ログアウト開閉 */
  // const [loginOpen, setroginOpen] = useState(true);

  /* methods ----------------------------------------- */
  /* 現ページとのpath比較 */
  const isSelected = (url: string): boolean => {
    if (pathname === url /*|| pathname.startsWith(url + '/')*/) {
      return true;
    }
    return false;
  };
  /* 受注管理クリック時 */
  const orderClick = () => {
    setorderOpen(!orderOpen);
  };
  /* プリントクリック時 */
  const printClick = () => {
    setprintOpen(!printOpen);
  };
  /* マスタ管理クリック時 */
  const masterClick = () => {
    setmasterOpen(!masterOpen);
  };
  /* 設定クリック時 */
  const settingClick = () => {
    setsettingOpen(!settingOpen);
  };
  /* 入出庫管理クリック時 */
  const stockIOClick = () => {
    setStockIOOpen(!stockIOOpen);
  };
  /* ログアウトクリック時 */
  // const loginClick = () => {
  //   setroginOpen(!loginOpen);
  // };

  return (
    <List dense sx={{ pt: 0 }}>
      {/* ダッシュボード */}
      <ListItemButton
        href="/dashboard"
        sx={{
          backgroundColor: pathname === '/dashboard' ? currentPgColor : undefined,
        }}
      >
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText sx={{ color: pathname === '/dashboard' ? 'primary.dark' : undefined }}>
          ダッシュボード
        </ListItemText>
      </ListItemButton>
      {/* 受注管理 */}
      <ListItemButton onClick={orderClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>受注管理</ListItemText>
        {orderOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={orderOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {orderList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
              }}
            >
              <ListItemButton /*href={text.url}*/ onClick={() => requestNavigation(text.url)} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? 'primary.dark' : undefined, pl: 8 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
      {/* 入出庫管理 */}
      <ListItemButton onClick={stockIOClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>入出庫管理</ListItemText>
        {stockIOOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={stockIOOpen} timeout="auto" unmountOnExit>
        <List disablePadding>
          {stockIOList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? 'primary.dark' : undefined, pl: 8 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
      {/* マスタ管理 */}
      <ListItemButton onClick={masterClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>マスタ管理</ListItemText>
        {masterOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={masterOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {masterList.map((text, index) => (
            <Fragment key={text.name}>
              <ListItem
                key={text.name}
                disablePadding
                sx={{
                  backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
                }}
              >
                <ListItemButton href={text.url} dense>
                  <ListItemText
                    primary={text.name}
                    sx={{ color: isSelected(text.url) ? 'primary.dark' : undefined, pl: 8 }}
                  />
                </ListItemButton>
              </ListItem>
              {index === 10 && <Divider sx={{ ml: 8 }} />}
            </Fragment>
          ))}
        </List>
      </Collapse>
      {/* 設定 */}
      <ListItemButton onClick={settingClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>設定</ListItemText>
        {settingOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={settingOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {settingList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? 'primary.dark' : undefined, pl: 8 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      {/* ログアウト */}
      {/* <ListItemButton onClick={loginClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>ログアウト</ListItemText>
        {loginOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={loginOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {loginList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText primary={text.name} sx={{ color: isSelected(text.url) ? 'primary.dark' : undefined, pl: 8 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse> */}
      <ListItemButton href="/">
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>ログアウト</ListItemText>
      </ListItemButton>
      {/* 一番下が見づらいので空白 */}
      <ListItem>
        <Box height={50}></Box>
      </ListItem>
    </List>
  );
}

/** ------------------------スタイル----------------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  colorWhite: {
    color: undefined,
  },
};
