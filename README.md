# Test Automation ROI Intelligence Platform

This project is a full-stack Test Automation ROI (Return on Investment) dashboard designed to help engineering managers and QA leads balance engineering overhead against pipeline execution gains. It identifies brittle targets and tracks net team hours saved by automating test scenarios.

## ✨ Key Features

*   **Persistent Storage**: Save multiple scenarios and dashboards to your account using Supabase.
*   **Auth Integration**: Secure login/signup to manage your private ROI data.
*   **Real-time Calculations**: Instant feedback on Break-even points, Net Savings, and Risk flags.
*   **Interactive Visuals**: Resource vector charts to visualize manual vs. automation effort.
*   **Multi-scenario Management**: Add, remove, and categorize test cases with ease.
*   **Professional PDF Export**: Generate comprehensive PDF reports of your dashboard.

## 🚀 Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Database & Auth**: Supabase (PostgreSQL)
*   **Styling**: Tailwind CSS
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Charts**: Chart.js with React-Chartjs-2
*   **PDF Export**: jsPDF + html2canvas

## 🛠️ Setup Instructions

Follow these steps to get the project up and running locally.

### 1. Supabase Project Setup

1.  **Create a Supabase Project**:
    *   Go to [Supabase](https://supabase.com/) and create a new project.
    *   Note down your `Project URL` and `anon public` key from **Project Settings > API**.

2.  **Database Schema**:
    *   In your Supabase project dashboard, navigate to the **SQL Editor**.
    *   Run the following SQL script to create the `scenarios` table and enable Row Level Security (RLS):

    ```sql
    -- CREATE THE SCENARIOS TABLE
    CREATE TABLE scenarios (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      manual_mins FLOAT DEFAULT 0,
      frequency FLOAT DEFAULT 0,
      dev_hours FLOAT DEFAULT 0,
      maint_hours FLOAT DEFAULT 0,
      is_flaky BOOLEAN DEFAULT false,
      is_visual BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- ENABLE ROW LEVEL SECURITY
    ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

    -- POLICIES
    CREATE POLICY "Users can view their own scenarios" 
    ON scenarios FOR SELECT 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own scenarios" 
    ON scenarios FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own scenarios" 
    ON scenarios FOR UPDATE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own scenarios" 
    ON scenarios FOR DELETE 
    USING (auth.uid() = user_id);
    ```

3.  **Authentication Settings**:
    *   For local development and testing, you might want to disable email confirmation. Go to **Authentication > Providers > Email** and toggle "Confirm email" to OFF.

### 2. Environment Variables

Create a `.env` file in the root of your project and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_public_key` with the values you obtained from your Supabase project settings.

### 3. Installation

Install the project dependencies:

```bash
npm install --legacy-peer-deps
```
*Note: `--legacy-peer-deps` is used to bypass potential peer dependency conflicts with React 19 release candidates.*

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 💡 Usage

1.  **Sign Up / Log In**: Upon first access, you'll be redirected to the authentication page. Create an account or sign in.
2.  **Manage Scenarios**:
    *   Use the table to input details for each test scenario: `Manual Mins`, `Runs/Mo`, `Dev Hrs`, `Maint Hrs`.
    *   Toggle `Flaky` or `Visual` flags to mark high-risk scenarios.
    *   Observe real-time calculations for `Break-Even` and `Recommendation`.
    *   Add new scenarios with the "New Scenario" button.
    *   Remove scenarios using the trash icon.
3.  **Monitor KPIs**: The KPI cards at the top provide an overview of `Net Monthly Savings`, `Total Upfront Hours`, `Average Break-Even`, and `Viable Targets`.
4.  **Visualize Data**: The "Resource Vectors" chart dynamically updates to show the manual effort vs. maintenance tax for each scenario.
5.  **Save & Export**:
    *   Click "Save" to persist your current scenarios to your Supabase account.
    *   Click "Export PDF" to generate a PDF report of your dashboard.

## 🤝 Contributing

Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.