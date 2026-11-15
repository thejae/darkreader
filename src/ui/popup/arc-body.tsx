/**
 * @fileoverview Option 6b: Arc Spatial Glass — Site-Scoped Sandbox Popup UI.
 * Replicates the 06b-arc-site-scoped design 1:1 and wires all controls
 * (Power, Theme Mode, Quick Moods, Surface Darkness, Optics Sliders,
 * Global/Site Scoping, and Time/Sunset Auto-Schedule) to Dark Reader's
 * live ExtensionActions & UserSettings.
 */

import {m} from 'malevic';
import {useState, withState} from 'malevic/state';

import type {
    ExtensionActions,
    ExtensionData,
    SiteScheduleConfig,
    SurfaceTone,
    Theme,
    UserSettings,
} from '../../definitions';
import {FilterMode} from '../../generators/css-filter';
import {AutomationMode} from '../../utils/automation';
import {getSunsetSunriseLocalTimes, isInTimeIntervalLocal, isNightAtLocation} from '../../utils/time';
import {getURLHostOrProtocol, isURLInList} from '../../utils/url';

import {
    computePreviewFilter,
    detectActivePreset,
    FILTER_PRESETS,
    SURFACE_TONE_COLORS,
    type PresetId,
} from './arc-presets';
import {TOP_TRAFFIC_COUNTRIES, WORLD_COUNTRIES, type CountryPreset} from './countries';

interface ArcBodyProps {
    data: ExtensionData;
    actions: ExtensionActions;
}

interface ArcUiState {
    scope: 'global' | 'site';
    scopeInitialized: boolean;
    openPanel: 'none' | 'tune' | 'schedule';
    countryOpen: boolean;
    countryQuery: string;
    gpsStatus: 'idle' | 'locating' | 'ready' | 'error';
}

type ScheduleMode = 'off' | 'time' | 'location';

/**
 * Root popup component implementing Design Option 6b (Arc Site-Scoped).
 */
export const ArcSiteScopedBody = withState(function ArcSiteScopedBody(props: ArcBodyProps, ..._children: any[]) {
    const {data, actions} = props;
    const {settings, activeTab} = data;
    const tabURL = activeTab?.url || '';
    const host = getURLHostOrProtocol(tabURL) || 'current-site';

    const customThemeIndex = settings.customThemes.findIndex(
        (c) => !c.builtIn && isURLInList(tabURL, c.url),
    );
    const customThemeEntry = customThemeIndex >= 0 ? settings.customThemes[customThemeIndex] : null;
    const siteSchedule = settings.siteSchedules?.[host];
    const isInEnabledFor = isURLInList(tabURL, settings.enabledFor);
    const isInDisabledFor = isURLInList(tabURL, settings.disabledFor);
    const hasSiteOverride = Boolean(customThemeEntry || siteSchedule || isInEnabledFor || isInDisabledFor);
    const hasNativeDarkTheme = Boolean(
        activeTab?.isInDarkList || (settings.detectDarkTheme && activeTab?.isDarkThemeDetected),
    );

    const {state: ui, setState: setUi} = useState<ArcUiState>({
        scope: hasSiteOverride ? 'site' : 'global',
        scopeInitialized: false,
        openPanel: 'none',
        countryOpen: false,
        countryQuery: '',
        gpsStatus: 'idle',
    });

    const scope: 'global' | 'site' = ui.scopeInitialized
        ? (ui.scope === 'site' && !hasSiteOverride ? 'global' : ui.scope)
        : (hasSiteOverride ? 'site' : 'global');
    const isSiteMode = scope === 'site';

    const editingTheme: Theme = isSiteMode && customThemeEntry
        ? customThemeEntry.theme
        : settings.theme;
    const effectiveTheme: Theme = customThemeEntry ? customThemeEntry.theme : settings.theme;

    const editingEnabled: boolean = isSiteMode
        ? (isInDisabledFor ? false : isInEnabledFor ? true : settings.enabled)
        : settings.enabled;

    let effectiveEnabled: boolean;
    if (siteSchedule && siteSchedule.mode !== 'off') {
        if (siteSchedule.mode === 'time') {
            effectiveEnabled = isInTimeIntervalLocal(siteSchedule.startTime, siteSchedule.endTime);
        } else if (siteSchedule.mode === 'location' && siteSchedule.latitude != null && siteSchedule.longitude != null) {
            effectiveEnabled = isNightAtLocation(siteSchedule.latitude, siteSchedule.longitude);
        } else {
            effectiveEnabled = data.isEnabled;
        }
    } else if (isInDisabledFor) {
        effectiveEnabled = false;
    } else if (isInEnabledFor) {
        effectiveEnabled = true;
    } else if (hasNativeDarkTheme) {
        effectiveEnabled = false;
    } else {
        effectiveEnabled = data.isEnabled;
    }

    const globalScheduleMode: ScheduleMode = !settings.automation.enabled
        ? 'off'
        : settings.automation.mode === AutomationMode.TIME
            ? 'time'
            : settings.automation.mode === AutomationMode.LOCATION
                ? 'location'
                : 'off';

    const globalSchedule: SiteScheduleConfig = {
        mode: globalScheduleMode,
        startTime: settings.time.activation,
        endTime: settings.time.deactivation,
        latitude: settings.location.latitude,
        longitude: settings.location.longitude,
        cityName: settings.location.name || '',
    };

    const editingSchedule: SiteScheduleConfig = isSiteMode && siteSchedule
        ? siteSchedule
        : (isSiteMode ? {...globalSchedule, mode: 'off'} : globalSchedule);

    const activePreset = detectActivePreset(editingTheme);
    const previewFilter = computePreviewFilter(effectiveEnabled, effectiveTheme);
    const isGpsLocation = editingSchedule.cityName.startsWith('GPS');
    const selectedCountry =
        WORLD_COUNTRIES.find((c) => c.name === editingSchedule.cityName) ??
        TOP_TRAFFIC_COUNTRIES.find((c) => c.name === editingSchedule.cityName);
    const hasLocation = isGpsLocation || Boolean(selectedCountry) || (editingSchedule.latitude != null && editingSchedule.longitude != null);

    const sunTimes = (editingSchedule.latitude != null && editingSchedule.longitude != null)
        ? getSunsetSunriseLocalTimes(editingSchedule.latitude, editingSchedule.longitude)
        : {sunset: '--:--', sunrise: '--:--'};

    function ensureSiteOverrideAndSwitchScope() {
        const patch: Partial<UserSettings> = {};
        if (!customThemeEntry) {
            patch.customThemes = [
                ...settings.customThemes,
                {url: [host], theme: {...settings.theme}},
            ];
        }
        if (!isInEnabledFor && !isInDisabledFor && editingEnabled) {
            patch.enabledFor = [...settings.enabledFor, host];
        }
        if (Object.keys(patch).length > 0) {
            actions.changeSettings(patch);
        }
        setUi({...ui, scope: 'site', scopeInitialized: true});
    }

    function switchToGlobalScope() {
        setUi({...ui, scope: 'global', scopeInitialized: true, countryOpen: false});
    }

    function resetSiteToGlobal() {
        const nextCustomThemes = settings.customThemes.filter(
            (c) => c.builtIn || !isURLInList(tabURL, c.url),
        );
        const nextEnabledFor = settings.enabledFor.filter((u) => u !== host && !isURLInList(tabURL, [u]));
        const nextDisabledFor = settings.disabledFor.filter((u) => u !== host && !isURLInList(tabURL, [u]));
        const nextSiteSchedules = {...(settings.siteSchedules ?? {})};
        delete nextSiteSchedules[host];
        actions.changeSettings({
            customThemes: nextCustomThemes,
            enabledFor: nextEnabledFor,
            disabledFor: nextDisabledFor,
            siteSchedules: nextSiteSchedules,
        });
        setUi({...ui, scope: 'global', scopeInitialized: true, countryOpen: false});
    }

    function setEnabled(next: boolean) {
        if (isSiteMode) {
            const nextEnabledFor = settings.enabledFor.filter((u) => u !== host && !isURLInList(tabURL, [u]));
            const nextDisabledFor = settings.disabledFor.filter((u) => u !== host && !isURLInList(tabURL, [u]));
            if (next) {
                nextEnabledFor.push(host);
            } else {
                nextDisabledFor.push(host);
            }
            const nextCustomThemes = customThemeEntry
                ? settings.customThemes
                : [...settings.customThemes, {url: [host], theme: {...settings.theme}}];
            const patch: Partial<UserSettings> = {
                enabledFor: nextEnabledFor,
                disabledFor: nextDisabledFor,
                customThemes: nextCustomThemes,
            };
            if (siteSchedule && siteSchedule.mode !== 'off') {
                patch.siteSchedules = {
                    ...(settings.siteSchedules ?? {}),
                    [host]: {...siteSchedule, mode: 'off'},
                };
            }
            actions.changeSettings(patch);
            return;
        }
        actions.changeSettings({
            enabled: next,
            automation: {...settings.automation, enabled: false},
        });
    }

    function updateTheme(patch: Partial<Theme>) {
        if (isSiteMode) {
            const nextTheme: Theme = {...editingTheme, ...patch};
            const nextCustomThemes = customThemeIndex >= 0
                ? settings.customThemes.map((c, idx) => (idx === customThemeIndex ? {...c, theme: nextTheme} : c))
                : [...settings.customThemes, {url: [host], theme: nextTheme}];
            actions.changeSettings({customThemes: nextCustomThemes});
            return;
        }
        actions.setTheme(patch);
    }

    function setSurfaceTone(tone: SurfaceTone) {
        updateTheme({
            surfaceTone: tone,
            darkSchemeBackgroundColor: SURFACE_TONE_COLORS[tone],
        });
    }

    function applyPreset(pid: PresetId) {
        updateTheme(FILTER_PRESETS[pid].theme);
    }

    function updateSchedule(patch: Partial<SiteScheduleConfig>) {
        const next: SiteScheduleConfig = {...editingSchedule, ...patch};
        if (isSiteMode) {
            const nextSiteSchedules = {
                ...(settings.siteSchedules ?? {}),
                [host]: next,
            };
            actions.changeSettings({siteSchedules: nextSiteSchedules});
            return;
        }
        const automationMode = next.mode === 'time'
            ? AutomationMode.TIME
            : next.mode === 'location'
                ? AutomationMode.LOCATION
                : AutomationMode.NONE;
        actions.changeSettings({
            automation: {
                enabled: next.mode !== 'off',
                mode: automationMode,
                behavior: 'OnOff',
            },
            time: {
                activation: next.startTime,
                deactivation: next.endTime,
            },
            location: {
                latitude: next.latitude,
                longitude: next.longitude,
                name: next.cityName,
            },
        });
    }

    function selectCountry(c: CountryPreset) {
        updateSchedule({
            latitude: c.latitude,
            longitude: c.longitude,
            cityName: c.name,
        });
        setUi({...ui, countryOpen: false, countryQuery: '', gpsStatus: 'idle'});
    }

    function resetLocation() {
        updateSchedule({
            latitude: null,
            longitude: null,
            cityName: '',
        });
        setUi({...ui, countryOpen: false, countryQuery: '', gpsStatus: 'idle'});
    }

    function detectGpsLocation() {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setUi({...ui, countryOpen: false, gpsStatus: 'error'});
            return;
        }
        setUi({...ui, countryOpen: false, gpsStatus: 'locating'});
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const {latitude, longitude} = pos.coords;
                updateSchedule({
                    latitude,
                    longitude,
                    cityName: `GPS (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                });
                setUi({...ui, countryOpen: false, gpsStatus: 'ready'});
            },
            () => {
                setUi({...ui, countryOpen: false, gpsStatus: 'error'});
            },
            {timeout: 8000},
        );
    }

    return (
        <div class={`dr-d06b ${effectiveEnabled ? 'is-live' : ''} ${isSiteMode ? 'is-site-mode' : ''}`}>
            <div class="d06b-aura" />
            <div class="d06b-content">
                {/* Live Mini-Preview Card */}
                <div
                    class={`d06b-preview-card ${effectiveEnabled && effectiveTheme.mode === FilterMode.dark ? `is-dark is-tone-${effectiveTheme.surfaceTone ?? 'charcoal'}` : 'is-light'}`}
                    style={`filter: ${previewFilter}`}
                >
                    <div class="d06b-preview-top">
                        <span class="d06b-preview-domain">
                            {hasSiteOverride
                                ? `⚡ ${host} (Site Override)`
                                : hasNativeDarkTheme
                                    ? `🌙 ${host} (Native Dark Theme)`
                                    : `🌐 ${host} (Global)`}
                        </span>
                    </div>
                    <div class="d06b-preview-sample">
                        <span>
                            {`Bri ${effectiveTheme.brightness}% · Con ${effectiveTheme.contrast}% · Sep ${effectiveTheme.sepia}% · Img ${effectiveTheme.imageBrightness ?? 100}%`}
                        </span>
                    </div>
                </div>

                {/* Scope Selector */}
                <div class="d06b-quick-row">
                    <button
                        class={`d06b-chip ${!isSiteMode ? 'is-active' : ''}`}
                        onclick={switchToGlobalScope}
                    >
                        Global
                    </button>
                    {isSiteMode || hasSiteOverride ? (
                        <button
                            class={`d06b-chip d06b-chip--site-active ${isSiteMode ? 'is-active' : ''}`}
                            onclick={ensureSiteOverrideAndSwitchScope}
                        >
                            {`⚡ ${host}`}
                        </button>
                    ) : (
                        <button class="d06b-chip d06b-chip--cta" onclick={ensureSiteOverrideAndSwitchScope}>
                            + Customize This Site
                        </button>
                    )}
                </div>

                {/* Unified Sandbox Container */}
                <div class={`d06b-sandbox ${isSiteMode ? 'is-site' : ''}`}>
                    {isSiteMode ? (
                        <div class="d06b-sandbox-banner">
                            <div class="d06b-banner-text">
                                <strong>{`Customizing ${host} only`}</strong>
                                <span>
                                    Power, mode, presets, optics & schedule below apply only to this
                                    site and override Global
                                </span>
                            </div>
                            <button class="d06b-reset-site-btn" onclick={resetSiteToGlobal}>
                                ✕ Reset to Global
                            </button>
                        </div>
                    ) : hasSiteOverride ? (
                        <div class="d06b-global-override-notice">
                            <div class="d06b-banner-text">
                                <strong>{`⚡ ${host} uses custom settings`}</strong>
                                <span>
                                    You can edit Global defaults below, but changes won't show on
                                    this site while its custom config is active.
                                </span>
                            </div>
                            <button
                                class="d06b-switch-site-btn"
                                onclick={ensureSiteOverrideAndSwitchScope}
                            >
                                View Site
                            </button>
                        </div>
                    ) : null}

                    {/* Scoped Extension Power (On / Off) */}
                    <div class="d06b-polarity-row">
                        <div class="d06b-subhead">
                            <span>{isSiteMode ? 'Extension (This Site)' : 'Extension (Global)'}</span>
                        </div>
                        <div class="d06b-polarity-pills">
                            <button
                                class={editingEnabled ? 'is-active is-power-on' : ''}
                                onclick={() => setEnabled(true)}
                            >
                                ● On
                            </button>
                            <button
                                class={!editingEnabled ? 'is-active' : ''}
                                onclick={() => setEnabled(false)}
                            >
                                ○ Off
                            </button>
                        </div>
                    </div>

                    {/* Theme Polarity (Dark / Light) */}
                    <div class="d06b-polarity-row">
                        <div class="d06b-subhead">
                            <span>Theme Mode</span>
                        </div>
                        <div class="d06b-polarity-pills">
                            <button
                                class={editingTheme.mode === FilterMode.dark ? 'is-active' : ''}
                                onclick={() => updateTheme({mode: FilterMode.dark})}
                            >
                                ☾ Dark
                            </button>
                            <button
                                class={editingTheme.mode === FilterMode.light ? 'is-active' : ''}
                                onclick={() => updateTheme({mode: FilterMode.light})}
                            >
                                ☀ Light
                            </button>
                        </div>
                    </div>

                    {/* Quick Moods */}
                    <div class="d06b-mood-section">
                        <div class="d06b-polarity-row">
                            <div class="d06b-subhead">
                                <span>Quick Moods</span>
                            </div>
                        </div>

                        <div class="d06b-mood-grid">
                            {(Object.keys(FILTER_PRESETS) as PresetId[]).map((pid) => (
                                <button
                                    class={`d06b-mood-tile ${activePreset === pid ? 'is-active' : ''}`}
                                    onclick={() => applyPreset(pid)}
                                >
                                    <span class={`d06b-swatch d06b-swatch--${pid}`} />
                                    <span class="d06b-mood-name">{FILTER_PRESETS[pid].label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fine-Tune Optics Accordion */}
                    <div class="d06b-accordion">
                        <button
                            class="d06b-acc-trigger"
                            onclick={() =>
                                setUi({...ui, openPanel: ui.openPanel === 'tune' ? 'none' : 'tune'})
                            }
                        >
                            <span>Fine-Tune Optics</span>
                            <ChevronArrow open={ui.openPanel === 'tune'} />
                        </button>
                        {ui.openPanel === 'tune' ? (
                            <div class="d06b-acc-body">
                                <div class="d06b-tone-block">
                                    <span class="d06b-tone-label">Surface Darkness</span>
                                    <div class="d06b-tone-pills">
                                        <button
                                            class={
                                                (editingTheme.surfaceTone ?? 'charcoal') === 'slate'
                                                    ? 'is-active'
                                                    : ''
                                            }
                                            onclick={() => setSurfaceTone('slate')}
                                        >
                                            <span class="d06b-tone-dot d06b-tone-dot--slate" />
                                            <span>Slate</span>
                                        </button>
                                        <button
                                            class={
                                                (editingTheme.surfaceTone ?? 'charcoal') === 'charcoal'
                                                    ? 'is-active'
                                                    : ''
                                            }
                                            onclick={() => setSurfaceTone('charcoal')}
                                        >
                                            <span class="d06b-tone-dot d06b-tone-dot--charcoal" />
                                            <span>Charcoal</span>
                                        </button>
                                        <button
                                            class={
                                                (editingTheme.surfaceTone ?? 'charcoal') === 'oled'
                                                    ? 'is-active'
                                                    : ''
                                            }
                                            onclick={() => setSurfaceTone('oled')}
                                        >
                                            <span class="d06b-tone-dot d06b-tone-dot--oled" />
                                            <span>OLED</span>
                                        </button>
                                    </div>
                                </div>

                                <ArcBSlider
                                    label="Brightness"
                                    value={editingTheme.brightness}
                                    defaultValue={100}
                                    min={50}
                                    max={150}
                                    onChange={(v) => updateTheme({brightness: v})}
                                />
                                <ArcBSlider
                                    label="Contrast"
                                    value={editingTheme.contrast}
                                    defaultValue={100}
                                    min={50}
                                    max={150}
                                    onChange={(v) => updateTheme({contrast: v})}
                                />
                                <ArcBSlider
                                    label="Sepia"
                                    value={editingTheme.sepia}
                                    defaultValue={0}
                                    min={0}
                                    max={100}
                                    onChange={(v) => updateTheme({sepia: v})}
                                />
                                <ArcBSlider
                                    label="Grayscale"
                                    value={editingTheme.grayscale}
                                    defaultValue={0}
                                    min={0}
                                    max={100}
                                    onChange={(v) => updateTheme({grayscale: v})}
                                />
                                <ArcBSlider
                                    label="Images & Media"
                                    value={editingTheme.imageBrightness ?? 100}
                                    defaultValue={100}
                                    min={50}
                                    max={100}
                                    onChange={(v) => updateTheme({imageBrightness: v})}
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Auto-Schedule Accordion */}
                    <div class="d06b-accordion">
                        <button
                            class="d06b-acc-trigger"
                            onclick={() =>
                                setUi({
                                    ...ui,
                                    openPanel: ui.openPanel === 'schedule' ? 'none' : 'schedule',
                                    countryOpen: false,
                                })
                            }
                        >
                            <span>
                                {`Auto-Schedule (${
                                    editingSchedule.mode === 'off'
                                        ? 'Off'
                                        : editingSchedule.mode === 'time'
                                            ? `${editingSchedule.startTime}–${editingSchedule.endTime}`
                                            : hasLocation
                                                ? `Sunset · ${editingSchedule.cityName || 'Custom'}`
                                                : 'Sunset · Select country'
                                })`}
                            </span>
                            <ChevronArrow open={ui.openPanel === 'schedule'} />
                        </button>
                        {ui.openPanel === 'schedule' ? (
                            <div class="d06b-acc-body">
                                <div class="d06b-sched-pills">
                                    <button
                                        class={editingSchedule.mode === 'off' ? 'is-active' : ''}
                                        onclick={() => updateSchedule({mode: 'off'})}
                                    >
                                        Off
                                    </button>
                                    <button
                                        class={editingSchedule.mode === 'time' ? 'is-active' : ''}
                                        onclick={() => updateSchedule({mode: 'time'})}
                                    >
                                        Hours
                                    </button>
                                    <button
                                        class={editingSchedule.mode === 'location' ? 'is-active' : ''}
                                        onclick={() => updateSchedule({mode: 'location'})}
                                    >
                                        Sunset
                                    </button>
                                </div>

                                {editingSchedule.mode === 'time' ? (
                                    <div class="d06b-sched-row">
                                        <input
                                            type="time"
                                            value={editingSchedule.startTime}
                                            oninput={(e: Event) =>
                                                updateSchedule({
                                                    startTime: (e.target as HTMLInputElement).value,
                                                })
                                            }
                                        />
                                        <span>to</span>
                                        <input
                                            type="time"
                                            value={editingSchedule.endTime}
                                            oninput={(e: Event) =>
                                                updateSchedule({
                                                    endTime: (e.target as HTMLInputElement).value,
                                                })
                                            }
                                        />
                                    </div>
                                ) : null}

                                {editingSchedule.mode === 'location' ? (
                                    <div class="d06b-sched-col">
                                        <div class="d06b-sched-row">
                                            <div class="d06b-country-select">
                                                <button
                                                    class={`d06b-country-trigger ${ui.countryOpen ? 'is-open' : ''}`}
                                                    onclick={() =>
                                                        setUi({
                                                            ...ui,
                                                            countryOpen: !ui.countryOpen,
                                                            countryQuery: '',
                                                        })
                                                    }
                                                >
                                                    <span class="d06b-country-curr">
                                                        <CountryFlag
                                                            code={
                                                                isGpsLocation
                                                                    ? 'GPS'
                                                                    : selectedCountry?.code
                                                            }
                                                        />
                                                        <span>
                                                            {hasLocation
                                                                ? (editingSchedule.cityName || 'Custom Location')
                                                                : 'Select country'}
                                                        </span>
                                                    </span>
                                                    <ChevronArrow open={ui.countryOpen} />
                                                </button>

                                                {ui.countryOpen ? (
                                                    <div class="d06b-country-menu">
                                                        <div class="d06b-country-search-wrap">
                                                            <input
                                                                type="text"
                                                                class="d06b-country-search"
                                                                placeholder={`Search ${WORLD_COUNTRIES.length} countries…`}
                                                                value={ui.countryQuery}
                                                                oninput={(e: Event) =>
                                                                    setUi({
                                                                        ...ui,
                                                                        countryQuery: (
                                                                            e.target as HTMLInputElement
                                                                        ).value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        {ui.countryQuery.trim() === '' ? (
                                                            <div class="d06b-country-list">
                                                                {hasLocation ? (
                                                                    <button
                                                                        class="d06b-country-opt d06b-country-reset-opt"
                                                                        onclick={resetLocation}
                                                                    >
                                                                        <span>↺ Reset country</span>
                                                                    </button>
                                                                ) : null}
                                                                <div class="d06b-menu-section">
                                                                    Popular
                                                                </div>
                                                                {TOP_TRAFFIC_COUNTRIES.map((c) => {
                                                                    const isSel = c.name === editingSchedule.cityName;
                                                                    return (
                                                                        <button
                                                                            class={`d06b-country-opt ${isSel ? 'is-selected' : ''}`}
                                                                            onclick={() => selectCountry(c)}
                                                                        >
                                                                            <span class="d06b-opt-left">
                                                                                <CountryFlag code={c.code} />
                                                                                <span>{c.name}</span>
                                                                            </span>
                                                                            {isSel ? (
                                                                                <span class="d06b-check">✓</span>
                                                                            ) : null}
                                                                        </button>
                                                                    );
                                                                })}
                                                                <div class="d06b-menu-section">
                                                                    All Countries (A–Z)
                                                                </div>
                                                                {WORLD_COUNTRIES.map((c) => {
                                                                    const isSel = c.name === editingSchedule.cityName;
                                                                    return (
                                                                        <button
                                                                            class={`d06b-country-opt ${isSel ? 'is-selected' : ''}`}
                                                                            onclick={() => selectCountry(c)}
                                                                        >
                                                                            <span class="d06b-opt-left">
                                                                                <CountryFlag code={c.code} />
                                                                                <span>{c.name}</span>
                                                                            </span>
                                                                            {isSel ? (
                                                                                <span class="d06b-check">✓</span>
                                                                            ) : null}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div class="d06b-country-list">
                                                                {(() => {
                                                                    const q = ui.countryQuery.trim().toLowerCase();
                                                                    const matches = WORLD_COUNTRIES.filter(
                                                                        (c) =>
                                                                            c.name.toLowerCase().includes(q) ||
                                                                            (c.code && c.code.toLowerCase().includes(q)),
                                                                    );
                                                                    if (matches.length === 0) {
                                                                        return (
                                                                            <div class="d06b-empty">
                                                                                No countries found
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return matches.map((c) => {
                                                                        const isSel = c.name === editingSchedule.cityName;
                                                                        return (
                                                                            <button
                                                                                class={`d06b-country-opt ${isSel ? 'is-selected' : ''}`}
                                                                                onclick={() => selectCountry(c)}
                                                                            >
                                                                                <span class="d06b-opt-left">
                                                                                    <CountryFlag code={c.code} />
                                                                                    <span>{c.name}</span>
                                                                                </span>
                                                                                {isSel ? (
                                                                                    <span class="d06b-check">✓</span>
                                                                                ) : null}
                                                                            </button>
                                                                        );
                                                                    });
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {hasLocation ? (
                                                <button
                                                    class="d06b-loc-reset"
                                                    title="Reset country"
                                                    aria-label="Reset country"
                                                    onclick={resetLocation}
                                                >
                                                    ✕
                                                </button>
                                            ) : null}

                                            <button
                                                class="d06b-gps-btn"
                                                onclick={detectGpsLocation}
                                            >
                                                {ui.gpsStatus === 'locating' ? 'Locating…' : '📍 Use GPS'}
                                            </button>
                                        </div>
                                        <div class="d06b-sun-meta">
                                            {ui.gpsStatus === 'error'
                                                ? 'GPS permission denied or unavailable'
                                                : `Sunset ${sunTimes.sunset} · Sunrise ${sunTimes.sunrise}`}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
});

function ChevronArrow(props: {open: boolean}) {
    return (
        <svg
            class={`d06b-acc-arrow ${props.open ? 'is-open' : ''}`}
            viewBox="0 0 12 12"
            aria-hidden="true"
        >
            <path
                d={props.open ? 'M2.5 7.5L6 4L9.5 7.5' : 'M2.5 4.5L6 8L9.5 4.5'}
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
}

interface ArcBSliderProps {
    label: string;
    value: number;
    defaultValue: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
}

interface ArcBSliderState {
    isDragging: boolean;
    draftValue: number | null;
    lastPropValue: number;
    lastInputTime: number;
}

/**
 * Range slider with optimistic local state during drags so the track fill,
 * percentage readout, and thumb stay in sync without waiting for background
 * settings round-trips.
 */
const ArcBSlider = withState(function ArcBSlider(props: ArcBSliderProps, ..._children: any[]) {
    const {state, setState} = useState<ArcBSliderState>({
        isDragging: false,
        draftValue: null,
        lastPropValue: props.value,
        lastInputTime: 0,
    });

    if (props.value !== state.lastPropValue) {
        state.lastPropValue = props.value;
        if (
            state.draftValue !== null &&
            (props.value === state.draftValue || (!state.isDragging && Date.now() - state.lastInputTime > 250))
        ) {
            state.draftValue = null;
        }
    }

    const displayValue = state.draftValue ?? props.value;
    const ratio = Math.min(1, Math.max(0, (displayValue - props.min) / (props.max - props.min)));
    const pct = ratio * 100;
    const isDirty = displayValue !== props.defaultValue;

    return (
        <div class="d06b-slider">
            <div class="d06b-slider-head">
                <span>{props.label}</span>
            </div>
            <div class="d06b-slider-track-row">
                <input
                    type="range"
                    class="d06b-range"
                    min={props.min}
                    max={props.max}
                    value={String(displayValue)}
                    style={{'--pct': `${pct}%`, '--ratio': String(ratio)}}
                    onrender={(el: Element) => {
                        if (!state.isDragging) {
                            (el as HTMLInputElement).value = String(displayValue);
                        }
                    }}
                    oninput={(e: Event) => {
                        const next = Number((e.target as HTMLInputElement).value);
                        setState({
                            isDragging: true,
                            draftValue: next,
                            lastInputTime: Date.now(),
                        });
                        props.onChange(next);
                    }}
                    onchange={(e: Event) => {
                        const next = Number((e.target as HTMLInputElement).value);
                        setState({
                            isDragging: false,
                            draftValue: props.value === next ? null : next,
                        });
                    }}
                />
                <span class="d06b-slider-val">{`${displayValue}%`}</span>
                <button
                    type="button"
                    class={`d06b-slider-reset ${isDirty ? 'is-dirty' : ''}`}
                    title={`Reset ${props.label} to ${props.defaultValue}%`}
                    aria-label={`Reset ${props.label} to default`}
                    onclick={() => {
                        setState({isDragging: false, draftValue: null, lastInputTime: 0});
                        props.onChange(props.defaultValue);
                    }}
                >
                    <svg viewBox="0 0 14 14" aria-hidden="true">
                        <path
                            d="M2.5 7a4.5 4.5 0 1 1 1.1 2.95M2.5 4.2V7h2.8"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.4"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
});

/**
 * Offline & CSP-safe country flag renderer: inline SVGs for popular countries
 * and regional indicator emoji / ISO fallback for all other countries.
 */
function CountryFlag(props: {code?: string}) {
    const c = props.code;
    if (c === 'GPS') {
        return <span class="d06b-flag">📍</span>;
    }
    if (c === 'BR') {
        return (
            <svg class="d06b-flag-svg" viewBox="0 0 20 14">
                <rect width="20" height="14" rx="2" fill="#009c3b" />
                <polygon points="10,2 18,7 10,12 2,7" fill="#ffdf00" />
                <circle cx="10" cy="7" r="3" fill="#002776" />
            </svg>
        );
    }
    if (c === 'CN') {
        return (
            <svg class="d06b-flag-svg" viewBox="0 0 20 14">
                <rect width="20" height="14" rx="2" fill="#de2910" />
                <circle cx="4.5" cy="4" r="1.6" fill="#ffde00" />
                <circle cx="7.5" cy="2.5" r="0.6" fill="#ffde00" />
                <circle cx="8.5" cy="4.2" r="0.6" fill="#ffde00" />
                <circle cx="7.5" cy="6" r="0.6" fill="#ffde00" />
            </svg>
        );
    }
    if (c === 'HK') {
        return (
            <svg class="d06b-flag-svg" viewBox="0 0 20 14">
                <rect width="20" height="14" rx="2" fill="#de2910" />
                <circle cx="10" cy="7" r="2.8" fill="#ffffff" />
                <circle cx="10" cy="7" r="1.1" fill="#de2910" />
            </svg>
        );
    }
    if (c === 'IN') {
        return (
            <svg class="d06b-flag-svg" viewBox="0 0 20 14">
                <rect width="20" height="4.7" fill="#ff9933" />
                <rect y="4.7" width="20" height="4.6" fill="#ffffff" />
                <rect y="9.3" width="20" height="4.7" fill="#138808" />
                <circle cx="10" cy="7" r="1.5" fill="none" stroke="#000080" stroke-width="0.7" />
            </svg>
        );
    }
    if (c === 'ID') {
        return (
            <svg class="d06b-flag-svg" viewBox="0 0 20 14">
                <rect width="20" height="7" fill="#ce1126" />
                <rect y="7" width="20" height="7" fill="#ffffff" />
            </svg>
        );
    }
    if (c === 'JP') {
        return (
            <svg class="d06b-flag-svg" viewBox="0 0 20 14">
                <rect width="20" height="14" rx="2" fill="#ffffff" />
                <circle cx="10" cy="7" r="3.6" fill="#bc002d" />
            </svg>
        );
    }
    if (c === 'US') {
        return (
            <svg class="d06b-flag-svg" viewBox="0 0 20 14">
                <rect width="20" height="14" rx="2" fill="#ffffff" />
                <rect y="0" width="20" height="2" fill="#b22234" />
                <rect y="4" width="20" height="2" fill="#b22234" />
                <rect y="8" width="20" height="2" fill="#b22234" />
                <rect y="12" width="20" height="2" fill="#b22234" />
                <rect width="9" height="8" fill="#3c3b6e" />
            </svg>
        );
    }
    if (c && /^[A-Z]{2}$/.test(c)) {
        const regional = String.fromCodePoint(
            0x1f1e6 + c.charCodeAt(0) - 65,
            0x1f1e6 + c.charCodeAt(1) - 65,
        );
        return <span class="d06b-flag">{regional}</span>;
    }
    return <span class="d06b-flag">🌍</span>;
}
