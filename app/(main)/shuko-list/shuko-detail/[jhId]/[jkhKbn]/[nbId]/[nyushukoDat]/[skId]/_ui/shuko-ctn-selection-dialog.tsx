'use client';

import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { getShukoCtnSelection } from '../_lib/funcs';
import { ShukoCtnSelectionValues } from '../_lib/types';

/**
 * コンテナ追加ダイアログ
 * 追加先の受注機材ヘッダー（未出発のものだけ。1つなら選択を省略）と、追加するコンテナを選ぶ
 */
export const ShukoCtnSelectionDialog = (props: {
  /** 追加先に選べる受注機材ヘッダー（未出発のもの） */
  heads: { juchuKizaiHeadId: number; headNam: string }[];
  /** 受注機材ヘッダーごとに、すでに表示されているコンテナの機材id（二重追加しないため） */
  existingKizaiIds: Map<number, number[]>;
  onConfirm: (juchuKizaiHeadId: number, selected: ShukoCtnSelectionValues[]) => void;
  onClose: () => void;
}) => {
  const { heads, existingKizaiIds, onConfirm, onClose } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [containers, setContainers] = useState<ShukoCtnSelectionValues[]>([]);
  const [juchuKizaiHeadId, setJuchuKizaiHeadId] = useState<number | ''>(
    heads.length === 1 ? heads[0].juchuKizaiHeadId : ''
  );
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setContainers(await getShukoCtnSelection());
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // 選んだヘッダーにすでにあるコンテナは選べない
  const disabledIds = useMemo(
    () => (juchuKizaiHeadId === '' ? [] : (existingKizaiIds.get(juchuKizaiHeadId) ?? [])),
    [existingKizaiIds, juchuKizaiHeadId]
  );

  const visibleContainers = containers.filter((c) => c.kizaiNam.includes(query.trim()));

  const handleToggle = (kizaiId: number) => {
    setSelectedIds((prev) => (prev.includes(kizaiId) ? prev.filter((id) => id !== kizaiId) : [...prev, kizaiId]));
  };

  const handleHeadChange = (value: number) => {
    setJuchuKizaiHeadId(value);
    // ヘッダーを変えたら、そのヘッダーにすでにあるコンテナの選択を外す
    const disabled = existingKizaiIds.get(value) ?? [];
    setSelectedIds((prev) => prev.filter((id) => !disabled.includes(id)));
  };

  const handleConfirm = () => {
    if (juchuKizaiHeadId === '') return;
    const selected = containers.filter((c) => selectedIds.includes(c.kizaiId) && !disabledIds.includes(c.kizaiId));
    onConfirm(juchuKizaiHeadId, selected);
  };

  return (
    <>
      <DialogTitle>コンテナ追加</DialogTitle>
      <DialogContent sx={{ width: 480 }}>
        {heads.length > 1 && (
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="shuko-ctn-head-label">追加先の受注明細</InputLabel>
            <Select
              labelId="shuko-ctn-head-label"
              label="追加先の受注明細"
              value={juchuKizaiHeadId}
              onChange={(e) => handleHeadChange(Number(e.target.value))}
            >
              {heads.map((h) => (
                <MenuItem key={h.juchuKizaiHeadId} value={h.juchuKizaiHeadId}>
                  {h.headNam}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <TextField
          size="small"
          fullWidth
          placeholder="コンテナ名で絞り込み"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mt: heads.length > 1 ? 0 : 1 }}
        />
        {isLoading ? (
          <Loading />
        ) : visibleContainers.length === 0 ? (
          <Typography p={2}>該当するコンテナがありません</Typography>
        ) : (
          <List dense sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            {visibleContainers.map((c) => {
              const disabled = disabledIds.includes(c.kizaiId);
              return (
                <ListItem key={c.kizaiId} disablePadding>
                  <ListItemButton onClick={() => handleToggle(c.kizaiId)} disabled={disabled}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={disabled || selectedIds.includes(c.kizaiId)} tabIndex={-1} />
                    </ListItemIcon>
                    <ListItemText primary={c.kizaiNam} secondary={disabled ? '追加済み' : undefined} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm} disabled={juchuKizaiHeadId === '' || selectedIds.length === 0}>
          追加
        </Button>
        <Button onClick={onClose}>戻る</Button>
      </DialogActions>
    </>
  );
};
