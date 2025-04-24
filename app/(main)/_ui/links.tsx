'use client';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, Link, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type MenuItem = {
  name: string;
  url: string;
};

const dashboardList: MenuItem[] = [{ name: 'ダッシュボード', url: '' }];
const orderList: MenuItem[] = [
  { name: '新規受注', url: '/new-order' },
  { name: '受注一覧', url: '/order-list' },
  { name: '見積書', url: '' },
  { name: '在庫確認', url: '' },
  { name: '出庫履歴', url: '' },
  { name: '貸出状況', url: '' },
];
const printList: MenuItem[] = [
  { name: '出庫指示書', url: '' },
  { name: '出庫リスト', url: '' },
  { name: '納品書', url: '' },
  { name: '請求書', url: '' },
];
const rateList: MenuItem[] = [{ name: '稼働率', url: '' }];
const equipmentList: MenuItem[] = [{ name: '機材マスタ', url: '/equipment' }];
const masterList: MenuItem[] = [
  { name: '顧客マスタ', url: '' },
  { name: '車両マスタ', url: '' },
  { name: '場所マスタ', url: '' },
  { name: '担当者マスタ', url: '' },
  { name: '権限マスタ', url: '' },
  { name: '一式マスタ', url: '' },
  { name: '大部門マスタ', url: '' },
  { name: '集計部門マスタ', url: '' },
  { name: '口座マスタ', url: '' },
  { name: '拠点マスタ', url: '' },
];
const settingList: MenuItem[] = [
  { name: 'データ', url: '' },
  { name: '表示', url: '' },
  { name: '会社情報', url: '' },
  { name: '価格改定', url: '' },
];
const roginList: MenuItem[] = [
  { name: 'ログアウト', url: '' },
  { name: 'ログイン管理', url: '' },
];

export default function NavLinks() {
  const pathname = usePathname();

  const isSelected = (url: string) => {
    if (pathname === url /*|| pathname.startsWith(url + '/')*/) {
      return true;
    }
    return false;
  };

  const [dashboardOpen, setdashboardOpen] = useState(false);
  const [orderOpen, setorderOpen] = useState(false);
  const [printOpen, setprintOpen] = useState(false);
  const [rateOpen, setrateOpen] = useState(false);
  const [equipmentOpen, setequipmentOpen] = useState(false);
  const [masterOpen, setmasterOpen] = useState(false);
  const [settingOpen, setsettingOpen] = useState(false);
  const [roginOpen, setroginOpen] = useState(false);

  const dashboardClick = () => {
    setdashboardOpen(!dashboardOpen);
  };
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
  const roginClick = () => {
    setroginOpen(!roginOpen);
  };

  return (
    <List>
      <ListItemButton onClick={dashboardClick}>
        <ListItemText primary="■ダッシュボード" />
        {dashboardOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={dashboardOpen} timeout="auto" unmountOnExit>
        {dashboardList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton selected={isSelected(url)} sx={{ pl: 4 }}>
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
      <ListItemButton onClick={orderClick}>
        <ListItemText primary="■新規受注" />
        {orderOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={orderOpen} timeout="auto" unmountOnExit>
        {orderList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton
                /*selected={isSelected(url)}*/
                sx={{
                  pl: 4,
                  bgcolor: isSelected(url) ? 'oklch(0.951 0.026 236.824)' : 'white',
                  color: isSelected(url) ? 'oklch(0.546 0.245 262.881)' : 'black',
                }}
              >
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
      <ListItemButton onClick={printClick}>
        <ListItemText primary="■プリントアウト" />
        {printOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={printOpen} timeout="auto" unmountOnExit>
        {printList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton selected={isSelected(url)} sx={{ pl: 4 }}>
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
      <ListItemButton onClick={rateClick}>
        <ListItemText primary="■稼働率" />
        {rateOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={rateOpen} timeout="auto" unmountOnExit>
        {rateList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton selected={isSelected(url)} sx={{ pl: 4 }}>
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
      <ListItemButton onClick={equipmentClick}>
        <ListItemText primary="■機材マスタ管理" />
        {equipmentOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={equipmentOpen} timeout="auto" unmountOnExit>
        {equipmentList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton selected={isSelected(url)} sx={{ pl: 4 }}>
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
      <ListItemButton onClick={masterClick}>
        <ListItemText primary="■マスタ管理" />
        {masterOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={masterOpen} timeout="auto" unmountOnExit>
        {masterList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton selected={isSelected(url)} sx={{ pl: 4 }}>
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
      <ListItemButton onClick={settingClick}>
        <ListItemText primary="■設定" />
        {settingOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={settingOpen} timeout="auto" unmountOnExit>
        {settingList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton selected={isSelected(url)} sx={{ pl: 4 }}>
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
      <ListItemButton onClick={roginClick}>
        <ListItemText primary="■ログイン管理" />
        {roginOpen ? <ExpandMore /> : <ExpandLess />}
      </ListItemButton>
      <Collapse in={roginOpen} timeout="auto" unmountOnExit>
        {roginList.map(({ name, url }: MenuItem) => (
          <ListItem key={name} disablePadding>
            <Link href={url} underline="none" color="inherit" sx={{ width: '100%' }}>
              <ListItemButton selected={isSelected(url)} sx={{ pl: 4 }}>
                {name}
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </Collapse>
    </List>
  );
}
