import {
    _,
    AgChartThemeOverrides,
    Autowired,
    BeanStub,
    ChartOptionsChanged,
    ChartType,
    ColumnApi,
    Events,
    GridApi,
    PostConstruct
} from "@ag-grid-community/core";
import { ChartController } from "./chartController";
import { CategoryAxis, Chart, ChartAxis, GroupedCategoryAxis, NumberAxis, TimeAxis } from "ag-charts-community";
import { getChartThemeOverridesObjectName } from "./chartThemeOverridesMapper";

export class ChartOptionsService extends BeanStub {

    @Autowired('gridApi') private readonly gridApi: GridApi;
    @Autowired('columnApi') private readonly columnApi: ColumnApi;

    private readonly chartController: ChartController;

    constructor(chartController: ChartController) {
        super();
        this.chartController = chartController;
    }

    public getChartType(): ChartType {
        return this.chartController.getChartType();
    }

    public getChartOption<T = string>(expression: string): T {
        return _.get(this.getChart(), expression, undefined) as T;
    }

    public setChartOption<T = string>(expression: string, value: T): void {
        // update chart options
        const optionsType = getChartThemeOverridesObjectName(this.getChartType());
        const options = _.get(this.getChartOptions(), `${optionsType}`, undefined);
        _.set(options, expression, value);

        // update chart
        _.set(this.getChart(), expression, value);

        this.raiseChartOptionsChangedEvent();
    }

    public getAxisProperty<T = string>(expression: string): T {
        return _.get(this.getChart().axes[0], expression, undefined) as T;
    }

    public setAxisProperty<T = string>(expression: string, value: T) {
        const chart = this.getChart();

        chart.axes.forEach((axis: any) => {
            // update axis options
            this.updateAxisOptions<T>(axis, expression, value);

            // update chart axis
            _.set(axis, expression, value)
        });

        // chart axis properties are not reactive, need to schedule a layout
        chart.layoutPending = true;

        this.raiseChartOptionsChangedEvent();
    }

    public getLabelRotation(axisType: 'xAxis' | 'yAxis'): number {
        const axis = this.getAxis(axisType);
        return _.get(axis, 'label.rotation', undefined);
    }

    public setLabelRotation(axisType: 'xAxis' | 'yAxis', value: number) {
        const expression = 'label.rotation';

        // update chart
        const chartAxis = this.getAxis(axisType);
        _.set(chartAxis, expression, value);

        // chart axis properties are not reactive, need to schedule a layout
        this.getChart().layoutPending = true;

        // do not update axis options when the default category is selected
        if (chartAxis && !this.chartController.isDefaultCategorySelected()) {
            this.updateAxisOptions(chartAxis, expression, value);
            this.raiseChartOptionsChangedEvent();
        }
    }

    public getSeriesOption<T = string>(expression: string): T {
        return _.get(this.getChart().series[0], expression, undefined) as T;
    }

    public setSeriesOption<T = string>(expression: string, value: T): void {
        // update series options
        const optionsType = getChartThemeOverridesObjectName(this.getChartType());
        _.set(this.getChartOptions()[optionsType].series, expression, value);

        // update chart
        this.getChart().series.forEach((s: any) => _.set(s, expression, value));

        this.raiseChartOptionsChangedEvent();
    }

    public getPairedMode(): boolean {
        const optionsType = getChartThemeOverridesObjectName(this.getChartType());
        return _.get(this.getChartOptions(), `${optionsType}.paired`, undefined);
    }

    public setPairedMode(paired: boolean): void {
        const optionsType = getChartThemeOverridesObjectName(this.getChartType());
        const options = _.get(this.getChartOptions(), `${optionsType}`, undefined);
        _.set(options, 'paired', paired);
    }

    private getChart(): Chart {
        return this.chartController.getChartProxy().getChart();
    }

    private getChartOptions(): AgChartThemeOverrides {
        return this.chartController.getChartProxy().getChartOptions();
    }

    private getAxis(axisType: string): ChartAxis | undefined {
        const chart = this.getChart();
        if (!chart.axes || chart.axes.length < 1) { return undefined; }

        if (axisType === 'xAxis') {
            return (chart.axes && chart.axes[0].direction === 'x') ? chart.axes[0] : chart.axes[1];
        }
        return (chart.axes && chart.axes[1].direction === 'y') ? chart.axes[1] : chart.axes[0];
    }

    private updateAxisOptions<T = string>(chartAxis: ChartAxis, expression: string, value: T) {
        const optionsType = getChartThemeOverridesObjectName(this.getChartType());
        const axisOptions = this.getChartOptions()[optionsType].axes;
        if (chartAxis instanceof NumberAxis) {
            _.set(axisOptions.number, expression, value);
        } else if (chartAxis instanceof CategoryAxis) {
            _.set(axisOptions.category, expression, value);
        } else if (chartAxis instanceof TimeAxis) {
            _.set(axisOptions.time, expression, value);
        } else if (chartAxis instanceof GroupedCategoryAxis) {
            _.set(axisOptions.groupedCategory, expression, value);
        }
    }

    private raiseChartOptionsChangedEvent(): void {
        const chartModel = this.chartController.getChartModel();

        const event: ChartOptionsChanged = Object.freeze({
            type: Events.EVENT_CHART_OPTIONS_CHANGED,
            chartId: chartModel.chartId,
            chartType: chartModel.chartType,
            chartThemeName: chartModel.chartThemeName!,
            chartOptions: chartModel.chartOptions,
            api: this.gridApi,
            columnApi: this.columnApi,
        });

        this.eventService.dispatchEvent(event);
    }

    protected destroy(): void {
        super.destroy();
    }
}