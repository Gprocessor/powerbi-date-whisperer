"use strict";

import { AdvancedFilter, IFilterColumnTarget } from "powerbi-models";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import IVisual                       = powerbi.extensibility.visual.IVisual;
import IVisualEventService             = powerbi.extensibility.IVisualEventService;
import IVisualHost                   = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions      = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions           = powerbi.extensibility.visual.VisualUpdateOptions;
import FilterAction                  = powerbi.FilterAction;
import DialogAction                  = powerbi.DialogAction;
import VisualDialogPositionType      = powerbi.VisualDialogPositionType;

import { VisualFormattingSettingsModel }    from "./settings";
import { THEMES }                          from "./htmlTemplates";
import { DatePickerDialog, DialogInitialState, DialogResult } from "./datePickerDialog";
import { setHTML } from "./domUtils";

export class Visual implements IVisual {
    private host:       IVisualHost;
    private el:         HTMLElement;
    private settings:   VisualFormattingSettingsModel;
    private fmtService: FormattingSettingsService;

    private events:          IVisualEventService;
    private filterTarget:    IFilterColumnTarget|null = null;
    private hasDateField     = false;
    private dataViewDates:   Date[] = [];
    private weekStartMonday  = true;
    private activeThemeKey   = "midnight";
    private activePresetKey: string|null = null;
    private openCatId:       string|null = null;
    private filterLabel      = "";
    private startDate:       Date|null = null;
    private endDate:         Date|null = null;

    constructor(options: VisualConstructorOptions) {
        this.host       = options.host;
        this.el         = options.element;
        this.fmtService = new FormattingSettingsService();
        this.settings   = new VisualFormattingSettingsModel();
        this.el.style.cssText = "width:100%;height:100%;overflow:hidden;position:relative;";
        this.events = options.host.eventService;
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);
        try {
        this.settings = this.fmtService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel, options.dataViews[0]);
        const ds = this.settings.dateSelector;
        this.weekStartMonday = (ds.weekStart.value as any).value === "monday";
        this.extractDates(options.dataViews);
        this.renderPill();
        this.events.renderingFinished(options);
        } catch (e) {
            this.events.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): any {
        return this.fmtService.buildFormattingModel(this.settings);
    }

    private extractDates(dvs: powerbi.DataView[]): void {
        this.dataViewDates = []; this.filterTarget = null; this.hasDateField = false;
        if (!dvs?.[0]?.categorical?.categories) return;
        const cat = dvs[0].categorical.categories[0];
        if (!cat?.values) return;
        const qn = cat.source.queryName || "", dot = qn.indexOf(".");
        this.filterTarget = { table: dot > -1 ? qn.substring(0, dot) : qn, column: cat.source.displayName };
        this.hasDateField = true;
        const seen = new Set<string>();
        for (const v of cat.values) {
            if (v == null) continue;
            const d = v instanceof Date ? v : new Date(v as string);
            if (isNaN(d.getTime())) continue;
            const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (!seen.has(k)) { seen.add(k); this.dataViewDates.push(d); }
        }
    }

    // ── Pill — always visible on canvas ──────────────────────────────────────
    private renderPill(): void {
        const t = THEMES[this.activeThemeKey] || THEMES["midnight"];
        const isActive = !!(this.startDate);
        const label = isActive ? (this.filterLabel || this.fmtDate(this.startDate)) : "Select Date Range";

        if (!this.hasDateField) {
            setHTML(this.el, `<div class="dw-landing">
                <span class="dw-landing-ico">📅</span>
                <span class="dw-landing-sub">Add a <strong>Date</strong> field to begin</span>
               </div>`);
        } else {
            const pillHtml = `<div class="dw-pill${isActive ? " dw-pill--active" : ""}"
                    style="--accent:${t.accent};--accent-t:${t.accentText};--pill-bg:${t.pillBg};--pill-text:${t.pillText};--border:${t.border};"
                    id="dw-pill">
                <span class="dw-pill-ico">📅</span>
                <span class="dw-pill-lbl">${label}</span>
                ${isActive ? `<span class="dw-pill-x" id="dw-pill-clear">✕</span>` : `<span class="dw-pill-caret">▾</span>`}
               </div>`;
            setHTML(this.el, pillHtml);
        }

        if (!this.hasDateField) return;
        this.el.querySelector("#dw-pill")?.addEventListener("click", (e) => {
            const tgt = e.target as HTMLElement;
            if (tgt.id === "dw-pill-clear" || tgt.closest("#dw-pill-clear")) {
                e.stopPropagation(); this.clearFilter(); return;
            }
            this.openDialog();
        });
    }

    // ── Open modal dialog ─────────────────────────────────────────────────────
    private openDialog(): void {
        // Check if openModalDialog API is available (not available in some Service contexts)
        const canDialog = !!(this.host as any).openModalDialog &&
                          this.host.hostCapabilities?.allowModalDialog !== false;

        if (!canDialog) {
            // Fallback: show inline picker within the visual canvas
            this.showInlineFallback();
            return;
        }

        const state: DialogInitialState = {
            themeKey:         this.activeThemeKey,
            activePresetKey:  this.activePresetKey,
            openCatId:        this.openCatId,
            startDate:        this.startDate ? this.startDate.toISOString() : null,
            endDate:          this.endDate   ? this.endDate.toISOString()   : null,
            weekStartMonday:  this.weekStartMonday,
            fiscalStartMonth: Number(this.settings.dateSelector.fiscalYearStartMonth.value) || 7,
            dataViewDates:    this.dataViewDates.map(d => d.toISOString()),
            dateFormat:       String((this.settings.dateSelector.dateFormat.value as any).value || "DD/MM/YYYY"),
            filterLabel:      this.filterLabel
        };

        const dialogOptions = {
            actionButtons: [],
            size:     { width: 740, height: 500 },
            position: {
                type: VisualDialogPositionType.RelativeToVisual,
                left: 0,
                top:  36
            }
            // No title = no PBI title bar = no warning checkbox shown
        };

        this.host.openModalDialog(DatePickerDialog.id, dialogOptions as any, state)
            .then((result: any) => {
                if (!result || !result.actionId || result.actionId === DialogAction.Close || result.actionId === DialogAction.OK) {
                    const r = result.resultState as DialogResult;
                    if (r.cleared) { this.clearFilter(); return; }
                    if (r.startDate) {
                        this.startDate      = new Date(r.startDate);
                        this.endDate        = r.endDate ? new Date(r.endDate) : null;
                        this.filterLabel    = r.label || "";
                        this.activeThemeKey = r.themeKey || this.activeThemeKey;
                        this.applyFilter();
                    }
                }
                this.renderPill();
            })
            .catch((err: any) => {
                // User cancelled or dismissed — just re-render pill
                console.log("[DateWhisperer] dialog closed:", err);
                this.renderPill();
            });
    }


    // ── Inline fallback (when dialog API unavailable in Service) ──────────────
    private showInlineFallback(): void {
        // Show a simple message with the selection state as an overlay on the pill
        const t = THEMES[this.activeThemeKey] || THEMES["midnight"];
        const fbLabel = this.startDate ? (this.filterLabel || this.fmtDate(this.startDate)) : "Select Date Range";
        const fbClear = this.startDate ? `<span id="dw-clear-fb" style="cursor:pointer;font-size:10px;opacity:.7">✕</span>` : `<span>▾</span>`;
        setHTML(this.el, `<div style="width:100%;display:flex;flex-direction:column;align-items:flex-start;font-family:'Segoe UI',sans-serif;gap:4px;padding:4px 0;"><div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:18px;background:${t.surface};border:1.5px solid ${t.border};cursor:pointer;font-size:12px;color:${t.text};" id="dw-pill-fb"><span>📅</span><span>${fbLabel}</span>${fbClear}</div><div style="font-size:10px;color:#f59e0b;padding:2px 4px;background:#fef3c7;border-radius:4px;border:1px solid #fde68a;">⚠ Dialog mode unavailable. Use filter pane or open in Desktop.</div></div>`);
        this.el.querySelector("#dw-clear-fb")?.addEventListener("click", (e) => {
            e.stopPropagation(); this.clearFilter();
        });
    }

    // ── Filter ────────────────────────────────────────────────────────────────
    private applyFilter(): void {
        if (!this.startDate || !this.filterTarget) return;
        const si = this.startDate.toISOString();
        const ei = (this.endDate || this.startDate).toISOString();
        try {
            const fi = new AdvancedFilter(this.filterTarget, "And",
                { operator: "GreaterThanOrEqual", value: si },
                { operator: "LessThanOrEqual",    value: ei });
            (this.host as any).applyJsonFilter(fi.toJSON(), "general", "filter", FilterAction.merge);
        } catch(e) { console.error("[DateWhisperer]", e); }
    }

    private clearFilter(): void {
        this.startDate = null; this.endDate = null; this.filterLabel = "";
        this.activePresetKey = null;
        try { (this.host as any).applyJsonFilter(null, "general", "filter", FilterAction.remove); } catch { /* */ }
        this.renderPill();
    }

    private fmtDate(d: Date|null): string {
        if (!d) return "";
        const f = String((this.settings.dateSelector.dateFormat.value as any).value || "DD/MM/YYYY");
        const dd = String(d.getDate()).padStart(2,"0"), mm = String(d.getMonth()+1).padStart(2,"0"), yy = d.getFullYear();
        if (f === "MM/DD/YYYY") return `${mm}/${dd}/${yy}`;
        if (f === "YYYY-MM-DD") return `${yy}-${mm}-${dd}`;
        return `${dd}/${mm}/${yy}`;
    }
}
