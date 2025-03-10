import { IDoesFilterPassParams, IFilterComp, IFilterParams } from '../../interfaces/iFilter';
import { Autowired, PostConstruct } from '../../context/context';
import { IRowModel } from '../../interfaces/iRowModel';
import { IAfterGuiAttachedParams } from '../../interfaces/iAfterGuiAttachedParams';
import { loadTemplate, setDisabled } from '../../utils/dom';
import { debounce } from '../../utils/function';
import { AgPromise } from '../../utils/promise';
import { PopupEventParams } from '../../widgets/popupService';
import { IFilterLocaleText, IFilterTitleLocaleText, DEFAULT_FILTER_LOCALE_TEXT } from '../filterLocaleText';
import { ManagedFocusFeature } from '../../widgets/managedFocusFeature';
import { convertToSet } from '../../utils/set';
import { Component } from '../../widgets/component';
import { RowNode } from '../../entities/rowNode';

type FilterButtonType = 'apply' | 'clear' | 'reset' | 'cancel';

export interface IProvidedFilterParams extends IFilterParams {
    buttons?: FilterButtonType[];
    closeOnApply?: boolean;
    debounceMs?: number;
    /** Defaults to false. If true, all UI inputs related to this filter are for display only, and
     * the filter can only be affected by API calls. */
    readOnly?: boolean;
}

/**
 * Contains common logic to all provided filters (apply button, clear button, etc).
 * All the filters that come with AG Grid extend this class. User filters do not
 * extend this class.
 *
 * @param M type of filter-model managed by the concrete sub-class that extends this type
 * @param V type of value managed by the concrete sub-class that extends this type
 */
export abstract class ProvidedFilter<M, V> extends Component implements IFilterComp {
    // each level in the hierarchy will save params with the appropriate type for that level.
    private providedFilterParams: IProvidedFilterParams;

    private applyActive = false;
    private hidePopup: ((params: PopupEventParams) => void) | null | undefined = null;
    // a debounce of the onBtApply method
    private onBtApplyDebounce: () => void;

    // after the user hits 'apply' the model gets copied to here. this is then the model that we use for
    // all filtering. so if user changes UI but doesn't hit apply, then the UI will be out of sync with this model.
    // this is what we want, as the UI should only become the 'active' filter once it's applied. when apply is
    // inactive, this model will be in sync (following the debounce ms). if the UI is not a valid filter
    // (eg the value is missing so nothing to filter on, or for set filter all checkboxes are checked so filter
    // not active) then this appliedModel will be null/undefined.
    private appliedModel: M | null = null;

    @Autowired('rowModel') protected readonly rowModel: IRowModel;

    constructor(private readonly filterNameKey: keyof IFilterTitleLocaleText) {
        super();
    }

    public abstract doesFilterPass(params: IDoesFilterPassParams): boolean;

    protected abstract updateUiVisibility(): void;

    protected abstract createBodyTemplate(): string;
    protected abstract getCssIdentifier(): string;
    protected abstract resetUiToDefaults(silent?: boolean): AgPromise<void>;

    protected abstract setModelIntoUi(model: M): AgPromise<void>;
    protected abstract areModelsEqual(a: M, b: M): boolean;

    /** Used to get the filter type for filter models. */
    protected abstract getFilterType(): string;

    @PostConstruct
    protected postConstruct(): void {
        this.resetTemplate(); // do this first to create the DOM
        this.createManagedBean(new ManagedFocusFeature(
            this.getFocusableElement(),
            {
                handleKeyDown: this.handleKeyDown.bind(this)
            }
        ));
    }

    // override
    protected handleKeyDown(e: KeyboardEvent): void {}

    public abstract getModelFromUi(): M | null;

    public getFilterTitle(): string {
        return this.translate(this.filterNameKey);
    }

    public isFilterActive(): boolean {
        // filter is active if we have a valid applied model
        return !!this.appliedModel;
    }

    protected resetTemplate(paramsMap?: any) {
        const templateString = /* html */`
            <div class="ag-filter-wrapper">
                <div class="ag-filter-body-wrapper ag-${this.getCssIdentifier()}-body-wrapper">
                    ${this.createBodyTemplate()}
                </div>
            </div>`;

        this.setTemplate(templateString, paramsMap);
    }

    protected isReadOnly(): boolean {
        return !!this.providedFilterParams.readOnly;
    }

    public init(params: IProvidedFilterParams): void {
        this.setParams(params);

        this.resetUiToDefaults(true).then(() => {
            this.updateUiVisibility();
            this.setupOnBtApplyDebounce();
        });
    }

    protected setParams(params: IProvidedFilterParams): void {
        this.providedFilterParams = params;

        this.applyActive = ProvidedFilter.isUseApplyButton(params);

        this.createButtonPanel();
    }

    private createButtonPanel(): void {
        const { buttons } = this.providedFilterParams;

        if (!buttons || buttons.length < 1 || this.isReadOnly()) {
            return;
        }

        const eButtonsPanel = document.createElement('div');

        eButtonsPanel.classList.add('ag-filter-apply-panel');

        const addButton = (type: FilterButtonType): void => {
            let text;
            let clickListener: (e?: Event) => void;

            switch (type) {
                case 'apply':
                    text = this.translate('applyFilter');
                    clickListener = (e) => this.onBtApply(false, false, e);
                    break;
                case 'clear':
                    text = this.translate('clearFilter');
                    clickListener = () => this.onBtClear();
                    break;
                case 'reset':
                    text = this.translate('resetFilter');
                    clickListener = () => this.onBtReset();
                    break;
                case 'cancel':
                    text = this.translate('cancelFilter');
                    clickListener = (e) => { this.onBtCancel(e!); };
                    break;
                default:
                    console.warn('Unknown button type specified');
                    return;
            }

            const button = loadTemplate(
                /* html */
                `<button
                    type="button"
                    ref="${type}FilterButton"
                    class="ag-standard-button ag-filter-apply-panel-button"
                >${text}
                </button>`
            );

            eButtonsPanel.appendChild(button);
            this.addManagedListener(button, 'click', clickListener);
        };

        convertToSet(buttons).forEach(type => addButton(type));

        this.getGui().appendChild(eButtonsPanel);
    }

    // subclasses can override this to provide alternative debounce defaults
    protected getDefaultDebounceMs(): number {
        return 0;
    }

    private setupOnBtApplyDebounce(): void {
        const debounceMs = ProvidedFilter.getDebounceMs(this.providedFilterParams, this.getDefaultDebounceMs());
        this.onBtApplyDebounce = debounce(this.onBtApply.bind(this), debounceMs);
    }

    public getModel(): M | null {
        return this.appliedModel;
    }

    public setModel(model: M | null): AgPromise<void> {
        const promise = model ? this.setModelIntoUi(model) : this.resetUiToDefaults();

        return promise.then(() => {
            this.updateUiVisibility();

            // we set the model from the GUI, rather than the provided model,
            // so the model is consistent, e.g. handling of null/undefined will be the same,
            // or if model is case insensitive, then casing is removed.
            this.applyModel();
        });
    }

    private onBtCancel(e: Event): void {
        const currentModel = this.getModel();

        const afterAppliedFunc = () => {
            this.onUiChanged(false, 'prevent');

            if (this.providedFilterParams.closeOnApply) {
                this.close(e);
            }
        };

        if (currentModel != null) {
            this.setModelIntoUi(currentModel).then(afterAppliedFunc);
        } else {
            this.resetUiToDefaults().then(afterAppliedFunc);
        }
    }

    private onBtClear(): void {
        this.resetUiToDefaults().then(() => this.onUiChanged());
    }

    private onBtReset(): void {
        this.onBtClear();
        this.onBtApply();
    }

    /**
     * Applies changes made in the UI to the filter, and returns true if the model has changed.
     */
    public applyModel(): boolean {
        const newModel = this.getModelFromUi();

        if (!this.isModelValid(newModel!)) { return false; }

        const previousModel = this.appliedModel;

        this.appliedModel = newModel;

        // models can be same if user pasted same content into text field, or maybe just changed the case
        // and it's a case insensitive filter
        return !this.areModelsEqual(previousModel!, newModel!);
    }

    protected isModelValid(model: M): boolean {
        return true;
    }

    protected onBtApply(afterFloatingFilter = false, afterDataChange = false, e?: Event): void {
        if (this.applyModel()) {
            // the floating filter uses 'afterFloatingFilter' info, so it doesn't refresh after filter changed if change
            // came from floating filter
            this.providedFilterParams.filterChangedCallback({ afterFloatingFilter, afterDataChange });
        }

        const { closeOnApply } = this.providedFilterParams;

        // only close if an apply button is visible, otherwise we'd be closing every time a change was made!
        if (closeOnApply && this.applyActive && !afterFloatingFilter && !afterDataChange) {
            this.close(e);
        }
    }

    public onNewRowsLoaded(): void {
        this.resetUiToDefaults().then(() => this.appliedModel = null);
    }

    public close(e?: Event): void {
        if (!this.hidePopup) { return; }

        const keyboardEvent = e as KeyboardEvent;
        const key = keyboardEvent && keyboardEvent.key;
        let params: PopupEventParams;

        if (key === 'Enter' || key === 'Space') {
            params = { keyboardEvent };
        }

        this.hidePopup(params!);
        this.hidePopup = null;
    }

    /**
     * By default, if the change came from a floating filter it will be applied immediately, otherwise if there is no
     * apply button it will be applied after a debounce, otherwise it will not be applied at all. This behaviour can
     * be adjusted by using the apply parameter.
     */
    protected onUiChanged(fromFloatingFilter = false, apply?: 'immediately' | 'debounce' | 'prevent'): void {
        this.updateUiVisibility();
        this.providedFilterParams.filterModifiedCallback();

        if (this.applyActive && !this.isReadOnly) {
            const isValid = this.isModelValid(this.getModelFromUi()!);

            setDisabled(this.getRefElement('applyFilterButton'), !isValid);
        }

        if ((fromFloatingFilter && !apply) || apply === 'immediately') {
            this.onBtApply(fromFloatingFilter);
        } else if ((!this.applyActive && !apply) || apply === 'debounce') {
            this.onBtApplyDebounce();
        }
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        if (params == null) { return; }

        this.hidePopup = params.hidePopup;
    }

    // static, as used by floating filter also
    public static getDebounceMs(params: IProvidedFilterParams, debounceDefault: number): number {
        if (ProvidedFilter.isUseApplyButton(params)) {
            if (params.debounceMs != null) {
                console.warn('AG Grid: debounceMs is ignored when apply button is present');
            }

            return 0;
        }

        return params.debounceMs != null ? params.debounceMs : debounceDefault;
    }

    // static, as used by floating filter also
    public static isUseApplyButton(params: IProvidedFilterParams): boolean {
        return !!params.buttons && params.buttons.indexOf('apply') >= 0;
    }

    public destroy(): void {
        this.hidePopup = null;

        super.destroy();
    }

    protected translate(key: keyof IFilterLocaleText | keyof IFilterTitleLocaleText): string {
        const translate = this.gridOptionsWrapper.getLocaleTextFunc();

        return translate(key, DEFAULT_FILTER_LOCALE_TEXT[key]);
    }

    protected getCellValue(rowNode: RowNode): V {
        return this.providedFilterParams.valueGetter(rowNode);
    }
}
