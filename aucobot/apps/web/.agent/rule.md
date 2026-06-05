# Nguyên tắc Phát triển Frontend — OpenClaw SaaS

> Áp dụng cho toàn bộ mã nguồn trong thư mục `frontend/`. Mọi đóng góp mã nguồn (contribution) phải tuân thủ nghiêm ngặt.

---

## 1. Nguyên tắc Tái sử dụng UI (Composition First)

- **Kiểm tra UI Primitives trước**: Khi xây dựng bất kỳ thành phần giao diện nào (Button, Input, Card, Modal...), **luôn luôn phải kiểm tra thư mục `components/ui/` đầu tiên**.
- **Đọc Storybook để hiểu cách dùng**: Trước khi sử dụng bất kỳ component nào trong `components/ui/`, **bắt buộc phải đọc file `.stories.tsx` cùng thư mục** (ví dụ `components/ui/Button/Button.stories.tsx`) để hiểu rõ các props, variant và cách dùng chuẩn.
- **Lắp ghép thay vì viết mới**: Ưu tiên sử dụng các component nhỏ có sẵn trong `components/ui` để ghép lại thành các giao diện phức tạp hơn. Không tự ý viết mới khi các component sẵn có có thể lắp ghép hoặc mở rộng được.
- **Không ghi đè style của UI Primitives**: Các component cấp cao (như Dashboard components) tuyệt đối không viết lại CSS cho những gì các UI Primitives (`Button`, `Avatar`, `DropdownMenu`...) đã đảm nhiệm. Sử dụng đúng các `variant`, `size`, hoặc bổ sung `props` vào chính UI component đó nếu cần mở rộng.
- **Quy tắc Import gọn**: Khi import các component từ `components/ui/` hoặc `components/layout/`, **bắt buộc phải import gộp trên một dòng** (ví dụ: `import { Card, Typography } from "@/components/ui"`). Không import rải rác từng file nhỏ lẻ.

---

## 2. Chuẩn CSS Modules & Styling

- **Không dùng CSS Framework**: Tuyệt đối không sử dụng Tailwind, Bootstrap, Material UI, shadcn, hay bất kỳ CSS framework nào khác. Tự build UI bằng Vanilla CSS kết hợp CSS Modules.
- **Quản lý CSS theo Component & Chuẩn Comment đồng bộ**:
  - Mỗi component có file `.module.css` riêng đặt cùng thư mục.
  - **Không dùng chuẩn BEM**: Vì Next.js CSS Modules đã tự động cô lập class name (scope local), hãy đặt tên class phẳng, tự nhiên và ngắn gọn (ví dụ: `.card`, `.title`, `.active`, `.disabled` thay vì `.card__title` hay `.card--active`).
  - **Viết comment tiếng Việt đơn giản**: Chỉ cần dùng comment một dòng ngắn gọn mô tả block CSS đó dành cho **thành phần hoặc chức năng nào** để mở file ra là hiểu ngay:

    ```css
    /* Khung chứa thẻ */
    .card {
      display: flex;
      flex-direction: column;
    }

    /* Tiêu đề thẻ */
    .title {
      font-size: var(--font-size-md);
    }

    /* Trạng thái hoạt động */
    .active {
      border-color: var(--color-primary);
    }
    ```

- **Dùng CSS Variables**: Sử dụng **CSS Custom Properties** (variables định nghĩa trong `globals.css`) cho color, spacing, radius, shadow — không hardcode giá trị thô.
- **Thang size thống nhất (`xs` → `2xl`)** — định nghĩa tại `app/globals.css`, **không dùng `base`**:
  - Typography: `--font-size-xs` (11px), `--font-size-sm` (13px), **`--font-size-md` (14px, mặc định body)**, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`
  - Transition: `--transition-fast`, **`--transition-md`**, `--transition-slow`
  - Component props `size`: dùng cùng tên `xs | sm | md | lg | xl | 2xl` khi có (ví dụ `DatePicker size="sm"`)
  - **Button**: `size` = `xs | sm | md | lg` (mặc định `md`); nút chỉ icon dùng thêm `iconOnly` (ví dụ `<Button size="sm" iconOnly />`)
- **Quy tắc Radius (Bo góc)**:
  - **Button, Input, Alert, Menu**: Sử dụng `var(--radius-md)` (10px).
  - **Card, Modal, Large Containers**: Sử dụng `var(--radius-lg)` (14px).
- **Quy tắc Sử dụng Single-styling (Style hoặc ClassName — KHÔNG DÙNG CẢ HAI - QUAN TRỌNG)**:
  - **Chỉ dùng EITHER `style` hoặc `className`**: Tuyệt đối không dùng cả `className` và `style` đồng thời trên cùng một element.
  - **Khi nào dùng `style`**: Khi element chỉ cần **đúng 1 thuộc tính CSS đơn giản** (ví dụ: `style={{ marginRight: 8 }}`) hoặc thuộc tính CSS tính toán động dựa trên state/server. Không khai báo thêm thuộc tính `className` cho element này.
  - **Khi nào dùng `className`**: Khi element cần **từ 2 thuộc tính CSS trở lên**. Toàn bộ các style phải được đưa hết vào CSS Module class và sử dụng `className` duy nhất. Không khai báo thêm thuộc tính `style` cho element này.
- **Chuẩn giao diện Card**:
  - Mặc định: `border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);`
  - Hover: `border-color: var(--color-border-focus); box-shadow: var(--shadow-md);` (KHÔNG dùng `transform: translateY(-2px)` hay `border-color: var(--color-primary)`).
  - Transition: Chỉ định rõ các thuộc tính cần transition, ví dụ: `transition: border-color var(--transition-md) ease, box-shadow var(--transition-md) ease;` (Tuyệt đối không dùng `transition: all`).
- **Chuẩn giao diện Menu Dropdown**:
  - **Nút mở (Kebab/Dots)**: `width: 34px; height: 34px; border-radius: var(--radius-sm); color: var(--color-text-muted); background: transparent;`. Khi hover: `background: var(--color-primary-dim); color: var(--color-text);`.
  - **Menu Container**: `background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); padding: var(--space-1); z-index: 50;`.
  - **Item nguy hiểm (.danger)**: `color: var(--color-danger);`. Khi hover: `background: var(--color-danger-dim);`.

---

## 3. Form & Validation (Zod + React Hook Form)

- **Validation bắt buộc qua Zod**: Mọi input đầu vào từ người dùng hoặc dữ liệu trả về từ API đều phải qua Zod schema để validate trước khi sử dụng. Đặt schema trong file riêng dưới thư mục `schemas/`.
- **Sử dụng React Hook Form**: Mọi form nhập liệu phải sử dụng `react-hook-form` kết hợp với `zodResolver`. Cấm sử dụng `useState` lẻ tẻ để quản lý từng trường dữ liệu của form.
- **Hiển thị lỗi trực quan**:
  - Hiển thị lỗi inline ngay dưới từng ô nhập liệu bị lỗi, sử dụng class `.field__error` trong CSS Module.
  - Không sử dụng alert để hiển thị lỗi validation của form.

---

## 4. Zustand — State Management

- **Global State**: Mọi global/shared business state bắt buộc sử dụng Zustand. Cấm sử dụng React Context API cho business state.
- **Local State**: Các state thuần local và tức thời của component (như trạng thái open/close modal, hover) thì sử dụng `useState`.
- **Selector Pattern (Tối ưu hiệu năng)**: Khi lấy state từ store, bắt buộc dùng selector để tránh render thừa không đáng có:

  ```ts
  // Đúng — chỉ subscribe đúng dữ liệu cần thiết
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);

  // Sai — gây re-render component khi bất kỳ trường nào khác trong store thay đổi
  const store = useProjectStore();
  ```

---

## 5. TypeScript

- **Cấm sử dụng `any`**: Tuyệt đối không dùng `any` trong code. Nếu kiểu dữ liệu chưa xác định rõ, sử dụng `unknown` và tiến hành parse thông qua Zod schema.
- **Định nghĩa Props tường minh**: Props của mọi component phải có type hoặc interface rõ ràng.
- **Cấm `@ts-ignore`**: Không sử dụng `// @ts-ignore` để bỏ qua lỗi build. Hãy giải quyết lỗi type một cách triệt để.

---

## 6. Storybook — Quy tắc viết Story

- **Vị trí lưu trữ**: Đặt file `.stories.tsx` **cạnh component** trong `components/ui/[ComponentName]/`, `components/layout/[ComponentName]/`, hoặc `components/dashboard/[ComponentName]/`.
- **Nguyên tắc Self-contained (Tự thân)**:
  - Hạn chế tạo thêm file CSS phụ cho story. Sử dụng các **Helper Components** nội bộ (như `DemoBox`, `DemoLabel`) ngay trong file `.stories.tsx` để quản lý layout demo (grid, flex, spacing...).
  - Mục tiêu: Giúp nhà phát triển hoặc AI Agent chỉ cần đọc duy nhất 1 file `.stories.tsx` là hiểu trọn vẹn cách dùng và demo trực quan của component.
- **Tags**: Luôn luôn khai báo `tags: ['autodocs']` để Storybook tự động tạo tài liệu hướng dẫn.
