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
    onRangeSelectionChanged: onRangeSelectionChanged,

    processCellForClipboard: function (params) {
        if (params.column.getColId() === 'athlete' && params.value && params.value.toUpperCase) {
            return params.value.toUpperCase();
        }

        return params.value;
    },

    processCellFromClipboard: function (params) {
        if (params.column.getColId() === 'athlete' && params.value && params.value.toLowerCase) {
            return params.value.toLowerCase();
        }
        return params.value;
    }
};

function onAddRange() {
    gridOptions.api.addCellRange({
        rowStartIndex: 4,
        rowEndIndex: 8,
        columnStart: 'age',
        columnEnd: 'date'
    });
}

function onClearRange() {
    gridOptions.api.clearRangeSelection();
}

function onRangeSelectionChanged(event) {
    var lbRangeCount = document.querySelector('#lbRangeCount');
    var lbEagerSum = document.querySelector('#lbEagerSum');
    var lbLazySum = document.querySelector('#lbLazySum');
    var cellRanges = gridOptions.api.getCellRanges();

    // if no selection, clear all the results and do nothing more
    if (!cellRanges || cellRanges.length === 0) {
        lbRangeCount.innerHTML = '0';
        lbEagerSum.innerHTML = '-';
        lbLazySum.innerHTML = '-';
        return;
    }

    // set range count to the number of ranges selected
    lbRangeCount.innerHTML = cellRanges.length;

    var sum = 0;
    var api = gridOptions.api;

    cellRanges.forEach(function (range) {
        // get starting and ending row, remember rowEnd could be before rowStart
        var startRow = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
        var endRow = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);

        for (var rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
            range.columns.forEach(function (column) {
                var rowModel = api.getModel();
                var rowNode = rowModel.getRow(rowIndex);
                var value = api.getValue(column, rowNode);
                if (typeof value === 'number') {
                    sum += value;
                }
            });
        }
    });

    lbEagerSum.innerHTML = sum;

    if (event.started) {
        lbLazySum.innerHTML = '?';
    }
    if (event.finished) {
        lbLazySum.innerHTML = sum;
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
