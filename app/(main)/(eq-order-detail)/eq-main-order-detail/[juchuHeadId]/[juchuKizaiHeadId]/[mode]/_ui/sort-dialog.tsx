'use client';

import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandleIcon from '@mui/icons-material/DragHandle'; // ドラッグ操作を示すアイコン
import { Button, DialogActions, DialogContent, DialogTitle, List, Paper } from '@mui/material';
// MUI コンポーネント
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
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
  const [localItems, setLocalItems] = useState<JuchuKizaiMeisaiValues[]>(juchuKizaiMeisai);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = Number(String(active.id).replace('sortable-', ''));
    const newIndex = Number(String(over.id).replace('sortable-', ''));

    setLocalItems(arrayMove(localItems, oldIndex, newIndex));
  };

  return (
    <Paper>
      <DialogTitle>並び替え</DialogTitle>
      <DialogContent dividers>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={localItems.map((_, index) => `sortable-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <List>
              {localItems.map((data, index) => (
                <SortableItem key={`sortable-${index}`} id={`sortable-${index}`} index={index} item={data} />
              ))}
            </List>
          </SortableContext>
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
        <Button variant="contained" onClick={() => onSave(localItems)}>
          OK
        </Button>
        <Button onClick={onClose}>キャンセル</Button>
      </DialogActions>
    </Paper>
  );
};

const SortableItem = ({ id, index, item }: { id: string; index: number; item: JuchuKizaiMeisaiValues }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 8,
  };

  return (
    <Paper ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ListItem>{item.kizaiNam}</ListItem>
    </Paper>
  );
};
