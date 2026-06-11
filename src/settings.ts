"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard  = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

// ─── Date Selector Card ──────────────────────────────────────────────────────
class DateSelectorSettings extends FormattingSettingsCard {
    selectionMode = new formattingSettings.ItemDropdown({
        name: "selectionMode",
        displayName: "Selection Mode",
        items: [
            { displayName: "Single Date",   value: "single" },
            { displayName: "Date Range",     value: "range" },
            { displayName: "Relative Dates", value: "relative" }
        ],
        value: { displayName: "Date Range", value: "range" }
    });

    dateFormat = new formattingSettings.ItemDropdown({
        name: "dateFormat",
        displayName: "Date Format",
        items: [
            { displayName: "DD/MM/YYYY", value: "DD/MM/YYYY" },
            { displayName: "MM/DD/YYYY", value: "MM/DD/YYYY" },
            { displayName: "YYYY-MM-DD", value: "YYYY-MM-DD" }
        ],
        value: { displayName: "DD/MM/YYYY", value: "DD/MM/YYYY" }
    });

    defaultSelection = new formattingSettings.ItemDropdown({
        name: "defaultSelection",
        displayName: "Default Selection",
        items: [
            { displayName: "None",       value: "none" },
            { displayName: "Today",      value: "today" },
            { displayName: "This Month", value: "thisMonth" },
            { displayName: "This Year",  value: "thisYear" }
        ],
        value: { displayName: "None", value: "none" }
    });

    weekStart = new formattingSettings.ItemDropdown({
        name: "weekStart",
        displayName: "Week Starts On",
        items: [
            { displayName: "Sunday", value: "sunday" },
            { displayName: "Monday", value: "monday" }
        ],
        value: { displayName: "Monday", value: "monday" }
    });

    fiscalYearStartMonth = new formattingSettings.NumUpDown({
        name: "fiscalYearStartMonth",
        displayName: "Fiscal Year Start Month (1–12)",
        value: 7   // Default: July
    });

    name: string        = "dateSelector";
    displayName: string = "Date Selection";
    slices: Array<FormattingSettingsSlice> = [
        this.selectionMode,
        this.dateFormat,
        this.defaultSelection,
        this.weekStart,
        this.fiscalYearStartMonth
    ];
}

// ─── Appearance Card ─────────────────────────────────────────────────────────
class AppearanceSettings extends FormattingSettingsCard {
    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Show Title",
        value: true
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Title Text",
        value: "Date Whisperer",
        placeholder: "Enter title"
    });

    primaryColor = new formattingSettings.ColorPicker({
        name: "primaryColor",
        displayName: "Primary Color",
        value: { value: "#0078D4" }
    });

    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background Color",
        value: { value: "#FFFFFF" }
    });

    fontFamily = new formattingSettings.ItemDropdown({
        name: "fontFamily",
        displayName: "Font Family",
        items: [
            { displayName: "Segoe UI", value: "Segoe UI" },
            { displayName: "Arial",    value: "Arial" },
            { displayName: "Tahoma",   value: "Tahoma" }
        ],
        value: { displayName: "Segoe UI", value: "Segoe UI" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        value: 13
    });

    name: string        = "appearance";
    displayName: string = "Appearance";
    slices: Array<FormattingSettingsSlice> = [
        this.showTitle, this.titleText, this.primaryColor,
        this.backgroundColor, this.fontFamily, this.fontSize
    ];
}

// ─── Calendar Card ───────────────────────────────────────────────────────────
class CalendarSettings extends FormattingSettingsCard {
    showQuickActions = new formattingSettings.ToggleSwitch({
        name: "showQuickActions",
        displayName: "Show Quick Actions Panel",
        value: true
    });

    showManualInput = new formattingSettings.ToggleSwitch({
        name: "showManualInput",
        displayName: "Show Manual Date Input",
        value: true
    });

    enableTooltips = new formattingSettings.ToggleSwitch({
        name: "enableTooltips",
        displayName: "Enable Tooltips",
        value: true
    });

    name: string        = "calendar";
    displayName: string = "Calendar Settings";
    slices: Array<FormattingSettingsSlice> = [
        this.showQuickActions, this.showManualInput, this.enableTooltips
    ];
}

// ─── Root Model ──────────────────────────────────────────────────────────────
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    dateSelector = new DateSelectorSettings();
    appearance   = new AppearanceSettings();
    calendar     = new CalendarSettings();
    cards        = [this.dateSelector, this.appearance, this.calendar];
}
