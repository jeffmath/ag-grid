var gridOptions = {
    columnDefs: [
        {field: "country", rowGroup: true, hide: true},
        {field: "year", rowGroup: true, hide: true},
        {field: "version"},
        {field: "gold", aggFunc: 'sum'},
        {field: "silver", aggFunc: 'sum'},
        {field: "bronze", aggFunc: 'sum'}
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        resizable: true,
        sortable: true
    },
    autoGroupColumnDef: {
        flex: 1,
        minWidth: 280,
        field: 'athlete'
    },
    getRowNodeId: function (data) {
        var parts = [];
        if (data.country != null) {
            parts.push(data.country);
        }
        if (data.year != null) {
            parts.push(data.year);
        }
        if (data.id != null) {
            parts.push(data.id);
        }
        return parts.join('-');
    },
    // use the server-side row model
    rowModelType: 'serverSide',
    serverSideStoreType: 'full',

    enableCellChangeFlash: true,
    suppressAggFuncInHeader: true,

    animateRows: true,
    debug: true,
};

var versionCounter = 1;

function refreshCache(route) {
    versionCounter++;
    var purge = document.querySelector('#purge').checked === true;
    gridOptions.api.refreshServerSideStore({route: route, purge: purge});
}

function getBlockState() {
    var blockState = gridOptions.api.getCacheBlockState();
    console.log(blockState);
}

function ServerSideDatasource(server) {
    return {
        getRows: function (params) {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            var response = server.getData(params.request);

            response.rows = response.rows.map(function (item) {
                var res = {};
                Object.assign(res, item);
                res.version = versionCounter + ' - ' + versionCounter + ' - ' + versionCounter;

                // for unique-id purposes in the client, we also want to attached
                // the parent group keys
                params.request.groupKeys.forEach(function (groupKey, index) {
                    var col = params.request.rowGroupCols[index];
                    var field = col.id;
                    res[field] = groupKey;
                });

                return res;
            });

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

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json').then(response => response.json()).then(function (data) {
        // give each data item an ID
        data.forEach(function (dataItem, index) {
            dataItem.id = index;
        });

        // setup the fake server with entire dataset
        var fakeServer = new FakeServer(data);

        // create datasource with a reference to the fake server
        var datasource = new ServerSideDatasource(fakeServer);

        // register the datasource with the grid
        gridOptions.api.setServerSideDatasource(datasource);
    });
});

