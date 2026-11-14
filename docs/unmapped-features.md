# Unmapped Features Dropped from the Option 6b Popup UI

Design **Option 6b (Arc Spatial Glass — Site-Scoped Sandbox Variant)** replaces Dark Reader's extension popup UI (`src/ui/popup/`). The following features and options from the previous popup UI do not map to Option 6b and have been dropped from the popup:

## 1. Theme Engine Selector (`engine-switch`)
- **Previous UI**: Allowed switching between `Dynamic`, `Filter`, `Filter+`, and `Static` theme engines per-global or per-site.
- **Status**: Dropped from the popup. The extension continues using the configured engine (`dynamicTheme` by default) in the background.

## 2. Font & Text Stroke Settings (`font-settings`)
- **Previous UI**: Toggle for custom font (`useFont`), font family selector (`fontFamily`), and `textStroke` slider.
- **Status**: Dropped from the popup.

## 3. Site List Editor & Inverted Mode (`site-list-settings`, `more-settings`)
- **Previous UI**: Dedicated "Site List" tab with bulk URL pattern list (`enabledFor` / `disabledFor`) and "Invert listed only" (`enabledByDefault: false`) toggle.
- **Status**: Dropped from the popup. Per-site control in Option 6b is handled via the **Site Sandbox** (`+ Customize This Site`, scoped Power `On`/`Off`, and `✕ Reset to Global`).

## 4. System Automation Mode & Scheme Behavior (`more-settings`)
- **Previous UI**: `AutomationMode.SYSTEM` (follow OS dark/light mode) and `automation.behavior` (`OnOff` vs `Scheme` switching).
- **Status**: Dropped from the popup. Option 6b's **Auto-Schedule** accordion supports `Off`, `Hours` (time interval), and `Sunset` (country/GPS solar calculation) with `OnOff` behavior.

## 5. Header Site & Toggle Sub-Menus (`header`)
- **Previous UI**: `MoreSiteSettings` (`detectDarkTheme`, `isInDarkList`, `enableForProtectedPages`, `enableForPDF`), `MoreToggleSettings`, and keyboard shortcut badge display.
- **Status**: Dropped from the popup.

## 6. Popup Footer Links, Options/DevTools Entry Points, & Legacy Design Toggles (`body.tsx`, `news`)
- **Previous UI**: Footer buttons/links to **Settings** (`options.html`), **DevTools** (`devtools.html`), **Help**, **Donate**, **News** slide-in panel (`news`), **Mobile Links** (`mobile-links`), and `previewNewDesign` / `previewNewestDesign` / `PlusBody` toggles.
- **Status**: Dropped from the popup. Option 6b is rendered unconditionally as the sole popup UI with no links or entry points to Options or DevTools.

## 7. Granular Color Scheme & Custom Stylesheet Controls
- **Previous UI**: `darkSchemeTextColor`, `lightSchemeBackgroundColor`, `lightSchemeTextColor`, `scrollbarColor`, `selectionColor`, `styleSystemControls`, `immediateModify`, and `stylesheet` editor link.
- **Status**: Replaced in Option 6b by **Surface Darkness** (`Slate`, `Charcoal`, `OLED`) and **Quick Moods** (`Balanced`, `Warm Read`, `Cinema`, `Midnight Ink`).
