// noinspection ES6UnusedImports
import React, {useState} from 'react'
import {mount} from 'cypress-react-unit-test'
import {AgGridColumn} from "../../lib/shared/agGridColumn";
import {AgGridReact} from "../../lib/agGridReact";
import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model";
import {ensureGridApiHasBeenSet} from "./utils";

const CellRenderer = props => <>{props.value}</>;

const App = () => {
    const [gridApi, setGridApi] = useState(null);
    const [gridColumnApi, setGridColumnApi] = useState(null);

    const [rowData, setRowData] = useState([
        {
            value: 10
        },
        {
            value: null
        }
    ]);

    function onGridReady(params) {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
    }

    return (
        <div className="ag-theme-alpine" style={{height: 400, width: 600}}>
            <AgGridReact
                ref={(element) => {
                    window.gridComponentInstance = element
                }}
                onGridReady={onGridReady}
                rowData={rowData}
                frameworkComponents={{
                    cellRenderer: CellRenderer
                }}
                modules={[ClientSideRowModelModule]}>
                <AgGridColumn field="value" cellRenderer="cellRenderer"></AgGridColumn>
            </AgGridReact>
        </div>
    );
};

describe('Grid With Null Values', () => {
    beforeEach((done) => {
        window.gridComponentInstance = null;

        mount(<App/>, {
            stylesheets: [
                'https://unpkg.com/@ag-grid-community/core/dist/styles/ag-grid.css',
                'https://unpkg.com/@ag-grid-community/core/dist/styles/ag-theme-alpine.css'
            ]
        })

        ensureGridApiHasBeenSet().then(() => setTimeout(() => done(), 20), () => throw new Error("Grid API not set within expected time limits"));
    });
    afterEach(() => {
        window.gridComponentInstance = null;
    });

    it('Null and Non-Null Values Render As Expected', () => {
        // row position (top to bottom): row value
        const EXPECTED_ROWS = {
            0: '10',
            1: '',
        }
        cy.get('div .ag-react-container')
            .should('have.length', 2)
            .each((value, index, collection) => {
                cy.wrap(value)
                    .invoke('text')
                    .then(text => expect(text).to.equal(EXPECTED_ROWS[index]))
            })
    })
})
