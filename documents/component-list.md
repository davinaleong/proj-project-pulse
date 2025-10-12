# React Component List

## 🧱 1. **Global UI Components**

These are **reused across the entire app** (buttons, forms, modals, tables, etc.)
You should make these first.

| Category                 | Component                                                                                                                                | Purpose                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Buttons & Inputs**     | `Button`, `IconButton`, `DropdownButton`, `ToggleSwitch`, `Checkbox`, `Radio`, `Input`, `Textarea`, `Select`, `DatePicker`, `FileUpload` | Core form elements                 |
| **Navigation**           | `Sidebar`, `Topbar`, `Breadcrumbs`, `NavItem`, `TabNav`, `Pagination`, `SearchBar`, `CommandPalette`                                     | Global navigation + search         |
| **Feedback & Modals**    | `Alert`, `Toast`, `Modal`, `ConfirmDialog`, `Drawer`, `Tooltip`, `ProgressBar`, `Spinner`                                                | UX feedback components             |
| **Typography & Display** | `Card`, `Table`, `DataGrid`, `Badge`, `Tag`, `Avatar`, `StatCard`, `EmptyState`, `Timeline`                                              | Visual presentation components     |
| **Charts**               | `BarChart`, `PieChart`, `LineChart`                                                                                                      | For analytics pages                |
| **Auth Utilities**       | `TwoFactorInput`, `OTPField`, `PasswordStrengthMeter`                                                                                    | Used in login/register/reset forms |

---

## 🧭 2. **Layout Components**

| Component                        | Purpose                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `AuthLayout`                     | Minimal layout for login/register/reset pages             |
| `DashboardLayout`                | Default app layout for logged-in users                    |
| `AdminLayout`                    | Layout for `/admin` section (different sidebar/nav)       |
| `ModuleLayout`                   | Generic wrapper for nested modules (projects/tasks/notes) |
| `SettingsLayout`                 | Tabbed sublayout for `/settings`                          |
| `ProfileLayout`                  | Tabs for `/profile` pages                                 |
| `ErrorBoundary`, `LoadingScreen` | Global error/loading handling                             |

---

## 🔐 3. **Auth Module Components**

| Component            | Used In                  | Purpose                       |
| -------------------- | ------------------------ | ----------------------------- |
| `LoginForm`          | `/login`                 | Username/password + 2FA field |
| `RegisterForm`       | `/register`              | New account registration form |
| `ForgotPasswordForm` | `/forgot-password`       | Send reset link               |
| `ResetPasswordForm`  | `/reset-password/:token` | Input new password            |
| `VerifyEmailMessage` | `/verify-email/:token`   | Confirmation message          |

---

## 📊 4. **Dashboard Components**

| Component            | Purpose                                 |
| -------------------- | --------------------------------------- |
| `DashboardOverview`  | Container for summary cards             |
| `ProjectSummaryCard` | Show key project stats                  |
| `TaskStatsCard`      | Summarize task progress                 |
| `RecentNotesList`    | List of latest notes                    |
| `ActivityFeed`       | Stream of recent system/user activities |

---

## 📁 5. **Projects Module Components**

| Component              | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `ProjectList`          | Table/list view of all projects                   |
| `ProjectFilters`       | Search, sort, filter by stage                     |
| `ProjectForm`          | Create/Edit project form                          |
| `ProjectDetailsHeader` | Summary header (title, stage, owner, cost)        |
| `ProjectTabs`          | Tabs: Overview, Tasks, Notes, Analytics, Settings |
| `ProjectAnalytics`     | Charts for cost/time analysis                     |
| `ProjectSettingsForm`  | Manage billing cycle, currency                    |
| `ProjectDeleteDialog`  | Confirm project deletion                          |

---

## ✅ 6. **Tasks Module Components**

| Component         | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `TaskList`        | Table or list of tasks                      |
| `TaskForm`        | Create/Edit task                            |
| `TaskDetails`     | Task info, DoD, cost, time spent            |
| `TaskKanbanBoard` | `/tasks/board` visual layout                |
| `TaskCard`        | Individual task in Kanban column            |
| `TaskFilters`     | Filter by status, project, assignee         |
| `TaskReport`      | Table/chart of cost & time per user/project |
| `TaskTimer`       | Optional duration tracker for active tasks  |

---

## 📝 7. **Notes Module Components**

| Component           | Purpose                       |
| ------------------- | ----------------------------- |
| `NoteList`          | All notes (filterable)        |
| `NoteForm`          | Create/Edit form              |
| `NoteViewer`        | Markdown or rich-text display |
| `NoteFilters`       | Filter by visibility/status   |
| `NoteEditorToolbar` | Toolbar for text formatting   |
| `PublicNoteCard`    | For `/notes/public` page      |

---

## 👥 8. **Users Module Components**

| Component          | Purpose                             |
| ------------------ | ----------------------------------- |
| `UserList`         | Table view of all users             |
| `UserFilters`      | Search by role/status               |
| `UserForm`         | Create/Edit user form               |
| `UserProfileCard`  | Display role, status, last login    |
| `UserSessionsList` | Active sessions with revoke buttons |
| `UserActivityList` | Activity log for a single user      |

---

## 🧑‍🎨 9. **Profile Module Components**

| Component           | Purpose                           |
| ------------------- | --------------------------------- |
| `ProfileOverview`   | User’s bio, avatar, summary       |
| `ProfileForm`       | Edit personal details             |
| `PreferencesForm`   | Timezone, language, theme toggles |
| `NotificationsForm` | Manage email/desktop alerts       |
| `PrivacyForm`       | Manage visibility settings        |
| `SocialLinksForm`   | Manage connected accounts         |

---

## 🧾 10. **Activities Module Components**

| Component             | Purpose                    |
| --------------------- | -------------------------- |
| `ActivityList`        | Global or personal logs    |
| `ActivityFilters`     | Filter by module/user/date |
| `ActivityDiffViewer`  | Compare old/new values     |
| `ActivityDetailsCard` | View single audit entry    |

---

## 🔐 11. **Sessions Module Components**

| Component             | Purpose                     |
| --------------------- | --------------------------- |
| `SessionList`         | Active sessions list        |
| `RevokedSessionList`  | Revoked sessions view       |
| `SessionDetails`      | IP, agent, login timestamps |
| `RevokeSessionButton` | Action component            |

---

## ⚙️ 12. **Settings Module Components**

| Component              | Purpose                       |
| ---------------------- | ----------------------------- |
| `SettingsList`         | Categories list               |
| `SystemSettingsForm`   | Manage system-wide values     |
| `AdminSettingsForm`    | Keys and admin configs        |
| `UserSettingsForm`     | Personal-level preferences    |
| `SettingsCategoryTabs` | Navigation between categories |
| `SettingEditor`        | Edit individual key/value     |
| `SettingSearchBar`     | Filter settings quickly       |

---

## 🔄 13. **Password Reset Tokens Module Components**

| Component                   | Purpose                    |
| --------------------------- | -------------------------- |
| `PasswordResetTokenList`    | Admin list of reset tokens |
| `PasswordResetTokenDetails` | Inspect individual token   |

---

## 🧩 14. **Admin Components**

| Component             | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `AdminDashboardCards` | System metrics summary                          |
| `AdminUserTable`      | Overview of all users (reuse from Users module) |
| `AdminSettingsPanel`  | Manage global configs                           |
| `AdminAuditSummary`   | Logs overview                                   |
| `SystemHealthWidget`  | Uptime, sessions, errors                        |

---

## 💡 15. **Misc / Utility Components**

| Component          | Purpose                         |
| ------------------ | ------------------------------- |
| `MeDashboard`      | Personalized user dashboard     |
| `GlobalSearch`     | Unified search modal            |
| `HelpCenter`       | Docs and FAQ                    |
| `AboutPageContent` | App version, credits info       |
| `FeedbackForm`     | (Optional) Submit user feedback |
| `ThemeToggle`      | Dark/light mode switch          |

---

## 🧩 16. **Structural Helpers**

| Component            | Purpose                                 |
| -------------------- | --------------------------------------- |
| `ProtectedRoute`     | Checks authentication for private pages |
| `RoleGuard`          | Restricts access based on role          |
| `ErrorPage`          | 404/403/500                             |
| `LoadingSkeleton`    | Placeholder for async content           |
| `PaginationControls` | Reusable pagination                     |
| `FilterBar`          | Combined filters for tables             |
| `SortDropdown`       | Sorting component                       |

---

## ✅ **Total Estimated Components**

| Type                 | Count (approx.)              |
| -------------------- | ---------------------------- |
| Global UI / Layout   | 30                           |
| Module-specific      | 60–70                        |
| Structural / Utility | 10                           |
| **Total**            | **≈100 reusable components** |

```
/components
 ├─ ui/
 ├─ layouts/
 ├─ projects/
 ├─ tasks/
 ├─ notes/
 ├─ users/
 ├─ profile/
 ├─ settings/
 ├─ activities/
 ├─ sessions/
 ├─ admin/
 └─ common/
```
