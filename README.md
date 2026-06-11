# 📅 Date Whisperer
**A free, open-source Power BI custom visual for intelligent date range filtering**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Power BI](https://img.shields.io/badge/Power%20BI-Custom%20Visual-yellow)](https://appsource.microsoft.com)

![Date Whisperer Preview](assets/icon.png)

## ✨ Features

- 🗓 **Dual calendar** range picker with live hover preview
- 📋 **40+ date presets** across 8 categories:
  - Days · Weeks · Months · Quarters · Years · Fiscal Ranges · Business Ranges · Fixed Ranges
- 🎨 **7 built-in themes** — Azure, Violet, Emerald, Rose, Amber, Slate Dark, Midnight
- 📅 **FROM/TO manual inputs** with swap button (⇄)
- 📊 **Live range duration badge** — e.g. "92 days (13w 1d) selected"
- 🔄 **Go to Today** quick-jump button
- 🪟 Opens as a proper **Power BI modal dialog** (outside the visual iframe)
- ✅ Filters **all visuals** on the page via Power BI AdvancedFilter API
- 🏭 Battle-tested at **Nestlé Agbara Factory Plant 1478, Nigeria**

## 🚀 Quick Start

1. Download the `.pbiviz` file from [Releases](../../releases)
2. In Power BI Desktop: **Visualizations → ⋯ → Import visual from file**
3. Add the visual to your report canvas (~200×40px)
4. Drag a **Date** column into the **Date Field** bucket
5. Click the pill button → select your date range → **✓ Apply Filter**

## 🔨 Build from Source

```bash
npm install
npx pbiviz package
```

Output: `dist/DateWhispererGP1478NGAGB.1.0.0.0.pbiviz`

## 🏆 AppSource Certification

This visual passes all Microsoft certification requirements:

| Check | Status |
|---|---|
| No innerHTML / outerHTML | ✅ Pass |
| No eval / fetch / XMLHttpRequest | ✅ Pass |
| No external HTTP requests | ✅ Pass |
| Rendering Events API | ✅ Pass |
| npm audit (production) | ✅ 0 vulnerabilities |
| Required files | ✅ All present |

```bash
npm audit --omit=dev           # 0 vulnerabilities
npx pbiviz package --certification-audit  # No external requests found
```

## 📁 Project Structure

```
├── src/
│   ├── visual.ts           # Main visual class + pill UI
│   ├── datePickerDialog.ts # Modal dialog with dual calendar
│   ├── htmlTemplates.ts    # Theme definitions + preset categories
│   ├── dataModel.ts        # Date range computation (40+ presets)
│   ├── settings.ts         # Format pane settings model
│   └── domUtils.ts         # Safe DOM manipulation (cert compliant)
├── style/
│   └── visual.less         # Pill button styles
├── assets/
│   └── icon.png            # Visual panel icon
├── capabilities.json
├── pbiviz.json
└── package.json
```

## 👤 Author

**Gprocessor** (Olawale Jamiu Ayomide)  
Digital Solutions Professional — Nestlé Agbara Factory, Nigeria  
📧 olawalejamiuayomide@gmail.com  
🐙 [@Gprocessor](https://github.com/Gprocessor)

## 📄 License

[MIT](LICENSE) — free for personal and commercial use
