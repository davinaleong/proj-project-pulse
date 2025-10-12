# 🎨 Layout Planning

## 1️⃣ **AuthLayout**

**Used for:**

- `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/verify-email/:token`

**Purpose:**
Minimal interface, centered form, no navigation, optional brand logo, background illustration.

✅ Pages using: **5**

---

## 2️⃣ **DashboardLayout (Default App Layout)**

**Used for:**

- `/dashboard`
- `/me`
- `/search`
- `/help`
- `/about`

**Purpose:**
Main shell for logged-in users:
Sidebar navigation + header (user menu, notifications) + content container.

✅ Pages using: **5**

---

## 3️⃣ **ProjectsLayout**

**Used for:**

- `/projects`, `/projects/create`, `/projects/:uuid`, `/projects/:uuid/edit`, `/projects/:uuid/tasks`, `/projects/:uuid/notes`, `/projects/:uuid/analytics`, `/projects/:uuid/settings`

**Purpose:**
Adds project-specific sidebar or tabs (“Overview”, “Tasks”, “Notes”, “Analytics”, “Settings”) nested within `DashboardLayout`.

✅ Pages using: **8**
🧩 Typically implemented as a **nested layout** inside `DashboardLayout`.

---

## 4️⃣ **TasksLayout**

**Used for:**

- `/tasks`, `/tasks/create`, `/tasks/:uuid`, `/tasks/:uuid/edit`, `/tasks/board`, `/tasks/my`, `/tasks/reports`

**Purpose:**
Similar to Projects but task-focused; may include task filters, views (list, Kanban, table), and project link context.

✅ Pages using: **7**

---

## 5️⃣ **NotesLayout**

**Used for:**

- `/notes`, `/notes/create`, `/notes/:uuid`, `/notes/:uuid/edit`, `/notes/me`, `/notes/public`

**Purpose:**
Focused on reading/writing content; may include markdown toolbar and visibility filters.

✅ Pages using: **6**

---

## 6️⃣ **UsersLayout (Admin-only)**

**Used for:**

- `/users`, `/users/create`, `/users/:uuid`, `/users/:uuid/edit`, `/users/:uuid/sessions`, `/users/:uuid/activities`

**Purpose:**
Administrative layout nested under `AdminLayout` or `DashboardLayout`, includes search/filter controls and user management tabs.

✅ Pages using: **6**

---

## 7️⃣ **ProfileLayout**

**Used for:**

- `/profile`, `/profile/edit`, `/profile/preferences`, `/profile/notifications`, `/profile/privacy`, `/profile/social-links`

**Purpose:**
Personal account settings layout for normal users; tabbed navigation across profile sections.

✅ Pages using: **6**

---

## 8️⃣ **ActivitiesLayout**

**Used for:**

- `/activities`, `/activities/my`, `/activities/:id`

**Purpose:**
Audit trail viewer with diff viewer panel.

✅ Pages using: **3**

---

## 9️⃣ **SessionsLayout**

**Used for:**

- `/sessions`, `/sessions/revoked`, `/sessions/:id`

**Purpose:**
Session management, likely a simple table view with revoke buttons.

✅ Pages using: **3**

---

## 🔟 **SettingsLayout**

**Used for:**

- `/settings`, `/settings/system`, `/settings/admin`, `/settings/user`, `/settings/categories/:category`, `/settings/:uuid/edit`

**Purpose:**
Tabbed configuration management for both system and user settings.

✅ Pages using: **6**

---

## 11️⃣ **PasswordResetTokensLayout**

**Used for:**

- `/password-resets`, `/password-resets/:uuid`

**Purpose:**
Security audit layout; admin-only, table view with details panel.

✅ Pages using: **2**

---

## 12️⃣ **AdminLayout**

**Used for:**

- `/admin/dashboard`, `/admin/users`, `/admin/settings`, `/admin/audit`, `/admin/system-health`

**Purpose:**
Distinct admin control center layout with top navigation, system metrics, and sidebar sections.

✅ Pages using: **5**
🧩 Could share base shell with `DashboardLayout` but different theme/nav.

---

## 🧩 Optional Derived Layouts

If you modularize well, some of these can **reuse the same base** with variations:

| Layout Type               | Likely Derived From           |
| ------------------------- | ----------------------------- |
| ProjectsLayout            | → DashboardLayout             |
| TasksLayout               | → DashboardLayout             |
| NotesLayout               | → DashboardLayout             |
| ProfileLayout             | → DashboardLayout             |
| ActivitiesLayout          | → DashboardLayout             |
| SessionsLayout            | → DashboardLayout             |
| SettingsLayout            | → DashboardLayout/AdminLayout |
| PasswordResetTokensLayout | → AdminLayout                 |

---

## ✅ **Final Count Summary**

| Layout                    | Scope                       | Distinct?   |
| ------------------------- | --------------------------- | ----------- |
| AuthLayout                | Public auth forms           | ✅          |
| DashboardLayout           | Main shell for normal users | ✅          |
| ProjectsLayout            | Nested under dashboard      | ⚙️ (nested) |
| TasksLayout               | Nested under dashboard      | ⚙️ (nested) |
| NotesLayout               | Nested under dashboard      | ⚙️ (nested) |
| ProfileLayout             | Nested under dashboard      | ⚙️ (nested) |
| ActivitiesLayout          | Nested under dashboard      | ⚙️ (nested) |
| SessionsLayout            | Nested under dashboard      | ⚙️ (nested) |
| SettingsLayout            | Shared or nested            | ⚙️ (nested) |
| PasswordResetTokensLayout | Admin-only nested           | ⚙️ (nested) |
| AdminLayout               | Separate admin shell        | ✅          |

---

## 🧮 **Total Distinct Base Layouts: 3**

1. **AuthLayout** – for login/registration/reset
2. **DashboardLayout** – main logged-in app shell
3. **AdminLayout** – admin control panel shell

All others are **nested or derived layouts** inside `DashboardLayout` or `AdminLayout`.
