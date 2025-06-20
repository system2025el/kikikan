import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StopSharpIcon from '@mui/icons-material/StopSharp';
import {
  alpha,
  Collapse,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type MenuItem = {
  name: string;
  url: string;
};

const dashboardList: MenuItem[] = [{ name: 'ダッシュボード', url: '/dashboard' }];
const orderList: MenuItem[] = [
  { name: '新規受注', url: '/new-order' },
  { name: '受注一覧', url: '/order-list' },
  { name: '見積一覧', url: '/quotation-list' },
  { name: '在庫確認', url: '/stock' },
  { name: '出庫履歴', url: '/' },
  { name: '貸出状況', url: '/loan-situation' },
];
const printList: MenuItem[] = [
  { name: '出庫指示書', url: '/' },
  { name: '出庫リスト', url: '/' },
  { name: '納品書', url: '/' },
  { name: '請求書', url: '/' },
];
const rateList: MenuItem[] = [{ name: '稼働率', url: '/' }];
const equipmentList: MenuItem[] = [{ name: '機材マスタ', url: '/equipment' }];
const masterList: MenuItem[] = [
  { name: '顧客マスタ', url: '/customers-master' },
  { name: '車両マスタ', url: '/vehicles-master' },
  { name: '場所マスタ', url: '/location-master' },
  { name: '担当者マスタ', url: '/' },
  { name: '権限マスタ', url: '/' },
  { name: '一式マスタ', url: '/' },
  { name: '大部門マスタ', url: '/' },
  { name: '集計部門マスタ', url: '/' },
  { name: '口座マスタ', url: '/' },
  { name: '拠点マスタ', url: '/' },
];
const settingList: MenuItem[] = [
  { name: 'データ', url: '/' },
  { name: '表示', url: '/' },
  { name: '会社情報', url: '/' },
  { name: '価格改定', url: '/' },
];
const loginList: MenuItem[] = [
  { name: 'ログアウト', url: '/' },
  { name: 'ログイン管理', url: '/' },
];

export default function NavLinks() {
  const theme = useTheme();
  const selectedBgColor = alpha(theme.palette.primary.light, 0.2);
  const pathname = usePathname();

  const isSelected = (url: string) => {
    if (pathname === url /*|| pathname.startsWith(url + '/')*/) {
      return true;
    }
    return false;
  };

  const [orderOpen, setorderOpen] = useState(true);
  const [printOpen, setprintOpen] = useState(true);
  const [rateOpen, setrateOpen] = useState(true);
  const [equipmentOpen, setequipmentOpen] = useState(true);
  const [masterOpen, setmasterOpen] = useState(true);
  const [settingOpen, setsettingOpen] = useState(true);
  const [loginOpen, setroginOpen] = useState(true);

  const orderClick = () => {
    setorderOpen(!orderOpen);
  };
  const printClick = () => {
    setprintOpen(!printOpen);
  };
  const rateClick = () => {
    setrateOpen(!rateOpen);
  };
  const equipmentClick = () => {
    setequipmentOpen(!equipmentOpen);
  };
  const masterClick = () => {
    setmasterOpen(!masterOpen);
  };
  const settingClick = () => {
    setsettingOpen(!settingOpen);
  };
  const loginClick = () => {
    setroginOpen(!loginOpen);
  };

  return (
    <List dense sx={{ pt: 0 }}>
      <ListItemButton
        href="/dashboard"
        sx={{
          backgroundColor: pathname === '/dashboard' ? selectedBgColor : '',
        }}
      >
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText sx={{ color: pathname === '/dashboard' ? 'primary.dark' : '' }}>ダッシュボード</ListItemText>
      </ListItemButton>
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
                backgroundColor: isSelected(text.url) ? selectedBgColor : '',
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText primary={text.name} sx={{ color: isSelected(text.url) ? 'primary.dark' : '', pl: 8 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
      <ListItemButton onClick={printClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>プリントアウト</ListItemText>
        {printOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={printOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {printList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? selectedBgColor : '',
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText primary={text.name} sx={{ color: isSelected(text.url) ? 'primary.dark' : '', pl: 8 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      <ListItemButton onClick={rateClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>稼働率</ListItemText>
        {rateOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={rateOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem
            disablePadding
            sx={{
              backgroundColor: pathname === '/kadouritu' ? selectedBgColor : '',
            }}
          >
            <ListItemButton href="/kadouritu" dense>
              <ListItemText primary="稼働率" sx={{ color: pathname === '/kadouritu' ? 'primary.dark' : '', pl: 8 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Collapse>

      <ListItemButton onClick={equipmentClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>機材マスタ</ListItemText>
        {equipmentOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={equipmentOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem
            disablePadding
            sx={{
              backgroundColor: pathname === '/eqpmaster' ? selectedBgColor : '',
            }}
          >
            <ListItemButton href="/eqpt-master" dense>
              <ListItemText
                primary="機材マスタ"
                sx={{ color: pathname === '/eqpt-master' ? 'primary.dark' : '', pl: 8 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Collapse>

      <ListItemButton onClick={masterClick}>
        <ListItemIcon>
          <StopSharpIcon />
        </ListItemIcon>
        <ListItemText>マスタ管理</ListItemText>
        {masterOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={masterOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {masterList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? selectedBgColor : '',
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText primary={text.name} sx={{ color: isSelected(text.url) ? 'primary.dark' : '', pl: 8 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

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
                backgroundColor: isSelected(text.url) ? selectedBgColor : '',
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText primary={text.name} sx={{ color: isSelected(text.url) ? 'primary.dark' : '', pl: 8 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      <ListItemButton onClick={loginClick}>
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
                backgroundColor: isSelected(text.url) ? selectedBgColor : '',
              }}
            >
              <ListItemButton href={text.url} dense>
                <ListItemText primary={text.name} sx={{ color: isSelected(text.url) ? 'primary.dark' : '', pl: 8 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </List>
  );
}

/** ------------------------スタイル----------------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  colorWhite: {
    color: '',
  },
};
