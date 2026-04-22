# Frontend Rules — OpenClaw SaaS

> Áp dụng cho toàn bộ code trong `frontend/`. Mọi contribution phải tuân thủ.

---

## 1. CSS — Tự build UI, không dùng framework

### Nguyên tắc chung
- **Không dùng Tailwind, Bootstrap, Material UI, shadcn, hay bất kỳ CSS framework nào.**
- Mỗi component có file `.module.css` riêng đặt cùng thư mục với component.
- Global styles chỉ ở `app/globals.css`: reset, CSS variables, typography base, utility classes tối thiểu.
- Dùng **CSS Custom Properties** (variables) cho color, spacing, radius, shadow — không hardcode giá trị.

### Cấu trúc CSS variables (định nghĩa trong `globals.css`)
```css
:root {
  /* Colors */
  --color-bg: #0f0f0f;
  --color-surface: #1a1a1a;
  --color-border: #2a2a2a;
  --color-text: #e8e8e8;
  --color-text-muted: #888;
  --color-primary: #7c6af7;
  --color-primary-hover: #9585f8;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --color-warning: #f59e0b;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Shape */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Typography */
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
}
```

### Quy tắc đặt tên class (BEM-lite)
```css
/* Block */
.card { }

/* Element */
.card__title { }
.card__body { }

/* Modifier */
.card--active { }
.card--danger { }
```

### Responsive
- Dùng media queries với breakpoints cố định: `640px`, `768px`, `1024px`, `1280px`.
- Mobile-first: viết base style cho mobile, dùng `min-width` để mở rộng lên desktop.

### Không được làm
- Không dùng inline style ngoài trường hợp giá trị động (`style={{ width: progress + '%' }}`).
- Không dùng `!important`.
- Không đặt màu sắc hay spacing hardcode trong component CSS — luôn dùng variables.

---

## 2. Zod — Validation bắt buộc

### Nguyên tắc
- **Mọi input từ user (form, query param, API response) đều phải qua Zod schema trước khi dùng.**
- Đặt schema trong file riêng: `schemas/auth.schema.ts`, `schemas/project.schema.ts`, v.v.
- Export cả schema lẫn inferred type từ schema.

### Cấu trúc schema file
```ts
// schemas/project.schema.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Tên tối thiểu 3 ký tự').max(50),
  description: z.string().max(200).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
```

### Validate API response
```ts
// Luôn parse response từ API — không tin blindly
const data = createProjectSchema.parse(response.data)
```

### Validate form với react-hook-form
```ts
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm<CreateProjectInput>({
  resolver: zodResolver(createProjectSchema),
})
```

### Không được làm
- Không dùng validation bằng `if (!email.includes('@'))` hay tương tự — luôn dùng Zod.
- Không define type bằng tay nếu đã có Zod schema — dùng `z.infer<>`.

---

## 3. React Hook Form — Form handling

### Nguyên tắc
- **Mọi form dùng `react-hook-form` với `zodResolver`.**
- Không dùng `useState` để quản lý từng field của form.
- Submit handler nhận data đã được validated — không cần check lại.

### Pattern chuẩn
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    // data đã validated — gọi API trực tiếp
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <button disabled={isSubmitting}>Đăng nhập</button>
    </form>
  )
}
```

### Error display
- Hiển thị lỗi inline dưới từng field, không dùng alert/toast cho validation error.
- Dùng class `.field__error` trong module CSS.

---

## 4. Zustand — State Management

### Nguyên tắc
- **Mọi global/shared state dùng Zustand.** Không dùng Context API cho business state.
- Mỗi domain có 1 store riêng: `stores/auth.store.ts`, `stores/project.store.ts`.
- State thuần local của 1 component (modal open/close, hover) thì dùng `useState`.

### Cấu trúc store chuẩn
```ts
// stores/project.store.ts
import { create } from 'zustand'
import type { Project } from '@/types/project'

interface ProjectState {
  projects: Project[]
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await projectApi.list()
      set({ projects: data })
    } catch (err) {
      set({ error: 'Không tải được danh sách project' })
    } finally {
      set({ isLoading: false })
    }
  },

  createProject: async (input) => {
    const project = await projectApi.create(input)
    set((state) => ({ projects: [...state.projects, project] }))
  },
}))
```

### Selector pattern (tránh re-render thừa)
```ts
// Tốt — chỉ subscribe đúng slice cần
const projects = useProjectStore((s) => s.projects)
const isLoading = useProjectStore((s) => s.isLoading)

// Tránh — subscribe toàn bộ store
const store = useProjectStore()
```

### Không được làm
- Không đặt business logic (API call) trong component — gọi action từ store.
- Không mutate state trực tiếp — luôn dùng `set()`.
- Không dùng Redux, Jotai, hay Context cho global state.

---

## 5. Axios — HTTP Client

### Setup
- Tạo 1 axios instance duy nhất ở `lib/axios.ts`.
- Instance tự động gắn base URL từ env và gửi cookie (credentials).
- Interceptor response: extract `data`, bắt lỗi HTTP thành error message chuẩn.

```ts
// lib/axios.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Better-Auth dùng cookie
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message ?? 'Lỗi không xác định'
    return Promise.reject(new Error(message))
  }
)
```

- API functions nhóm theo domain trong `lib/api/`: `lib/api/auth.ts`, `lib/api/project.ts`.

### Pattern API function
```ts
// lib/api/project.ts
import { api } from '@/lib/axios'
import { projectSchema } from '@/schemas/project.schema'
import { z } from 'zod'

export const projectApi = {
  list: async () => {
    const res = await api.get('/api/projects')
    return z.array(projectSchema).parse(res.data)
  },
  create: async (input: CreateProjectInput) => {
    const res = await api.post('/api/projects', input)
    return projectSchema.parse(res.data)
  },
}
```

---

## 6. Cấu trúc thư mục chuẩn

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

## 7. TypeScript

- Không dùng `any` — dùng `unknown` nếu type chưa biết, sau đó parse qua Zod.
- Props của mọi component phải có interface rõ ràng.
- Không bỏ qua lỗi TS bằng `// @ts-ignore` — sửa type thực sự.

---

## 8. Auth — Better-Auth

- Backend dùng **Better-Auth** → session lưu bằng **HttpOnly cookie**.
- Frontend không lưu token trong `localStorage` hay `sessionStorage`.
- Axios gửi `withCredentials: true` để cookie được gửi tự động.
- Auth state (user info, isLoggedIn) lưu trong `stores/auth.store.ts`.
- Middleware Next.js (`middleware.ts`) kiểm tra session cookie, redirect nếu chưa login.
