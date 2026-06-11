"use strict";

export type SelectionMode = "single" | "range" | "relative";

export interface DateRange { startDate: Date|null; endDate: Date|null; }
export interface FilterState {
    isActive: boolean;
    selectedRange: DateRange;
    filterType: SelectionMode;
    quickLabel: string;
}

export type QuickRangeKey =
    // Days
    | "today" | "yesterday" | "tomorrow" | "dayBeforeYesterday" | "last2Days" | "last3Days"
    // Weeks
    | "thisWeek" | "lastWeek" | "nextWeek" | "wtd" | "last7Days" | "last14Days" | "last2Weeks"
    // Months
    | "thisMonth" | "lastMonth" | "nextMonth" | "mtd" | "last30Days" | "last60Days" | "last90Days" | "last3Months" | "last6Months"
    // Quarters
    | "thisQuarter" | "lastQuarter" | "nextQuarter" | "qtd" | "last2Quarters"
    // Years
    | "thisYear" | "lastYear" | "nextYear" | "ytd" | "last365Days" | "last2Years" | "last3Years"
    // Fiscal
    | "thisFY" | "lastFY" | "fyToDate" | "thisHalfFY" | "lastHalfFY"
    // Business / Rolling
    | "last5BusinessDays" | "last10BusinessDays" | "last20BusinessDays" | "thisBusinessWeek" | "lastBusinessWeek"
    // Fixed ranges
    | "first7DaysOfMonth" | "last7DaysOfMonth" | "firstHalfOfMonth" | "lastHalfOfMonth"
    | "firstQuarterOfYear" | "secondQuarterOfYear" | "thirdQuarterOfYear" | "fourthQuarterOfYear";

function sod(d:Date):Date { return new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0,0); }
function eod(d:Date):Date { return new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59,999); }
function addD(d:Date,n:number):Date { const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function addM(d:Date,n:number):Date { const r=new Date(d); r.setMonth(r.getMonth()+n); return r; }
function soM(d:Date):Date { return new Date(d.getFullYear(),d.getMonth(),1); }
function eoM(d:Date):Date { return new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999); }
function soQ(d:Date):Date { return new Date(d.getFullYear(),Math.floor(d.getMonth()/3)*3,1); }
function eoQ(d:Date):Date { return new Date(d.getFullYear(),Math.floor(d.getMonth()/3)*3+3,0,23,59,59,999); }
function soY(d:Date):Date { return new Date(d.getFullYear(),0,1); }
function eoY(d:Date):Date { return new Date(d.getFullYear(),11,31,23,59,59,999); }
function soW(d:Date,mon:boolean):Date {
    const day=d.getDay(); const off=mon?(day===0?-6:1-day):-day;
    return sod(addD(d,off));
}
function fyStart(d:Date,fsm:number):Date {
    const m=fsm-1; let y=d.getFullYear(); if(d.getMonth()<m) y--; return new Date(y,m,1);
}
function fyEnd(fs:Date):Date { return new Date(fs.getFullYear()+1,fs.getMonth(),0,23,59,59,999); }

// skip weekends
function addBusinessDays(d:Date, n:number):Date {
    let r=new Date(d); let added=0;
    while(added<n) { r=addD(r,1); if(r.getDay()!==0&&r.getDay()!==6) added++; }
    return r;
}
function subBusinessDays(d:Date, n:number):Date {
    let r=new Date(d); let sub=0;
    while(sub<n) { r=addD(r,-1); if(r.getDay()!==0&&r.getDay()!==6) sub++; }
    return r;
}

export class DataModel {
    private _state: FilterState;
    private _fy = 7;

    constructor() { this._state = this._empty(); }

    setFiscalYearStartMonth(m:number) { this._fy=Math.min(12,Math.max(1,Math.round(m))); }
    getFilterState():FilterState { return {...this._state}; }
    isActive():boolean { return this._state.isActive; }

    setRange(range:DateRange, mode:SelectionMode, label:string) {
        this._state = { isActive: range.startDate!==null||range.endDate!==null, selectedRange:{...range}, filterType:mode, quickLabel:label };
    }
    clear() { this._state=this._empty(); }

    resolveQuickRange(key:QuickRangeKey, monStart=true):{range:DateRange;label:string} {
        const today=sod(new Date());
        type Res={start:Date;end:Date;label:string};
        const map:Record<QuickRangeKey,()=>Res> = {
            // Days
            today:              ()=>({start:today,end:eod(today),label:"Today"}),
            yesterday:          ()=>{const d=addD(today,-1);return{start:d,end:eod(d),label:"Yesterday"};},
            tomorrow:           ()=>{const d=addD(today,1);return{start:d,end:eod(d),label:"Tomorrow"};},
            dayBeforeYesterday: ()=>{const d=addD(today,-2);return{start:d,end:eod(d),label:"Day Before Yesterday"};},
            last2Days:          ()=>({start:addD(today,-1),end:eod(today),label:"Last 2 Days"}),
            last3Days:          ()=>({start:addD(today,-2),end:eod(today),label:"Last 3 Days"}),
            // Weeks
            wtd:          ()=>({start:soW(today,monStart),end:eod(today),label:"Week to Date"}),
            thisWeek:     ()=>{const s=soW(today,monStart);return{start:s,end:eod(addD(s,6)),label:"This Week"};},
            lastWeek:     ()=>{const s=addD(soW(today,monStart),-7);return{start:s,end:eod(addD(s,6)),label:"Last Week"};},
            nextWeek:     ()=>{const s=addD(soW(today,monStart),7);return{start:s,end:eod(addD(s,6)),label:"Next Week"};},
            last7Days:    ()=>({start:addD(today,-6),end:eod(today),label:"Last 7 Days"}),
            last14Days:   ()=>({start:addD(today,-13),end:eod(today),label:"Last 14 Days"}),
            last2Weeks:   ()=>({start:addD(today,-13),end:eod(today),label:"Last 2 Weeks"}),
            // Months
            mtd:          ()=>({start:soM(today),end:eod(today),label:"Month to Date"}),
            thisMonth:    ()=>({start:soM(today),end:eoM(today),label:"This Month"}),
            lastMonth:    ()=>{const d=addM(today,-1);return{start:soM(d),end:eoM(d),label:"Last Month"};},
            nextMonth:    ()=>{const d=addM(today,1);return{start:soM(d),end:eoM(d),label:"Next Month"};},
            last30Days:   ()=>({start:addD(today,-29),end:eod(today),label:"Last 30 Days"}),
            last60Days:   ()=>({start:addD(today,-59),end:eod(today),label:"Last 60 Days"}),
            last90Days:   ()=>({start:addD(today,-89),end:eod(today),label:"Last 90 Days"}),
            last3Months:  ()=>({start:soM(addM(today,-2)),end:eod(today),label:"Last 3 Months"}),
            last6Months:  ()=>({start:soM(addM(today,-5)),end:eod(today),label:"Last 6 Months"}),
            // Quarters
            qtd:          ()=>({start:soQ(today),end:eod(today),label:"Quarter to Date"}),
            thisQuarter:  ()=>({start:soQ(today),end:eoQ(today),label:"This Quarter"}),
            lastQuarter:  ()=>{const d=addM(today,-3);return{start:soQ(d),end:eoQ(d),label:"Last Quarter"};},
            nextQuarter:  ()=>{const d=addM(today,3);return{start:soQ(d),end:eoQ(d),label:"Next Quarter"};},
            last2Quarters:()=>{const d=addM(today,-3);return{start:soQ(d),end:eoQ(today),label:"Last 2 Quarters"};},
            // Years
            ytd:          ()=>({start:soY(today),end:eod(today),label:"Year to Date"}),
            thisYear:     ()=>({start:soY(today),end:eoY(today),label:"This Year"}),
            lastYear:     ()=>{const y=today.getFullYear()-1;return{start:new Date(y,0,1),end:new Date(y,11,31,23,59,59,999),label:"Last Year"};},
            nextYear:     ()=>{const y=today.getFullYear()+1;return{start:new Date(y,0,1),end:new Date(y,11,31,23,59,59,999),label:"Next Year"};},
            last365Days:  ()=>({start:addD(today,-364),end:eod(today),label:"Last 365 Days"}),
            last2Years:   ()=>{const y=today.getFullYear()-1;return{start:new Date(y,0,1),end:eoY(today),label:"Last 2 Years"};},
            last3Years:   ()=>{const y=today.getFullYear()-2;return{start:new Date(y,0,1),end:eoY(today),label:"Last 3 Years"};},
            // Fiscal
            fyToDate:     ()=>{const s=fyStart(today,this._fy);return{start:s,end:eod(today),label:"Fiscal Year to Date"};},
            thisFY:       ()=>{const s=fyStart(today,this._fy);return{start:s,end:fyEnd(s),label:"This Fiscal Year"};},
            lastFY:       ()=>{const s=fyStart(addM(today,-12),this._fy);return{start:s,end:fyEnd(s),label:"Last Fiscal Year"};},
            thisHalfFY:   ()=>{const s=fyStart(today,this._fy);const mid=addM(s,6);const inSecond=today>=mid;return inSecond?{start:mid,end:fyEnd(s),label:"This FY Second Half"}:{start:s,end:eod(addD(mid,-1)),label:"This FY First Half"};},
            lastHalfFY:   ()=>{const s=fyStart(addM(today,-12),this._fy);const mid=addM(s,6);return{start:s,end:eod(addD(mid,-1)),label:"Last FY First Half"};},
            // Business
            last5BusinessDays:  ()=>({start:subBusinessDays(today,4),end:eod(today),label:"Last 5 Business Days"}),
            last10BusinessDays: ()=>({start:subBusinessDays(today,9),end:eod(today),label:"Last 10 Business Days"}),
            last20BusinessDays: ()=>({start:subBusinessDays(today,19),end:eod(today),label:"Last 20 Business Days"}),
            thisBusinessWeek:   ()=>{const s=soW(today,true);return{start:s,end:eod(addD(s,4)),label:"This Business Week"};},
            lastBusinessWeek:   ()=>{const s=addD(soW(today,true),-7);return{start:s,end:eod(addD(s,4)),label:"Last Business Week"};},
            // Fixed
            first7DaysOfMonth:    ()=>({start:soM(today),end:eod(new Date(today.getFullYear(),today.getMonth(),7)),label:"First 7 Days of Month"}),
            last7DaysOfMonth:     ()=>{const e=eoM(today);return{start:eod(addD(e,-6)),end:e,label:"Last 7 Days of Month"};},
            firstHalfOfMonth:     ()=>({start:soM(today),end:eod(new Date(today.getFullYear(),today.getMonth(),15)),label:"First Half of Month"}),
            lastHalfOfMonth:      ()=>{const e=eoM(today);return{start:sod(new Date(today.getFullYear(),today.getMonth(),16)),end:e,label:"Last Half of Month"};},
            firstQuarterOfYear:   ()=>({start:new Date(today.getFullYear(),0,1),end:new Date(today.getFullYear(),2,31,23,59,59,999),label:"Q1 of Year"}),
            secondQuarterOfYear:  ()=>({start:new Date(today.getFullYear(),3,1),end:new Date(today.getFullYear(),5,30,23,59,59,999),label:"Q2 of Year"}),
            thirdQuarterOfYear:   ()=>({start:new Date(today.getFullYear(),6,1),end:new Date(today.getFullYear(),8,30,23,59,59,999),label:"Q3 of Year"}),
            fourthQuarterOfYear:  ()=>({start:new Date(today.getFullYear(),9,1),end:new Date(today.getFullYear(),11,31,23,59,59,999),label:"Q4 of Year"}),
        };
        const r=map[key]();
        return { range:{startDate:r.start,endDate:r.end}, label:r.label };
    }

    private _empty():FilterState {
        return { isActive:false, selectedRange:{startDate:null,endDate:null}, filterType:"range", quickLabel:"" };
    }
}
