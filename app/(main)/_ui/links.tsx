import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StopSharpIcon from '@mui/icons-material/StopSharp';
import {
  alpha,
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { permission } from '@/app/(main)/_lib/permission';

import { useDirty } from './dirty-context';

/* サイドバーの中身のタイプ */
type MenuItem = {
  name: string;
  url: string;
};
/* 受注管理リスト */
const orderList: MenuItem[] = [
  { name: '新規受注', url: '/order/0/edit' },
  // { name: '受注一覧', url: '/order-list' },
  { name: '受注明細一覧', url: '/eqpt-order-list' },
  { name: '在庫確認', url: '/stock' },
  { name: '貸出状況', url: '/loan-situation' },
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
  // { name: '課マスタ', url: '/sections-master' },
  // { name: '拠点マスタ', url: '/bases-master' },
  // { name: '権限マスタ', url: '/' },
  { name: '一式マスタ', url: '/isshiki-master' },
  //{ name: '担当者マスタ', url: '/users-master' },
  { name: '機材セットマスタ', url: '/eqpt-set-master' },
  { name: 'マスタインポート', url: '/masters-import' },
  { name: 'マスタエクスポート', url: '/masters-export' },
];
/* 設定リスト */
const settingList: MenuItem[] = [{ name: '担当者マスタ', url: '/users-master' }];
/* 入出庫管理リスト */
const stockIOList: MenuItem[] = [
  { name: '出庫', url: '/shuko-list' },
  { name: '入庫', url: '/nyuko-list' },
  { name: '移動', url: '/ido-list' },
  { name: 'スケジュール', url: '/schedule' },
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
  const user = useUserStore((state) => state.user);
  const { isDirty } = useDirty();
  const { requestNavigation, isPending } = useDirty();

  // /** 検索条件保持削除処理 */
  // const delSessionStorage = () => {
  //   sessionStorage.removeItem('billListSearchParams');
  //   sessionStorage.removeItem('billingStsSearchParams');
  //   sessionStorage.removeItem('orderListSearchParams');
  //   sessionStorage.removeItem('quotListSearchParams');
  // };

  /* useState -------------------------------------------- */
  /* 受注管理開閉 */
  const [orderOpen, setorderOpen] = useState<boolean>(true);
  /* プリントアウト開閉 */
  const [printOpen, setprintOpen] = useState<boolean>(true);
  /* マスタ管理開閉 */
  const [masterOpen, setmasterOpen] = useState<boolean>(true);
  /* 設定開閉 */
  const [settingOpen, setsettingOpen] = useState<boolean>(true);
  /* 入出庫管理開閉 */
  const [stockIOOpen, setStockIOOpen] = useState<boolean>(true);
  /* ログアウト開閉 */
  // const [loginOpen, setroginOpen] = useState(true);
  /** 連打制御 */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* methods ----------------------------------------- */
  /** 現ページとのpath比較 */
  const isSelected = (url: string): boolean => {
    if (pathname === url /*|| pathname.startsWith(url + '/')*/) {
      return true;
    }
    return false;
  };
  /** 受注管理クリック時 */
  const orderClick = () => {
    setorderOpen(!orderOpen);
  };
  /** プリントクリック時 */
  const printClick = () => {
    setprintOpen(!printOpen);
  };
  /** マスタ管理クリック時 */
  const masterClick = () => {
    setmasterOpen(!masterOpen);
  };
  /** 設定クリック時 */
  const settingClick = () => {
    setsettingOpen(!settingOpen);
  };
  /** 入出庫管理クリック時 */
  const stockIOClick = () => {
    setStockIOOpen(!stockIOOpen);
  };
  /* ログアウトクリック時 */
  // const loginClick = () => {
  //   setroginOpen(!loginOpen);
  // };

  /** サイドバークリックされたときの処理 */
  const handleNavigation = (pathname: string) => {
    ///setIsLoading(true);
    requestNavigation(pathname);
    // setTimeout(() => {
    //   setIsLoading(false);
    // }, 1500);
  };

  return (
    <List dense sx={{ pt: 0 }}>
      {/* ダッシュボード */}
      <ListItemButton
        onClick={() => handleNavigation('/dashboard')}
        sx={{
          backgroundColor: pathname === '/dashboard' ? currentPgColor : undefined,
        }}
        disabled={isPending}
      >
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText sx={{ color: pathname === '/dashboard' ? 'primary.dark' : undefined }}>
          ダッシュボード
        </ListItemText>
      </ListItemButton>
      {/* 受注管理 */}
      <ListItemButton
        onClick={orderClick}
        sx={{ display: user!.permission.juchu & permission.juchu_ref ? 'flex' : 'none' }}
      >
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>受注管理</ListItemText>
        {orderOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse
        in={orderOpen}
        timeout="auto"
        unmountOnExit
        sx={{ display: user!.permission.juchu & permission.juchu_ref ? 'flex' : 'none' }}
      >
        <List component="div" disablePadding>
          {orderList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
                display:
                  text.name === '新規受注' ? (user!.permission.juchu & permission.juchu_upd ? 'flex' : 'none') : 'flex',
              }}
            >
              <ListItemButton onClick={() => handleNavigation(text.url)} dense disabled={isPending}>
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
      <ListItemButton
        onClick={stockIOClick}
        sx={{ display: user!.permission.nyushuko & permission.nyushuko_ref ? 'flex' : 'none' }}
      >
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>入出庫管理</ListItemText>
        {stockIOOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse
        in={stockIOOpen}
        timeout="auto"
        unmountOnExit
        sx={{ display: user!.permission.nyushuko & permission.nyushuko_ref ? 'flex' : 'none' }}
      >
        <List disablePadding>
          {stockIOList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
              }}
            >
              <ListItemButton onClick={() => handleNavigation(text.url)} dense disabled={isPending}>
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
      <ListItemButton
        onClick={masterClick}
        sx={{ display: user!.permission.masters & permission.mst_ref ? 'flex' : 'none' }}
      >
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>マスタ管理</ListItemText>
        {masterOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse
        in={masterOpen}
        timeout="auto"
        unmountOnExit
        sx={{ display: user!.permission.masters & permission.mst_ref ? 'flex' : 'none' }}
      >
        <List component="div" disablePadding>
          {masterList.map((text, index) => (
            <Fragment key={text.name}>
              <ListItem
                key={text.name}
                disablePadding
                sx={{
                  backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
                  display:
                    text.name === 'マスタインポート' || text.name === 'マスタエクスポート'
                      ? user!.permission.masters & permission.mst_upd
                        ? 'flex'
                        : 'none'
                      : 'flex',
                }}
              >
                <ListItemButton onClick={() => handleNavigation(text.url)} dense disabled={isPending}>
                  <ListItemText
                    primary={text.name}
                    sx={{ color: isSelected(text.url) ? 'primary.dark' : undefined, pl: 8 }}
                  />
                </ListItemButton>
              </ListItem>
              {index === 9 && !!(user!.permission.masters & permission.mst_upd) && <Divider sx={{ ml: 8 }} />}
            </Fragment>
          ))}
        </List>
      </Collapse>
      {/* 設定 */}
      <ListItemButton
        onClick={settingClick}
        sx={{ display: user!.permission.loginSetting & permission.login ? 'flex' : 'none' }}
      >
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>ログイン管理</ListItemText>
        {settingOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse
        in={settingOpen}
        timeout="auto"
        unmountOnExit
        sx={{ display: user!.permission.loginSetting & permission.login ? 'flex' : 'none' }}
      >
        <List component="div" disablePadding>
          {settingList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? currentPgColor : undefined,
              }}
            >
              <ListItemButton onClick={() => handleNavigation(text.url)} dense disabled={isPending}>
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
              <ListItemButton onClick={() => requestNavigation(text.url)} dense>
                <ListItemText primary={text.name} sx={{ color: isSelected(text.url) ? 'primary.dark' : undefined, pl: 8 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse> */}
      <ListItemButton onClick={() => handleNavigation('/')} disabled={isPending}>
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
