import {
  THEME_APPEARANCE_COOKIE,
  THEME_COOKIE_MAX_AGE,
  THEME_LS_STORAGE_KEY,
} from '@/lib/theme/theme-constants'

/** Chuỗi IIFE nhỏ: đặt `data-theme` + cookie khớp zustand persist trong LS (chạy trước khi hydrate). */
export function getThemeBootstrapInlineScript(): string {
  const lsKey = JSON.stringify(THEME_LS_STORAGE_KEY)
  const cookieName = JSON.stringify(THEME_APPEARANCE_COOKIE)
  const maxAge = String(THEME_COOKIE_MAX_AGE)
  return `try{var K=${lsKey};var C=${cookieName};var r=localStorage.getItem(K);if(!r)return;var j=JSON.parse(r);var t=j&&j.state&&j.state.theme;var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark){document.documentElement.setAttribute("data-theme","dark");document.cookie=C+"=dark;path=/;max-age=${maxAge};SameSite=Lax";}else{document.documentElement.removeAttribute("data-theme");document.cookie=C+"=light;path=/;max-age=${maxAge};SameSite=Lax";}}catch(e){}`
}
