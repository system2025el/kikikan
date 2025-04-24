'use client';

import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';
import * as React from 'react';
import { forwardRef, ForwardRefRenderFunction, useImperativeHandle, useState } from 'react';

export type EditableGridHandle = {
  getData: () => GridRowModel[];
};

type Props = {
  columns: GridColDef[];
  rows: GridRowModel[];
};

const Grid: ForwardRefRenderFunction<EditableGridHandle, Props> = ({ columns, rows }, ref) => {
  const [data, setData] = useState(rows);

  const handleProcessRowUpdate = (newRow: GridRowModel) => {
    setData((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    return newRow;
  };

  useImperativeHandle(ref, () => ({
    getData: () => data,
  }));

  return (
    <Box display="flex" sx={{ width: '55%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5 },
          },
        }}
        pageSizeOptions={[5]}
        processRowUpdate={handleProcessRowUpdate}
        sx={{ bgcolor: 'white' }}
        hideFooter
      />
    </Box>
  );
};

export default forwardRef(Grid);
