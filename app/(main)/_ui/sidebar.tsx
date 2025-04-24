'use client';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar as MuiAppBar,
  AppBarProps as MuiAppBarProps,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  styled,
  useTheme,
} from '@mui/material';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useState } from 'react';

import NavLinks from '@/app/(main)/_ui/links';

const drawerWidth = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    // marginLeft: drawerWidth,
    // width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: drawerWidth,
  },
}));

interface MainProps {
  open?: boolean;
}

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<MainProps>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  marginLeft: open ? drawerWidth : 0,
  minWidth: 0,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.easeOut,
    duration: theme.transitions.duration.enteringScreen,
  }),
  width: '99vw',
}));

type Props = {
  children: React.ReactNode;
};

const Sidebar = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open} color="secondary">
        <Toolbar>
          <IconButton color="inherit" onClick={toggleDrawer} edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            RFID機材管理システム
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="persistent" anchor="left" open={open}>
        <Toolbar />
        <Divider />
        <Box sx={{ overflow: 'auto' }}>
          <NavLinks />
        </Box>
      </Drawer>
      <Main open={open}>
        <Toolbar />
        {children}
      </Main>
    </Box>
  );
};

export default Sidebar;
