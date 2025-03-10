var countries =
    [
        'United States',
        'Russia',
        'Australia',
        'Canada',
        'Norway',
        'China',
        'Zimbabwe',
        'Netherlands',
        'South Korea',
        'Croatia',
        'France',
        'Japan',
        'Hungary',
        'Germany',
        'Poland',
        'South Africa',
        'Sweden',
        'Ukraine',
        'Italy',
        'Czech Republic',
        'Austria',
        'Finland',
        'Romania',
        'Great Britain',
        'Jamaica',
        'Singapore',
        'Belarus',
        'Chile',
        'Spain',
        'Tunisia',
        'Brazil',
        'Slovakia',
        'Costa Rica',
        'Bulgaria',
        'Switzerland',
        'New Zealand',
        'Estonia',
        'Kenya',
        'Ethiopia',
        'Trinidad and Tobago',
        'Turkey',
        'Morocco',
        'Bahamas',
        'Slovenia',
        'Armenia',
        'Azerbaijan',
        'India',
        'Puerto Rico',
        'Egypt',
        'Kazakhstan',
        'Iran',
        'Georgia',
        'Lithuania',
        'Cuba',
        'Colombia',
        'Mongolia',
        'Uzbekistan',
        'North Korea',
        'Tajikistan',
        'Kyrgyzstan',
        'Greece',
        'Macedonia',
        'Moldova',
        'Chinese Taipei',
        'Indonesia',
        'Thailand',
        'Vietnam',
        'Latvia',
        'Venezuela',
        'Mexico',
        'Nigeria',
        'Qatar',
        'Serbia',
        'Serbia and Montenegro',
        'Hong Kong',
        'Denmark',
        'Portugal',
        'Argentina',
        'Afghanistan',
        'Gabon',
        'Dominican Republic',
        'Belgium',
        'Kuwait',
        'United Arab Emirates',
        'Cyprus',
        'Israel',
        'Algeria',
        'Montenegro',
        'Iceland',
        'Paraguay',
        'Cameroon',
        'Saudi Arabia',
        'Ireland',
        'Malaysia',
        'Uruguay',
        'Togo',
        'Mauritius',
        'Syria',
        'Botswana',
        'Guatemala',
        'Bahrain',
        'Grenada',
        'Uganda',
        'Sudan',
        'Ecuador',
        'Panama',
        'Eritrea',
        'Sri Lanka',
        'Mozambique',
        'Barbados'
    ];

var filterParams = {values: countries};

var columnDefs = [
    // this row just shows the row index, doesn't use any data from the row
    {
        headerName: 'ID',
        maxWidth: 100,
        valueGetter: 'node.id',
        cellRenderer: 'loadingCellRenderer',
        // we don't want to sort by the row index, this doesn't make sense as the point
        // of the row index is to know the row index in what came back from the server
        sortable: false,
        suppressMenu: true
    },
    {field: 'athlete', suppressMenu: true},
    {
        field: 'age',
        filter: 'agNumberColumnFilter',
        filterParams: {
            filterOptions: ['equals', 'lessThan', 'greaterThan'],
            suppressAndOrCondition: true
        }
    },
    {
        field: 'country',
        filter: 'agSetColumnFilter',
        filterParams: filterParams
    },
    {
        field: 'year',
        filter: 'agSetColumnFilter',
        filterParams: {values: ['2000', '2004', '2008', '2012']}
    },
    {field: 'date'},
    {field: 'sport', suppressMenu: true},
    {field: 'gold', suppressMenu: true},
    {field: 'silver', suppressMenu: true},
    {field: 'bronze', suppressMenu: true},
    {field: 'total', suppressMenu: true}
];

var gridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        sortable: true,
        resizable: true,
        floatingFilter: true,
    },
    rowSelection: 'multiple',
    rowModelType: 'infinite',
    cacheBlockSize: 100,
    cacheOverflowSize: 2,
    maxConcurrentDatasourceRequests: 2,
    infiniteInitialRowCount: 1,
    maxBlocksInCache: 2,
    // debug: true,
    getRowNodeId: function (item) {
        return item.id;
    },
    components: {
        loadingCellRenderer: function (params) {
            if (params.value !== undefined) {
                return params.value;
            } else {
                return '<img src="https://www.ag-grid.com/example-assets/loading.gif">';
            }
        }
    }
};

function sortAndFilter(allOfTheData, sortModel, filterModel) {
    return sortData(sortModel, filterData(filterModel, allOfTheData));
}

function sortData(sortModel, data) {
    var sortPresent = sortModel && sortModel.length > 0;
    if (!sortPresent) {
        return data;
    }
    // do an in memory sort of the data, across all the fields
    var resultOfSort = data.slice();
    resultOfSort.sort(function (a, b) {
        for (var k = 0; k < sortModel.length; k++) {
            var sortColModel = sortModel[k];
            var valueA = a[sortColModel.colId];
            var valueB = b[sortColModel.colId];
            // this filter didn't find a difference, move onto the next one
            if (valueA == valueB) {
                continue;
            }
            var sortDirection = sortColModel.sort === 'asc' ? 1 : -1;
            if (valueA > valueB) {
                return sortDirection;
            } else {
                return sortDirection * -1;
            }
        }
        // no filters found a difference
        return 0;
    });
    return resultOfSort;
}

function filterData(filterModel, data) {
    var filterPresent = filterModel && Object.keys(filterModel).length > 0;
    if (!filterPresent) {
        return data;
    }

    var resultOfFilter = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];

        if (filterModel.age) {
            var age = item.age;
            var allowedAge = parseInt(filterModel.age.filter);
            // EQUALS = 1;
            // LESS_THAN = 2;
            // GREATER_THAN = 3;
            if (filterModel.age.type == 'equals') {
                if (age !== allowedAge) {
                    continue;
                }
            } else if (filterModel.age.type == 'lessThan') {
                if (age >= allowedAge) {
                    continue;
                }
            } else {
                if (age <= allowedAge) {
                    continue;
                }
            }
        }

        if (filterModel.year) {
            if (filterModel.year.values.indexOf(item.year.toString()) < 0) {
                // year didn't match, so skip this record
                continue;
            }
        }

        if (filterModel.country) {
            if (filterModel.country.values.indexOf(item.country) < 0) {
                continue;
            }
        }

        resultOfFilter.push(item);
    }

    return resultOfFilter;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json').then(response => response.json()).then(function (data) {
        // give each row an id
        data.forEach(function (data, index) {
            data.id = 'R' + (index + 1);
        });

        var dataSource = {
            rowCount: null, // behave as infinite scroll
            getRows: function (params) {
                console.log('asking for ' + params.startRow + ' to ' + params.endRow);

                // At this point in your code, you would call the server, using $http if in AngularJS 1.x.
                // To make the demo look real, wait for 500ms before returning
                setTimeout(function () {
                    // take a slice of the total rows
                    var dataAfterSortingAndFiltering = sortAndFilter(data, params.sortModel, params.filterModel);
                    var rowsThisPage = dataAfterSortingAndFiltering.slice(params.startRow, params.endRow);
                    // if on or after the last page, work out the last row.
                    var lastRow = -1;
                    if (dataAfterSortingAndFiltering.length <= params.endRow) {
                        lastRow = dataAfterSortingAndFiltering.length;
                    }
                    // call the success callback
                    params.successCallback(rowsThisPage, lastRow);
                }, 500);
            }
        };

        gridOptions.api.setDatasource(dataSource);
    });
});
