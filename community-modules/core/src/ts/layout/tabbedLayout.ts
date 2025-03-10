import { AgPromise } from '../utils';
import { RefSelector } from '../widgets/componentAnnotations';
import { ManagedFocusFeature } from '../widgets/managedFocusFeature';
import { IAfterGuiAttachedParams } from '../interfaces/iAfterGuiAttachedParams';
import { clearElement } from '../utils/dom';
import { setAriaLabel, setAriaRole } from '../utils/aria';
import { callIfPresent } from '../utils/function';
import { KeyCode } from '../constants/keyCode';
import { Component } from '../widgets/component';
import { PostConstruct, Autowired } from '../context/context';
import { FocusService } from '../focusService';

export class TabbedLayout extends Component {

    @Autowired('focusService') private focusService: FocusService;

    @RefSelector('eHeader') private readonly eHeader: HTMLElement;
    @RefSelector('eBody') private readonly eBody: HTMLElement;

    private params: TabbedLayoutParams;
    private afterAttachedParams: IAfterGuiAttachedParams;
    private items: TabbedItemWrapper[] = [];
    private activeItem: TabbedItemWrapper;

    constructor(params: TabbedLayoutParams) {
        super(TabbedLayout.getTemplate(params.cssClass));
        this.params = params;

        if (params.items) {
            params.items.forEach(item => this.addItem(item));
        }
    }

    @PostConstruct
    private postConstruct() {
        this.createManagedBean(new ManagedFocusFeature(
            this.getFocusableElement(),
            {
                onTabKeyDown: this.onTabKeyDown.bind(this),
                handleKeyDown: this.handleKeyDown.bind(this)
            }
        ));
    }

    private static getTemplate(cssClass?: string) {
        return /* html */ `<div class="ag-tabs ${cssClass}">
            <div ref="eHeader" role="tablist" class="ag-tabs-header ${cssClass ? `${cssClass}-header` : ''}"></div>
            <div ref="eBody" role="presentation" class="ag-tabs-body ${cssClass ? `${cssClass}-body` : ''}"></div>
        </div>`;
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case KeyCode.RIGHT:
            case KeyCode.LEFT:
                if (!this.eHeader.contains(document.activeElement)) { return; }

                const currentPosition = this.items.indexOf(this.activeItem);
                const nextPosition = e.key === KeyCode.RIGHT ? Math.min(currentPosition + 1, this.items.length - 1) : Math.max(currentPosition - 1, 0);

                if (currentPosition === nextPosition) { return; }

                e.preventDefault();

                const nextItem = this.items[nextPosition];

                this.showItemWrapper(nextItem);
                nextItem.eHeaderButton.focus();
                break;
            case KeyCode.UP:
            case KeyCode.DOWN:
                e.stopPropagation();
                break;
        }
    }

    protected onTabKeyDown(e: KeyboardEvent) {
        if (e.defaultPrevented) { return; }

        const { focusService, eHeader, eBody, activeItem } = this;
        const activeElement = document.activeElement as HTMLElement;

        e.preventDefault();

        if (eHeader.contains(activeElement)) {
            // focus is in header, move into body of popup
            focusService.focusInto(eBody, e.shiftKey);
        } else {
            // focus is in body, establish if it should return to header
            if (focusService.isFocusUnderManagedComponent(eBody)) {
                // focus was in a managed focus component and has now left, so we can return to the header
                activeItem.eHeaderButton.focus();
            } else {
                const nextEl = focusService.findNextFocusableElement(eBody, false, e.shiftKey);

                if (nextEl) {
                    // if another element exists in the body that can be focussed, go to that
                    nextEl.focus();
                } else {
                    // otherwise return to the header
                    activeItem.eHeaderButton.focus();
                }
            }
        }
    }

    public setAfterAttachedParams(params: IAfterGuiAttachedParams): void {
        this.afterAttachedParams = params;
    }

    public showFirstItem(): void {
        if (this.items.length > 0) {
            this.showItemWrapper(this.items[0]);
        }
    }

    private addItem(item: TabbedItem): void {
        const eHeaderButton = document.createElement('span');

        setAriaRole(eHeaderButton, 'tab');
        eHeaderButton.setAttribute('tabIndex', '-1');
        eHeaderButton.appendChild(item.title);
        eHeaderButton.classList.add('ag-tab');

        this.eHeader.appendChild(eHeaderButton);
        setAriaLabel(eHeaderButton, item.titleLabel);

        const wrapper: TabbedItemWrapper = {
            tabbedItem: item,
            eHeaderButton: eHeaderButton
        };
        this.items.push(wrapper);

        eHeaderButton.addEventListener('click', this.showItemWrapper.bind(this, wrapper));
    }

    public showItem(tabbedItem: TabbedItem): void {
        const itemWrapper = this.items.find(wrapper => wrapper.tabbedItem === tabbedItem);

        if (itemWrapper) {
            this.showItemWrapper(itemWrapper);
        }
    }

    private showItemWrapper(wrapper: TabbedItemWrapper): void {
        if (this.params.onItemClicked) {
            this.params.onItemClicked({ item: wrapper.tabbedItem });
        }

        if (this.activeItem === wrapper) {
            callIfPresent(this.params.onActiveItemClicked!);
            return;
        }

        clearElement(this.eBody);

        wrapper.tabbedItem.bodyPromise.then(body => {
            this.eBody.appendChild(body!);
            const onlyUnmanaged = !this.focusService.isKeyboardMode();

            this.focusService.focusInto(this.eBody, false, onlyUnmanaged);

            if (wrapper.tabbedItem.afterAttachedCallback) {
                wrapper.tabbedItem.afterAttachedCallback(this.afterAttachedParams);
            }
        });

        if (this.activeItem) {
            this.activeItem.eHeaderButton.classList.remove('ag-tab-selected');
        }

        wrapper.eHeaderButton.classList.add('ag-tab-selected');

        this.activeItem = wrapper;
    }
}

export interface TabbedLayoutParams {
    items: TabbedItem[];
    cssClass?: string;
    onItemClicked?: Function;
    onActiveItemClicked?: Function;
}

export interface TabbedItem {
    title: Element;
    titleLabel: string;
    bodyPromise: AgPromise<HTMLElement>;
    name: string;
    afterAttachedCallback?: (params: IAfterGuiAttachedParams) => void;
}

interface TabbedItemWrapper {
    tabbedItem: TabbedItem;
    eHeaderButton: HTMLElement;
}
