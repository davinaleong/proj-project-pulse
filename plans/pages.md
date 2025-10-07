# Pages

## 🧭 1. Global / Core Pages

| Category              | Page                     | Purpose                                                          |
| --------------------- | ------------------------ | ---------------------------------------------------------------- |
| **Auth**              | `/login`                 | User login page (with 2FA support)                               |
|                       | `/register`              | New account registration                                         |
|                       | `/forgot-password`       | Request password reset link                                      |
|                       | `/reset-password/:token` | Reset password using token                                       |
|                       | `/verify-email/:token`   | Verify new user’s email                                          |
| **Dashboard**         | `/dashboard`             | Main overview (projects summary, task stats, recent notes, etc.) |
| **Settings (System)** | `/settings`              | Global system settings (admin-only)                              |
| **Audit Logs**        | `/activities`            | System-wide activity log for admin                               |

---

## 📁 2. Projects Module

| Page                        | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `/projects`                 | List all projects (sortable, searchable, filter by stage) |
| `/projects/create`          | Create new project                                        |
| `/projects/:uuid`           | Project details summary (description, cost, stage, dates) |
| `/projects/:uuid/edit`      | Edit project info                                         |
| `/projects/:uuid/tasks`     | View all tasks under the project                          |
| `/projects/:uuid/notes`     | Notes related to the project                              |
| `/projects/:uuid/analytics` | Project cost/time analysis                                |
| `/projects/:uuid/settings`  | Manage project billing cycle, currency, etc.              |

---

## ✅ 3. Tasks Module

| Page                | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `/tasks`            | All tasks (list, kanban, or table view)                       |
| `/tasks/create`     | Create new task (select project + assignee)                   |
| `/tasks/:uuid`      | View single task details (definition of done, cost, timeline) |
| `/tasks/:uuid/edit` | Edit task info                                                |
| `/tasks/board`      | Kanban board grouped by status (Backlog, WIP, etc.)           |
| `/tasks/my`         | User’s assigned tasks                                         |
| `/tasks/reports`    | Task time/cost report by user or project                      |

---

## 📝 4. Notes Module

| Page                | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `/notes`            | All notes (filter by status or visibility) |
| `/notes/create`     | Create a new note                          |
| `/notes/:uuid`      | View a note (Markdown or rich text)        |
| `/notes/:uuid/edit` | Edit note                                  |
| `/notes/me`         | My private notes                           |
| `/notes/public`     | Publicly shared notes                      |

---

## 👥 5. Users Module

| Page                      | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `/users`                  | Admin list of all users                         |
| `/users/create`           | Create new user (admin only)                    |
| `/users/:uuid`            | View user info (role, status, last login, etc.) |
| `/users/:uuid/edit`       | Edit user details                               |
| `/users/:uuid/sessions`   | Manage active sessions / revoke tokens          |
| `/users/:uuid/activities` | User-specific activity log                      |

---

## 🧑‍🎨 6. Profiles Module

| Page                     | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `/profile`               | Current user profile (view & edit bio, avatar, theme, etc.) |
| `/profile/edit`          | Edit personal info                                          |
| `/profile/preferences`   | Manage timezone, language, theme                            |
| `/profile/notifications` | Manage notification preferences                             |
| `/profile/privacy`       | Manage visibility (public/private)                          |
| `/profile/social-links`  | Manage connected accounts                                   |

---

## 🧾 7. Activities Module

| Page              | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `/activities`     | Global activity log (admin view)                |
| `/activities/my`  | Personal activity log                           |
| `/activities/:id` | Detailed audit entry view (old/new values diff) |

---

## 🔐 8. Sessions Module

| Page                | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `/sessions`         | View all active sessions                     |
| `/sessions/revoked` | View revoked sessions                        |
| `/sessions/:id`     | Session details (IP, user agent, timestamps) |

---

## ⚙️ 9. Settings Module

| Page                             | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `/settings`                      | Global configuration categories list |
| `/settings/system`               | System-wide configurations           |
| `/settings/admin`                | Admin-only keys and values           |
| `/settings/user`                 | User-level personal settings         |
| `/settings/categories/:category` | Filter settings by category          |
| `/settings/:uuid/edit`           | Edit setting entry                   |

---

## 🔄 10. Password Reset Tokens Module

| Page                     | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `/password-resets`       | Admin view of reset token logs (for security auditing) |
| `/password-resets/:uuid` | Inspect token status (used, expired, active)           |

---

## 🧩 11. Admin / Management Area (Optional but Recommended)

| Page                   | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `/admin/dashboard`     | Admin control center                      |
| `/admin/users`         | User management                           |
| `/admin/settings`      | System configuration                      |
| `/admin/audit`         | Audit log overview                        |
| `/admin/system-health` | View app metrics (sessions, uptime, etc.) |

---

## 💡 12. Misc / Utility

| Page      | Purpose                                                  |
| --------- | -------------------------------------------------------- |
| `/me`     | Personalized dashboard (tasks, notes, projects overview) |
| `/search` | Global search (projects, tasks, notes, users)            |
| `/help`   | Help / documentation center                              |
| `/about`  | App info, version, and credits                           |

---

### 🧱 Suggested Folder Structure (for React/Next.js API or Web App)

```
/src
 ├─ pages/
 │   ├─ auth/
 │   │   ├─ login.tsx
 │   │   ├─ register.tsx
 │   │   ├─ forgot-password.tsx
 │   │   └─ reset-password/[token].tsx
 │   ├─ dashboard.tsx
 │   ├─ projects/
 │   ├─ tasks/
 │   ├─ notes/
 │   ├─ users/
 │   ├─ profile/
 │   ├─ settings/
 │   ├─ activities/
 │   ├─ sessions/
 │   ├─ password-resets/
 │   └─ admin/
 │
 ├─ components/
 ├─ layouts/
 ├─ lib/
 ├─ hooks/
 ├─ utils/
 └─ tests/
```
