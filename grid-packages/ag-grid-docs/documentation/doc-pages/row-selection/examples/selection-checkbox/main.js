function checkboxSelection(params) {
    return params.node.group === true;
}

function checkbox(params) {
    return params.node.group === true;
}


var gridOptions = {
    columnDefs: [
        {field: "country", rowGroup: true, hide: true},
        {field: "sport", rowGroup: true, hide: true},
        {field: "gold", aggFunc: 'sum'},
        {field: "silver", aggFunc: 'sum'},
        {field: "bronze", aggFunc: 'sum'},
        {
            field: "age",
            minWidth: 120,
            checkboxSelection: checkboxSelection,
            aggFunc: 'sum',
        },
        {field: "year", maxWidth: 120},
        {field: "date", minWidth: 150},
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    autoGroupColumnDef: {
        headerName: "Athlete",
        field: "athlete",
        minWidth: 250,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
            checkbox: checkbox
        }
    },
    rowSelection: 'multiple',
    groupSelectsChildren: true,
    suppressRowClickSelection: true,
    suppressAggFuncInHeader: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
