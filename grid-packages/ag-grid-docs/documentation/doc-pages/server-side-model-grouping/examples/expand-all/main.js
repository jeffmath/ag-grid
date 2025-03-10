var gridOptions = {
    columnDefs: [
        {field: "year", enableRowGroup: true, rowGroup: true, hide: true, minWidth: 100},
        {field: 'country', enableRowGroup: true, rowGroup: true, hide: true},
        {field: "sport", enableRowGroup: true, rowGroup: true, hide: true},
        {field: "gold", aggFunc: 'sum'},
        {field: "silver", aggFunc: 'sum'},
        {field: "bronze", aggFunc: 'sum'}
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 120,
        resizable: true,
        sortable: true
    },
    autoGroupColumnDef: {
        flex: 1,
        minWidth: 280,
    },
    maxConcurrentDatasourceRequests: 1,
    rowModelType: 'serverSide',
    serverSideStoreType: 'full',
    suppressAggFuncInHeader: true,
    animateRows: true,
};

function onBtExpandAll() {
    gridOptions.api.expandAll();
}

function onBtCollapseAll() {
    gridOptions.api.collapseAll();
}

function onBtExpandTopLevel() {
    gridOptions.api.forEachNode(function (node) {
        if (node.group && node.level == 0) {
            node.setExpanded(true);
        }
    });
}

function ServerSideDatasource(server) {
    return {
        getRows: function (params) {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            var response = server.getData(params.request);

            // adding delay to simulate real server call
            setTimeout(function () {
                if (response.success) {
                    // call the success callback
                    params.success({
                        rowData: response.rows,
                        rowCount: response.lastRow,
                        storeInfo: {lastLoadedTime: new Date().toLocaleString(), randomValue: Math.random()}
                    });
                } else {
                    // inform the grid request failed
                    params.failCallback();
                }
            }, 200);
        }
    };
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json').then(response => response.json()).then(function (data) {
        // setup the fake server with entire dataset
        var fakeServer = new FakeServer(data);

        // create datasource with a reference to the fake server
        var datasource = new ServerSideDatasource(fakeServer);

        // register the datasource with the grid
        gridOptions.api.setServerSideDatasource(datasource);
    });
});

