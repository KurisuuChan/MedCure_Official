# MedCure 💊

A modern, intuitive, and efficient pharmacy management solution built with the latest web technologies. MedCure provides a seamless experience for managing sales, inventory, and customer data.

-----

## ✨ Features

  * **Dashboard:** Get a quick overview of your pharmacy's performance.
  * **Point of Sales (POS):** A simple and efficient interface for processing transactions.
  * **Management:** Manage your inventory, staff, and other resources.
  * **Notifications:** Stay updated with important alerts.
  * **Secure Authentication:** Powered by Supabase for secure login and user management.
  * **Responsive Design:** A clean and responsive UI that works on all devices.

-----

## 🚀 Tech Stack

  * **Frontend:** [React](https://react.dev/), [Vite](https://vitejs.dev/)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  * **Backend & Database:** [Supabase](https://supabase.com/)
  * **Routing:** [React Router](https://reactrouter.com/)
  * **Icons:** [Lucide React](https://lucide.dev/)

-----

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine (v20.19.0 or higher is recommended). This will include `npm`.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/bulsu-santiagocs/medcure-official.git
    cd medcure-official
    ```

2.  **Install dependencies:**
    Use npm to install the required packages from `package.json`.

    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    This project uses Supabase for its backend services. You'll need to create your own Supabase project to get the necessary API keys.

      * Create a `.env` file in the root of the project.
      * Add your Supabase URL and Anon Key to the `.env` file:
        ```
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```

-----

## 📜 Available Scripts

In the project directory, you can run the following commands:

  * `npm run dev`
    Runs the app in development mode. Open [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) (or the address shown in your terminal) to view it in the browser. The page will automatically reload if you make edits.

  * `npm run build`
    Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

  * `npm run preview`
    Serves the production build from the `dist` folder for you to preview locally.

  * `npm run lint`
    Lints the project files for any code-style issues.

-----

Enjoy using **MedCure**\! 🌟
