'use client';

import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import React, { useState } from 'react';

import { JuchuKizaiMeisaiValues } from '../_lib/types';

export const SortDialog = ({
  juchuKizaiMeisai,
  onClose,
  onSave,
}: {
  juchuKizaiMeisai: JuchuKizaiMeisaiValues[];
  onClose: () => void;
  onSave: (sortJuchuKizaiMeisai: JuchuKizaiMeisaiValues[]) => void;
}) => {
  const [isSave, setIsSave] = useState(false);
  const [localItems, setLocalItems] = useState<JuchuKizaiMeisaiValues[]>(juchuKizaiMeisai);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = Number(String(active.id).replace('sortable-', ''));
    const newIndex = Number(String(over.id).replace('sortable-', ''));

    setLocalItems(arrayMove(localItems, oldIndex, newIndex));
  };

  const handleOK = () => {
    setIsSave(true);
    onSave(localItems);
  };

  return (
    <Paper>
      <DialogTitle
        sx={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        並び替え
      </DialogTitle>
      <DialogContent dividers>
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <TableContainer sx={{ maxHeight: '65vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="center" size="small" style={styles.header} />
                  <TableCell align="left" size="small" style={styles.header}>
                    機材名
                  </TableCell>
                  <TableCell align="right" size="small" style={styles.header}>
                    受注
                  </TableCell>
                  <TableCell align="right" size="small" style={styles.header}>
                    予備
                  </TableCell>
                  <TableCell align="right" size="small" style={styles.header}>
                    合計
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <SortableContext
                  items={localItems.map((_, index) => `sortable-${index}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {localItems
                    .filter((d) => !d.delFlag)
                    .map((data, index) => (
                      <SortableItem key={`sortable-${index}`} id={`sortable-${index}`} index={index} item={data} />
                    ))}
                </SortableContext>
              </TableBody>
            </Table>
          </TableContainer>
        </DndContext>
      </DialogContent>

      <DialogActions
        sx={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button variant="contained" onClick={handleOK} loading={isSave}>
          OK
        </Button>
        <Button onClick={onClose}>キャンセル</Button>
      </DialogActions>
    </Paper>
  );
};

const SortableItem = ({ id, index, item }: { id: string; index: number; item: JuchuKizaiMeisaiValues }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TableCell style={styles.row}>
        <DragHandleIcon sx={{ cursor: 'move' }} />
      </TableCell>
      <TableCell style={styles.row}>{item.kizaiNam}</TableCell>
      <TableCell style={styles.row}>{item.planKizaiQty}</TableCell>
      <TableCell style={styles.row}>{item.planYobiQty}</TableCell>
      <TableCell style={styles.row}>{item.planQty}</TableCell>
    </TableRow>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // ヘッダー
  header: {
    border: '1px solid black',
    whiteSpace: 'nowrap',
    padding: 0,
  },
  // 行
  row: {
    border: '1px solid black',
    whiteSpace: 'nowrap',
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 1,
    paddingRight: 1,
  },
};
