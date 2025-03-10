import {
    Component,
    FilterChangedEvent,
    _,
    IFloatingFilterComp,
    IFloatingFilterParams,
    UserComponentFactory,
    Autowired,
    HeaderFilterCellCtrl,
    IFilterDef,
    AgPromise,
    IFilterComp,
} from '@ag-grid-community/core';
import { IMultiFilterParams, IMultiFilterModel, MultiFilter } from './multiFilter';

export class MultiFloatingFilterComp extends Component implements IFloatingFilterComp {
    @Autowired('userComponentFactory') private readonly userComponentFactory: UserComponentFactory;

    private floatingFilters: IFloatingFilterComp[] = [];
    private params: IFloatingFilterParams;

    constructor() {
        super(/* html */`<div class="ag-multi-floating-filter ag-floating-filter-input"></div>`);
    }

    public init(params: IFloatingFilterParams): AgPromise<void> {
        this.params = params;

        const filterParams = params.filterParams as IMultiFilterParams;
        const floatingFilterPromises: AgPromise<IFloatingFilterComp>[] = [];

        MultiFilter.getFilterDefs(filterParams).forEach((filterDef, index) => {
            const floatingFilterParams: IFloatingFilterParams = {
                ...params,
                // set the parent filter instance for each floating filter to the relevant child filter instance
                parentFilterInstance: (callback: (filterInstance: IFilterComp) => void) => {
                    params.parentFilterInstance(parent => {
                        const childFilterInstance = (parent as MultiFilter).getChildFilterInstance(index);
                        callback(childFilterInstance);
                    });
                }
            };

            const floatingFilterPromise = this.createFloatingFilter(filterDef, floatingFilterParams);

            if (floatingFilterPromise != null) {
                floatingFilterPromises.push(floatingFilterPromise);
            }
        });

        return AgPromise.all(floatingFilterPromises).then(floatingFilters => {
            floatingFilters!.forEach((floatingFilter, index) => {
                this.floatingFilters.push(floatingFilter!);

                const gui = floatingFilter!.getGui();

                this.appendChild(gui);

                if (index > 0) {
                    _.setDisplayed(gui, false);
                }
            });
        });
    }

    public onParentModelChanged(model: IMultiFilterModel, event: FilterChangedEvent): void {
        // We don't want to update the floating filter if the floating filter caused the change,
        // because the UI is already in sync. if we didn't do this, the UI would behave strangely
        // as it would be updating as the user is typing
        if (event && event.afterFloatingFilter) { return; }

        this.params.parentFilterInstance((parent: MultiFilter) => {
            if (model == null) {
                this.floatingFilters.forEach((filter, i) => {
                    filter.onParentModelChanged(null, event);
                    _.setDisplayed(filter.getGui(), i === 0);
                });
            } else {
                const lastActiveFloatingFilterIndex = parent.getLastActiveFilterIndex();

                this.floatingFilters.forEach((filter, i) => {
                    const filterModel = model.filterModels!.length > i ? model.filterModels![i] : null;

                    filter.onParentModelChanged(filterModel, event);

                    const shouldShow = lastActiveFloatingFilterIndex == null ? i === 0 : i === lastActiveFloatingFilterIndex;

                    _.setDisplayed(filter.getGui(), shouldShow);
                });
            }
        });
    }

    public destroy(): void {
        this.destroyBeans(this.floatingFilters);
        this.floatingFilters.length = 0;

        super.destroy();
    }

    private createFloatingFilter(filterDef: IFilterDef, params: IFloatingFilterParams): AgPromise<IFloatingFilterComp> | null {
        const defaultComponentName =
            HeaderFilterCellCtrl.getDefaultFloatingFilterType(filterDef) || 'agTextColumnFloatingFilter';

        const compDetails = this.userComponentFactory.getFloatingFilterCompDetails(filterDef, params, defaultComponentName);
        return compDetails ? compDetails.newAgStackInstance() : null;
    }
}