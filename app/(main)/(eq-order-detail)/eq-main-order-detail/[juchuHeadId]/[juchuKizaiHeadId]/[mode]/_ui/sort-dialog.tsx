'use client';

import { closestCenter, DndContext, DragEndEvent, MeasuringStrategy } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import {
  Button,
  Checkbox,
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
import React, { useCallback, useState } from 'react';

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
  // 複数選択したもの同士をまとめてドラッグするための、ダイアログ内だけの選択状態
  const [checkedSortIds, setCheckedSortIds] = useState<Set<string>>(new Set());

  // 表示データ
  const visibleData = localData.filter((d) => !d.delFlag);

  const handleToggleChecked = useCallback((sortId: string) => {
    setCheckedSortIds((prev) => {
      const next = new Set(prev);
      if (next.has(sortId)) {
        next.delete(sortId);
      } else {
        next.add(sortId);
      }
      return next;
    });
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleData.findIndex((data) => data.sortId === active.id);
    const newIndex = visibleData.findIndex((data) => data.sortId === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // ドラッグしている行がチェック済みで、他にもチェックがあれば選択行をまとめて移動する
    const isGroupDrag = checkedSortIds.has(String(active.id)) && checkedSortIds.size > 1;

    let newVisibleData: typeof visibleData;
    if (isGroupDrag) {
      // まずドラッグした行単体の移動先を求め、そこへチェック済み行をまとめて差し込む
      const singleMoved = arrayMove(visibleData, oldIndex, newIndex);
      const otherCheckedIds = new Set(checkedSortIds);
      otherCheckedIds.delete(String(active.id));

      const withoutOtherChecked = singleMoved.filter((data) => !otherCheckedIds.has(data.sortId));
      const anchorIndex = withoutOtherChecked.findIndex((data) => data.sortId === active.id);
      const checkedGroup = visibleData.filter((data) => checkedSortIds.has(data.sortId));

      newVisibleData = [
        ...withoutOtherChecked.slice(0, anchorIndex),
        ...checkedGroup,
        ...withoutOtherChecked.slice(anchorIndex + 1),
      ];
    } else {
      // 表示されているものだけで並び替え
      newVisibleData = arrayMove(visibleData, oldIndex, newIndex);
    }

    // 削除済みデータ
    const deletedData = localData.filter((d) => d.delFlag);

    // 合体させて更新
    setLocalData([...newVisibleData, ...deletedData]);
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
          measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
          onDragEnd={handleDragEnd}
        >
          <TableContainer sx={{ maxHeight: '65vh' }}>
            <Table stickyHeader sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" size="small" style={styles.header} />
                  <TableCell align="center" size="small" style={styles.header} />
                  <TableCell align="left" size="small" style={styles.header}>
                    機材名
                  </TableCell>
                  <TableCell align="right" size="small" style={styles.header}>
                    合計
                  </TableCell>
                  <TableCell align="right" size="small" style={styles.header}>
                    受注
                  </TableCell>
                  <TableCell align="right" size="small" style={styles.header}>
                    予備
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <SortableContext items={visibleData.map((data) => data.sortId)} strategy={verticalListSortingStrategy}>
                  {visibleData.map((data) => (
                    <SortableItem
                      key={data.sortId}
                      id={data.sortId}
                      data={data}
                      checked={checkedSortIds.has(data.sortId)}
                      onToggleChecked={handleToggleChecked}
                    />
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

const SortableItem = React.memo(
  ({
    id,
    data,
    checked,
    onToggleChecked,
  }: {
    id: string;
    data: JuchuKizaiMeisaiValues;
    checked: boolean;
    onToggleChecked: (sortId: string) => void;
  }) => {
    const { attributes, listeners, setNodeRef, transform } = useSortable({ id: id });

    const style = {
      transform: CSS.Transform.toString(transform),
    };

    return (
      <TableRow ref={setNodeRef} style={style} hover>
        <TableCell style={styles.row}>
          <Checkbox size="small" checked={checked} onChange={() => onToggleChecked(id)} sx={{ padding: 0 }} />
        </TableCell>
        <TableCell style={styles.row} {...attributes} {...listeners}>
          <DragHandleIcon sx={{ cursor: 'move' }} />
        </TableCell>
        <TableCell style={styles.row}>{data.kizaiNam}</TableCell>
        <TableCell style={styles.rowRight}>{data.planQty}</TableCell>
        <TableCell style={styles.rowRight}>{data.planKizaiQty}</TableCell>
        <TableCell style={styles.rowRight}>{data.planYobiQty}</TableCell>
      </TableRow>
    );
  }
);
SortableItem.displayName = 'SortableItem';

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // ヘッダー
  header: {
    border: '1px solid lightGray',
    whiteSpace: 'nowrap',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
  // 行
  row: {
    border: '1px solid lightGray',
    whiteSpace: 'nowrap',
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
  // 行（右寄せ）
  rowRight: {
    border: '1px solid lightGray',
    whiteSpace: 'nowrap',
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: 'right',
  },
};
