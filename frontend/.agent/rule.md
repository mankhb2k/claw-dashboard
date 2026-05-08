# Frontend Rules — OpenClaw SaaS

> Áp dụng cho toàn bộ code trong `frontend/`. Mọi contribution phải tuân thủ.

---

## 0. Nguyên tắc Lắp ghép & Tái sử dụng (BẮT BUỘC)

- **Kiểm tra UI Primitives trước**: Khi cần làm bất kỳ UI nào (Button, Input, Card, Modal...), **luôn phải kiểm tra thư mục `frontend/components/ui/` đầu tiên**.
- **Ưu tiên lắp ghép (Composition)**: Luôn cố gắng sử dụng các component nhỏ có sẵn trong `components/ui` để ghép lại thành các component phức tạp hơn. 
- **Không tự ý viết mới**: Tuyệt đối không tự ý viết mới một component nào mà chưa xem xét liệu các component trong `ui` có thể lắp ghép hoặc mở rộng để đáp ứng nhu cầu được hay không.
- **Mở rộng thay vì tạo mới**: Nếu component hiện có thiếu tính năng, hãy ưu tiên bổ sung `props`, `variant`, hoặc `size` cho nó thay vì tạo một component song song.
- **Refactor bắt buộc**: Khi review code, nếu phát hiện các đoạn UI tự viết (hardcoded HTML/CSS) mà có thể thay thế bằng `components/ui`, bắt buộc phải refactor về dùng shared component.
- **Không ghi đè style của UI Primitives**: Các component cấp cao (như Dashboard components) tuyệt đối không được viết lại CSS cho những gì các UI Primitives (`Button`, `Avatar`, `DropdownMenu`...) đã đảm nhiệm. Phải sử dụng đúng các `variant`, `size`, hoặc bổ sung `props` vào chính UI component đó nếu cần mở rộng.

---

## 1. CSS — Tự build UI, không dùng framework

### Nguyên tắc chung

- **Không dùng Tailwind, Bootstrap, Material UI, shadcn, hay bất kỳ CSS framework nào.**
- Mỗi component có file `.module.css` riêng đặt cùng thư mục với component.
- Global styles chỉ ở `app/globals.css`: reset, CSS variables, typography base, utility classes tối thiểu.
- Dùng **CSS Custom Properties** (variables) cho color, spacing, radius, shadow — không hardcode giá trị.
- **Quy tắc Radius**: Tuân thủ phân cấp bo góc để tạo phân cấp thị giác:
  - **Button, Input, Alert, Menu**: Sử dụng `var(--radius-md)` (10px).
  - **Card, Modal, Large Containers**: Sử dụng `var(--radius-lg)` (14px).

### Chuẩn giao diện Card (Card UI Standard)

Tất cả các thẻ Card (Skill, Channel, Project, v.v.) phải sử dụng chung một chuẩn hover effect sau để đảm bảo tính đồng nhất trên toàn hệ thống:
- Mặc định: `border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);`
- Hover: `border-color: var(--color-border-focus); box-shadow: var(--shadow-md);` (KHÔNG dùng `transform: translateY(-2px)` hay `border-color: var(--color-primary)`).
- Focus: `box-shadow: var(--focus-ring), var(--shadow-md); outline: none;`
- Transition: `transition: border-color var(--transition-base) ease, box-shadow var(--transition-base) ease, transform var(--transition-fast) ease;`

### Chuẩn giao diện Menu Dropdown (Dropdown Menu Standard)

Các Menu Dropdown popup (ví dụ nhấn vào dấu 3 chấm) phải sử dụng chung cấu trúc CSS sau:
- **Nút mở (Kebab/Dots Button)**: `width: 34px; height: 34px; border-radius: var(--radius-sm); color: var(--color-text-muted); background: transparent;`. Khi hover: `background: var(--color-primary-dim); color: var(--color-text);`.
- **Menu Container (.dropdownMenu)**: `background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); padding: var(--space-1); z-index: 50;`.
- **Item (.dropdownItem)**: `padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); font-size: var(--font-size-sm); color: var(--color-text);`. Khi hover: `background: var(--color-primary-dim);`.
- **Item nguy hiểm (.danger)**: `color: var(--color-danger);`. Khi hover: `background: var(--color-danger-dim);`.

### Cấu trúc CSS variables (định nghĩa trong `globals.css`) — Control-UI Design System

**Updated:** Matched to Control-UI design system with red accent (#ff5c5c), updated radius sizes, dual-layer focus rings, standardized transitions.

### Quy tắc đặt tên class (BEM-lite)

```css
/* Block */
.card {
}

/* Element */
.card__title {
}
.card__body {
}

/* Modifier */
.card--active {
}
.card--danger {
}
```

### CSS Modules — Thứ tự khối & comment tiếng Việt

Mọi file `*.module.css` phải **sắp xếp từ cấu trúc tổng thể vào chi tiết**, kèm **comment tiếng Việt** theo từng nhóm để đọc và review nhanh.

**Thứ tự đề xuất**

1. **Layout / vỏ ngoài** — `.shell`, `.page`, `.card` bọc ngoài, overlay/modal root.
2. **Trạng thái & modifier** — lớp BEM `--modifier`, lớp kết hợp (ví dụ `.sidebarOpen`), hoặc khối comment `/* --- TRẠNG THÁI ... --- */` gom các rule biến thể.
3. **Theo vùng màn hình** — header → nội dung chính → footer / sidebar (tùy component).
4. **Thành phần con** — typography, field, nút, badge nested.
5. **Cuối file** — **`@keyframes`** và **media queries** trong mục riêng (ví dụ `Animation`, `Responsive`).

**Định dạng comment**

- Dùng banner nhiều dòng, tiêu đề tiếng Việt ngắn (ví dụ _Vỏ trang_, _Form & lỗi_, _Menu dropdown_).
- Tham chiếu chuẩn trong repo: `components/layout/Sidebar/Sidebar.module.css`.

**Ví dụ rút gọn**

```css
/* =============================================================================
   1. VỎ TRANG — căn giữa, nền toàn màn hình
   ============================================================================= */
.shell { ... }

/* Trạng thái thu nhỏ tổng quát */
.sidebarCollapsed { ... }

/* --- TRẠNG THÁI THU NHỎ (chỉnh layout) --- */
.sidebarCollapsed .header { ... }

/* =============================================================================
   2. ĐIỀU HƯỚNG — danh sách link
   ============================================================================= */
.nav { ... }
```

### Responsive

- Dùng media queries với breakpoints cố định: `640px`, `768px`, `1024px`, `1280px`.
- Mobile-first: viết base style cho mobile, dùng `min-width` để mở rộng lên desktop.

### Transitions & Focus States — Control-UI pattern

**Transitions:** Mọi interactive element phải có transition mượt mà với easing function:

```css
/* Pattern chuẩn */
.button {
  transition:
    background var(--transition-fast) ease,
    border-color var(--transition-fast) ease,
    box-shadow var(--transition-fast) ease;
}

/* Không dùng: transition: all ... (quá broad) */
```

**Focus Ring:** Sử dụng dual-layer focus-ring variable (chứ không hardcode):

```css
.button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring); /* Dual-ring: bg + accent with 80% opacity */
}

/* Không dùng: box-shadow: 0 0 0 2px #ff5c5c; (hardcode) */
```

**Hover States:** Luôn cặp với `not(:disabled)`:

```css
.button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}
```

### Không được làm

- Không dùng inline style ngoài trường hợp giá trị động (`style={{ width: progress + '%' }}`).
- Không dùng `!important`.
- Không đặt màu sắc hay spacing hardcode trong component CSS — luôn dùng variables.
- Không dùng `transition: all` — specify properties rõ ràng.
- Không dùng `:focus` — dùng `:focus-visible` cho accessible focus indicator.

---

## 2. Shared UI Components — Primitives

Mọi component dùng chung (trong `components/ui/`) phải tuân thủ nghiêm ngặt các quy định về Props và Variant để đảm bảo tính nhất quán của Design System.

### 2.1. Button Component

- **File**: `components/ui/Button/Button.tsx`
- **Variants hỗ trợ**: Chỉ được dùng các giá trị sau cho prop `variant`:
  - `primary`: Màu chính (màu đỏ accent của hệ thống).
  - `ghost`: Nền trong suốt, chỉ hiện màu khi hover (dùng cho nút Hủy, Đóng, hoặc các nút phụ).
  - `danger`: Màu đỏ cảnh báo (dùng cho các thao tác Xóa).
- **Tuyệt đối không dùng**: `secondary`, `outline`, `link` hay các giá trị lạ từ UI Framework khác. Nếu cần variant mới, phải bổ sung vào `ButtonProps` và `Button.module.css`.
- **Pattern**: Hỗ trợ `asChild` (Radix Slot) để linh hoạt chuyển đổi giữa `button` và `Link`.

---

## 3. Zod — Validation bắt buộc

### Nguyên tắc

- **Mọi input từ user (form, query param, API response) đều phải qua Zod schema trước khi dùng.**
- **Tuyệt đối không hardcode văn bản hiển thị**: Mọi chuỗi văn bản (labels, placeholders, messages, titles...) phải được đưa vào hệ thống i18n tại `lib/i18n/dictionaries`. Sử dụng hook `useI18n` để truy xuất.
- Đặt schema trong file riêng: `schemas/auth.schema.ts`, `schemas/project.schema.ts`, v.v.
- Export cả schema lẫn inferred type từ schema.

### Cấu trúc schema file

```ts
// schemas/project.schema.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(3, "Tên tối thiểu 3 ký tự").max(50),
  description: z.string().max(200).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### Validate API response

```ts
// Luôn parse response từ API — không tin blindly
const data = createProjectSchema.parse(response.data);
```

### Validate form với react-hook-form

```ts
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<CreateProjectInput>({
  resolver: zodResolver(createProjectSchema),
});
```

### Không được làm

- Không dùng validation bằng `if (!email.includes('@'))` hay tương tự — luôn dùng Zod.
- Không define type bằng tay nếu đã có Zod schema — dùng `z.infer<>`.

---

## 4. React Hook Form — Form handling

### Nguyên tắc

- **Mọi form dùng `react-hook-form` với `zodResolver`.**
- Không dùng `useState` để quản lý từng field của form.
- Submit handler nhận data đã được validated — không cần check lại.

### Pattern chuẩn

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    // data đã validated — gọi API trực tiếp
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}
      <button disabled={isSubmitting}>Đăng nhập</button>
    </form>
  );
}
```

### Error display

- Hiển thị lỗi inline dưới từng field, không dùng alert/toast cho validation error.
- Dùng class `.field__error` trong module CSS.

---

## 5. Zustand — State Management

### Nguyên tắc

- **Mọi global/shared state dùng Zustand.** Không dùng Context API cho business state.
- Mỗi domain có 1 store riêng: `stores/auth.store.ts`, `stores/project.store.ts`.
- State thuần local của 1 component (modal open/close, hover) thì dùng `useState`.

### Cấu trúc store chuẩn

```ts
// stores/project.store.ts
import { create } from "zustand";
import type { Project } from "@/types/project";

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await projectApi.list();
      set({ projects: data });
    } catch (err) {
      set({ error: "Không tải được danh sách project" });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (input) => {
    const project = await projectApi.create(input);
    set((state) => ({ projects: [...state.projects, project] }));
  },
}));
```

### Selector pattern (tránh re-render thừa)

```ts
// Tốt — chỉ subscribe đúng slice cần
const projects = useProjectStore((s) => s.projects);
const isLoading = useProjectStore((s) => s.isLoading);

// Tránh — subscribe toàn bộ store
const store = useProjectStore();
```

### Không được làm

- Không đặt business logic (API call) trong component — gọi action từ store.
- Không mutate state trực tiếp — luôn dùng `set()`.
- Không dùng Redux, Jotai, hay Context cho global state.

---

## 6. Axios — HTTP Client

### Setup

- Tạo 1 axios instance duy nhất ở `lib/axios.ts`.
- Instance tự động gắn base URL từ env và gửi cookie (credentials).
- Interceptor response: extract `data`, bắt lỗi HTTP thành error message chuẩn.

```ts
// lib/axios.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Better-Auth dùng cookie
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message ?? "Lỗi không xác định";
    return Promise.reject(new Error(message));
  },
);
```

- API functions nhóm theo domain trong `lib/api/`: `lib/api/auth.ts`, `lib/api/project.ts`.

### Pattern API function

```ts
// lib/api/project.ts
import { api } from "@/lib/axios";
import { projectSchema } from "@/schemas/project.schema";
import { z } from "zod";

export const projectApi = {
  list: async () => {
    const res = await api.get("/api/projects");
    return z.array(projectSchema).parse(res.data);
  },
  create: async (input: CreateProjectInput) => {
    const res = await api.post("/api/projects", input);
    return projectSchema.parse(res.data);
  },
};
```

---

## 7. Cấu trúc thư mục chuẩn

```
frontend/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Route group: login, register
│   ├── (dashboard)/            # Route group: protected pages
│   ├── globals.css
│   └── layout.tsx
├── components/                 # Shared UI components
│   ├── ui/                     # Primitives: Button, Input, Card
│   └── layout/                 # Sidebar, Header, PageShell
├── lib/
│   ├── axios.ts                # Axios instance
│   └── api/                   # Domain API functions
├── schemas/                    # Zod schemas
├── stores/                     # Zustand stores
├── types/                      # Shared TypeScript types
└── .agent/
    └── rule.md                 # File này
```

---

## 8. TypeScript

- Không dùng `any` — dùng `unknown` nếu type chưa biết, sau đó parse qua Zod.
- Props của mọi component phải có interface rõ ràng.
- Không bỏ qua lỗi TS bằng `// @ts-ignore` — sửa type thực sự.

---

## 9. Auth — Better-Auth

- Backend dùng **Better-Auth** → session lưu bằng **HttpOnly cookie**.
- Frontend không lưu token trong `localStorage` hay `sessionStorage`.
- Axios gửi `withCredentials: true` để cookie được gửi tự động.
- Auth state (user info, isLoggedIn) lưu trong `stores/auth.store.ts`.
- Middleware Next.js (`middleware.ts`) kiểm tra session cookie, redirect nếu chưa login.

---

## 10. Storybook — Quy tắc viết Story

- **Vị trí**: Đặt các file story trong thư mục `frontend/stories/ui/[ComponentName]/`.
- **Nguyên tắc Self-contained (Tự thân)**:
  - Hạn chế tạo thêm file `.module.css` phụ cho story nếu không thật sự cần thiết.
  - Sử dụng các **Helper Components** nội bộ (như `DemoBox`, `DemoLabel`) ngay trong file `.stories.tsx` để quản lý layout demo (grid, flex, padding...).
  - Mục tiêu: Giúp AI Agent và lập trình viên khác chỉ cần đọc 1 file duy nhất là hiểu toàn bộ cách sử dụng và demo của component.
- **Tận dụng UI Primitives**: Sử dụng chính các component trong `components/ui` để xây dựng nội dung cho story (theo nguyên tắc Composition).
- **Tags**: Luôn thêm `tags: ['autodocs']` để Storybook tự động sinh tài liệu.
