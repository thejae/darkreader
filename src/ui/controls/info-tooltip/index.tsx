import {m} from 'malevic';

export interface InfoTooltipItem {
    term: string;
    description: string;
}

export interface InfoTooltipProps {
    label?: string;
    title?: string;
    text?: string;
    items?: InfoTooltipItem[];
    placement?: 'top' | 'bottom';
    align?: 'left' | 'center' | 'right';
}

let tooltipIdCounter = 0;

/**
 * Reusable modern `(i)` info tooltip control.
 * Opens on hover, keyboard focus, or click/tap and closes on Escape or blur.
 */
export default function InfoTooltip(props: InfoTooltipProps) {
    const {
        label = 'More information',
        title,
        text,
        items,
        placement = 'top',
        align = 'left',
    } = props;

    const tooltipId = `dr-info-tooltip-${++tooltipIdCounter}`;

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            (e.currentTarget as HTMLElement)?.blur();
        }
    }

    return (
        <span class={`info-tooltip info-tooltip--${placement} info-tooltip--align-${align}`}>
            <button
                type="button"
                class="info-tooltip__trigger"
                aria-label={label}
                aria-describedby={tooltipId}
                onkeydown={handleKeyDown}
            >
                <svg
                    class="info-tooltip__icon"
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    aria-hidden="true"
                >
                    <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" stroke-width="1.35" />
                    <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
                    <path d="M8 7.3v4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
            </button>
            <div id={tooltipId} class="info-tooltip__popover" role="tooltip">
                {title ? <div class="info-tooltip__title">{title}</div> : null}
                {text ? <p class="info-tooltip__text">{text}</p> : null}
                {items && items.length > 0 ? (
                    <dl class="info-tooltip__list">
                        {items.map((item) => (
                            <div class="info-tooltip__item">
                                <dt class="info-tooltip__term">{item.term}</dt>
                                <dd class="info-tooltip__desc">{item.description}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
            </div>
        </span>
    );
}
