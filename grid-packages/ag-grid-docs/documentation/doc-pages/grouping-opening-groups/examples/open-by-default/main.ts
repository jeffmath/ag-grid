import { GridOptions } from '@ag-grid-community/core'

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'country', rowGroup: true },
    { field: 'year', rowGroup: true },
    { field: 'sport' },
    { field: 'athlete' },
    { field: 'total' },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 100,
    filter: true,
    sortable: true,
    resizable: true,
  },
  autoGroupColumnDef: {
    minWidth: 200,
  },
  animateRows: true,
  isGroupOpenByDefault: params => {
    return (
      (params.field === 'year' && params.key === '2004') ||
      (params.field === 'country' && params.key === 'United States')
    )
  },
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector('#myGrid')
  new agGrid.Grid(gridDiv, gridOptions)

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then(data => gridOptions.api!.setRowData(data))
})
