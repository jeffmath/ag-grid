var gridOptions = {
    columnDefs: [
        {field: 'athlete', minWidth: 180},
        {field: 'age'},
        {field: 'country', minWidth: 150},
        {field: 'year'},
        {field: 'date', minWidth: 150},
        {field: 'sport', minWidth: 150},
        {field: 'gold'},
        {field: 'silver'},
        {field: 'bronze'},
        {field: 'total'},
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        resizable: true,
        headerCheckboxSelection: isFirstColumn,
        checkboxSelection: isFirstColumn,
    },
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
};

function isFirstColumn(params) {
    var displayedColumns = params.columnApi.getAllDisplayedColumns();
    var thisIsFirstColumn = displayedColumns[0] === params.column;
    return thisIsFirstColumn;
}


function onQuickFilterChanged() {
    gridOptions.api.setQuickFilter(document.getElementById('quickFilter').value);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
