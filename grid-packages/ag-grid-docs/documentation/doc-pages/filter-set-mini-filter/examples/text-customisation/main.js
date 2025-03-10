var gridOptions = {
    columnDefs: [
        // set filters
        {field: 'athlete', filter: 'agSetColumnFilter'},
        {field: 'country', filter: 'agSetColumnFilter'},

        // number filters
        {field: 'gold', filter: 'agNumberColumnFilter'},
        {field: 'silver', filter: 'agNumberColumnFilter'},
        {field: 'bronze', filter: 'agNumberColumnFilter'},
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        resizable: true,
        floatingFilter: true,
    },
    localeText: {
        searchOoo: 'Search values...',
        noMatches: 'No matches could be found.'
    }
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
