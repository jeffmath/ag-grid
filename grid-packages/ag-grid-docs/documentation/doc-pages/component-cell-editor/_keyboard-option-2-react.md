[[only-react]]
|
|```jsx
|const KEY_UP = 'ArrowUp';
|const KEY_DOWN = 'ArrowDown';
|
|const GridExample = () => {
|    // rest of the component
|
|    return (
|        <div
|            style={{
|                height: '100%',
|                width: '100%'
|            }}
|            className="ag-theme-alpine test-grid">
|            <AgGridReact ...rest of the definition...>
|                <AgGridColumn field="value"
|                    suppressKeyboardEvent={params => {
|                        console.log('cell is editing: ' + params.editing);
|                        console.log('keyboard event:', params.event);
|
|                        // return true (to suppress) if editing and user hit up/down keys
|                        const key = params.event.key;
|                        const gridShouldDoNothing = params.editing && (key === KEY_UP || key === KEY_DOWN);
|                        return gridShouldDoNothing;
|                    }}
|                />
|            </AgGridReact>
|        </div>
|    );
|};
||```
