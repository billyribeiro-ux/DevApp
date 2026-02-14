# CSS Investigation Report

## Files Examined
- `/src/routes/+page.svelte` (Dashboard)
- `/src/routes/reminders/+page.svelte`
- `/src/routes/prompts/+page.svelte`
- `/src/routes/snippets/+page.svelte`
- `/src/routes/notes/+page.svelte`
- `/src/app.css` (Global styles)
- `/src/routes/+layout.svelte` (Layout wrapper)

## Key Findings

### 1. **Inconsistent Header Heights**
- **Dashboard**: `px-8 py-5` → ~52px total height
- **Reminders**: `px-8 py-5` → ~52px total height  
- **Prompts**: `px-8 py-5` → ~52px total height
- **Snippets**: `px-8 py-5` → ~52px total height
- **Notes**: `px-8 py-5` → ~52px total height
- **Layout sidebar header**: Fixed `height: 64px`

**Issue**: Headers are consistent across routes but don't match sidebar header (64px vs ~52px)

### 2. **Font Size Inconsistencies**
- **Dashboard h1**: `text-[24px]`
- **Other routes h1**: `text-[22px]`
- **Sidebar brand**: `text-lg` (18px)

### 3. **Padding Variations**
- **Dashboard content**: `px-8 py-6`
- **Other routes content**: `px-8 py-6`
- **Global CSS variable**: `--content-padding: 32px` (not used consistently)

### 4. **Button Styling Conflicts**
All pages have inline hover styles in `<style>` blocks:
```css
button:not(.btn-primary):not(.btn-secondary):not(.btn-ghost):hover { 
  background: var(--bg-card-hover); 
}
```

**Layout also has**:
```css
button:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}
```

**Conflict**: Layout button hover applies to ALL buttons, overriding page-specific styles.

### 5. **Border Radius Inconsistencies**
- Cards use: `rounded-2xl` (24px via Tailwind)
- Global CSS defines: `--radius-2xl: 24px`
- Buttons use: `rounded-xl` (20px via Tailwind)
- Input fields use: `var(--radius-md)` (10px)

### 6. **Icon Size Variations**
- Dashboard quick actions: `width={24} height={24}`
- Dashboard stats: `width={20} height={20}`
- Sidebar nav: `width={22} height={22}`
- Page headers: `width={24} height={24}`
- Action buttons: `width={16} height={16}`, `width={18} height={18}`, `width={14} height={14}`

**No consistent sizing system**

### 7. **Spacing System Issues**
- Mix of Tailwind classes (`px-8`, `py-5`, `gap-3`) and CSS variables
- CSS variables defined but not consistently used:
  - `--content-padding: 32px` (rarely used)
  - `--content-padding-lg: 40px` (never used)
  - `--section-gap: 40px` (never used)

### 8. **Text Color Inconsistencies**
All use inline styles like:
```html
style="color: var(--text-primary);"
```
Instead of utility classes, causing verbose markup.

## Root Causes

1. **No enforced design tokens** - CSS variables exist but aren't enforced
2. **Inline styles everywhere** - Makes it hard to track what's applied
3. **Tailwind + CSS variables mixed** - Two systems competing
4. **Layout CSS overrides page styles** - Global button hover in layout
5. **No component library** - Each page reimplements similar patterns
6. **Arbitrary values** - `text-[22px]`, `text-[24px]` instead of scale

## Recommended Fixes

### Priority 1: Remove Layout Button Override
The `button:hover` rule in `+layout.svelte` is too broad and conflicts with page-specific styles.

### Priority 2: Standardize Header Heights
Either use `py-5` everywhere or define a consistent header height variable.

### Priority 3: Create Consistent Spacing Scale
Use Tailwind's spacing or stick to CSS variables, not both.

### Priority 4: Icon Size System
Define 3-4 icon sizes: `sm` (14px), `md` (18px), `lg` (24px), `xl` (32px)

### Priority 5: Typography Scale
Replace arbitrary values with a proper type scale.
