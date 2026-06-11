"use strict";

// ── Theme definitions ─────────────────────────────────────────────────────────
export interface Theme {
    name: string;
    accent: string;
    accentText: string;
    bg: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    rangeHover: string;
    pillBg: string;
    pillText: string;
}

export const THEMES: Record<string, Theme> = {
    azure: {
        name:"Azure Blue", accent:"#0078D4", accentText:"#fff",
        bg:"#ffffff", surface:"#f3f6fb", border:"#e1e8f0",
        text:"#1a2332", textMuted:"#6b7a8d", rangeHover:"#dbeafe",
        pillBg:"#f0f7ff", pillText:"#0078D4"
    },
    violet: {
        name:"Violet", accent:"#7c3aed", accentText:"#fff",
        bg:"#ffffff", surface:"#f5f3ff", border:"#e5deff",
        text:"#1e1b4b", textMuted:"#6d5fad", rangeHover:"#ede9fe",
        pillBg:"#f5f3ff", pillText:"#7c3aed"
    },
    emerald: {
        name:"Emerald", accent:"#059669", accentText:"#fff",
        bg:"#ffffff", surface:"#f0fdf4", border:"#d1fae5",
        text:"#052e16", textMuted:"#4b7a5e", rangeHover:"#d1fae5",
        pillBg:"#f0fdf4", pillText:"#059669"
    },
    rose: {
        name:"Rose", accent:"#e11d48", accentText:"#fff",
        bg:"#ffffff", surface:"#fff1f2", border:"#fecdd3",
        text:"#1f0a0d", textMuted:"#8b4558", rangeHover:"#fecdd3",
        pillBg:"#fff1f2", pillText:"#e11d48"
    },
    amber: {
        name:"Amber", accent:"#d97706", accentText:"#fff",
        bg:"#ffffff", surface:"#fffbeb", border:"#fde68a",
        text:"#1a0f00", textMuted:"#92681e", rangeHover:"#fef3c7",
        pillBg:"#fffbeb", pillText:"#d97706"
    },
    slate: {
        name:"Slate Dark", accent:"#38bdf8", accentText:"#0f172a",
        bg:"#0f172a", surface:"#1e293b", border:"#334155",
        text:"#e2e8f0", textMuted:"#94a3b8", rangeHover:"#1e3a4a",
        pillBg:"#1e293b", pillText:"#38bdf8"
    },
    midnight: {
        name:"Midnight", accent:"#a78bfa", accentText:"#1e1b4b",
        bg:"#0f0f1a", surface:"#1a1a2e", border:"#2d2b4e",
        text:"#e0e0ff", textMuted:"#9090b8", rangeHover:"#2a2060",
        pillBg:"#1a1a2e", pillText:"#a78bfa"
    }
};

// ── Preset category structure ──────────────────────────────────────────────────
export interface PresetItem { key: string; label: string; }
export interface PresetCategory { id: string; icon: string; name: string; items: PresetItem[]; }

export const PRESET_CATEGORIES: PresetCategory[] = [
    {
        id:"days", icon:"📅", name:"Days",
        items:[
            {key:"today",             label:"Today"},
            {key:"yesterday",         label:"Yesterday"},
            {key:"tomorrow",          label:"Tomorrow"},
            {key:"dayBeforeYesterday",label:"Day Before Yesterday"},
            {key:"last2Days",         label:"Last 2 Days"},
            {key:"last3Days",         label:"Last 3 Days"},
        ]
    },
    {
        id:"weeks", icon:"📆", name:"Weeks",
        items:[
            {key:"wtd",        label:"Week to Date"},
            {key:"thisWeek",   label:"This Week"},
            {key:"lastWeek",   label:"Last Week"},
            {key:"nextWeek",   label:"Next Week"},
            {key:"last7Days",  label:"Last 7 Days"},
            {key:"last14Days", label:"Last 14 Days"},
            {key:"last2Weeks", label:"Last 2 Weeks"},
        ]
    },
    {
        id:"months", icon:"🗓", name:"Months",
        items:[
            {key:"mtd",        label:"Month to Date"},
            {key:"thisMonth",  label:"This Month"},
            {key:"lastMonth",  label:"Last Month"},
            {key:"nextMonth",  label:"Next Month"},
            {key:"last30Days", label:"Last 30 Days"},
            {key:"last60Days", label:"Last 60 Days"},
            {key:"last90Days", label:"Last 90 Days"},
            {key:"last3Months",label:"Last 3 Months"},
            {key:"last6Months",label:"Last 6 Months"},
        ]
    },
    {
        id:"quarters", icon:"📈", name:"Quarters",
        items:[
            {key:"qtd",           label:"Quarter to Date"},
            {key:"thisQuarter",   label:"This Quarter"},
            {key:"lastQuarter",   label:"Last Quarter"},
            {key:"nextQuarter",   label:"Next Quarter"},
            {key:"last2Quarters", label:"Last 2 Quarters"},
        ]
    },
    {
        id:"years", icon:"🔁", name:"Years",
        items:[
            {key:"ytd",       label:"Year to Date (YTD)"},
            {key:"thisYear",  label:"This Year"},
            {key:"lastYear",  label:"Last Year"},
            {key:"nextYear",  label:"Next Year"},
            {key:"last365Days",label:"Last 365 Days"},
            {key:"last2Years", label:"Last 2 Years"},
            {key:"last3Years", label:"Last 3 Years"},
        ]
    },
    {
        id:"fiscal", icon:"🏦", name:"Fiscal Ranges",
        items:[
            {key:"fyToDate",    label:"Fiscal Year to Date"},
            {key:"thisFY",      label:"This Fiscal Year"},
            {key:"lastFY",      label:"Last Fiscal Year"},
            {key:"thisHalfFY",  label:"This FY Half"},
            {key:"lastHalfFY",  label:"Last FY First Half"},
        ]
    },
    {
        id:"business", icon:"💼", name:"Business Ranges",
        items:[
            {key:"thisBusinessWeek",   label:"This Business Week"},
            {key:"lastBusinessWeek",   label:"Last Business Week"},
            {key:"last5BusinessDays",  label:"Last 5 Business Days"},
            {key:"last10BusinessDays", label:"Last 10 Business Days"},
            {key:"last20BusinessDays", label:"Last 20 Business Days"},
        ]
    },
    {
        id:"fixed", icon:"📌", name:"Fixed Ranges",
        items:[
            {key:"first7DaysOfMonth",   label:"First 7 Days of Month"},
            {key:"last7DaysOfMonth",    label:"Last 7 Days of Month"},
            {key:"firstHalfOfMonth",    label:"First Half of Month"},
            {key:"lastHalfOfMonth",     label:"Last Half of Month"},
            {key:"firstQuarterOfYear",  label:"Q1 of Year"},
            {key:"secondQuarterOfYear", label:"Q2 of Year"},
            {key:"thirdQuarterOfYear",  label:"Q3 of Year"},
            {key:"fourthQuarterOfYear", label:"Q4 of Year"},
        ]
    }
];

export class HtmlTemplates {

    // ── Pill button ────────────────────────────────────────────────────────────
    static pillHtml(label: string, isActive: boolean, t: Theme): string {
        return `
<div class="dw-pill${isActive?" dw-pill--active":""}" id="dw-pill"
     style="--accent:${t.accent};--pill-bg:${t.pillBg};--pill-text:${t.pillText};--bg:${t.bg};--border:${t.border};">
    <span class="dw-pill-ico">📅</span>
    <span class="dw-pill-lbl">${label}</span>
    ${isActive
        ? `<span class="dw-pill-clear" id="dw-pill-clear" title="Clear">✕</span>`
        : `<span class="dw-pill-caret">▾</span>`}
</div>`;
    }

    // ── Main popup ────────────────────────────────────────────────────────────
    static pickerHtml(t: Theme, themeName: string, fontSize: number, fontFamily: string): string {
        return `
<div class="dw-picker" style="
    --accent:${t.accent};--accent-text:${t.accentText};
    --bg:${t.bg};--surface:${t.surface};--border:${t.border};
    --text:${t.text};--muted:${t.textMuted};--range:${t.rangeHover};
    font-size:${fontSize}px;font-family:${fontFamily},sans-serif;">

    <!-- Header -->
    <div class="dw-hdr">
        <div class="dw-hdr-left">
            <span class="dw-hdr-ico">📅</span>
            <span class="dw-hdr-title">Date Whisperer</span>
        </div>
        <div class="dw-hdr-right">
            <div class="dw-theme-wrap" id="dw-theme-wrap">
                <button class="dw-icon-btn" id="dw-theme-toggle" title="Theme">🎨</button>
                <div class="dw-theme-panel" id="dw-theme-panel">
                    ${Object.entries(THEMES).map(([k,th])=>`
                    <div class="dw-theme-opt${themeName===k?" dw-theme-opt--active":""}" data-theme="${k}">
                        <span class="dw-theme-swatch" style="background:${th.accent}"></span>
                        <span>${th.name}</span>
                    </div>`).join("")}
                </div>
            </div>
        </div>
    </div>

    <!-- Active selection bar -->
    <div class="dw-active-bar">
        <span class="dw-active-label" id="dw-active-label">No filter active</span>
    </div>

    <!-- Body: accordion left + calendar right -->
    <div class="dw-body">

        <!-- Accordion sidebar -->
        <div class="dw-sidebar">
            <div class="dw-sb-label">Date Categories</div>
            ${PRESET_CATEGORIES.map(cat=>`
            <div class="dw-acc-group">
                <div class="dw-acc-hdr" data-cat="${cat.id}">
                    <span class="dw-cat-ico">${cat.icon}</span>
                    <span class="dw-cat-name">${cat.name}</span>
                    <span class="dw-acc-chevron">›</span>
                </div>
                <div class="dw-acc-body" id="dw-acc-body-${cat.id}">
                    ${cat.items.map(item=>`
                    <div class="dw-preset-item" data-key="${item.key}">${item.label}</div>
                    `).join("")}
                </div>
            </div>`).join("")}
        </div>

        <!-- Calendar panel -->
        <div class="dw-cal-panel">
            <!-- Date inputs row -->
            <div class="dw-inp-row">
                <div class="dw-inp-chip">
                    <span class="dw-inp-lbl">FROM</span>
                    <input type="date" id="dw-start" class="dw-inp" />
                </div>
                <span class="dw-inp-sep">→</span>
                <div class="dw-inp-chip">
                    <span class="dw-inp-lbl">TO</span>
                    <input type="date" id="dw-end" class="dw-inp" />
                </div>
            </div>
            <!-- Calendar -->
            <div id="dw-cal-wrapper" class="dw-cal-wrapper"></div>
            <!-- Footer -->
            <div class="dw-footer">
                <button class="dw-btn-clear" id="dw-clear">✕ Clear</button>
                <button class="dw-btn-apply" id="dw-apply"
                    style="background:var(--accent);color:var(--accent-text);">✓ Apply</button>
            </div>
        </div>

    </div>
</div>`;
    }

    static submenuHtml(cat: PresetCategory, activeKey: string|null): string {
        return `
<div class="dw-submenu-title">${cat.icon} ${cat.name}</div>
${cat.items.map(item=>`
<div class="dw-preset-item${activeKey===item.key?" dw-preset-item--active":""}" data-key="${item.key}">
    ${item.label}
</div>`).join("")}`;
    }

    // ── Calendar ───────────────────────────────────────────────────────────────
    static calendarHtml(
        year: number, month: number,
        dates: Date[],
        startDate: Date|null, endDate: Date|null, hoverDate: Date|null,
        monStart: boolean, accent: string
    ): string {
        const dayNames = monStart
            ? ["Mo","Tu","We","Th","Fr","Sa","Su"]
            : ["Su","Mo","Tu","We","Th","Fr","Sa"];

        const monthLabel = new Date(year, month, 1)
            .toLocaleString("default", {month:"long", year:"numeric"});

        let firstWd = new Date(year, month, 1).getDay();
        if (monStart) firstWd = firstWd===0 ? 6 : firstWd-1;
        const daysInMonth = new Date(year, month+1, 0).getDate();

        const seen = new Set(dates.map(d=>`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`));
        const dk = (d:Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

        const inRange = (d:Date):boolean => {
            const lo = startDate, hi = endDate||hoverDate;
            if (!lo||!hi) return false;
            const [a,b] = lo<=hi ? [lo,hi] : [hi,lo];
            return d>=a && d<=b;
        };

        let cells = "";
        for (let i=0; i<firstWd; i++) cells += `<div class="dw-cell dw-cell--blank"></div>`;

        for (let day=1; day<=daysInMonth; day++) {
            const d       = new Date(year, month, day);
            const key     = dk(d);
            const hasData = seen.has(key);
            const isStart = startDate && dk(startDate)===key;
            const isEnd   = endDate   && dk(endDate)===key;
            const isSingle= isStart && !endDate;
            const inRng   = inRange(d);
            const isToday = dk(new Date())===key;
            const isWknd  = d.getDay()===0||d.getDay()===6;

            const cls = ["dw-cell",
                hasData  ? "dw-cell--data"   : "dw-cell--nodata",
                isStart  ? "dw-cell--start"  : "",
                isEnd    ? "dw-cell--end"    : "",
                isSingle ? "dw-cell--single" : "",
                inRng    ? "dw-cell--in-range": "",
                isToday  ? "dw-cell--today"  : "",
                isWknd   ? "dw-cell--weekend" : ""
            ].filter(Boolean).join(" ");

            let style = "";
            if (isStart||isEnd||isSingle) style=`background:${accent};color:#fff;`;
            else if (inRng)               style=`background:${accent}22;`;

            cells += `<div class="${cls}" data-day="${day}" data-iso="${d.toISOString().slice(0,10)}" ${style?`style="${style}"`:""}>${day}</div>`;
        }

        return `
<div class="dw-cal">
    <div class="dw-cal-nav">
        <button class="dw-nav-btn" id="dw-prev">‹</button>
        <span class="dw-cal-month">${monthLabel}</span>
        <button class="dw-nav-btn" id="dw-next">›</button>
    </div>
    <div class="dw-cal-grid">
        ${dayNames.map(d=>`<div class="dw-wd">${d}</div>`).join("")}
        ${cells}
    </div>
</div>`;
    }
}
