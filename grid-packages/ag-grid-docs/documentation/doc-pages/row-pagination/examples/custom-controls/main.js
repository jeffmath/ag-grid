var cellRenderer = function (params) {
    return parseInt(params.node.id) + 1;
};
var columnDefs = [
    // this row just shows the row index, doesn't use any data from the row
    {
        headerName: '#',
        width: 50,
        cellRenderer: cellRenderer
    },
    {headerName: 'Athlete', field: 'athlete', width: 150},
    {headerName: 'Age', field: 'age', width: 90},
    {headerName: 'Country', field: 'country', width: 120},
    {headerName: 'Year', field: 'year', width: 90},
    {headerName: 'Date', field: 'date', width: 110},
    {headerName: 'Sport', field: 'sport', width: 110},
    {headerName: 'Gold', field: 'gold', width: 100},
    {headerName: 'Silver', field: 'silver', width: 100},
    {headerName: 'Bronze', field: 'bronze', width: 100},
    {headerName: 'Total', field: 'total', width: 100}
];

var gridOptions = {
    defaultColDef: {
        resizable: true,
        filter: true
    },
    debug: true,
    rowSelection: 'multiple',
    paginationPageSize: 500,
    columnDefs: columnDefs,
    pagination: true,
    suppressPaginationPanel: true,
    suppressScrollOnNewData: true,
    onPaginationChanged: onPaginationChanged
};

function setText(selector, text) {
    document.querySelector(selector).innerHTML = text;
}

function onPaginationChanged() {
    console.log('onPaginationPageLoaded');

    // Workaround for bug in events order
    if (gridOptions.api) {
        setText('#lbLastPageFound', gridOptions.api.paginationIsLastPageFound());
        setText('#lbPageSize', gridOptions.api.paginationGetPageSize());
        // we +1 to current page, as pages are zero based
        setText('#lbCurrentPage', gridOptions.api.paginationGetCurrentPage() + 1);
        setText('#lbTotalPages', gridOptions.api.paginationGetTotalPages());

        setLastButtonDisabled(!gridOptions.api.paginationIsLastPageFound());
    }
}

function setLastButtonDisabled(disabled) {
    document.querySelector('#btLast').disabled = disabled;
}

function setRowData(rowData) {
    allOfTheData = rowData;
    createNewDatasource();
}

function onBtFirst() {
    gridOptions.api.paginationGoToFirstPage();
}

function onBtLast() {
    gridOptions.api.paginationGoToLastPage();
}

function onBtNext() {
    gridOptions.api.paginationGoToNextPage();
}

function onBtPrevious() {
    gridOptions.api.paginationGoToPreviousPage();
}

function onBtPageFive() {
    // we say page 4, as the first page is zero
    gridOptions.api.paginationGoToPage(4);
}

function onBtPageFifty() {
    // we say page 49, as the first page is zero
    gridOptions.api.paginationGoToPage(49);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
