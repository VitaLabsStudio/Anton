# Anton Dashboard - UX Expert Prompt for AI Frontend Generation

**Generated**: December 1, 2025  
**Project**: Antone V1 - Autonomous AI Social Media Manager Dashboard  
**Target Tools**: Vercel v0, Lovable.ai, or similar AI frontend generation tools  
**Tech Stack**: Next.js 14+, TypeScript, Tailwind CSS, Recharts/shadcn/ui

---

## 🎯 HIGH-LEVEL GOAL

Create a comprehensive, professional analytics dashboard for monitoring an AI social media bot's performance across 10 distinct views. The dashboard emphasizes **transparency** (decision-making visibility), **control** (manual approval workflows), and **insight** (KPI trends and learning progress). The aesthetic should be data-driven and healthcare/analytics-focused, NOT consumer social media.

---

## 📋 DETAILED STEP-BY-STEP INSTRUCTIONS

### Phase 1: Foundation & Core Layout (Do This First)

1. **Create the main dashboard layout structure**:
   - Implement a persistent left sidebar navigation (60px collapsed, 240px expanded)
   - Create a top navbar with: Project logo, current view title, date range picker, user profile dropdown
   - Design the main content area with consistent padding (24px desktop, 16px mobile)
   - Add a bottom status bar showing: Last data refresh timestamp, connection status indicator

2. **Design the sidebar navigation**:
   - Icon-first navigation with 10 items:
     - 🎯 Mission Control (Home)
     - 🔍 Filtering Funnel
     - 💰 Revenue Attribution
     - 👥 Customer Journey
     - 📊 Triple Bottom Line KPIs
     - ✍️ Content Quality
     - 🧪 A/B Testing Lab
     - ⚙️ System Health
     - 🏆 Competitive Intelligence
     - 💎 Advocacy & Champions
   - Highlight active view with accent color
   - Show notification badges for alerts (red circle with count)
   - Collapse/expand animation on hover

3. **Establish the design system**:
   - **Colors**: 
     - Primary: Professional blue (#1E40AF)
     - Success/Commercial: Green (#10B981)
     - Warning/Love: Warm orange (#F59E0B)
     - Danger/Safety: Red (#EF4444)
     - Background: Light gray (#F9FAFB)
     - Card background: White (#FFFFFF)
   - **Typography**: 
     - Headings: Inter font, bold, sizes 24px/20px/16px
     - Body: Inter font, regular, 14px
     - Metrics: Tabular numbers, monospace for alignment
   - **Spacing**: 8px grid system (8, 16, 24, 32, 48px)
   - **Shadows**: Subtle card elevation (shadow-sm, shadow-md)

### Phase 2: Build View 1 - Mission Control (Homepage)

4. **Create the Mission Control landing page**:
   - Header section:
     - Large welcome message: "Welcome back, [User]"
     - Current date and time
     - Quick action buttons: "Manual Approve Queue", "Pause Bot", "Emergency Stop"
   
5. **Implement Hero Metrics Cards** (24-hour window):
   - Design 5 large metric cards in a responsive grid (3 cols desktop, 2 cols tablet, 1 col mobile):
     - **Posts Scanned**: Large number (e.g., "23,451"), trend indicator (↑ 12% vs yesterday)
     - **Replies Posted**: Count with breakdown (Helpful: X, Hybrid: Y, Engagement: Z)
     - **CTR (Click-Through Rate)**: Percentage with target indicator (2.0% target)
     - **Revenue**: Dollar amount with sparkline graph showing last 7 days
     - **Safety Score**: Percentage with color coding (>90% green, 75-90% yellow, <75% red)
   - Each card should have:
     - Icon in top-left
     - Metric value (large, bold)
     - Trend arrow and percentage change
     - Mini sparkline chart
     - "View Details" link

6. **Build the Live Activity Feed**:
   - Create a scrollable feed container (max-height: 500px, overflow-y: auto)
   - Design activity item cards showing:
     - Timestamp (relative: "2 minutes ago")
     - Action type icon (scan/filter/analyze/reply)
     - Post excerpt (truncated to 60 chars)
     - Decision score badge (color-coded: Helpful=green, Hybrid=yellow, Engagement=blue, Disengaged=gray)
     - Platform icon (Twitter/Reddit/Threads)
   - Auto-refresh every 5 seconds (use WebSocket or polling)
   - Smooth animation when new items appear (fade in from top)

7. **Create Active Alerts Widget**:
   - Design alert cards with 3 severity levels:
     - **Critical** (red): Platform strikes, safety KPI >1.5× baseline
     - **Warning** (yellow): CTR <1.5%, sentiment <60%
     - **Info** (blue): Queue depth >100, experiment completion
   - Each alert shows:
     - Icon, severity badge, message, timestamp, "Dismiss" button
   - Alerts stack vertically with most recent on top
   - Empty state: "No active alerts - all systems nominal ✅"

### Phase 3: Build View 2 - Filtering Funnel Intelligence

8. **Design the Visual Funnel**:
   - Create a large funnel diagram showing 4 stages:
     - **Stage 1 - Scanned**: "100,000 posts" (100% width)
     - **Stage 2 - Keyword Matched**: "30,000 posts" (30% width)
     - **Stage 3 - Spam Filtered**: "25,000 posts" (25% width)
     - **Stage 4 - Queued for DeepSeek**: "25,000 posts" (25% width)
   - Use gradient colors (blue → purple) for each stage
   - Show conversion rates between stages
   - Add hover tooltips with detailed breakdowns

9. **Create Keyword Performance Table**:
   - Design a sortable, paginated data table with columns:
     - Keyword (left-aligned)
     - Volume (right-aligned, thousands separator)
     - Engagement Rate (percentage, color-coded)
     - Revenue per Keyword (currency format)
     - Trend (mini sparkline)
     - ROI Score (1-5 stars visual)
   - Add search/filter bar above table
   - Highlight top 10 performers with subtle background color
   - Export to CSV button in top-right

10. **Platform Breakdown Section**:
    - Create 3 donut charts side-by-side:
      - Twitter match rate
      - Reddit match rate
      - Threads match rate
    - Show percentage inside donut, total volume below
    - Add legend with color coding

### Phase 4: Build View 3 - Revenue Attribution

11. **Build the Conversion Funnel Visualization**:
    - Design a horizontal funnel with 5 stages:
      - Impression (views of reply)
      - Reply Click
      - Landing Page Visit
      - Add to Cart
      - Conversion (purchase)
    - Show counts at each stage with drop-off percentages
    - Use arrow transitions between stages

12. **Create Top Revenue-Generating Replies List**:
    - Design cards for top 10 replies showing:
      - Rank badge (1st/2nd/3rd with medals)
      - Reply excerpt (first 100 chars)
      - Platform icon
      - Archetype badge
      - Revenue generated (large, bold)
      - CTR percentage
      - "View Full Context" button (opens modal with complete thread)
    - Horizontal scroll on mobile

13. **Revenue Attribution Breakdown**:
    - Create 3 side-by-side bar charts:
      - **By Archetype**: Horizontal bars showing revenue per archetype
      - **By Platform**: Twitter vs Reddit vs Threads revenue
      - **By Time-of-Day**: 24-hour heatmap showing best times

### Phase 5: Build View 4 - Customer Journey

14. **Design Lifecycle Stages Visualization**:
    - Create a flow diagram showing:
      - **New** (first engagement)
      - **Engaged** (2-5 interactions)
      - **Converted** (made purchase)
      - **Loyal** (repeat purchase)
    - Show user counts in each stage
    - Arrows between stages with conversion percentages
    - Click to filter users in each stage

15. **Implement Cohort Retention Chart**:
    - Create a heatmap table showing:
      - Rows: Cohorts by month (e.g., "Jan 2025 cohort")
      - Columns: Weeks since first interaction (Week 0, 1, 2, 3, 4...)
      - Cells: Retention percentage (color gradient: dark green = 100%, white = 0%)
    - Add legend explaining colors

16. **Create Time-to-Conversion Histogram**:
    - Design a bar chart showing:
      - X-axis: Time buckets (<1 day, 1-3 days, 3-7 days, 1-2 weeks, 2-4 weeks, >1 month)
      - Y-axis: Number of conversions
      - Highlight median time-to-conversion with vertical line

### Phase 6: Build View 5 - Triple Bottom Line KPIs

17. **Design the 3-Column Scorecard**:
    - Create 3 equal-width columns:
      - **Commercial KPIs** (green theme)
      - **Love KPIs** (orange theme)
      - **Safety KPIs** (red theme)
    - Each column shows 3 key metrics with:
      - Metric name
      - Current value (large)
      - Target value (smaller, below)
      - Progress bar (target = 100%)
      - 30-day trend line (sparkline)
      - Status indicator (✅ On target, ⚠️ Below target, ❌ Critical)

18. **Commercial KPIs Section**:
    - CTR (Click-Through Rate): Target >2%
    - Conversion Rate: Target >8%
    - Revenue per Reply: Target >$0.50

19. **Love KPIs Section**:
    - Thanks/Likes per Reply: Target >12%
    - Positive Sentiment Score: Target >75%
    - Unsolicited Follows per 100 Replies: Target >3

20. **Safety KPIs Section**:
    - Removal/Report Rate vs Baseline: Target <1.0×
    - Platform Strikes: Target = 0
    - Reddit Karma Trajectory: Target +50/month

### Phase 7: Build View 6 - Content Quality Insights

21. **Create Archetype Performance Comparison**:
    - Design a grouped bar chart comparing all 8 archetypes:
      - Checklist
      - Myth-bust
      - Coach
      - Storylet
      - Humor-light
      - Credibility-anchor
      - Confident Recommender
      - Problem-Solution Direct
    - Show 3 metrics per archetype: CTR, Love Score, Revenue
    - Use different colors for each metric
    - Add legend

22. **Content Pattern Correlations Section**:
    - Create scatter plots showing:
      - **Reply Length vs Engagement**: X-axis = character count, Y-axis = engagement rate
      - **Emoji Usage vs Love Score**: X-axis = emoji count, Y-axis = positive sentiment
      - **Question Marks vs Reply Rate**: X-axis = questions asked, Y-axis = user response rate
    - Add trend lines and correlation coefficients

23. **Tone Analysis Distribution**:
    - Design a pie chart showing tone distribution:
      - Empathetic (40%)
      - Educational (30%)
      - Humorous (15%)
      - Assertive (10%)
      - Neutral (5%)
    - Show sample reply for each tone on hover

### Phase 8: Build View 7 - A/B Testing Lab

24. **Design Active Experiment Cards**:
    - Create cards for each running experiment showing:
      - Experiment name
      - Start date and duration remaining
      - Hypothesis statement
      - Variant A vs Variant B preview
      - Current sample size (e.g., "1,247 users")
      - Statistical confidence meter (0-100%, color-coded)
      - Leading variant indicator (if confidence >80%)
      - "Stop Experiment" button (requires confirmation)
    - Grid layout (2 cols desktop, 1 col mobile)

25. **Implement Results Archive**:
    - Create a searchable list of completed experiments:
      - Date range filter
      - Search by experiment name
      - Sortable by confidence level
      - Click to expand full results
      - Export results to PDF button

26. **Add "Create New Experiment" Flow**:
    - Design a multi-step modal:
      - Step 1: Name experiment, state hypothesis
      - Step 2: Define variants (A and B)
      - Step 3: Choose target metric (CTR, Sentiment, Revenue)
      - Step 4: Set traffic split (default 50/50)
      - Step 5: Set duration (7-14 days recommended)
      - Step 6: Review and launch
    - Show guardrails warnings (e.g., "Cannot test prohibited terms")

### Phase 9: Build View 8 - System Health

27. **Create Component Status Grid**:
    - Design status indicators for 8 components:
      - Stream Monitor Worker
      - Decision Engine API
      - Dashboard API
      - PostgreSQL Database
      - Twitter API Connection
      - Reddit API Connection
      - Threads API Connection
      - DeepSeek R1 API
    - Each component shows:
      - Name
      - Status badge (Online=green, Offline=red, Degraded=yellow)
      - Uptime percentage (last 24hr)
      - Last health check timestamp
      - "View Logs" button

28. **Design Real-Time Queue Metrics**:
    - Create gauges showing:
      - **Queue Depth**: Posts waiting for processing (0-1000 scale)
      - **Average Wait Time**: Time from post detection to reply (0-120 min scale)
      - **Processing Rate**: Posts per minute (0-50 scale)
    - Use semi-circle gauge visualizations
    - Color-code based on thresholds (green/yellow/red)

29. **Implement Cost Tracking Dashboard**:
    - Design a card showing:
      - **Today's DeepSeek Spend**: $X.XX / $Y.YY budget
      - Progress bar (visual budget usage)
      - **Monthly Spend**: $XX.XX / $35.00 budget
      - **Projected Month-End**: $XX.XX (based on current burn rate)
      - Breakdown by operation (Analysis: $X, Generation: $Y)
    - Add warning if projected to exceed budget

30. **Create Error Logs Table**:
    - Design a scrollable table showing recent errors:
      - Timestamp
      - Component
      - Error message (truncated, expandable)
      - Severity (Critical/Warning/Info)
      - Status (Open/Resolved)
      - "View Stack Trace" button
    - Filter by severity and component
    - Auto-refresh every 30 seconds

### Phase 10: Build View 9 - Competitive Intelligence

31. **Design Share of Voice Chart**:
    - Create a multi-line time series chart showing:
      - Vita mentions (blue line)
      - LiquidIV mentions (purple line)
      - ZBiotics mentions (green line)
      - Drip Drop mentions (orange line)
      - Pedialyte mentions (red line)
    - X-axis: Last 90 days
    - Y-axis: Mention count
    - Legend with toggles to show/hide competitors
    - Highlight Vita's line with thicker stroke

32. **Create Competitor Mention Breakdown**:
    - Design a horizontal bar chart showing:
      - Total mentions per competitor (last 30 days)
      - Sort by volume (descending)
      - Show percentage of total market conversation
      - Click bar to filter for that competitor in other views

33. **Build Competitive Conversion Opportunities Table**:
    - Create a data table showing posts where:
      - Competitor mentioned
      - User expressed dissatisfaction
      - Anton replied with positioning
      - Outcome (clicked/converted/ignored)
    - Columns: Post excerpt, Competitor, Sentiment, Anton's reply, Outcome, Revenue
    - Filter by competitor and outcome
    - "Take Action" button to manually reply if opportunity missed

34. **Design Market Intelligence Insights Panel**:
    - Create 3 insight cards:
      - **Top Competitor Complaints**: List top 5 complaints (e.g., "Too expensive", "Tastes bad")
      - **Product Gaps**: Unmet needs analysis (e.g., "Users want faster-acting solutions")
      - **Sentiment Comparison**: Bar chart showing sentiment scores (Vita vs competitors)
    - Auto-generated weekly insights with AI summary

35. **Implement Competitive Reply Queue**:
    - Design an approval interface showing:
      - Original post mentioning competitor
      - Competitor detected badge
      - Positioning opportunity score (0-100)
      - Generated defensive reply preview
      - Comparison highlight (Vita's advantage)
      - Action buttons: "Approve", "Edit & Approve", "Skip"
    - Counter showing replies today vs 5/day limit

### Phase 11: Build View 10 - Advocacy & Community Champions

36. **Create Community Champions Leaderboard**:
    - Design a ranked list (top 20) showing:
      - Rank number (1-20)
      - User avatar placeholder (first letter of handle)
      - Handle (@username)
      - Platform icon
      - Champion tier badge (Bronze/Silver/Gold medal)
      - Engagement count (e.g., "12 positive interactions")
      - Sentiment score (0.0-1.0, displayed as percentage)
      - Last interaction timestamp
      - DM status (Not sent/Sent/Accepted/Declined)
      - Quick action dropdown: "Send DM", "Promote Tier", "View Profile"
    - Pagination (20 per page)
    - Search by handle

37. **Design DM Campaign Performance Dashboard**:
    - Create 4 metric cards showing:
      - **Sent**: Total DMs sent (e.g., "127 DMs")
      - **Accepted**: Percentage (e.g., "42% accepted samples")
      - **Declined**: Percentage (e.g., "18% declined")
      - **Converted**: Percentage (e.g., "23% purchased")
    - Add a funnel visualization below showing: Sent → Accepted → Converted
    - Calculate ROI: (Revenue from conversions) / (Sample costs)

38. **Build Advocate Impact Tracking Section**:
    - Design cards showing:
      - **User-Generated Content**: Count of unprompted Vita mentions (e.g., "47 organic posts")
      - **Reach**: Total impressions from advocate posts (e.g., "234,567 impressions")
      - **Amplification Factor**: Advocate reach / Direct Anton reach (e.g., "3.2× multiplier")
    - Timeline view showing recent advocate posts with preview

39. **Create Power User Engagement Status**:
    - Design a table showing active power users (>5k followers):
      - Handle, Follower count, Platform
      - Engagement status (Active/Inactive)
      - Gift samples sent (Yes/No, Date)
      - Response rate (percentage)
      - Conversion status (Pending/Converted)
      - Last engagement date
    - Filter by platform and engagement status

40. **Design Testimonial Library**:
    - Create a grid of testimonial cards:
      - Quote text (truncated to 120 chars, expandable)
      - Author handle (anonymized option: "User from Twitter")
      - Date submitted
      - Performance metrics (How many times used, CTR when used)
      - Status badge (Approved/Pending/Archived)
      - Actions: "Use in Reply", "Archive", "Edit"
    - Add "Submit New Testimonial" button
    - Search and filter by keyword

41. **Implement Viral Content Tracking**:
    - Design cards showing top 10 most-shared Anton replies:
      - Rank (1-10)
      - Reply text (full)
      - Platform
      - Original post context
      - Screenshot-worthy score (0-100, based on engagement + shares)
      - Engagement metrics: Likes, Shares, Saves
      - Share count with platforms (Twitter retweets, Reddit crosspost count)
    - "View Thread" button to see full context

### Phase 12: Global Features & Polish

42. **Implement Date Range Picker**:
    - Create a global date range selector in top navbar
    - Preset options: Today, Yesterday, Last 7 days, Last 30 days, Last 90 days, Custom
    - Calendar popup for custom range
    - Apply button updates all dashboard views
    - Show "Loading..." state during data refresh

43. **Add Export Capabilities**:
    - Add "Export" button to each view (top-right)
    - Export options: CSV, PDF, JSON
    - Generate filename with view name and date range
    - Show download progress toast notification

44. **Design Real-Time Updates**:
    - Implement WebSocket connection indicator in top navbar
    - Show "Connected" (green) or "Reconnecting..." (yellow)
    - Auto-refresh critical data every 30 seconds
    - Smooth transition animations for updating numbers (count up/down effect)

45. **Create Mobile Responsive Breakpoints**:
    - Desktop: 1280px+ (3-column layouts)
    - Tablet: 768px-1279px (2-column layouts)
    - Mobile: <768px (1-column layouts, collapsible navigation)
    - Test all views at all breakpoints
    - Ensure touch-friendly buttons (min 44px tap target)

46. **Add Loading & Empty States**:
    - Design skeleton loaders for each view (animated placeholders)
    - Create empty state illustrations with helpful messages:
      - "No data yet - check back soon"
      - "No experiments running - create your first one!"
      - "No champions yet - keep engaging!"
    - Add retry button for failed API calls

47. **Implement Dark Mode (Optional)**:
    - Create dark theme color palette
    - Toggle in user profile dropdown
    - Persist preference in localStorage
    - Ensure all charts and data visualizations work in dark mode

---

## 🔧 CODE EXAMPLES, DATA STRUCTURES & CONSTRAINTS

### Tech Stack Requirements

```typescript
// Required dependencies
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "recharts": "^2.10.0", // For all charts
    "shadcn/ui": "latest", // For UI components
    "date-fns": "^2.30.0", // For date formatting
    "lucide-react": "^0.292.0" // For icons
  }
}
```

### API Data Structure Examples

```typescript
// Mission Control Hero Metrics
interface HeroMetrics {
  postsScanned: {
    value: number;
    trend: number; // percentage change
    sparkline: number[]; // last 7 days
  };
  repliesPosted: {
    value: number;
    breakdown: {
      helpful: number;
      hybrid: number;
      engagement: number;
    };
  };
  ctr: {
    value: number; // percentage (e.g., 2.4)
    target: number; // (e.g., 2.0)
  };
  revenue: {
    value: number; // dollars
    sparkline: number[];
  };
  safetyScore: {
    value: number; // percentage (e.g., 94.5)
    status: 'healthy' | 'warning' | 'critical';
  };
}

// Live Activity Feed Item
interface ActivityItem {
  id: string;
  timestamp: Date;
  action: 'scan' | 'filter' | 'analyze' | 'reply';
  postExcerpt: string;
  decisionScore: number;
  mode: 'helpful' | 'hybrid' | 'engagement' | 'disengaged';
  platform: 'twitter' | 'reddit' | 'threads';
  authorHandle: string;
}

// Competitive Intelligence Data
interface CompetitorData {
  name: string;
  mentions: number;
  sentiment: number; // -1 to 1
  topComplaints: Array<{ complaint: string; count: number }>;
  positioningOpportunities: number;
}

// Community Champion
interface Champion {
  handle: string;
  platform: 'twitter' | 'reddit' | 'threads';
  tier: 'bronze' | 'silver' | 'gold';
  engagementCount: number;
  sentimentScore: number;
  lastInteraction: Date;
  dmStatus: 'not_sent' | 'sent' | 'accepted' | 'declined';
  followerCount?: number; // for power users
}
```

### Design Constraints

**DO:**
- Use Inter font exclusively
- Maintain 8px spacing grid
- Keep card borders at 1px solid #E5E7EB
- Use Recharts for ALL data visualizations (consistency)
- Implement responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Add hover states to all interactive elements
- Use skeleton loaders during data fetching
- Implement error boundaries for each view

**DO NOT:**
- Mix chart libraries (use Recharts only)
- Use custom fonts (stick to Inter)
- Create buttons smaller than 44px tap target
- Use complex animations (keep it snappy and professional)
- Hardcode data (all data must come from API props)
- Use inline styles (Tailwind classes only)
- Create new color schemes (use the defined palette)

### Routing Structure

```typescript
// App Router (Next.js 14)
app/
  dashboard/
    page.tsx                // View 1: Mission Control
    filtering/
      page.tsx              // View 2: Filtering Funnel
    revenue/
      page.tsx              // View 3: Revenue Attribution
    customers/
      page.tsx              // View 4: Customer Journey
    kpis/
      page.tsx              // View 5: Triple Bottom Line
    content/
      page.tsx              // View 6: Content Quality
    experiments/
      page.tsx              // View 7: A/B Testing Lab
    health/
      page.tsx              // View 8: System Health
    competitive/
      page.tsx              // View 9: Competitive Intelligence
    advocacy/
      page.tsx              // View 10: Advocacy & Champions
    layout.tsx              // Shared layout with sidebar
```

---

## 📏 STRICT SCOPE

### Files to Create

1. **Layout & Navigation** (3 files):
   - `app/dashboard/layout.tsx` - Sidebar and top navbar
   - `components/Sidebar.tsx` - Navigation component
   - `components/Navbar.tsx` - Top bar component

2. **View Components** (10 files):
   - `app/dashboard/page.tsx` - Mission Control
   - `app/dashboard/filtering/page.tsx` - Filtering Funnel
   - `app/dashboard/revenue/page.tsx` - Revenue Attribution
   - `app/dashboard/customers/page.tsx` - Customer Journey
   - `app/dashboard/kpis/page.tsx` - Triple Bottom Line
   - `app/dashboard/content/page.tsx` - Content Quality
   - `app/dashboard/experiments/page.tsx` - A/B Testing Lab
   - `app/dashboard/health/page.tsx` - System Health
   - `app/dashboard/competitive/page.tsx` - Competitive Intelligence
   - `app/dashboard/advocacy/page.tsx` - Advocacy & Champions

3. **Shared Components** (15+ files):
   - `components/MetricCard.tsx` - Reusable metric display
   - `components/ActivityFeed.tsx` - Live feed component
   - `components/AlertWidget.tsx` - Alert display
   - `components/FunnelChart.tsx` - Funnel visualization
   - `components/DataTable.tsx` - Sortable table
   - `components/ExportButton.tsx` - CSV/PDF export
   - `components/DateRangePicker.tsx` - Date selector
   - `components/StatusBadge.tsx` - Status indicators
   - `components/LoadingSkeleton.tsx` - Loading states
   - `components/EmptyState.tsx` - No data states
   - And more as needed...

4. **Utilities** (3 files):
   - `lib/formatters.ts` - Number, currency, date formatting
   - `lib/api.ts` - API fetch helpers
   - `lib/constants.ts` - Color codes, thresholds

### Files to NOT Touch

- **Backend Files**: Do NOT create any API routes or server logic
- **Database Files**: Do NOT create Prisma schemas or migrations
- **Authentication**: Do NOT implement auth logic (assume user is authenticated)
- **State Management**: Keep it simple with React state/context, no Redux needed initially
- **Testing Files**: Do NOT create test files (focus on UI implementation)

### Critical Requirements

- **All data must be passed as props** - Components receive data from parent, no direct API calls in components
- **Responsive first** - Mobile layout must work perfectly
- **Accessibility** - Use semantic HTML, ARIA labels where needed
- **Performance** - Lazy load heavy components, memoize expensive calculations
- **Type Safety** - Every component must have TypeScript interfaces defined

---

## 🎨 VISUAL STYLE GUIDE

### Color Palette

```typescript
const colors = {
  // Primary Brand
  primary: '#1E40AF',      // Blue 700
  primaryHover: '#1E3A8A', // Blue 800
  
  // Status Colors
  success: '#10B981',      // Green 500
  warning: '#F59E0B',      // Amber 500
  danger: '#EF4444',       // Red 500
  info: '#3B82F6',         // Blue 500
  
  // Neutrals
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Chart Colors (8 distinct colors for archetypes)
  chart: [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Green
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
  ]
};
```

### Typography Scale

```css
/* Headings */
.heading-1 { font-size: 24px; font-weight: 700; line-height: 32px; }
.heading-2 { font-size: 20px; font-weight: 600; line-height: 28px; }
.heading-3 { font-size: 16px; font-weight: 600; line-height: 24px; }

/* Body */
.body-large { font-size: 16px; font-weight: 400; line-height: 24px; }
.body-base { font-size: 14px; font-weight: 400; line-height: 20px; }
.body-small { font-size: 12px; font-weight: 400; line-height: 16px; }

/* Metrics */
.metric-large { font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
.metric-medium { font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
```

### Spacing System

Use Tailwind's spacing scale based on 4px (0.25rem):
- `p-1` = 4px
- `p-2` = 8px
- `p-3` = 12px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px
- `p-12` = 48px

---

## ✅ FINAL CHECKLIST

Before submitting the generated code, ensure:

- [ ] All 10 views are implemented and navigable
- [ ] Sidebar navigation works with active state highlighting
- [ ] Date range picker updates all views
- [ ] All metric cards show real data (from props)
- [ ] Charts render correctly with Recharts
- [ ] Tables are sortable and paginated
- [ ] Mobile responsive layouts work (test at 375px width)
- [ ] Loading skeletons display during data fetch
- [ ] Empty states show when no data available
- [ ] Export buttons are present (functionality can be stubbed)
- [ ] All colors match the defined palette
- [ ] Typography uses Inter font exclusively
- [ ] No console errors or TypeScript warnings
- [ ] Components are properly typed with interfaces
- [ ] Code is formatted and readable

---

## 🚨 IMPORTANT REMINDER

**All AI-generated code requires careful human review, testing, and refinement to be considered production-ready.**

This dashboard will display sensitive business data and must be:
- Security audited before production deployment
- Performance tested with real data volumes
- Accessibility tested with screen readers
- Cross-browser tested (Chrome, Firefox, Safari, Edge)
- Penetration tested for vulnerabilities

The generated UI is a starting point. Expect to iterate, refine, and enhance based on user feedback and real-world usage.

---

**End of Prompt** ✨

Use this prompt with Vercel v0, Lovable.ai, or similar AI frontend generation tools. Break it down into sections if the tool has token limits, starting with Phase 1 and progressing through each phase sequentially.

