import {
    _,
    Autowired,
    Component,
    ICellRendererComp,
    ICellRendererParams,
    IRichCellEditorParams,
    AgPromise,
    UserComponentFactory
} from "@ag-grid-community/core";

export class RichSelectRow extends Component {

    @Autowired('userComponentFactory') private userComponentFactory: UserComponentFactory;

    private readonly params: IRichCellEditorParams;

    constructor(params: IRichCellEditorParams) {
        super(/* html */`<div class="ag-rich-select-row"></div>`);
        this.params = params;
    }

    public setState(value: any, valueFormatted: string, selected: boolean): void {
        const rendererSuccessful = this.populateWithRenderer(value, valueFormatted);
        if (!rendererSuccessful) {
            this.populateWithoutRenderer(value, valueFormatted);
        }

        this.addOrRemoveCssClass('ag-rich-select-row-selected', selected)
    }

    private populateWithoutRenderer(value: any, valueFormatted: string) {
        const valueFormattedExits = valueFormatted !== null && valueFormatted !== undefined;
        const valueToRender = valueFormattedExits ? valueFormatted : value;

        if (_.exists(valueToRender) && valueToRender !== '') {
            // not using innerHTML to prevent injection of HTML
            // https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#Security_considerations
            this.getGui().textContent = valueToRender.toString();
        } else {
            // putting in blank, so if missing, at least the user can click on it
            this.getGui().innerHTML = '&nbsp;';
        }
    }

    private populateWithRenderer(value: any, valueFormatted: string): boolean {

        // bad coder here - we are not populating all values of the cellRendererParams
        const params = {
            value: value,
            valueFormatted: valueFormatted,
            api: this.gridOptionsWrapper.getApi()
        } as ICellRendererParams;

        const compDetails = this.userComponentFactory.getCellRendererDetails(this.params, params);
        const cellRendererPromise = compDetails ? compDetails.newAgStackInstance() : undefined;

        if (cellRendererPromise != null) {
            _.bindCellRendererToHtmlElement(cellRendererPromise, this.getGui());
        } else {
            this.getGui().innerText = params.valueFormatted != null ? params.valueFormatted : params.value;
        }

        if (cellRendererPromise) {
            cellRendererPromise.then(childComponent => {
                this.addDestroyFunc(() => {
                    this.getContext().destroyBean(childComponent);
                });
            });
            return true;
        }
        return false;
    }

}
