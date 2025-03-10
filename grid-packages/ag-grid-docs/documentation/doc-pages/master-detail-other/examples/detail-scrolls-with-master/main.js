var gridOptions = {
    columnDefs: [
        // group cell renderer needed for expand / collapse icons
        {field: 'name', cellRenderer: 'agGroupCellRenderer'},
        {field: 'account'},
        {field: 'calls'},
        {field: 'minutes', valueFormatter: "x.toLocaleString() + 'm'"}
    ],
    defaultColDef: {
        width: 300
    },
    masterDetail: true,
    embedFullWidthRows: true,
    detailCellRendererParams: {
        detailGridOptions: {
            columnDefs: [
                {field: 'callId'},
                {field: 'direction'},
                {field: 'number'},
                {field: 'duration', valueFormatter: "x.toLocaleString() + 's'"},
                {field: 'switchCode'}
            ],
        },
        getDetailRowData: function (params) {
            params.successCallback(params.data.callRecords);
        }
    },
    onFirstDataRendered: onFirstDataRendered
};

function onFirstDataRendered(params) {
    // arbitrarily expand a row for presentational purposes
    setTimeout(function () {
        params.api.getDisplayedRowAtIndex(1).setExpanded(true);
    }, 0);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/master-detail-data.json').then(response => response.json()).then(function (data) {
        gridOptions.api.setRowData(data);
    });
});
