var gridOptions = {
    columnDefs: [
        {field: "athlete", minWidth: 150},
        {field: "age", maxWidth: 90},
        {field: "country", minWidth: 150},
        {field: "year", maxWidth: 90},
        {field: "date", minWidth: 150},
        {field: "sport", minWidth: 150},
        {field: "gold"},
        {field: "silver"},
        {field: "bronze"},
        {field: "total"}
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        editable: true
    },
    enableRangeSelection: true,
    enableFillHandle: true,
    fillHandleDirection: 'x'
};

function fillHandleAxis(direction) {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.ag-fill-direction'));
    var button = document.querySelector('.ag-fill-direction.' + direction);

    buttons.forEach(function (btn) {
        btn.classList.remove('selected');
    });

    button.classList.add('selected');
    gridOptions.api.setFillHandleDirection(direction);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
