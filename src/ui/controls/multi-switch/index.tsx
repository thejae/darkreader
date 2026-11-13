import {m} from 'malevic';

interface MultiSwitchProps {
    class?: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
}

export default function MultiSwitch(props: MultiSwitchProps, ...children: Malevic.Child[]) {
    function onOptionKeydown(e: KeyboardEvent, option: string) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                option !== props.value && props.onChange(option);
                break;
            case 'ArrowLeft':
            case 'ArrowRight': {
                e.preventDefault();
                const index = props.options.indexOf(option);
                const next = props.options[index + (e.key === 'ArrowLeft' ? -1 : 1)];
                if (next == null) {
                    break;
                }
                const root = (e.currentTarget as HTMLElement).parentElement;
                const nextElement = root?.querySelector(`[data-option="${next}"]`) as HTMLElement | null;
                nextElement?.focus();
                props.onChange(next);
                break;
            }
        }
    }

    return (
        <span class={['multi-switch', props.class]} role="radiogroup">
            <span
                class="multi-switch__highlight"
                style={{
                    'left': `${props.options.indexOf(props.value) / props.options.length * 100}%`,
                    'width': `${1 / props.options.length * 100}%`,
                }}
            />
            {props.options.map((option) => (
                <span
                    class={{
                        'multi-switch__option': true,
                        'multi-switch__option--selected': option === props.value,
                    }}
                    role="radio"
                    aria-checked={String(option === props.value)}
                    data-option={option}
                    tabindex={option === props.value ? '0' : '-1'}
                    onclick={() => option !== props.value && props.onChange(option)}
                    onkeydown={(e: KeyboardEvent) => onOptionKeydown(e, option)}
                >
                    {option}
                </span>
            ))}
            {...children}
        </span>
    );
}
