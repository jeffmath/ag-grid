var gridOptions = {
    columnDefs: [
        {
            // demonstrating the use of valueGetters
            colId: 'country',
            valueGetter: 'data.country',
            rowGroup: true,
            hide: true,
        },
        {field: "sport", rowGroup: true, hide: true},
        {field: "year", minWidth: 100},
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
        field: 'athlete'
    },

    // use the server-side row model
    rowModelType: 'serverSide',
    serverSideStoreType: 'partial',
    maxConcurrentDatasourceRequests: 1,

    suppressAggFuncInHeader: true,
    purgeClosedRowNodes: true,

    cacheBlockSize: 20,

    animateRows: true
};

function ServerSideDatasource(server) {
    return {
        getRows: function (params) {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            var response = server.getData(params.request);

            // adding delay to simulate real server call
            setTimeout(function () {
                if (response.success) {
                    // call the success callback
                    params.success({rowData: response.rows, rowCount: response.lastRow});
                } else {
                    // inform the grid request failed
                    params.fail();
                }
            }, 1000);
        }
    };
}

function onBtRetry() {
    gridOptions.api.retryServerSideLoads();
}

function onBtReset() {
    gridOptions.api.refreshServerSideStore({purge: true});
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

