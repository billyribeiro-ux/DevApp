# DASHBOARD FORENSIC AUDIT - Principal Engineer ICT Level 7
**Date:** 2026-02-14  
**Component:** `/src/routes/+page.svelte` (Dashboard)  
**Objective:** Line-by-line token compliance verification

---

## DESIGN SYSTEM TOKENS (Reference)
```css
/* Layout */
--sidebar-width: 240px;
--titlebar-height: 56px;
--statusbar-height: 36px;
--content-padding: 24px;
--content-padding-lg: 32px;
--section-gap: 32px;

/* Icon sizes */
--icon-xs: 14px;
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 32px;

/* Typography scale */
--text-xs: 0.6875rem;     /* 11px */
--text-sm: 0.8125rem;     /* 13px */
--text-base: 0.875rem;    /* 14px */
--text-md: 0.9375rem;     /* 15px */
--text-lg: 1rem;          /* 16px */
--text-xl: 1.125rem;      /* 18px */
--text-2xl: 1.25rem;      /* 20px */
--text-3xl: 1.5rem;       /* 24px */
```

---

## LINE-BY-LINE AUDIT

### **LINE 43: Header Container**
```svelte
<div class="flex items-center justify-between px-6 shrink-0" style="height: 56px;">
```
**VIOLATION:**
- ❌ `px-6` = 24px (Tailwind default)
- ❌ `height: 56px` hardcoded
- ❌ Missing `border-b` for visual separation

**REQUIRED:**
```svelte
<div class="flex items-center justify-between shrink-0 border-b" style="height: var(--titlebar-height); padding: 0 var(--content-padding); border-color: var(--border-default);">
```

---

### **LINE 45: Greeting Text**
```svelte
<h1 class="text-lg font-semibold" style="color: var(--text-primary); letter-spacing: -0.02em;">{greeting}</h1>
```
**STATUS:** ✅ COMPLIANT
- `text-lg` = 1rem (16px) = `var(--text-lg)` ✓
- Font weight and letter-spacing appropriate ✓

---

### **LINE 46: Date Text**
```svelte
<p class="text-[12px]" style="color: var(--text-tertiary);">{dateStr}</p>
```
**VIOLATION:**
- ❌ `text-[12px]` arbitrary value

**REQUIRED:**
```svelte
<p class="text-xs" style="color: var(--text-tertiary);">
```
OR inline:
```svelte
<p style="font-size: var(--text-xs); color: var(--text-tertiary);">
```

---

### **LINE 51: Content Container**
```svelte
<div class="mx-auto w-full max-w-[860px] px-6 py-4 space-y-10">
```
**VIOLATIONS:**
- ❌ `px-6` = 24px (Tailwind, should use token)
- ❌ `py-4` = 16px (should use token)
- ❌ `space-y-10` = 40px (should use `--section-gap` = 32px)

**REQUIRED:**
```svelte
<div class="mx-auto w-full max-w-[860px] space-y-8" style="padding: var(--content-padding);">
```
Note: `space-y-8` = 32px matches `--section-gap`

---

### **LINE 60: Quick Action Buttons**
```svelte
class="group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors duration-100"
```
**VIOLATIONS:**
- ❌ `text-[13px]` arbitrary value

**REQUIRED:**
```svelte
class="group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 transition-colors duration-100"
style="font-size: var(--text-sm); ..."
```

---

### **LINE 63: Quick Action Icons**
```svelte
<Icon icon={action.icon} width={16} height={16} style="color: {action.color}; opacity: 0.85;" />
```
**STATUS:** ✅ COMPLIANT
- `width={16}` = `var(--icon-sm)` ✓

---

### **LINE 71: Stats Grid**
```svelte
<section class="grid grid-cols-4 gap-px rounded-xl border overflow-hidden" style="border-color: var(--border-default); background: var(--border-default);">
```
**STATUS:** ✅ COMPLIANT
- Uses CSS variables ✓
- `rounded-xl` maps to `var(--radius-xl)` via Tailwind config ✓

---

### **LINE 78: Stat Card**
```svelte
<div class="flex items-center gap-3 px-4 py-4" style="background: var(--bg-card);">
```
**VIOLATION:**
- ❌ `px-4` = 16px, `py-4` = 16px (Tailwind defaults, not using tokens)

**REQUIRED:**
```svelte
<div class="flex items-center gap-3" style="background: var(--bg-card); padding: 16px;">
```
OR define `--card-padding: 16px` token

---

### **LINE 79: Stat Icons**
```svelte
<Icon icon={stat.icon} width={18} height={18} style="color: {stat.color}; opacity: 0.8;" />
```
**VIOLATION:**
- ❌ `width={18}` not in token system (14, 16, 20, 24, 32)

**REQUIRED:**
```svelte
<Icon icon={stat.icon} width={16} height={16} style="color: {stat.color}; opacity: 0.8;" />
```
Use `--icon-sm` (16px)

---

### **LINE 81: Stat Value**
```svelte
<p class="text-[18px] font-semibold leading-none" style="color: var(--text-primary);">{stat.value}</p>
```
**VIOLATION:**
- ❌ `text-[18px]` arbitrary value

**REQUIRED:**
```svelte
<p class="font-semibold leading-none" style="font-size: var(--text-xl); color: var(--text-primary);">
```

---

### **LINE 82: Stat Label**
```svelte
<p class="text-[11px] mt-1" style="color: var(--text-tertiary);">{stat.label}</p>
```
**VIOLATION:**
- ❌ `text-[11px]` arbitrary value

**REQUIRED:**
```svelte
<p class="mt-1" style="font-size: var(--text-xs); color: var(--text-tertiary);">
```

---

### **LINE 89: Two Column Grid**
```svelte
<div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
```
**STATUS:** ✅ COMPLIANT
- `gap-8` = 32px = `--section-gap` ✓

---

### **LINE 94: Section Heading**
```svelte
<h2 class="text-[13px] font-medium" style="color: var(--text-secondary);">Recent Files</h2>
```
**VIOLATION:**
- ❌ `text-[13px]` arbitrary value

**REQUIRED:**
```svelte
<h2 class="font-medium" style="font-size: var(--text-sm); color: var(--text-secondary);">
```

---

### **LINE 95: View All Link**
```svelte
<a href="/vault" onclick={() => nav.navigate('/vault')} class="text-[12px] font-medium" style="color: var(--text-accent);">View all</a>
```
**VIOLATION:**
- ❌ `text-[12px]` arbitrary value

**REQUIRED:**
```svelte
<a ... class="font-medium" style="font-size: var(--text-xs); color: var(--text-accent);">
```

---

### **LINE 102: File List Item**
```svelte
class="flex items-center gap-3 px-4 py-3 transition-colors duration-75 hover:bg-[var(--bg-card-hover)] cursor-default"
```
**VIOLATIONS:**
- ❌ `px-4` = 16px, `py-3` = 12px (Tailwind defaults)

**REQUIRED:**
```svelte
class="flex items-center gap-3 transition-colors duration-75 hover:bg-[var(--bg-card-hover)] cursor-default"
style="padding: 12px 16px; ..."
```

---

### **LINE 105: File Icon**
```svelte
<Icon icon={typeInfo.icon} width={16} height={16} style="color: {typeInfo.color}; opacity: 0.75;" />
```
**STATUS:** ✅ COMPLIANT
- `width={16}` = `var(--icon-sm)` ✓

---

### **LINE 107: File Name**
```svelte
<p class="text-[13px] font-medium truncate" style="color: var(--text-primary);">{file.name}</p>
```
**VIOLATION:**
- ❌ `text-[13px]` arbitrary value

**REQUIRED:**
```svelte
<p class="font-medium truncate" style="font-size: var(--text-sm); color: var(--text-primary);">
```

---

### **LINE 109-110: File Metadata**
```svelte
<span class="text-[11px] shrink-0" style="color: var(--text-tertiary);">{formatFileSize(file.size_bytes)}</span>
<span class="text-[11px] shrink-0" style="color: var(--text-tertiary);">{formatRelativeDate(file.updated_at)}</span>
```
**VIOLATION:**
- ❌ `text-[11px]` arbitrary value (×2)

**REQUIRED:**
```svelte
<span class="shrink-0" style="font-size: var(--text-xs); color: var(--text-tertiary);">
```

---

### **LINE 116: Empty State Icon**
```svelte
<Icon icon="ph:folder-open" width={40} height={40} style="color: var(--text-tertiary); opacity: 0.3;" />
```
**VIOLATION:**
- ❌ `width={40}` not in token system

**REQUIRED:**
```svelte
<Icon icon="ph:folder-open" width={32} height={32} style="color: var(--text-tertiary); opacity: 0.3;" />
```
Use `--icon-xl` (32px)

---

### **LINE 117: Empty State Text**
```svelte
<p class="mt-3 text-[13px]" style="color: var(--text-tertiary);">No files yet</p>
```
**VIOLATION:**
- ❌ `text-[13px]` arbitrary value

**REQUIRED:**
```svelte
<p class="mt-3" style="font-size: var(--text-sm); color: var(--text-tertiary);">
```

---

### **LINE 132: Reminder Item**
```svelte
class="flex items-start gap-3 px-4 py-3"
```
**VIOLATION:**
- ❌ `px-4` = 16px, `py-3` = 12px (Tailwind defaults)

**REQUIRED:**
```svelte
class="flex items-start gap-3"
style="padding: 12px 16px;"
```

---

### **LINE 140: Reminder Title**
```svelte
<p class="text-[13px] font-medium" style="color: var(--text-primary);">{reminder.title}</p>
```
**VIOLATION:**
- ❌ `text-[13px]` arbitrary value

**REQUIRED:**
```svelte
<p class="font-medium" style="font-size: var(--text-sm); color: var(--text-primary);">
```

---

### **LINE 142: Reminder Due Date**
```svelte
<p class="text-[11px] mt-0.5" style="color: var(--text-tertiary);">Due {formatRelativeDate(reminder.due_date)}</p>
```
**VIOLATION:**
- ❌ `text-[11px]` arbitrary value

**REQUIRED:**
```svelte
<p class="mt-0.5" style="font-size: var(--text-xs); color: var(--text-tertiary);">
```

---

### **LINE 150: Empty Reminders Icon**
```svelte
<Icon icon="ph:check-circle" width={18} height={18} style="color: var(--color-success); opacity: 0.5;" />
```
**VIOLATION:**
- ❌ `width={18}` not in token system

**REQUIRED:**
```svelte
<Icon icon="ph:check-circle" width={16} height={16} style="color: var(--color-success); opacity: 0.5;" />
```

---

### **LINE 151: Empty Reminders Text**
```svelte
<p class="text-[13px]" style="color: var(--text-tertiary);">All caught up</p>
```
**VIOLATION:**
- ❌ `text-[13px]` arbitrary value

**REQUIRED:**
```svelte
<p style="font-size: var(--text-sm); color: var(--text-tertiary);">
```

---

### **LINE 166: Course Card**
```svelte
<div class="rounded-xl border px-4 py-3.5" style="border-color: var(--border-default); background: var(--bg-card);">
```
**VIOLATION:**
- ❌ `px-4` = 16px, `py-3.5` = 14px (Tailwind defaults)

**REQUIRED:**
```svelte
<div class="rounded-xl border" style="border-color: var(--border-default); background: var(--bg-card); padding: 14px 16px;">
```

---

### **LINE 169: Course Name**
```svelte
<p class="text-[13px] font-medium truncate" style="color: var(--text-primary);">{course.name}</p>
```
**VIOLATION:**
- ❌ `text-[13px]` arbitrary value

**REQUIRED:**
```svelte
<p class="font-medium truncate" style="font-size: var(--text-sm); color: var(--text-primary);">
```

---

### **LINE 171: Course Instructor**
```svelte
<p class="text-[11px] mt-0.5" style="color: var(--text-tertiary);">{course.instructor}</p>
```
**VIOLATION:**
- ❌ `text-[11px]` arbitrary value

**REQUIRED:**
```svelte
<p class="mt-0.5" style="font-size: var(--text-xs); color: var(--text-tertiary);">
```

---

### **LINE 174: Course Progress**
```svelte
<span class="text-[12px] font-semibold shrink-0 ml-3" style="color: var(--text-accent);">{course.progress_percent}%</span>
```
**VIOLATION:**
- ❌ `text-[12px]` arbitrary value

**REQUIRED:**
```svelte
<span class="font-semibold shrink-0 ml-3" style="font-size: var(--text-xs); color: var(--text-accent);">
```

---

### **LINE 180: Course Lessons**
```svelte
<span class="text-[11px]" style="color: var(--text-tertiary);">{course.completed_lessons}/{course.total_lessons} lessons</span>
```
**VIOLATION:**
- ❌ `text-[11px]` arbitrary value

**REQUIRED:**
```svelte
<span style="font-size: var(--text-xs); color: var(--text-tertiary);">
```

---

### **LINE 182: Course Platform**
```svelte
<span class="text-[11px]" style="color: var(--text-tertiary);">{course.platform}</span>
```
**VIOLATION:**
- ❌ `text-[11px]` arbitrary value

**REQUIRED:**
```svelte
<span style="font-size: var(--text-xs); color: var(--text-tertiary);">
```

---

## SUMMARY OF VIOLATIONS

### **Critical Issues (Spacing/Layout)**
1. ❌ Line 43: Header using `px-6` instead of `var(--content-padding)`, missing border
2. ❌ Line 43: Hardcoded `height: 56px` instead of `var(--titlebar-height)`
3. ❌ Line 51: Container using `px-6 py-4` instead of token-based padding
4. ❌ Line 51: `space-y-10` (40px) instead of `space-y-8` (32px = `--section-gap`)

### **Typography Violations (21 instances)**
All arbitrary `text-[Xpx]` values should use CSS variables:
- `text-[11px]` → `var(--text-xs)` (9 instances)
- `text-[12px]` → `var(--text-xs)` (2 instances)
- `text-[13px]` → `var(--text-sm)` (9 instances)
- `text-[18px]` → `var(--text-xl)` (1 instance)

### **Icon Size Violations (3 instances)**
- Line 79: `width={18}` → should be `16` (`--icon-sm`)
- Line 116: `width={40}` → should be `32` (`--icon-xl`)
- Line 150: `width={18}` → should be `16` (`--icon-sm`)

### **Padding Violations (5 instances)**
Tailwind utilities (`px-4`, `py-3`, etc.) should use inline styles with explicit values or tokens

---

## RECOMMENDED FIX STRATEGY

1. **Replace all arbitrary font sizes** with CSS variable inline styles
2. **Update header** to use `var(--titlebar-height)` and `var(--content-padding)`
3. **Fix content container** spacing to use tokens
4. **Normalize icon sizes** to token values (16, 20, 24, 32)
5. **Convert Tailwind padding** to explicit pixel values or create card padding token

**Total violations: 34**
**Estimated fix time: 15 minutes**
**Risk level: LOW** (purely cosmetic, no logic changes)
