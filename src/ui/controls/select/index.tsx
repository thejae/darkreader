import {m} from 'malevic';
import {getContext} from 'malevic/dom';
import {withState, useState} from 'malevic/state';

import Button from '../button';
import TextBox from '../textbox';
import VirtualScroll from '../virtual-scroll';

interface SelectProps {
    class?: any;
    value: string;
    options: {
        [value: string]: Malevic.Child;
    };
    onChange: (value: string) => void;
}

interface SelectState {
    isExpanded: boolean;
    focusedIndex: number | null;
}

function Select(props: SelectProps) {
    const {state, setState} = useState<SelectState>({isExpanded: false, focusedIndex: null});
    const values = Object.keys(props.options);

    const {store} = getContext();
    const valueNodes: Map<string, Element> = store.valueNodes || (store.valueNodes = new Map());
    const nodesValues: WeakMap<Element, string> = store.nodesValues || (store.nodesValues = new WeakMap());

    function onRender(node: Element) {
        store.rootNode = node;
    }

    function onOuterClick(e: MouseEvent) {
        const r = (store.rootNode as Element).getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
            window.removeEventListener('click', onOuterClick);
            collapseList();
        }
    }

    function onTextInput(e: Event) {
        const text = (e.target as HTMLInputElement)
            .value
            .toLowerCase()
            .trim();

        expandList();

        values.some((value) => {
            if (value.toLowerCase().indexOf(text) === 0) {
                scrollToValue(value);
                return true;
            }
        });
    }

    function onKeyPress(e: KeyboardEvent) {
        const input = e.target as HTMLInputElement;
        if (e.key === 'Enter') {
            const value = state.isExpanded && state.focusedIndex != null && state.focusedIndex >= 0
                ? values[state.focusedIndex]
                : input.value;
            input.blur();
            collapseList();
            props.onChange(value);
        }
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
            return;
        }
        e.preventDefault();
        const current = state.focusedIndex == null ? values.indexOf(props.value) : state.focusedIndex;
        const nextIndex = Math.max(0, Math.min(values.length - 1, (current < 0 ? 0 : current) + (e.key === 'ArrowDown' ? 1 : -1)));
        if (!state.isExpanded) {
            expandList();
        }
        setState({focusedIndex: nextIndex});
    }

    function scrollToValue(value: string) {
        setState({focusedIndex: values.indexOf(value)});
    }

    function onExpandClick() {
        if (state.isExpanded) {
            collapseList();
        } else {
            expandList();
        }
    }

    function expandList() {
        setState({isExpanded: true});
        scrollToValue(props.value);
        window.addEventListener('click', onOuterClick, {passive: true});
    }

    function collapseList() {
        setState({isExpanded: false});
    }

    function onSelectOption(e: MouseEvent) {
        let current = e.target as HTMLElement;
        while (current && !nodesValues.has(current)) {
            current = current.parentElement!;
        }

        if (current) {
            const value = nodesValues.get(current)!;
            props.onChange(value);
        }

        collapseList();
    }

    function saveValueNode(value: string, domNode: Element) {
        valueNodes.set(value, domNode);
        nodesValues.set(domNode, value);
    }

    function removeValueNode(value: string) {
        const el = valueNodes.get(value);
        valueNodes.delete(value);
        nodesValues.delete(el!);
    }

    return (
        <span
            class={[
                'select',
                state.isExpanded && 'select--expanded',
                props.class,
            ]}
            onrender={onRender}
            onkeydown={onKeyDown}
        >
            <span class="select__line">
                <TextBox
                    class="select__textbox"
                    value={props.value}
                    oninput={onTextInput}
                    onkeypress={onKeyPress}
                />
                <Button
                    class="select__expand"
                    onclick={onExpandClick}
                >
                    <span class="select__expand__icon"></span>
                </Button>
            </span>
            <VirtualScroll
                root={<span
                    class={{
                        'select__list': true,
                        'select__list--expanded': state.isExpanded,
                        'select__list--short': Object.keys(props.options).length <= 7,
                    }}
                    onclick={onSelectOption}
                />}
                items={Object.entries(props.options).map(([value, content], index) => (
                    <span
                        class={{
                            'select__option': true,
                            'select__option--focused': index === state.focusedIndex,
                            'select__option--selected': value === props.value,
                        }}
                        role="option"
                        aria-selected={String(value === props.value)}
                        data={value}
                        onrender={(domNode) => saveValueNode(value, domNode)}
                        onremove={() => removeValueNode(value)}
                    >
                        {content}
                    </span>
                ))}
                scrollToIndex={state.focusedIndex}
            />
        </span>
    );
}

export default withState(Select as any);
