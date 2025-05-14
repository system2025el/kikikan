'use client';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StopSharpIcon from '@mui/icons-material/StopSharp';
import { Collapse, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { blue, lightBlue } from '@mui/material/colors';
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
  { name: '場所マスタ', url: '/' },
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
  const pathname = usePathname();

  const isSelected = (url: string) => {
    if (pathname === url /*|| pathname.startsWith(url + '/')*/) {
      return true;
    }
    return false;
  };

  const [orderOpen, setorderOpen] = useState(false);
  const [printOpen, setprintOpen] = useState(false);
  const [rateOpen, setrateOpen] = useState(false);
  const [equipmentOpen, setequipmentOpen] = useState(false);
  const [masterOpen, setmasterOpen] = useState(false);
  const [settingOpen, setsettingOpen] = useState(false);
  const [loginOpen, setroginOpen] = useState(false);

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
      <ListItemButton sx={{ bgcolor: blue[800] }} href="/dashboard">
        <ListItemIcon>
          <StopSharpIcon sx={{ color: 'white' }} />
        </ListItemIcon>
        <ListItemText sx={{ color: 'white' }}>ダッシュボード</ListItemText>
      </ListItemButton>
      <ListItemButton onClick={orderClick} sx={{ bgcolor: blue[800] }}>
        <ListItemIcon>
          <StopSharpIcon sx={{ color: 'white' }} />
        </ListItemIcon>
        <ListItemText sx={{ color: 'white' }}>受注管理</ListItemText>
        {orderOpen ? <ExpandLess sx={styles.colorWhite} /> : <ExpandMore sx={styles.colorWhite} />}
      </ListItemButton>
      <Collapse in={orderOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {orderList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? 'white' : '',
              }}
            >
              <ListItemButton href={text.url} onClick={orderClick} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? lightBlue[700] : 'white', pl: 8 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
      <ListItemButton onClick={printClick} sx={{ bgcolor: blue[800] }}>
        <ListItemIcon>
          <StopSharpIcon sx={{ color: 'white' }} />
        </ListItemIcon>
        <ListItemText sx={{ color: 'white' }}>プリントアウト</ListItemText>
        {printOpen ? <ExpandLess sx={styles.colorWhite} /> : <ExpandMore sx={styles.colorWhite} />}
      </ListItemButton>
      <Collapse in={printOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {printList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? 'white' : '',
              }}
            >
              <ListItemButton href={text.url} onClick={printClick} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? lightBlue[700] : 'white', pl: 8 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      <ListItemButton onClick={rateClick} sx={{ bgcolor: blue[800] }}>
        <ListItemIcon>
          <StopSharpIcon sx={styles.colorWhite} />
        </ListItemIcon>
        <ListItemText sx={styles.colorWhite}>稼働率</ListItemText>
        {rateOpen ? <ExpandLess sx={styles.colorWhite} /> : <ExpandMore sx={styles.colorWhite} />}
      </ListItemButton>
      <Collapse in={rateOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem
            disablePadding
            sx={{
              backgroundColor: pathname === '/kadouritu' ? 'white' : '',
            }}
          >
            <ListItemButton href="/kadouritu" onClick={rateClick} dense>
              <ListItemText
                primary="稼働率"
                sx={{ color: pathname === '/kadouritu' ? lightBlue[700] : 'white', pl: 8 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Collapse>

      <ListItemButton onClick={equipmentClick} sx={{ bgcolor: blue[800] }}>
        <ListItemIcon>
          <StopSharpIcon sx={styles.colorWhite} />
        </ListItemIcon>
        <ListItemText sx={styles.colorWhite}>機材マスタ</ListItemText>
        {equipmentOpen ? <ExpandLess sx={styles.colorWhite} /> : <ExpandMore sx={styles.colorWhite} />}
      </ListItemButton>
      <Collapse in={equipmentOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem
            disablePadding
            sx={{
              backgroundColor: pathname === '/eqpmaster' ? 'white' : '',
            }}
          >
            <ListItemButton href="/eqpmaster" onClick={equipmentClick} dense>
              <ListItemText
                primary="機材マスタ"
                sx={{ color: pathname === '/eqpmaster' ? lightBlue[700] : 'white', pl: 8 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Collapse>

      <ListItemButton onClick={masterClick} sx={{ bgcolor: blue[800] }}>
        <ListItemIcon>
          <StopSharpIcon sx={styles.colorWhite} />
        </ListItemIcon>
        <ListItemText sx={styles.colorWhite}>マスタ管理</ListItemText>
        {masterOpen ? <ExpandLess sx={styles.colorWhite} /> : <ExpandMore sx={styles.colorWhite} />}
      </ListItemButton>
      <Collapse in={masterOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {masterList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? 'white' : '',
              }}
            >
              <ListItemButton href={text.url} onClick={masterClick} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? lightBlue[700] : 'white', pl: 8 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      <ListItemButton onClick={settingClick} sx={{ bgcolor: blue[800] }}>
        <ListItemIcon>
          <StopSharpIcon sx={styles.colorWhite} />
        </ListItemIcon>
        <ListItemText sx={styles.colorWhite}>設定</ListItemText>
        {settingOpen ? <ExpandLess sx={styles.colorWhite} /> : <ExpandMore sx={styles.colorWhite} />}
      </ListItemButton>
      <Collapse in={settingOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {settingList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? 'white' : '',
              }}
            >
              <ListItemButton href={text.url} onClick={settingClick} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? lightBlue[700] : 'white', pl: 8 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      <ListItemButton onClick={loginClick} sx={{ bgcolor: blue[800] }}>
        <ListItemIcon>
          <StopSharpIcon sx={styles.colorWhite} />
        </ListItemIcon>
        <ListItemText sx={styles.colorWhite}>ログアウト</ListItemText>
        {loginOpen ? <ExpandLess sx={styles.colorWhite} /> : <ExpandMore sx={styles.colorWhite} />}
      </ListItemButton>
      <Collapse in={loginOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {loginList.map((text) => (
            <ListItem
              key={text.name}
              disablePadding
              sx={{
                backgroundColor: isSelected(text.url) ? 'white' : '',
              }}
            >
              <ListItemButton href={text.url} onClick={loginClick} dense>
                <ListItemText
                  primary={text.name}
                  sx={{ color: isSelected(text.url) ? lightBlue[700] : 'white', pl: 8 }}
                />
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
    color: 'white',
  },
};
