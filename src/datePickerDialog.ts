import { setHTML } from "./domUtils";
"use strict";

import powerbi from "powerbi-visuals-api";
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import DialogAction = powerbi.DialogAction;
import { THEMES, PRESET_CATEGORIES, Theme } from "./htmlTemplates";
import { DataModel, QuickRangeKey } from "./dataModel";

export interface DialogInitialState {
    themeKey:         string;
    activePresetKey:  string|null;
    openCatId:        string|null;
    startDate:        string|null;
    endDate:          string|null;
    weekStartMonday:  boolean;
    fiscalStartMonth: number;
    dataViewDates:    string[];
    dateFormat:       string;
    filterLabel:      string;
}

export interface DialogResult {
    startDate: string|null;
    endDate:   string|null;
    label:     string;
    themeKey:  string;
    cleared:   boolean;
}

export class DatePickerDialog {
    static id = "DatePickerDialog";

    private host:            any;
    private el:              HTMLElement;
    private model:           DataModel;
    private t:               Theme;
    private themeKey:        string;
    private activePresetKey: string|null = null;
    private openCatId:       string|null = null;
    private calYear:         number;
    private calMonth:        number;
    private hoverDate:       Date|null   = null;
    private weekStartMonday: boolean;
    private dateFormat:      string;

    constructor(options: DialogConstructorOptions, initialState: DialogInitialState) {
        this.host            = options.host;
        this.el              = options.element;
        this.model           = new DataModel();
        this.themeKey        = initialState.themeKey || "midnight";
        this.t               = { ...THEMES[this.themeKey] || THEMES["midnight"] };
        this.activePresetKey = initialState.activePresetKey;
        this.openCatId       = initialState.openCatId;
        this.weekStartMonday = initialState.weekStartMonday;
        this.dateFormat      = initialState.dateFormat || "DD/MM/YYYY";
        this.model.setFiscalYearStartMonth(initialState.fiscalStartMonth || 7);

        if (initialState.startDate) {
            const s = new Date(initialState.startDate);
            const e = initialState.endDate ? new Date(initialState.endDate) : null;
            this.model.setRange({ startDate: s, endDate: e }, e ? "range" : "single", initialState.filterLabel || "");
            this.calYear  = s.getFullYear();
            this.calMonth = s.getMonth();
        } else {
            const now = new Date();
            this.calYear  = now.getFullYear();
            this.calMonth = now.getMonth();
        }

        this.host.setResult(this.buildResult(false));
        this.buildShell();      // Build static shell once
        this.refreshCalendars(); // Paint calendar cells
        this.syncAll();
        this.bindStaticEvents(); // Bind to stable shell elements (event delegation for cells)
    }

    // ─── Month helpers ────────────────────────────────────────────────────────
    private rightYear():  number { return this.calMonth === 11 ? this.calYear + 1 : this.calYear; }
    private rightMonth(): number { return this.calMonth === 11 ? 0 : this.calMonth + 1; }

    // ─── Build shell ONCE ─────────────────────────────────────────────────────
    private buildShell(): void {
        this.el.style.cssText = "width:100%;height:100%;overflow:hidden;";
        setHTML(this.el, this.shellHtml());
    }

    // ─── Refresh only calendar cell content (no listener re-binding needed) ──
    private refreshCalendars(): void {
        const lw = this.el.querySelector<HTMLElement>("#cal-left");
        const rw = this.el.querySelector<HTMLElement>("#cal-right");
        if (lw) {
            setHTML(lw, this.monthGridHtml(this.calYear, this.calMonth, "L"));
        }
        if (rw) {
            setHTML(rw, this.monthGridHtml(this.rightYear(), this.rightMonth(), "R"));
        }
    }

    private syncAll(): void {
        this.syncInputs();
        this.syncLabel();
        this.syncAccordion();
        this.syncPresets();
        this.syncRangeInfo();
        this.syncFooterHint();
    }

    // ─── Static event binding (ONE TIME, uses delegation for cells) ───────────
    private bindStaticEvents(): void {
        const el = this.el;

        // Apply
        el.querySelector("#btn-apply")?.addEventListener("click", () => {
            this.host.setResult(this.buildResult(false));
            this.host.close(DialogAction.Close, this.buildResult(false));
        });

        // Clear
        el.querySelector("#btn-clear")?.addEventListener("click", () => {
            this.model.clear();
            this.activePresetKey = null;
            this.hoverDate       = null;
            this.syncAll();
            this.refreshCalendars();
            this.syncRangeInfo();
            this.host.setResult(this.buildResult(true));
        });

        // Manual date inputs
        el.querySelector("#inp-start")?.addEventListener("change", () => this.onManualInput());
        el.querySelector("#inp-end")?.addEventListener("change",   () => this.onManualInput());

        // Swap dates
        el.querySelector("#btn-swap")?.addEventListener("click", () => {
            const s = this.model.getFilterState();
            if (s.selectedRange.startDate && s.selectedRange.endDate) {
                this.model.setRange(
                    { startDate: s.selectedRange.endDate, endDate: s.selectedRange.startDate },
                    "range", `${this.fmt(s.selectedRange.endDate)} – ${this.fmt(s.selectedRange.startDate)}`
                );
                this.syncAll(); this.refreshCalendars(); this.syncRangeInfo();
            }
        });

        // Go to Today
        el.querySelector("#btn-today")?.addEventListener("click", () => {
            const now = new Date();
            this.calYear  = now.getFullYear();
            this.calMonth = now.getMonth();
            this.refreshCalendars();
        });

        // Calendar navigation — must re-bind after refreshCalendars via delegation on cals-row header area
        el.querySelector("#cals-row")?.addEventListener("click", (e) => {
            const btn = (e.target as HTMLElement).closest<HTMLElement>(".nav-btn");
            if (btn?.id === "cal-prev") { this.calMonth--; if (this.calMonth<0){this.calMonth=11;this.calYear--;} this.refreshCalendars(); return; }
            if (btn?.id === "cal-next") { this.calMonth++; if (this.calMonth>11){this.calMonth=0;this.calYear++;} this.refreshCalendars(); return; }

            // Cell click
            const cell = (e.target as HTMLElement).closest<HTMLElement>(".cell[data-iso]");
            if (!cell) return;
            const iso = cell.getAttribute("data-iso");
            if (iso) this.onCellClick(new Date(iso + "T00:00:00"));
        });

        // Hover preview
        const calsRow = el.querySelector<HTMLElement>("#cals-row");
        if (calsRow) {
            calsRow.addEventListener("mousemove", (e) => {
                const cell = (e.target as HTMLElement).closest<HTMLElement>(".cell[data-iso]");
                const st   = this.model.getFilterState();
                if (!cell || !st.selectedRange.startDate || st.selectedRange.endDate) return;
                const iso = cell.getAttribute("data-iso");
                if (!iso || (this.hoverDate && this.toISO(this.hoverDate) === iso)) return;
                this.hoverDate = new Date(iso + "T00:00:00");
                this.refreshCalendars();
                this.syncRangeInfo();
            });
            calsRow.addEventListener("mouseleave", () => {
                const st = this.model.getFilterState();
                if (st.selectedRange.startDate && !st.selectedRange.endDate && this.hoverDate) {
                    this.hoverDate = null; this.refreshCalendars(); this.syncRangeInfo();
                }
            });
        }

        // Theme toggle
        el.querySelector("#theme-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            el.querySelector("#theme-panel")?.classList.toggle("open");
        });
        el.addEventListener("click", (e) => {
            if (!(e.target as HTMLElement).closest("#theme-wrap"))
                el.querySelector("#theme-panel")?.classList.remove("open");
        });
        el.querySelector("#theme-panel")?.addEventListener("click", (e) => {
            const opt = (e.target as HTMLElement).closest<HTMLElement>(".theme-opt");
            if (!opt) return;
            const k = opt.getAttribute("data-theme");
            if (!k || !THEMES[k]) return;
            this.themeKey = k;
            this.t = { ...THEMES[k] };
            this.buildShell();
            this.refreshCalendars();
            this.syncAll();
            this.syncRangeInfo();
            this.bindStaticEvents();
        });

        // Accordion — delegated on sidebar
        el.querySelector("#sidebar")?.addEventListener("click", (e) => {
            // Preset item
            const item = (e.target as HTMLElement).closest<HTMLElement>(".preset-item");
            if (item) {
                const key = item.getAttribute("data-key") as QuickRangeKey;
                if (!key) return;
                this.activePresetKey = key;
                this.hoverDate       = null;
                const { range, label } = this.model.resolveQuickRange(key, this.weekStartMonday);
                this.model.setRange(range, "relative", label);
                if (range.startDate) { this.calYear=range.startDate.getFullYear(); this.calMonth=range.startDate.getMonth(); }
                this.syncAll(); this.refreshCalendars(); this.syncRangeInfo();
                this.host.setResult(this.buildResult(false));
                return;
            }
            // Accordion header
            const hdr = (e.target as HTMLElement).closest<HTMLElement>(".acc-hdr");
            if (hdr) {
                const id = hdr.getAttribute("data-cat");
                if (!id) return;
                this.openCatId = this.openCatId === id ? null : id;
                this.syncAccordion();
            }
        });
    }

    // ─── Cell click logic ─────────────────────────────────────────────────────
    private onCellClick(date: Date): void {
        const st = this.model.getFilterState();

        if (!st.selectedRange.startDate || (st.selectedRange.startDate && st.selectedRange.endDate)) {
            // Start new range
            this.model.setRange({ startDate: date, endDate: null }, "range", "");
            this.hoverDate = null;
        } else {
            // Complete the range
            const s  = st.selectedRange.startDate;
            const lo = date >= s ? s : date;
            const hi = date >= s ? date : s;
            const label = `${this.fmt(lo)} – ${this.fmt(hi)}`;
            this.model.setRange({ startDate: lo, endDate: hi }, "range", label);
            this.hoverDate       = null;
            this.activePresetKey = null;
        }

        this.syncAll();
        this.refreshCalendars();
        this.host.setResult(this.buildResult(false));
    }

    private onManualInput(): void {
        const sv = this.el.querySelector<HTMLInputElement>("#inp-start")?.value;
        const ev = this.el.querySelector<HTMLInputElement>("#inp-end")?.value;
        if (!sv) return;
        const start = new Date(sv + "T00:00:00");
        const end   = ev ? new Date(ev + "T00:00:00") : null;
        if (isNaN(start.getTime()) || (end && end < start)) return;
        const label = end ? `${this.fmt(start)} – ${this.fmt(end)}` : this.fmt(start);
        this.model.setRange({ startDate: start, endDate: end }, end ? "range" : "single", label);
        this.calYear  = start.getFullYear();
        this.calMonth = start.getMonth();
        this.hoverDate       = null;
        this.activePresetKey = null;
        this.syncAll();
        this.refreshCalendars();
        this.host.setResult(this.buildResult(false));
    }

    // ─── Sync helpers ─────────────────────────────────────────────────────────
    private syncInputs(): void {
        const s  = this.model.getFilterState();
        const si = this.el.querySelector<HTMLInputElement>("#inp-start");
        const ei = this.el.querySelector<HTMLInputElement>("#inp-end");
        if (si) si.value = s.selectedRange.startDate ? this.toISO(s.selectedRange.startDate) : "";
        if (ei) ei.value = s.selectedRange.endDate   ? this.toISO(s.selectedRange.endDate)   : "";
    }

    private syncLabel(): void {
        const lbl = this.el.querySelector<HTMLElement>("#active-lbl");
        const s   = this.model.getFilterState();
        if (!lbl) return;
        lbl.textContent = s.quickLabel || (s.isActive
            ? `${this.fmt(s.selectedRange.startDate)} – ${this.fmt(s.selectedRange.endDate)}`
            : "No filter active");
    }

    private syncAccordion(): void {
        this.el.querySelectorAll<HTMLElement>(".acc-hdr").forEach(h => {
            const id = h.getAttribute("data-cat");
            const open = id === this.openCatId;
            h.classList.toggle("open", open);
            const body = this.el.querySelector(`#ab-${id}`);
            if (body) body.classList.toggle("open", open);
        });
    }

    private syncPresets(): void {
        this.el.querySelectorAll<HTMLElement>(".preset-item").forEach(i => {
            i.classList.toggle("active", i.getAttribute("data-key") === this.activePresetKey);
        });
    }

    // ─── Month grid HTML (re-rendered on nav/selection) ───────────────────────
    private monthGridHtml(year: number, month: number, side: string): string {
        const s = this.model.getFilterState();
        const dayNames = this.weekStartMonday
            ? ["Mo","Tu","We","Th","Fr","Sa","Su"]
            : ["Su","Mo","Tu","We","Th","Fr","Sa"];

        const monthLabel = new Date(year, month, 1)
            .toLocaleString("default", { month: "long", year: "numeric" });

        let firstWd = new Date(year, month, 1).getDay();
        if (this.weekStartMonday) firstWd = firstWd === 0 ? 6 : firstWd - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dk = (d: Date) => this.toISO(d);
        const startKey = s.selectedRange.startDate ? dk(s.selectedRange.startDate) : null;
        const endKey   = s.selectedRange.endDate   ? dk(s.selectedRange.endDate)   : null;
        const todayKey = this.toISO(new Date());

        const inRange = (d: Date): boolean => {
            const lo = s.selectedRange.startDate;
            const hi = s.selectedRange.endDate || this.hoverDate;
            if (!lo || !hi) return false;
            const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
            return d > a && d < b;
        };

        let cells = "";
        for (let i = 0; i < firstWd; i++) cells += `<div class="cell blank"></div>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const d   = new Date(year, month, day);
            const iso = dk(d);
            const cls = ["cell",
                iso === startKey  ? "start"    : "",
                iso === endKey    ? "end"       : "",
                iso === startKey && !endKey ? "single" : "",
                inRange(d)        ? "in-range"  : "",
                iso === todayKey  ? "today"     : "",
                (d.getDay() === 0 || d.getDay() === 6) ? "weekend" : ""
            ].filter(Boolean).join(" ");

            cells += `<div class="${cls}" data-iso="${iso}">${day}</div>`;
        }

        // Nav: left cal has ‹ only, right has › only
        const navL = side === "L"
            ? `<button class="nav-btn" id="cal-prev" style="visibility:visible">‹</button>`
            : `<div class="nav-spacer"></div>`;
        const navR = side === "R"
            ? `<button class="nav-btn" id="cal-next" style="visibility:visible">›</button>`
            : `<div class="nav-spacer"></div>`;

        return `
<div class="cal-nav">
    ${navL}
    <span class="cal-month">${monthLabel}</span>
    ${navR}
</div>
<div class="cal-grid">
    ${dayNames.map(d => `<div class="wd">${d}</div>`).join("")}
    ${cells}
</div>`;
    }

    // ─── Full shell HTML (built once) ─────────────────────────────────────────
    private shellHtml(): string {
        const t = this.t;
        const themes = Object.entries(THEMES);
        return `
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;margin:0;padding:0}
.root{display:flex;flex-direction:column;width:100%;height:100vh;max-height:100vh;overflow:hidden;background:${t.bg};color:${t.text};font-family:"Segoe UI",Tahoma,Arial,sans-serif;font-size:12px}
/* ── Header ── */
.dw-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px 7px;background:${t.surface};border-bottom:1px solid ${t.border};flex-shrink:0}
.dw-hdr-left{display:flex;align-items:center;gap:7px}
.dw-hdr-ico{font-size:15px}
.dw-hdr-title{font-size:13px;font-weight:700;color:${t.text}}
.dw-hdr-right{display:flex;align-items:center;gap:4px}
.icon-btn{width:26px;height:26px;border-radius:6px;border:none;background:transparent;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:${t.textMuted};transition:background .14s}
.icon-btn:hover{background:${t.border}}
/* Theme panel */
.theme-wrap{position:relative}
.theme-panel{display:none;position:fixed;top:44px;right:8px;background:${t.bg};border:1px solid ${t.border};border-radius:10px;padding:5px;width:178px;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.35)}
.theme-panel.open{display:block!important}
.theme-opt{display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:7px;cursor:pointer;font-size:11.5px;color:${t.text}}
.theme-opt:hover{background:${t.surface}}
.theme-opt.active{background:${t.surface};font-weight:600}
.t-swatch{width:12px;height:12px;border-radius:50%;flex-shrink:0;border:1.5px solid rgba(255,255,255,.15)}
/* Active bar */
.active-bar{padding:3px 12px 3px;background:${t.surface};border-bottom:1px solid ${t.border};flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:8px}
#active-lbl{font-size:11px;font-weight:600;color:${t.accent};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.today-btn{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;border:1px solid ${t.accent};background:transparent;color:${t.accent};cursor:pointer;flex-shrink:0;transition:all .12s}
.today-btn:hover{background:${t.accent};color:${t.accentText}}
/* Body */
.body{display:flex;flex:1;overflow:hidden;min-height:0}
/* Sidebar */
#sidebar{width:172px;flex-shrink:0;background:${t.surface};border-right:1px solid ${t.border};overflow-y:auto;padding:5px 4px}
#sidebar::-webkit-scrollbar{width:3px}
#sidebar::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px}
.sb-lbl{font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${t.textMuted};padding:3px 8px 6px}
.acc-hdr{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:7px;cursor:pointer;user-select:none;color:${t.text};transition:background .12s}
.acc-hdr:hover{background:${t.rangeHover};color:${t.accent}}
.acc-hdr.open{background:${t.accent};color:${t.accentText}}
.acc-hdr.open .chv{transform:rotate(90deg);color:${t.accentText}}
.cat-ico{font-size:12px;width:14px;text-align:center;flex-shrink:0}
.cat-name{flex:1;font-size:11.5px;font-weight:500}
.chv{font-size:12px;color:${t.textMuted};transition:transform .16s;display:inline-block;flex-shrink:0}
.acc-body{display:none;padding:1px 0 2px 3px}
.acc-body.open{display:block}
.preset-item{padding:5px 6px 5px 20px;border-radius:5px;cursor:pointer;font-size:11.5px;color:${t.text};transition:all .1s}
.preset-item:hover{background:${t.rangeHover};color:${t.accent}}
.preset-item.active{background:${t.accent};color:${t.accentText};font-weight:600}
/* Calendar panel */
.cal-panel{flex:1;display:flex;flex-direction:column;padding:7px 10px 6px;overflow:hidden;min-width:0}
/* Input row */
.inp-row{display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-shrink:0}
.inp-chip{flex:1;display:flex;align-items:center;gap:4px;background:${t.surface};border:1px solid ${t.border};border-radius:6px;padding:3px 7px;min-width:0;transition:border .14s}
.inp-chip:focus-within{border-color:${t.accent}}
.inp-lbl{font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:${t.textMuted};flex-shrink:0}
.inp{flex:1;border:none;background:transparent;color:${t.text};font-size:10.5px;font-family:inherit;min-width:0}
.inp:focus{outline:none}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.5);cursor:pointer;width:11px;height:11px}
.inp-sep{color:${t.textMuted};font-size:12px;flex-shrink:0}
.swap-btn{width:24px;height:24px;border-radius:50%;border:1px solid ${t.border};background:${t.surface};cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:${t.textMuted};transition:all .14s;flex-shrink:0}
.swap-btn:hover{background:${t.accent};color:${t.accentText};border-color:${t.accent}}
/* Dual calendars */
#cals-row{display:flex;gap:0;flex:1;overflow:hidden;min-height:0;cursor:default}
.cal-wrap{flex:1;overflow:hidden;min-width:0;padding:0 6px;display:flex;flex-direction:column}
.cal-divider{width:1px;background:${t.border};flex-shrink:0;margin:4px 0}
/* Calendar nav */
.cal-nav{display:flex;align-items:center;justify-content:space-between;padding:0 0 4px;flex-shrink:0}
.cal-month{font-size:12px;font-weight:700;color:${t.text}}
.nav-btn{width:22px;height:22px;border-radius:5px;border:1px solid ${t.border};background:transparent;cursor:pointer;font-size:13px;color:${t.text};display:flex;align-items:center;justify-content:center;transition:all .12s}
.nav-btn:hover{background:${t.rangeHover};border-color:${t.accent};color:${t.accent}}
.nav-spacer{width:22px}
/* Calendar grid */
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;flex:1}
.wd{text-align:center;font-size:8.5px;font-weight:700;color:${t.textMuted};padding:1px 0 3px;text-transform:uppercase;user-select:none}
.cell{height:27px;display:flex;align-items:center;justify-content:center;font-size:11px;border-radius:4px;cursor:pointer;transition:background .08s,color .08s;color:${t.text};user-select:none;position:relative}
.cell.blank{cursor:default;pointer-events:none;visibility:hidden}
.cell.weekend{opacity:.65}
.cell.today{font-weight:800;outline:2px solid ${t.accent};outline-offset:-2px}
.cell:not(.blank):not(.start):not(.end):not(.single):hover{background:${t.rangeHover}}
.cell.in-range{border-radius:0;background:${t.rangeHover}}
.cell.start{border-radius:4px 0 0 4px!important;background:${t.accent}!important;color:${t.accentText}!important;font-weight:700}
.cell.end{border-radius:0 4px 4px 0!important;background:${t.accent}!important;color:${t.accentText}!important;font-weight:700}
.cell.single{border-radius:4px!important;background:${t.accent}!important;color:${t.accentText}!important;font-weight:700}
/* Range duration badge */
.range-info{text-align:center;font-size:10px;color:${t.textMuted};padding:2px 0;flex-shrink:0;min-height:16px}
.range-info span{background:${t.surface};border-radius:8px;padding:1px 8px;border:1px solid ${t.border}}
/* Footer */
.footer{display:flex;gap:6px;padding-top:5px;border-top:1px solid ${t.border};flex-shrink:0;align-items:center}
.footer-left{font-size:10px;color:${t.textMuted};flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.btn-clear{padding:5px 12px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;border:1px solid ${t.border};background:${t.surface};color:${t.textMuted};font-family:inherit;flex-shrink:0;transition:all .14s}
.btn-clear:hover{background:rgba(220,38,38,.1);border-color:rgba(220,38,38,.35);color:#ef4444}
.btn-apply{padding:5px 20px;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;border:none;font-family:inherit;background:${t.accent};color:${t.accentText};transition:filter .14s;flex-shrink:0}
.btn-apply:hover{filter:brightness(1.1)}
.btn-apply:active{filter:brightness(.9)}
</style>
<div class="root">
    <!-- Header -->
    <div class="dw-hdr">
        <div class="dw-hdr-left">
            <span class="dw-hdr-ico">📅</span>
            <span class="dw-hdr-title" id="dw-hdr-title" style="display:none"></span>
        </div>
        <div class="dw-hdr-right">
            <div class="theme-wrap" id="theme-wrap">
                <button class="icon-btn" id="theme-btn" title="Change theme">🎨</button>
                <div class="theme-panel" id="theme-panel">
                    ${themes.map(([k,th])=>`
                    <div class="theme-opt${this.themeKey===k?" active":""}" data-theme="${k}">
                        <span class="t-swatch" style="background:${th.accent}"></span>
                        <span>${th.name}</span>
                    </div>`).join("")}
                </div>
            </div>
        </div>
    </div>
    <!-- Active bar -->
    <div class="active-bar">
        <span id="active-lbl">No filter active</span>
        <button class="today-btn" id="btn-today">Go to Today</button>
    </div>
    <!-- Body -->
    <div class="body">
        <!-- Sidebar -->
        <div id="sidebar">
            <div class="sb-lbl">Date Categories</div>
            ${PRESET_CATEGORIES.map(cat => `
            <div class="acc-group">
                <div class="acc-hdr" data-cat="${cat.id}">
                    <span class="cat-ico">${cat.icon}</span>
                    <span class="cat-name">${cat.name}</span>
                    <span class="chv">›</span>
                </div>
                <div class="acc-body" id="ab-${cat.id}">
                    ${cat.items.map(i => `<div class="preset-item" data-key="${i.key}">${i.label}</div>`).join("")}
                </div>
            </div>`).join("")}
        </div>
        <!-- Calendar panel -->
        <div class="cal-panel">
            <div class="inp-row">
                <div class="inp-chip">
                    <span class="inp-lbl">FROM</span>
                    <input type="date" id="inp-start" class="inp"/>
                </div>
                <button class="swap-btn" id="btn-swap" title="Swap dates">⇄</button>
                <div class="inp-chip">
                    <span class="inp-lbl">TO</span>
                    <input type="date" id="inp-end" class="inp"/>
                </div>
            </div>
            <div id="cals-row">
                <div class="cal-wrap" id="cal-left"></div>
                <div class="cal-divider"></div>
                <div class="cal-wrap" id="cal-right"></div>
            </div>
            <div class="range-info" id="range-info"></div>
            <div class="footer">
                <span class="footer-left" id="footer-hint">Click a date to start selecting</span>
                <button class="btn-clear" id="btn-clear">✕ Clear</button>
                <button class="btn-apply" id="btn-apply">✓ Apply Filter</button>
            </div>
        </div>
    </div>
</div>`;
    }

    // ─── Range info & footer hint ─────────────────────────────────────────────
    private syncRangeInfo(): void {
        const el  = this.el;
        const box = el.querySelector<HTMLElement>("#range-info");
        if (!box) return;
        const s  = this.model.getFilterState();
        const lo = s.selectedRange.startDate;
        const hi = s.selectedRange.endDate || (this.hoverDate && lo ? this.hoverDate : null);
        if (lo && hi) {
            const days = Math.round(Math.abs(hi.getTime() - lo.getTime()) / 86400000) + 1;
            const weeks = Math.floor(days / 7);
            const rem   = days % 7;
            const parts: string[] = [`${days} day${days!==1?"s":""}`];
            if (weeks > 0) parts.push(`${weeks}w ${rem}d`);
            setHTML(box, `<span>${parts[0]}${weeks>0?" ("+parts[1]+")":""} selected</span>`);
        } else if (lo && !hi) {
            setHTML(box, "<span>Select end date…</span>");
        } else {
            while (box.firstChild) box.removeChild(box.firstChild);
        }
    }

    private syncFooterHint(): void {
        const hint = this.el.querySelector<HTMLElement>("#footer-hint");
        if (!hint) return;
        const s = this.model.getFilterState();
        if (s.selectedRange.startDate && !s.selectedRange.endDate) {
            hint.textContent = "Now click an end date";
        } else if (s.isActive) {
            hint.textContent = s.quickLabel || `${this.fmt(s.selectedRange.startDate)} – ${this.fmt(s.selectedRange.endDate)}`;
        } else {
            hint.textContent = "Click a date to start";
        }
    }

    // ─── Result ───────────────────────────────────────────────────────────────
    private buildResult(cleared: boolean): DialogResult {
        const s = this.model.getFilterState();
        return {
            startDate: s.selectedRange.startDate?.toISOString() || null,
            endDate:   s.selectedRange.endDate?.toISOString()   || null,
            label:     s.quickLabel || "",
            themeKey:  this.themeKey,
            cleared
        };
    }

    // ─── Formatters ───────────────────────────────────────────────────────────
    private fmt(d: Date|null): string {
        if (!d) return "";
        const dd = String(d.getDate()).padStart(2,"0");
        const mm = String(d.getMonth()+1).padStart(2,"0");
        const yy = d.getFullYear();
        if (this.dateFormat === "MM/DD/YYYY") return `${mm}/${dd}/${yy}`;
        if (this.dateFormat === "YYYY-MM-DD") return `${yy}-${mm}-${dd}`;
        return `${dd}/${mm}/${yy}`;
    }

    private toISO(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
}

globalThis.dialogRegistry = globalThis.dialogRegistry || {};
globalThis.dialogRegistry[DatePickerDialog.id] = DatePickerDialog;
