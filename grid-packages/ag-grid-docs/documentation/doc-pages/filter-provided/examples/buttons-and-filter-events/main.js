const columnDefs = [
    {
        field: 'athlete',
        filter: 'agTextColumnFilter',
        filterParams: {
            buttons: ['reset', 'apply'],
        }
    },
    {
        field: 'age',
        maxWidth: 100,
        filter: 'agNumberColumnFilter',
        filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true,
        }
    },
    {
        field: 'country',
        filter: 'agSetColumnFilter',
        filterParams: {
            buttons: ['clear', 'apply'],
        }
    },
    {
        field: 'year',
        filter: 'agSetColumnFilter',
        filterParams: {
            buttons: ['apply', 'cancel'],
            closeOnApply: true,
        },
        maxWidth: 100,
    },
    {field: 'sport'},
    {field: 'gold', filter: 'agNumberColumnFilter'},
    {field: 'silver', filter: 'agNumberColumnFilter'},
    {field: 'bronze', filter: 'agNumberColumnFilter'},
    {field: 'total', filter: 'agNumberColumnFilter'},
];

function onFilterOpened(e) {
    console.log('onFilterOpened', e);
}

function onFilterChanged(e) {
    console.log('onFilterChanged', e);
    console.log('gridApi.getFilterModel() =>', e.api.getFilterModel());
}

function onFilterModified(e) {
    console.log('onFilterModified', e);
    console.log('filterInstance.getModel() =>', e.filterInstance.getModel());
    console.log('filterInstance.getModelFromUi() =>', e.filterInstance.getModelFromUi());
}

const gridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        filter: true,
    },
    onFilterOpened: onFilterOpened,
    onFilterChanged: onFilterChanged,
    onFilterModified: onFilterModified
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
