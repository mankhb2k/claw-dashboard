# Design System Migration: Frontend → Control-UI

## Overview

Control-UI sử dụng design system khác biệt đáng kể so với frontend hiện tại. Để match style giao diện, cần update:

1. **Color Tokens** — từ purple (#7c6af7) sang red (#ff5c5c)
2. **Spacing & Radius** — tiêu chuẩn khác (control-ui dùng px thay vì `--space-*`)
3. **Typography** — font và sizes khác
4. **Animations & Transitions** — cubic-bezier khác, duration khác
5. **Component Patterns** — naming convention khác (cfg-*, config-*)

---

## Design Token Comparison

### Colors

**Frontend (Current)**:
```css
--color-primary: #7c6af7        /* Purple */
--color-primary-hover: #9585f8
--color-danger: #ef4444
--color-success: #22c55e
--color-bg: #0f0f0f
--color-text: #e8e8e8
--color-border: #2a2a2a
```

**Control-UI (Target)**:
```css
--accent: #ff5c5c              /* Red - primary brand */
--accent-hover: #ff7070
--bg: #0e1015                  /* Slightly different dark */
--text: #d4d4d8                /* Slightly different light */
--border: #1e2028              /* Whisper-thin borders */
--ok: #22c55e                  /* Same green for success */
--danger: #ef4444              /* Same red for errors */
```

**Key Changes**:
- Primary color: Purple (#7c6af7) → Red (#ff5c5c)
- Accent naming: `--color-primary` → `--accent`
- Borders: More subtle (#1e2028 vs #2a2a2a)
- Text: More muted (#d4d4d8 vs #e8e8e8)

---

### Spacing & Radius

**Frontend (Current)**:
```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
```

**Control-UI (Target)**:
```css
/* Control-UI uses explicit px values in components, not space system */
/* Example from components */
padding: 8px 12px;
padding: 10px 14px;
border-radius: 10px;    /* Default radius-md */
border-radius: 14px;    /* radius-lg */
border-radius: 20px;    /* radius-xl */

/* But defines as: */
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--radius-xl: 20px
```

**Key Changes**:
- `--radius-md`: 8px → 10px (slightly rounder)
- `--radius-lg`: 12px → 14px
- Introduce `--radius-xl: 20px` (new)
- Slightly larger/rounder aesthetic

---

### Typography

**Frontend (Current)**:
```css
--font-size-xs: 11px
--font-size-sm: 13px
--font-size-base: 15px
--font-size-lg: 18px
```

**Control-UI (Target)**:
```css
/* Explicit in components */
font-size: 11px;    /* smaller labels */
font-size: 12px;    /* field labels */
font-size: 12.5px;  /* body text in forms */
font-size: 13px;    /* body text */
font-size: 14px;    /* regular */
font-size: 15px;    /* larger text */
```

**Key Changes**:
- More granular font sizes (12.5px, 12px common)
- Control-UI is slightly more conservative with sizes
- Fonts: Both use Inter/system sans-serif

---

### Transitions & Animations

**Frontend (Current)**:
```css
--transition-fast: ???  /* Not defined */
```

**Control-UI (Target)**:
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)        /* Default */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) /* Bouncy */

--duration-fast: 100ms
--duration-normal: 180ms
--duration-slow: 300ms

/* Common pattern */
transition: property var(--duration-fast) ease;
transition: property var(--duration-normal) var(--ease-out);
```

**Key Changes**:
- Defined easing functions (frontend doesn't have these)
- 100ms for fast, 180ms for normal (vs no standard)
- More sophisticated animations

---

### Focus Ring & Shadows

**Frontend (Current)**:
```css
.btn:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary);
}
```

**Control-UI (Target)**:
```css
--focus-ring: 0 0 0 2px var(--bg), 0 0 0 3px color-mix(in srgb, var(--ring) 80%, transparent);
--focus-glow: 0 0 0 2px var(--bg), 0 0 0 3px var(--ring), 0 0 16px var(--accent-glow);

/* Layered, sophisticated */
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

**Key Changes**:
- Double-ring focus (background + accent)
- Semi-transparent outer ring (80% opacity)
- Optional glow effect
- Much more polished

---

### Shadows

**Frontend (Current)**:
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
```

**Control-UI (Target)**:
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 24px 48px rgba(0, 0, 0, 0.5);
```

**Key Changes**:
- Softer shadows (lower opacity)
- More layers (sm, md, lg, xl)
- Slightly larger blur radius

---

## Component Pattern Differences

### Button Style

**Frontend Current**:
```typescript
export function Button({
  variant = 'primary',
  size = 'md',
  ...
})
```

**Control-UI Pattern**:
```css
/* Named like: .cfg-button, .config-btn */
/* Uses segmented controls, toggle buttons more */
.cfg-segmented__btn {
  padding: 6px 14px;
  border-radius: calc(var(--radius-md) - 3px);
  background: var(--accent);  /* Direct accent color */
  color: white;
  font-weight: 500;
}
```

**Observations**:
- Control-UI uses more segmented controls
- Simpler variants
- Padding is more generous (6px 14px)

### Form Fields

**Frontend Current**:
```typescript
<Input label="Email" error={errors.email?.message} />
```

**Control-UI Pattern**:
```css
.cfg-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-accent);
  font-size: 13px;
  outline: none;
  transition:
    border-color var(--duration-fast) ease,
    box-shadow var(--duration-fast) ease,
    background var(--duration-fast) ease;
}

.cfg-input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
  background: var(--bg-hover);
}
```

**Key Differences**:
- Control-UI uses CSS classes directly (no components)
- More detailed transition definitions
- Focus uses the focus-ring variable

---

## Migration Strategy

### Phase 1: Update CSS Variables (globals.css)

```css
:root {
  /* Colors - Primary change from purple to red */
  --color-primary: #ff5c5c;        /* Was #7c6af7 */
  --color-primary-hover: #ff7070;  /* Was #9585f8 */
  --accent: #ff5c5c;               /* Add alias */
  
  /* Subtle color adjustments */
  --color-bg: #0e1015;             /* Was #0f0f0f */
  --color-text: #d4d4d8;           /* Was #e8e8e8 */
  --color-border: #1e2028;         /* Was #2a2a2a */
  
  /* Radius adjustments */
  --radius-md: 10px;               /* Was 8px */
  --radius-lg: 14px;               /* Was 12px */
  --radius-xl: 20px;               /* New */
  
  /* Add easing functions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Update transitions */
  --transition-fast: 100ms;        /* Changed */
  --transition-normal: 180ms;      /* New */
  
  /* Add focus ring */
  --focus-ring: 0 0 0 2px var(--color-bg), 
                0 0 0 3px color-mix(in srgb, var(--color-primary) 80%, transparent);
  
  /* Update shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 24px 48px rgba(0, 0, 0, 0.5);
}
```

### Phase 2: Update Button Component

```css
/* Button.module.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);      /* Now 10px */
  font-weight: 500;
  transition: 
    background var(--transition-fast) ease,
    border-color var(--transition-fast) ease,
    box-shadow var(--transition-fast) ease;
  outline: none;
}

.btn:focus-visible {
  box-shadow: var(--focus-ring);        /* Use new focus-ring */
}

.primary {
  background: var(--color-primary);     /* Now #ff5c5c */
  color: #fff;
  border-color: var(--color-primary);
}

.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}
```

### Phase 3: Update Input Component

```css
/* Input.module.css */
.input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);  /* Use bg-elevated concept */
  font-size: 13px;
  outline: none;
  transition:
    border-color var(--transition-fast) ease,
    box-shadow var(--transition-fast) ease,
    background var(--transition-fast) ease;
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
  background: var(--color-bg);  /* Keep consistent */
}
```

### Phase 4: Update Social Button Component

```css
/* SocialLoginButton.module.css */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  height: 38px;                         /* Slightly bigger */
  padding: 0 var(--space-4);
  font-size: 13px;                      /* Slightly smaller */
  font-weight: 500;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);      /* Now 10px */
  transition: all var(--transition-fast) ease;
  cursor: pointer;
  outline: none;
}

.btn:hover:not(:disabled) {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.btn:focus-visible {
  box-shadow: var(--focus-ring);
  border-color: var(--color-primary);
}
```

---

## Visual Changes Summary

| Aspect | Frontend (Now) | Control-UI (Target) | Change |
|--------|---|---|---|
| **Primary Color** | Purple #7c6af7 | Red #ff5c5c | ⚠️ Major |
| **Border Color** | #2a2a2a | #1e2028 | Slightly lighter |
| **Border Radius** | 8px (md) | 10px (md) | Rounder |
| **Focus Ring** | Single 2px ring | Dual-ring with opacity | Much improved |
| **Shadows** | Simple | Layered (sm/md/lg/xl) | More depth |
| **Transitions** | Not standardized | 100ms/180ms/300ms | Better control |
| **Text Color** | #e8e8e8 | #d4d4d8 | Slightly muted |

---

## Implementation Steps

1. **Update `frontend/styles/globals.css`** with new tokens
2. **Update `SocialLoginButton.module.css`** with new radius/transitions
3. **Update `Button.module.css`** with red accent instead of purple
4. **Update `Input.module.css`** with red focus ring
5. **Update login/register page CSS** with new divider and spacing
6. **Test** all components look consistent

---

## Notes

- Control-UI uses more CSS variables and is very well-organized
- The red accent is much bolder and more "punchy" than purple
- Focus rings are more sophisticated (double ring with transparency)
- Transitions are more granular and well-defined
- Control-UI doesn't use modular CSS but shows excellent patterns

Would you like me to proceed with implementing these changes?
