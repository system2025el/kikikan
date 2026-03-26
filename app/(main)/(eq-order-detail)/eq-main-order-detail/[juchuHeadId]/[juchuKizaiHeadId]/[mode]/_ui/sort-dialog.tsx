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
  // ソート用のid付与した明細データ
  const [localData, setLocalData] = useState(() =>
    juchuKizaiMeisai.map((data, index) => ({ ...data, sortId: `item-${index}` }))
  );

  // 表示データ
  const visibleData = localData.filter((d) => !d.delFlag);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleData.findIndex((data) => data.sortId === active.id);
    const newIndex = visibleData.findIndex((data) => data.sortId === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // 表示されているものだけで並び替え
      const newVisibleData = arrayMove(visibleData, oldIndex, newIndex);

      // 削除済みデータ
      const deletedData = localData.filter((d) => d.delFlag);

      // 合体させて更新
      setLocalData([...newVisibleData, ...deletedData]);
    }
  };

  const handleOK = () => {
    setIsSave(true);
    // sortIdを除外して元の型に戻す
    const removeIdData = localData.map(({ sortId, ...data }) => data);
    onSave(removeIdData);
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
                <SortableContext items={visibleData.map((data) => data.sortId)} strategy={verticalListSortingStrategy}>
                  {visibleData.map((data) => (
                    <SortableItem key={data.sortId} id={data.sortId} data={data} />
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

const SortableItem = ({ id, data }: { id: string; data: JuchuKizaiMeisaiValues }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners} hover>
      <TableCell style={styles.row}>
        <DragHandleIcon sx={{ cursor: 'move' }} />
      </TableCell>
      <TableCell style={styles.row}>{data.kizaiNam}</TableCell>
      <TableCell style={styles.row}>{data.planKizaiQty}</TableCell>
      <TableCell style={styles.row}>{data.planYobiQty}</TableCell>
      <TableCell style={styles.row}>{data.planQty}</TableCell>
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
