var gridOptions = {
  columnDefs: [
    { field: 'id', maxWidth: 80 },
    { field: 'athlete', minWidth: 220 },
    { field: 'country', minWidth: 200 },
    { field: 'year' },
    { field: 'sport', minWidth: 200 },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
  ],

  defaultColDef: {
    flex: 1,
    minWidth: 100,
    resizable: true,
  },

  // to help with this example, no row buffer, so no rows drawn off screen
  rowBuffer: 0,

  // use the server-side row model
  rowModelType: 'serverSide',

  // set to partial, so infinite scrolling is enabled
  serverSideStoreType: 'partial',

  // fetch 10 rows at a time (default is 100)
  cacheBlockSize: 50,

  // only keep 4 blocks of rows (default is keep all rows)
  maxBlocksInCache: 2,

  debug: true
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
  var gridDiv = document.querySelector('#myGrid');
  new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
    .then(function(data) {
      // adding row id to data
      var idSequence = 0;
      data.forEach(function(item) {
        item.id = idSequence++;
      });

      // setup the fake server with entire dataset
      var fakeServer = createFakeServer(data);

      // create datasource with a reference to the fake server
      var datasource = createServerSideDatasource(fakeServer);

      // register the datasource with the grid
      gridOptions.api.setServerSideDatasource(datasource);
    });
});

function createServerSideDatasource(server) {
  return {
    getRows: function(params) {
      console.log('[Datasource] - rows requested by grid: ', params.request);

      // get data for request from our fake server
      var response = server.getData(params.request);

      // simulating real server call with a 500ms delay
      setTimeout(function() {
        if (response.success) {
          // supply rows for requested block to grid
          params.success({ rowData: response.rows, rowCount: response.lastRow });
        } else {
          params.fail();
        }
      }, 1000);
    }
  };
}

function createFakeServer(allData) {
  return {
    getData: function(request) {
      // take a slice of the total rows for requested block
      var rowsForBlock = allData.slice(request.startRow, request.endRow);

      // here we are pretending we don't know the last row until we reach it!
      var lastRow = getLastRowIndex(request, rowsForBlock);

      return {
        success: true,
        rows: rowsForBlock,
        lastRow: lastRow,
      };
    },
  };
}

function getLastRowIndex(request, results) {
  if (!results) return undefined;
  var currentLastRow = request.startRow + results.length;

  // if on or after the last block, work out the last row, otherwise return 'undefined'
  return currentLastRow < request.endRow ? currentLastRow : undefined;
}
