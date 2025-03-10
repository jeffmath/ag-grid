var gridOptions = {
    columnDefs: [
        {field: "athlete", filter: 'agTextColumnFilter', minWidth: 200},
        {field: "age"},
        {field: "country", minWidth: 180},
        {field: "year"},
        {field: "date", minWidth: 150},
        {field: "gold"},
        {field: "silver"},
        {field: "bronze"},
        {field: "total"}
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        // allow every column to be aggregated
        enableValue: true,
        // allow every column to be grouped
        enableRowGroup: true,
        // allow every column to be pivoted
        enablePivot: true,
        sortable: true,
        filter: true
    },
    sideBar: true
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
