import {m} from 'malevic';
import {getContext} from 'malevic/dom';

export type DropDownOption<T> = {id: T; content: Malevic.Child};

interface DropDownProps<T> {
    class?: string;
    selected: T;
    options: Array<DropDownOption<T>>;
    onChange: (value: T) => void;
}

interface DropDownStore {
    isOpen: boolean;
    listNode: HTMLElement;
    selectedNode: HTMLElement;
}

export default function DropDown<T>(props: DropDownProps<T>) {
    const context = getContext();
    const store: DropDownStore = context.store;

    if (context.prev) {
        const currOptions = props.options.map((o) => o.id);
        const prevOptions = (context.prev.props.options as Array<DropDownOption<T>>).map((o) => o.id);
        if (currOptions.length !== prevOptions.length || currOptions.some((o, i) => o !== prevOptions[i])) {
            store.isOpen = false;
        }
    }

    function saveListNode(el: Node) {
        store.listNode = el as HTMLElement;
    }

    function saveSelectedNode(el: Node) {
        store.selectedNode = el as HTMLElement;
    }

    function selectValue(value: DropDownOption<T>) {
        store.isOpen = false;
        context.refresh();
        store.selectedNode.focus();
        props.onChange(value.id);
    }

    function openList() {
        store.isOpen = true;
        context.refresh();
        const selected = store.listNode.querySelector('.dropdown__list__item--selected') as HTMLElement | null;
        (selected || store.listNode.firstElementChild as HTMLElement | null)?.focus();
    }

    function onSelectedKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            openList();
        }
    }

    function onItemKeydown(e: KeyboardEvent, value: DropDownOption<T>) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                selectValue(value);
                break;
            case 'Escape':
                e.preventDefault();
                store.isOpen = false;
                context.refresh();
                store.selectedNode.focus();
                break;
            case 'ArrowDown': {
                e.preventDefault();
                const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null;
                if (next) {
                    next.focus();
                }
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null;
                if (prev) {
                    prev.focus();
                } else {
                    store.selectedNode.focus();
                }
                break;
            }
        }
    }

    function onSelectedClick() {
        store.isOpen = !store.isOpen;
        context.refresh();

        if (store.isOpen) {
            const onOuterClick = (e: MouseEvent) => {
                window.removeEventListener('mousedown', onOuterClick);

                const listRect = store.listNode.getBoundingClientRect();
                const ex = e.clientX;
                const ey = e.clientY;
                if (
                    ex < listRect.left ||
                    ex > listRect.right ||
                    ey < listRect.top ||
                    ey > listRect.bottom
                ) {
                    store.isOpen = false;
                    context.refresh();
                }
            };

            window.addEventListener('mousedown', onOuterClick, {passive: true});
        }
    }

    function createListItem(value: DropDownOption<T>) {
        return (
            <span
                class={{
                    'dropdown__list__item': true,
                    'dropdown__list__item--selected': value.id === props.selected,
                    [props.class!]: Boolean(props.class),
                }}
                role="option"
                aria-selected={String(value.id === props.selected)}
                tabindex="0"
                onclick={() => selectValue(value)}
                onkeydown={(e: KeyboardEvent) => onItemKeydown(e, value)}
            >
                {value.content}
            </span>
        );
    }

    const selectedContent = props.options.find((value) => value.id === props.selected)!.content;

    return (
        <span
            class={{
                'dropdown': true,
                'dropdown--open': store.isOpen,
                [props.class!]: Boolean(props.class),
            }}
        >
            <span
                class="dropdown__list"
                oncreate={saveListNode}
            >
                {props.options
                    .slice()
                    .sort((a, b) => a.id === props.selected ? -1 : b.id === props.selected ? 1 : 0)
                    .map(createListItem)}
            </span>
            <span
                class="dropdown__selected"
                oncreate={saveSelectedNode}
                onclick={onSelectedClick}
                onkeydown={onSelectedKeydown}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={String(store.isOpen)}
                tabindex="0"
            >
                <span class="dropdown__selected__text">
                    {selectedContent}
                </span>
            </span>
        </span >
    );
}
