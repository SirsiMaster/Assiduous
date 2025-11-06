# Universal Component System (UCS) Templates
## Assiduous Admin Portal Design Patterns

**Version:** 1.0  
**Date:** November 6, 2025  
**Status:** Production Ready

---

## Overview

This document captures the design patterns, components, and layouts established during the comprehensive admin portal redesign. All 20 admin pages now follow these consistent patterns, making them exportable as UCS templates for future projects.

---

## Table of Contents

1. [Design System](#design-system)
2. [Page Structure](#page-structure)
3. [Component Patterns](#component-patterns)
4. [Layout Patterns](#layout-patterns)
5. [Interactive Elements](#interactive-elements)
6. [Data Visualization](#data-visualization)
7. [Implementation Examples](#implementation-examples)

---

## Design System

### Color Palette

```css
/* Primary Colors */
--sky: #60A3D9;        /* Primary brand color */
--navy: #0B1F41;       /* Secondary brand color */

/* Semantic Colors */
--success: #059669;    /* Positive actions/states */
--warning: #D97706;    /* Warning states */
--danger: #DC2626;     /* Destructive actions */

/* Neutrals */
--white: #FFFFFF;
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--border: #E5E7EB;
--text-primary: #1F2937;
--text-secondary: #6B7280;

/* Gradients */
--gradient: linear-gradient(135deg, #60A3D9, #0B1F41);
```

### Typography

```css
/* Font Family */
font-family: "Geist Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;

/* Type Scale */
--text-xs: 11px;       /* Labels, meta */
--text-sm: 12px;       /* Secondary text */
--text-base: 14px;     /* Body text */
--text-lg: 16px;       /* Section titles */
--text-xl: 20px;       /* Page sections */
--text-2xl: 24px;      /* Page titles */

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Spacing

```css
/* Spacing Scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 48px;
```

### Border Radius

```css
--radius: 6px;         /* Default */
--radius-md: 8px;      /* Cards */
--radius-lg: 12px;     /* Large containers */
--radius-full: 9999px; /* Badges, pills */
```

---

## Page Structure

### Standard Admin Page Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Page Title - Assiduous Admin</title>
    
    <!-- Design System -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="../assiduous.css">
    <link rel="stylesheet" href="../components/admin-layout.css">
    <link rel="stylesheet" href="/assets/css/button-override.css">
    
    <style>
        /* Page-specific styles only */
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <!-- Sidebar Component -->
        <div id="sidebar-root" data-active="page-key"></div>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <div id="header-root"></div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Page content here -->
            </div>
        </main>
    </div>

    <!-- Components -->
    <script src="../components/sidebar.js"></script>
    <script src="../components/admin-header.js"></script>
</body>
</html>
```

### Key Structure Elements

**1. Admin Wrapper**
```css
.admin-wrapper {
    display: flex;
    height: 100vh;
}
```

**2. Sidebar Component** (240px fixed width)
```html
<div id="sidebar-root" data-active="page-key"></div>
```

**3. Main Content** (flex: 1, vertical layout)
```css
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
```

**4. Page Content** (scrollable area)
```css
.page-content {
    flex: 1;
    padding: var(--space-xl);
    overflow-y: auto;
    background: var(--gray-50);
}
```

---

## Component Patterns

### 1. Page Header

**Purpose:** Consistent page identification with title and description

```html
<div class="page-header">
    <h1 class="page-title">Page Title</h1>
    <p class="page-description">Brief description of page purpose and functionality</p>
</div>
```

```css
.page-header {
    margin-bottom: var(--space-xl);
}

.page-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--navy);
    margin-bottom: var(--space-xs);
}

.page-description {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: 1.5;
}
```

### 2. Section Header

**Purpose:** Clear visual hierarchy for page sections (NEW - Analytics pattern)

```html
<div class="section-header">
    <h2 class="section-title">Section Title</h2>
    <p class="section-subtitle">Description of what this section contains</p>
</div>
```

```css
.section-header {
    margin-bottom: var(--space-lg);
}

.section-title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--navy);
    margin-bottom: var(--space-xs);
}

.section-subtitle {
    font-size: var(--text-base);
    color: var(--text-secondary);
}
```

### 3. KPI/Stats Cards

**Purpose:** Display key metrics at a glance

**Design Improvement:** Fixed width for consistency (200-280px per card)

```html
<div class="stats-grid">
    <div class="kpi-card">
        <div class="kpi-label">Metric Name</div>
        <div class="kpi-value">$485,000</div>
        <div class="kpi-change positive">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            +8.2% vs last quarter
        </div>
    </div>
    <!-- Repeat for other metrics -->
</div>
```

```css
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(200px, 280px));
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);
}

.kpi-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    transition: all 0.2s;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.kpi-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-xs);
}

.kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: var(--space-sm);
}

.kpi-change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-sm);
    font-weight: 500;
}

.kpi-change.positive {
    color: var(--success);
}

.kpi-change.negative {
    color: var(--danger);
}
```

### 4. Buttons (Line-Art Style)

**Design Improvement:** Replaced purple gradients with clean line-art style

```html
<!-- Default Button -->
<button class="btn">Default</button>

<!-- Primary Button -->
<button class="btn btn-primary">Primary</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary</button>

<!-- Danger Button -->
<button class="btn btn-danger">Delete</button>
```

```css
.btn {
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius);
    font-size: var(--text-base);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
}

/* Default/Secondary - Line-art style */
.btn, .btn-secondary {
    background: transparent;
    border-color: var(--sky);
    color: var(--sky);
}

.btn:hover, .btn-secondary:hover {
    background: rgba(96, 163, 217, 0.08);
    border-color: var(--navy);
    color: var(--navy);
}

/* Primary - Filled */
.btn-primary {
    background: var(--sky);
    border-color: var(--sky);
    color: white;
}

.btn-primary:hover {
    background: var(--navy);
    border-color: var(--navy);
}

/* Danger */
.btn-danger {
    background: transparent;
    border-color: var(--danger);
    color: var(--danger);
}

.btn-danger:hover {
    background: var(--danger);
    color: white;
}
```

### 5. Data Tables

```html
<div class="data-table">
    <div class="table-header">
        <h3 class="table-title">Table Title</h3>
        <div class="table-actions">
            <!-- Optional actions -->
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Column 1</th>
                <th>Column 2</th>
                <th>Column 3</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td>Data 3</td>
            </tr>
        </tbody>
    </table>
</div>
```

```css
.data-table {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-bottom: var(--space-xl);
}

.table-header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--navy);
}

table {
    width: 100%;
    border-collapse: collapse;
}

th {
    padding: var(--space-sm) var(--space-lg);
    text-align: left;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--gray-50);
    border-bottom: 1px solid var(--border);
}

td {
    padding: var(--space-md) var(--space-lg);
    font-size: var(--text-base);
    color: var(--text-primary);
    border-bottom: 1px solid var(--gray-100);
}

tr:last-child td {
    border-bottom: none;
}

tr:hover {
    background: var(--gray-50);
}
```

---

## Layout Patterns

### 1. Two-Column Layout

**Purpose:** Side-by-side content sections

```html
<div class="two-column-layout">
    <div class="column-left">
        <!-- Left content -->
    </div>
    <div class="column-right">
        <!-- Right content -->
    </div>
</div>
```

```css
.two-column-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xl);
    margin-bottom: var(--space-xl);
}

@media (max-width: 1024px) {
    .two-column-layout {
        grid-template-columns: 1fr;
    }
}
```

### 2. Chart Container (NEW - Analytics pattern)

**Design Improvement:** Consistent chart styling with headers

```html
<div class="chart-container">
    <div class="chart-header">
        <div class="chart-title">Chart Title</div>
        <select class="form-select" style="width: auto;">
            <option>Last 12 Months</option>
            <option>Last 6 Months</option>
        </select>
    </div>
    <canvas id="chartId" height="80"></canvas>
</div>
```

```css
.chart-container {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    margin-bottom: var(--space-xl);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);
}

.chart-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--navy);
}
```

### 3. Responsive Grid

```css
/* 4-column grid (stats, properties) */
.grid-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(200px, 280px));
    gap: var(--space-lg);
}

/* 3-column grid */
.grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-lg);
}

/* Auto-fit grid */
.grid-auto {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-lg);
}

/* Responsive breakpoints */
@media (max-width: 1200px) {
    .grid-4 {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .grid-4, .grid-3 {
        grid-template-columns: 1fr;
    }
}
```

---

## Interactive Elements

### 1. Form Elements

```css
.form-input, .form-select {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: var(--text-base);
    transition: all 0.2s;
    width: 100%;
}

.form-input:focus, .form-select:focus {
    outline: none;
    border-color: var(--sky);
    box-shadow: 0 0 0 3px rgba(96, 163, 217, 0.1);
}

.form-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-xs);
}
```

### 2. Badges/Status Indicators

```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-danger">Inactive</span>
```

```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.badge-success {
    background: #D1FAE5;
    color: #065F46;
}

.badge-warning {
    background: #FEF3C7;
    color: #92400E;
}

.badge-danger {
    background: #FEE2E2;
    color: #991B1B;
}
```

---

## Data Visualization

### Chart.js Integration (NEW - Analytics pattern)

**Design Improvement:** Consistent chart styling with Assiduous colors

```javascript
// Standard Chart Configuration
const chartConfig = {
    type: 'line', // or 'bar', 'doughnut', etc.
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Dataset Name',
            data: [12, 19, 3, 5, 2, 3],
            borderColor: '#60A3D9',           // Sky
            backgroundColor: 'rgba(96, 163, 217, 0.1)',
            tension: 0.4,                      // Smooth curves
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false  // Or customize
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    }
};
```

---

## Implementation Examples

### Complete Analytics Page Pattern

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Analytics - Assiduous Admin</title>
    <link rel="stylesheet" href="../assiduous.css">
    <link rel="stylesheet" href="../components/admin-layout.css">
    <link rel="stylesheet" href="/assets/css/button-override.css">
</head>
<body>
    <div class="admin-wrapper">
        <div id="sidebar-root" data-active="analytics"></div>

        <main class="main-content">
            <div id="header-root"></div>

            <div class="page-content">
                <!-- Page Header -->
                <div class="page-header">
                    <h1 class="page-title">Realty Analytics</h1>
                    <p class="page-description">
                        Comprehensive real estate metrics and performance insights
                    </p>
                </div>

                <!-- Section 1: Overview Stats -->
                <div class="section-header">
                    <h2 class="section-title">Sales Overview</h2>
                    <p class="section-subtitle">Year-to-date performance metrics</p>
                </div>

                <div class="stats-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">Total Sales</div>
                        <div class="kpi-value">$48.6M</div>
                        <div class="kpi-change positive">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                            +15.3% YoY
                        </div>
                    </div>
                    <!-- More KPI cards -->
                </div>

                <!-- Section 2: Chart -->
                <div class="section-header">
                    <h2 class="section-title">Sales Trends</h2>
                    <p class="section-subtitle">Monthly sales volume over the past year</p>
                </div>

                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title">Monthly Sales Volume</div>
                        <select class="form-select" style="width: auto;">
                            <option>Last 12 Months</option>
                            <option>Last 6 Months</option>
                        </select>
                    </div>
                    <canvas id="salesChart" height="80"></canvas>
                </div>

                <!-- Section 3: Data Table -->
                <div class="section-header">
                    <h2 class="section-title">Top Performing Agents</h2>
                    <p class="section-subtitle">Ranked by sales volume and transaction count</p>
                </div>

                <div class="data-table">
                    <div class="table-header">
                        <h3 class="table-title">Agent Performance</h3>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Agent</th>
                                <th>Sales</th>
                                <th>Transactions</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>John Doe</td>
                                <td>$2.4M</td>
                                <td>12</td>
                                <td><span class="badge badge-success">Active</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="../components/sidebar.js"></script>
    <script src="../components/admin-header.js"></script>
    
    <script>
        // Initialize chart
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, chartConfig);
    </script>
</body>
</html>
```

---

## Migration Checklist

When converting an existing page to UCS pattern:

- [ ] Remove embedded `<aside class="sidebar">` HTML
- [ ] Replace with `<div id="sidebar-root" data-active="key"></div>`
- [ ] Replace `<header id="universal-header-root">` with `<div id="header-root"></div>`
- [ ] Remove duplicate layout CSS (use admin-layout.css)
- [ ] Update button styles to line-art pattern
- [ ] Fix stat card widths (200-280px)
- [ ] Add section headers with descriptions
- [ ] Include component scripts at bottom
- [ ] Test all functionality preserved

---

## Design Principles

1. **Consistency**: All pages follow the same structure and styling
2. **Clarity**: Clear visual hierarchy with section headers
3. **Constraint**: Fixed-width stat cards prevent layout sprawl
4. **Cleanliness**: Line-art button style, no heavy gradients
5. **Component-Based**: Sidebar and header are reusable components
6. **Responsive**: Mobile-first approach with breakpoints
7. **Accessible**: Semantic HTML, proper ARIA labels
8. **Performance**: Minimal CSS, component lazy-loading

---

## Version History

- **v1.0** (Nov 6, 2025) - Initial UCS documentation based on 20-page admin portal redesign
  - Analytics page complete rebuild pattern
  - Market page complete rebuild pattern
  - Line-art button system
  - Fixed-width stat cards (200-280px)
  - Section header pattern
  - Component-based architecture

---

## Export Instructions

To use these patterns in a new project:

1. Copy `assiduous.css` (design tokens)
2. Copy `admin-layout.css` (base layout)
3. Copy `button-override.css` (button system)
4. Copy `components/sidebar.js` and `components/admin-header.js`
5. Use page template as starting point
6. Follow component patterns documented above

---

**Document maintained by:** Assiduous Development Team  
**Last updated:** November 6, 2025  
**Repository:** https://github.com/SirsiMaster/Assiduous
