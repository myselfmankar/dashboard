# Stitch Screen Prompts — Notivo Dashboard

> Copy each prompt below into Stitch's `generate_screen_from_text` tool.
> Follow design tokens from `.stitch/DESIGN.md`.
> All screens share: Navy sidebar (210px), white header with search + avatar, Plus Jakarta Sans body.

---

## Screen 1: Login

**Prompt:**

Design a login screen for "Notivo" — a smart pen analytics SaaS platform for schools.

Layout: Split 50/50 — left side is a dark navy (#1A1A1A) panel with the Notivo logo, tagline "Smart Pen Analytics for Schools", a subtle geometric pattern or pen illustration, and a glowing orange (#F47B20) accent stripe. Right side is white with a centered login form.

Login form has:
- "Welcome back" heading in Anton font, 20px
- "Sign in to your dashboard" subtext in Plus Jakarta Sans, 14px, slate-500
- Email input field with floating label
- Password input with show/hide toggle
- "Remember me" checkbox + "Forgot password?" link
- Primary CTA button: "Sign In" — full width, orange (#F47B20), rounded-xl, 44px tall
- "Or continue with" divider with Google sign-in option
- Bottom text: "Don't have an account? Contact your school admin"

Style: Premium SaaS feel, generous whitespace, rounded-xl inputs with 1px slate-200 border, subtle shadow on hover. No gradients on form elements.

---

## Screen 2: Admin Dashboard

**Prompt:**

Design an admin dashboard overview for "Notivo" smart pen analytics platform. Navy sidebar (210px) on left with logo at top, navigation items: Dashboard (active, orange highlight), Teachers, Analytics, Courses, Parents, Timetable, Notifications, Settings. Small user avatar + role at sidebar bottom.

Top header: White, sticky, 56px. Left: page title "Dashboard" in Anton 20px. Right: search bar (rounded-xl, slate-100 bg), notification bell with red dot, user avatar dropdown.

Main content area (slate-50 background) with 20px padding:

Row 1: 4 KPI metric cards in a grid — Total Students (1,247), Active Teachers (34), Attendance Rate (94.2%), Alerts Today (7 in red). Each card: white bg, rounded-2xl, left-colored icon container (40×40, tinted), value in Anton 24px, label in DM Mono 10px uppercase.

Row 2 (2 columns):
- Left: Demographics donut chart (recharts) showing grade distribution (Grade 1-6) with orange/amber/teal palette. Cormorant Garamond heading.
- Right: Weekly Attendance grouped bar chart (recharts) — Present vs Absent bars per day, green/red palette.

Row 3: Full-width "Live Alert Feed" section with orange gradient (#F47B20 → #FB923C) header saying "INTELLIGENCE" with pulsing LIVE badge. Below: 4-5 alert cards with severity dot (red/amber), message text, timestamp in DM Mono, dismiss button.

---

## Screen 3: Teacher Class View

**Prompt:**

Design a teacher's class view dashboard for "Notivo". Same sidebar+header layout but sidebar shows teacher-specific nav: My Classes (active), Student Heatmap, Calendar, Resources.

Content:
Top: Welcome banner with illustration — "Welcome back, Ms. Ahmed" heading (Anton 20px), subtext about today's schedule, right side has a simple pen/notebook line illustration.

Section 1: "Student Heatmap — Grade 4A" (Cormorant Garamond, 18px)
- 8-column CSS grid of student tiles
- Each tile: 80×80px, rounded-xl, student first name (10px), risk score percentage
- Color-coded by risk level: green (0), amber (1-2), red (3-5)
- At-risk tiles have subtle pulse animation
- Click to expand detail panel

Section 2: "This Week's Calendar"
- 5-day horizontal strip (Mon-Fri)
- Time slots 8AM-3PM
- Color-coded class blocks with subject name + room
- Current time indicator line

Right panel (256px, optional): Quick student detail slide-in showing selected student's profile, recent scores, trend sparkline.

---

## Screen 4: Analytics

**Prompt:**

Design a school-wide analytics view for "Notivo". Full data-dense layout.

Row 1: 3 KPI cards — Avg. Pen Activity Score (73%), Concepts Below Threshold (12), Top Performing Class (Grade 5A).

Row 2 (2 columns):
- Left: "Teacher Performance Ranking" table — columns: Rank, Teacher Name, Subject, Avg Score (progress bar), Trend (sparkline). Top 3 highlighted with gold/silver/bronze badges. DM Mono headers.
- Right: "Weak Concept Analysis" horizontal bar chart (recharts) — Subject + Topic labels on Y axis, proficiency % on X axis. Bars color-coded: red (<40%), orange (40-60%), amber (60-75%).

Row 3: Full-width "Student Risk Heatmap" — Plotly heatmap matrix. Rows = students, Columns = subjects. Cell color = risk level. Hover tooltip shows student name, subject, score, trend. Include a color scale legend.

Row 4: "Pen Usage Patterns" — Line chart showing daily pen activity over 30 days with trend line. Below: summary stats in DM Mono.

---

## Screen 5: Parents View

**Prompt:**

Design a parent portal for "Notivo". Warmer, more approachable feel while maintaining the design system.

Top: "Your Children" section with child profile cards (max 3). Each card: avatar circle, child name (Plus Jakarta Sans, 16px bold), grade + class, quick stats row (Attendance %, Avg Score, Risk Level as colored badge).

Section 2: "Upcoming Events" — Timeline-style list with date badges on left, event name + description on right. Include events like Parent-Teacher Conference, Sports Day, Exam Week.

Section 3: "Learning Insights — Subject Performance" — Per child, a grouped horizontal bar chart (recharts) showing subject scores. Bars color-coded: green (80%+), amber (60-79%), red (<60%). Each child's chart in its own card with child name as heading.

Section 4: "Recent Notifications" — Clean list with icon, message, timestamp. Types: attendance alert, grade update, teacher message.

---

## Screen 6: Timetable

**Prompt:**

Design a timetable/schedule view for "Notivo".

Top controls: Week selector (< Week 14 >), view toggle (Week/Day), class/grade filter dropdown.

Main: 5-day weekly grid (Mon-Fri columns).
- Time slots on Y axis: 7:30 AM to 3:30 PM, 30-min intervals
- Class blocks as colored cards within the grid
- Each block shows: Subject name (bold), Teacher name (small), Room number
- Color per subject: Math=blue, Science=green, English=purple, Arabic=teal, PE=orange, Art=pink
- Current time indicator: horizontal orange line with dot
- Break/lunch slots: hatched pattern or grey

Bottom: "Today's Summary" bar showing total periods, free periods, upcoming next class countdown.

---

## Screen 7: Settings

**Prompt:**

Design a settings page for "Notivo" admin dashboard.

Left: Settings navigation (vertical tabs) — Profile, School Info, Notifications, Appearance, Integrations, Security.

Right (main area), showing "Appearance" tab:
- "Theme" section: Light/Dark mode toggle with preview cards showing each mode
- "Accent Color" section: Color picker or preset swatches (current: orange #F47B20)
- "Sidebar" section: Toggle compact mode, show/hide labels
- "Dashboard Layout" section: Drag-and-drop widget arrangement preview

Other tab previews:
- Profile: Avatar upload, name fields, role display, email
- School Info: School name, logo, address, academic year selector
- Notifications: Toggle rows for email/push per event type
- Security: Change password, 2FA toggle, session management

Style: Clean form layout, generous spacing, rounded-xl inputs, orange primary buttons.

---

## Screen 8: Notifications Center

**Prompt:**

Design a notifications center for "Notivo".

Top: Tabs — All | Alerts | Messages | System. Badge counts on each tab. "Mark all read" button right-aligned.

Filter bar: Date range picker, severity filter (Critical/Warning/Info), source filter (System/Teacher/Student).

Main list:
- Each notification: Left icon (color-coded by type), title, description text, timestamp (DM Mono, 9px), read/unread indicator (blue dot).
- Critical alerts have red left border accent
- Hoverable with subtle slate-50 background
- Click expands to full detail with action buttons

Right panel or modal: Notification detail — full message, related student/teacher link, action buttons (Dismiss, Follow Up, View Student Profile).

Bottom: Pagination or infinite scroll indicator.
