/**
 * @fileoverview Quick Mood presets, surface tone color mappings, and CSS preview
 * filter helpers for the Option 6b Arc Spatial Glass popup.
 */

import type {SurfaceTone, Theme} from '../../definitions';
import {FilterMode} from '../../generators/css-filter';

export type PresetId = 'default' | 'reading' | 'cinema' | 'midnight';

export const SURFACE_TONE_COLORS: Record<SurfaceTone, string> = {
    slate: '#252b37',
    charcoal: '#181a1b',
    oled: '#000000',
};

export interface FilterPreset {
    label: string;
    theme: Partial<Theme>;
}

export const FILTER_PRESETS: Record<PresetId, FilterPreset> = {
    default: {
        label: 'Balanced',
        theme: {
            mode: FilterMode.dark,
            brightness: 100,
            contrast: 100,
            sepia: 0,
            grayscale: 0,
            imageBrightness: 100,
            surfaceTone: 'charcoal',
            darkSchemeBackgroundColor: SURFACE_TONE_COLORS.charcoal,
        },
    },
    reading: {
        label: 'Warm Read',
        theme: {
            mode: FilterMode.dark,
            brightness: 92,
            contrast: 96,
            sepia: 32,
            grayscale: 0,
            imageBrightness: 85,
            surfaceTone: 'slate',
            darkSchemeBackgroundColor: SURFACE_TONE_COLORS.slate,
        },
    },
    cinema: {
        label: 'Cinema',
        theme: {
            mode: FilterMode.dark,
            brightness: 85,
            contrast: 118,
            sepia: 0,
            grayscale: 0,
            imageBrightness: 90,
            surfaceTone: 'oled',
            darkSchemeBackgroundColor: SURFACE_TONE_COLORS.oled,
        },
    },
    midnight: {
        label: 'Midnight Ink',
        theme: {
            mode: FilterMode.dark,
            brightness: 76,
            contrast: 108,
            sepia: 10,
            grayscale: 65,
            imageBrightness: 70,
            surfaceTone: 'oled',
            darkSchemeBackgroundColor: SURFACE_TONE_COLORS.oled,
        },
    },
};

/**
 * Detects which Quick Mood preset matches the given theme, or `'custom'` if modified.
 */
export function detectActivePreset(theme: Theme): PresetId | 'custom' {
    const surfaceTone = theme.surfaceTone ?? 'charcoal';
    const imageBrightness = theme.imageBrightness ?? 100;
    for (const id of Object.keys(FILTER_PRESETS) as PresetId[]) {
        const p = FILTER_PRESETS[id].theme;
        if (
            theme.mode === p.mode &&
            theme.brightness === p.brightness &&
            theme.contrast === p.contrast &&
            theme.sepia === p.sepia &&
            theme.grayscale === p.grayscale &&
            imageBrightness === p.imageBrightness &&
            surfaceTone === p.surfaceTone
        ) {
            return id;
        }
    }
    return 'custom';
}

/**
 * Computes a CSS `filter` string for the live mini-preview card.
 */
export function computePreviewFilter(enabled: boolean, theme: Theme): string {
    if (!enabled) {
        return 'none';
    }
    return [
        `brightness(${theme.brightness}%)`,
        `contrast(${theme.contrast}%)`,
        `sepia(${theme.sepia}%)`,
        `grayscale(${theme.grayscale}%)`,
    ].join(' ');
}
