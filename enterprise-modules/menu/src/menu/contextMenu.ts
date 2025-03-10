import {
    _,
    AgEvent,
    Autowired,
    Bean,
    BeanStub,
    CellPosition,
    CellPositionUtils,
    Column,
    ColumnModel,
    Component,
    FocusService,
    GetContextMenuItems,
    GetContextMenuItemsParams,
    GridBodyComp,
    IAfterGuiAttachedParams,
    IContextMenuFactory,
    IRangeService,
    MenuItemDef,
    ModuleNames,
    ModuleRegistry,
    Optional,
    PopupService,
    PostConstruct,
    RowNode,
    CtrlsService
} from "@ag-grid-community/core";
import { MenuItemComponent } from "./menuItemComponent";
import { MenuList } from "./menuList";
import { MenuItemMapper } from "./menuItemMapper";

const CSS_MENU = 'ag-menu';
const CSS_CONTEXT_MENU_OPEN = 'ag-context-menu-open';

@Bean('contextMenuFactory')
export class ContextMenuFactory extends BeanStub implements IContextMenuFactory {

    @Autowired('popupService') private popupService: PopupService;
    @Optional('rangeService') private rangeService: IRangeService;
    @Autowired('ctrlsService') private ctrlsService: CtrlsService;
    @Autowired('columnModel') private columnModel: ColumnModel;

    private activeMenu: ContextMenu | null;

    public hideActiveMenu(): void {
        this.destroyBean(this.activeMenu);
    }

    private getMenuItems(node: RowNode | null, column: Column | null, value: any): (MenuItemDef | string)[] | undefined {
        const defaultMenuOptions: string[] = [];

        if (_.exists(node) && ModuleRegistry.isRegistered(ModuleNames.ClipboardModule)) {
            if (column) {
                // only makes sense if column exists, could have originated from a row
                defaultMenuOptions.push('copy', 'copyWithHeaders', 'paste', 'separator');
            }
        }

        if (this.gridOptionsWrapper.isEnableCharts() &&
            ModuleRegistry.isRegistered(ModuleNames.RangeSelectionModule) &&
            ModuleRegistry.isRegistered(ModuleNames.GridChartsModule)) {
            if (this.columnModel.isPivotMode()) {
                defaultMenuOptions.push('pivotChart');
            }

            if (this.rangeService && !this.rangeService.isEmpty()) {
                defaultMenuOptions.push('chartRange');
            }
        }

        if (_.exists(node)) {
            // if user clicks a cell
            const csvModuleMissing = !ModuleRegistry.isRegistered(ModuleNames.CsvExportModule);
            const excelModuleMissing = !ModuleRegistry.isRegistered(ModuleNames.ExcelExportModule);
            const suppressExcel = this.gridOptionsWrapper.isSuppressExcelExport() || excelModuleMissing;
            const suppressCsv = this.gridOptionsWrapper.isSuppressCsvExport() || csvModuleMissing;
            const onIPad = _.isIOSUserAgent();
            const anyExport: boolean = !onIPad && (!suppressExcel || !suppressCsv);
            if (anyExport) {
                defaultMenuOptions.push('export');
            }
        }

        if (this.gridOptionsWrapper.getContextMenuItemsFunc()) {
            const userFunc: GetContextMenuItems | undefined = this.gridOptionsWrapper.getContextMenuItemsFunc();
            const params: GetContextMenuItemsParams = {
                node: node,
                column: column,
                value: value,
                defaultItems: defaultMenuOptions.length ? defaultMenuOptions : undefined,
                api: this.gridOptionsWrapper.getApi()!,
                columnApi: this.gridOptionsWrapper.getColumnApi()!,
                context: this.gridOptionsWrapper.getContext()
            };

            return userFunc ? userFunc(params) : undefined;
        }

        return defaultMenuOptions;
    }

    public onContextMenu(mouseEvent: MouseEvent | null, touchEvent: TouchEvent | null, rowNode: RowNode | null, column: Column | null, value: any, anchorToElement: HTMLElement): void {
        // to allow us to debug in chrome, we ignore the event if ctrl is pressed.
        // not everyone wants this, so first 'if' below allows to turn this hack off.
        if (!this.gridOptionsWrapper.isAllowContextMenuWithControlKey()) {
            // then do the check
            if (mouseEvent && (mouseEvent.ctrlKey || mouseEvent.metaKey)) { return; }
        }

        // need to do this regardless of context menu showing or not, so doing
        // before the isSuppressContextMenu() check
        if (mouseEvent) {
            this.blockMiddleClickScrollsIfNeeded(mouseEvent);
        }

        if (this.gridOptionsWrapper.isSuppressContextMenu()) { return; }

        const eventOrTouch: (MouseEvent | Touch) = mouseEvent ? mouseEvent : touchEvent!.touches[0];
        if (this.showMenu(rowNode, column, value, eventOrTouch, anchorToElement)) {
            const event = mouseEvent ? mouseEvent : touchEvent;
            event!.preventDefault();
        }
    }

    private blockMiddleClickScrollsIfNeeded(mouseEvent: MouseEvent): void {
        // if we don't do this, then middle click will never result in a 'click' event, as 'mousedown'
        // will be consumed by the browser to mean 'scroll' (as you can scroll with the middle mouse
        // button in the browser). so this property allows the user to receive middle button clicks if
        // they want.
        const { gridOptionsWrapper } = this;
        const { which } = mouseEvent;

        if (gridOptionsWrapper.isSuppressMiddleClickScrolls() && which === 2) {
            mouseEvent.preventDefault();
        }
    }

    public showMenu(node: RowNode | null, column: Column | null, value: any, mouseEvent: MouseEvent | Touch, anchorToElement: HTMLElement): boolean {
        const menuItems = this.getMenuItems(node, column, value);
        const eGridBodyGui = this.ctrlsService.getGridBodyCtrl().getGui();

        if (menuItems === undefined || _.missingOrEmpty(menuItems)) { return false; }

        const menu = new ContextMenu(menuItems);
        this.createBean(menu);

        const eMenuGui = menu.getGui();

        const positionParams = {
            column: column,
            rowNode: node,
            type: 'contextMenu',
            mouseEvent: mouseEvent,
            ePopup: eMenuGui,
            // move one pixel away so that accidentally double clicking
            // won't show the browser's contextmenu
            nudgeY: 1
        };

        const translate = this.gridOptionsWrapper.getLocaleTextFunc();

        const addPopupRes = this.popupService.addPopup({
            modal: true,
            eChild: eMenuGui,
            closeOnEsc: true,
            closedCallback: () => {
                eGridBodyGui.classList.remove(CSS_CONTEXT_MENU_OPEN);
                this.destroyBean(menu);
            },
            click: mouseEvent,
            positionCallback: () => {
                this.popupService.positionPopupUnderMouseEvent(Object.assign({}, {
                    nudgeX: this.gridOptionsWrapper.isEnableRtl() ? (eMenuGui.offsetWidth + 1) * -1 : 1
                }, positionParams));
            },
            // so when browser is scrolled down, or grid is scrolled, context menu stays with cell
            anchorToElement: anchorToElement,
            ariaLabel: translate('ariaLabelContextMenu', 'Context Menu')
        });

        if (addPopupRes) {
            eGridBodyGui.classList.add(CSS_CONTEXT_MENU_OPEN);
            menu.afterGuiAttached({ container: 'contextMenu', hidePopup: addPopupRes.hideFunc });
        }

        // there should never be an active menu at this point, however it was found
        // that you could right click a second time just 1 or 2 pixels from the first
        // click, and another menu would pop up. so somehow the logic for closing the
        // first menu (clicking outside should close it) was glitchy somehow. an easy
        // way to avoid this is just remove the old context menu here if it exists.
        if (this.activeMenu) {
            this.hideActiveMenu();
        }

        this.activeMenu = menu;

        menu.addEventListener(BeanStub.EVENT_DESTROYED, () => {
            if (this.activeMenu === menu) {
                this.activeMenu = null;
            }
        });

        // hide the popup if something gets selected
        if (addPopupRes) {
            menu.addEventListener(MenuItemComponent.EVENT_MENU_ITEM_SELECTED, addPopupRes.hideFunc);
        }

        return true;
    }
}

class ContextMenu extends Component {

    @Autowired('menuItemMapper') private menuItemMapper: MenuItemMapper;
    @Autowired('focusService') private focusService: FocusService;
    @Autowired('cellPositionUtils') private cellPositionUtils: CellPositionUtils;

    private menuItems: (MenuItemDef | string)[];
    private menuList: MenuList | null = null;
    private focusedCell: CellPosition | null = null;

    constructor(menuItems: (MenuItemDef | string)[]) {
        super(/* html */`<div class="${CSS_MENU}" role="presentation"></div>`);
        this.menuItems = menuItems;
    }

    @PostConstruct
    private addMenuItems(): void {
        const menuList = this.createBean(new MenuList());
        const menuItemsMapped = this.menuItemMapper.mapWithStockItems(this.menuItems, null);

        menuList.addMenuItems(menuItemsMapped);

        this.appendChild(menuList);
        this.menuList = menuList;

        menuList.addEventListener(MenuItemComponent.EVENT_MENU_ITEM_SELECTED, (e:AgEvent) => this.dispatchEvent(e));
    }

    public afterGuiAttached(params: IAfterGuiAttachedParams): void {
        if (params.hidePopup) {
            this.addDestroyFunc(params.hidePopup);
        }

        this.focusedCell = this.focusService.getFocusedCell();

        if (this.menuList) {
            this.focusService.focusInto(this.menuList.getGui());
        }
    }

    private restoreFocusedCell(): void {
        const currentFocusedCell = this.focusService.getFocusedCell();

        if (currentFocusedCell && this.focusedCell && this.cellPositionUtils.equals(currentFocusedCell, this.focusedCell)) {
            const { rowIndex, rowPinned, column } = this.focusedCell;
            const doc = this.gridOptionsWrapper.getDocument();

            if (doc.activeElement === doc.body) {
                this.focusService.setFocusedCell(rowIndex, column, rowPinned, true);
            }
        }
    }

    protected destroy(): void {
        this.restoreFocusedCell();
        super.destroy();
    }
}
