import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useState } from 'react';

import { customers } from '../../../_lib/mock-data';
import { CustomerDialogContents } from './customers-dialog-contents';

export const CustomersTableHead = () => {
  const [openId, setOpen] = useState(-100);

  const handleOpen = (id: number) => {
    setOpen(id);
  };
  const handleClose = () => {
    setOpen(-100);
  };
  const deleteInfo = (id: number) => {
    setOpen(-100);
  };
  return (
    <List>
      <ListItem>
        <ListItemText inset sx={{ maxWidth: '50vw' }}>
          顧客
        </ListItemText>
        <ListItemText inset sx={{ maxWidth: '40vw' }}>
          住所
        </ListItemText>
      </ListItem>
      <Divider />

      {customers.map((customer) => (
        <ListItem key={customer.id} divider>
          <ListItemButton onClick={() => handleOpen(customer.id)}>
            <ListItemText inset sx={{ maxWidth: '50vw' }}>
              {customer.name}
            </ListItemText>
            <ListItemText inset sx={{ maxWidth: '40vw' }}>{`${customer.addressA} ${customer.addressB}`}</ListItemText>
          </ListItemButton>
          <Dialog open={openId === customer.id} onClose={handleClose} fullScreen sx={{ m: 5 }}>
            <DialogTitle>顧客情報</DialogTitle>
            <DialogContent>
              <CustomerDialogContents customerId={customer.id} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} variant="outlined" color="primary" autoFocus>
                やめる
              </Button>
              <Button onClick={(e) => deleteInfo(customer.id)} color="primary">
                削除する
              </Button>
            </DialogActions>
          </Dialog>
        </ListItem>
      ))}
    </List>
  );
};
