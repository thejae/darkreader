import type {Child} from 'malevic';
import {m} from 'malevic';

interface ToggleProps {
    checked: boolean;
    class?: string;
    labelOn: Child;
    labelOff: Child;
    onChange: (checked: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const {checked, onChange} = props;

    const cls = [
        'toggle',
        checked ? 'toggle--checked' : null,
        props.class,
    ];

    const clsOn = {
        'toggle__btn': true,
        'toggle__on': true,
        'toggle__btn--active': checked,
    };

    const clsOff = {
        'toggle__btn': true,
        'toggle__off': true,
        'toggle__btn--active': !checked,
    };

    function onKeydown(e: KeyboardEvent, value: boolean) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange && !checked && onChange(value);
        }
    }

    return (
        <span class={cls}>
            <span
                class={clsOn}
                role="button"
                tabindex="0"
                aria-pressed={String(checked)}
                onclick={onChange ? () => !checked && onChange(true) : undefined}
                onkeydown={(e: KeyboardEvent) => onKeydown(e, true)}
            >
                {props.labelOn}
            </span>
            <span
                class={clsOff}
                role="button"
                tabindex="0"
                aria-pressed={String(checked)}
                onclick={onChange ? () => checked && onChange(false) : undefined}
                onkeydown={(e: KeyboardEvent) => onKeydown(e, false)}
            >
                {props.labelOff}
            </span>
        </span>
    );
}
