# 📅 Date Whisperer

**A free, open-source Power BI custom visual for intelligent date range filtering**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Power BI](https://img.shields.io/badge/Power%20BI-Custom%20Visual-yellow)](https://appsource.microsoft.com)

## ✨ Features

- 🗓 **Dual calendar** range picker with live hover preview
- 📋 **40+ date presets** across 8 categories:
  - Days · Weeks · Months · Quarters · Years · Fiscal Ranges · Business Ranges · Fixed Ranges
- 🎨 **7 built-in themes** — Azure, Violet, Emerald, Rose, Amber, Slate Dark, Midnight
- 📅 **FROM / TO manual inputs** with swap button (⇄)
- 📊 **Live range duration badge** — e.g. "92 days (13w 1d) selected"
- 🔄 **Go to Today** quick-jump button
- 🪟 Opens as a proper **Power BI modal dialog** (floats outside the visual)
- ✅ Filters **all visuals** on the page via Power BI AdvancedFilter API

## 🚀 Quick Start

1. Download the `.pbiviz` file from [Releases](../../releases)
2. In Power BI Desktop: **Visualizations → ⋯ → Import visual from file**
3. Add the visual to your report canvas (keep it small — ~200×40px)
4. Drag a **Date** column into the **Date Field** bucket
5. Click the pill button → select your date range → **✓ Apply Filter**

## 🔨 Build from Source

```bash
npm install
npx pbiviz package
```

## ✅ AppSource Certification Ready

| Check | Status |
|---|---|
| No innerHTML / outerHTML | ✅ Pass |
| No eval / fetch / XMLHttpRequest | ✅ Pass |
| No external HTTP requests | ✅ Pass |
| Rendering Events API | ✅ Pass |
| npm audit (production deps) | ✅ 0 vulnerabilities |
| Required config files | ✅ All present |

```bash
npm audit --omit=dev
npx pbiviz package --certification-audit
```

## 📁 Project Structure

```
├── src/
│   ├── visual.ts             # Main visual — pill button UI
│   ├── datePickerDialog.ts   # Modal dialog — dual calendar + presets
│   ├── htmlTemplates.ts      # Themes + preset category definitions
│   ├── dataModel.ts          # Date range engine (40+ presets)
│   ├── settings.ts           # Format pane settings
│   └── domUtils.ts           # Cert-compliant safe DOM utilities
├── style/
│   └── visual.less           # Pill button styles
├── assets/
│   └── icon.png
├── capabilities.json
├── pbiviz.json
└── package.json
```

## 📄 License

[MIT](LICENSE) — free for personal and commercial use.

## 👤 Author

**Gprocessor**  
GitHub: [@Gprocessor](https://github.com/Gprocessor)
