# CourseQuest Lite

A modern, AI-powered course search and comparison platform that helps students and educators discover and compare educational courses across various departments and institutions.

## 🌟 Features

- **Advanced Course Search**: Search courses by name, department, level, and other criteria with powerful filtering options
- **Side-by-Side Comparison**: Compare up to 5 courses simultaneously with detailed information
- **AI-Powered Recommendations**: Ask natural language questions to get personalized course recommendations using OpenAI
- **CSV Data Ingestion**: Upload course data via CSV files for easy data management
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS
- **Real-time Filtering**: Dynamic filters for fees, ratings, credits, duration, and more
- **Pagination Support**: Efficient handling of large datasets with pagination

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database (hosted on Neon cloud)
- **OpenAI API** - AI-powered course recommendations
- **CSV-Parse** - CSV file processing
- **Multer** - File upload handling

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client (implied from usage)

## 📁 Project Structure

```
coursequest-lite/
├── backend/
│   ├── db.js                 # Database connection and configuration
│   ├── server.js             # Main Express server setup
│   ├── package.json          # Backend dependencies
│   ├── database/
│   │   └── sample_courses.csv # Sample course data
│   └── routes/
│       ├── ask.js            # AI-powered course search endpoint
│       ├── compare.js        # Course comparison endpoint
│       ├── courses.js        # Course search and filtering endpoint
│       └── ingest.js         # CSV upload and data ingestion endpoint
├── frontend/
│   ├── index.html            # Main HTML file
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── postcss.config.js     # PostCSS configuration
│   └── src/
│       ├── App.jsx           # Main React app component
│       ├── main.jsx          # React app entry point
│       ├── index.css         # Global styles
│       ├── components/
│       │   ├── Filters.jsx   # Course filtering component
│       │   ├── Loader.jsx    # Loading spinner component
│       │   └── ResultsTable.jsx # Course results display
│       └── pages/
│           ├── SearchPage.jsx    # Course search page
│           ├── ComparePage.jsx   # Course comparison page
│           └── AskAIPage.jsx     # AI recommendation page
└── README.md
```

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (Neon cloud recommended)
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```env
   DATABASE_URL=your_neon_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   PORT=4000
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   node server.js
   ```

The backend will run on `http://localhost:4000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## 📊 Database Schema

The application uses a PostgreSQL database with a `courses` table containing the following fields:

- `course_id` (Primary Key)
- `course_name`
- `department`
- `level` (UG/PG)
- `delivery_mode` (online/offline/hybrid)
- `credits`
- `duration_weeks`
- `rating` (0-5)
- `tuition_fee_inr`
- `year_offered`

## 🔌 API Endpoints

### Core Endpoints

- `GET /` - API status check
- `GET /health` - Health check with database connectivity

### Course Management

- `POST /api/ingest` - Upload and process CSV files containing course data
- `GET /api/courses` - Search and filter courses with pagination
  - Query parameters: `q`, `department`, `level`, `delivery_mode`, `min_fee`, `max_fee`, `min_rating`, `max_rating`, `min_credits`, `max_credits`, `min_duration_weeks`, `max_duration_weeks`, `year_offered`, `page`, `per_page`, `sort_by`, `sort_dir`

### Course Comparison

- `GET /api/compare` - Compare multiple courses by IDs
  - Query parameter: `ids` (comma-separated course IDs, max 5)

### AI-Powered Search

- `POST /api/ask` - Natural language course search using OpenAI
  - Body: `{ "query": "your natural language query" }`

## 🎯 Usage

1. **Course Search**: Use the search page to find courses with various filters
2. **Comparison**: Add courses to comparison and view them side-by-side
3. **AI Recommendations**: Ask questions like "Find me computer science courses under 50000 INR with high ratings"
4. **Data Management**: Upload CSV files to add new courses to the database

## 🔧 Development

### Running Tests

```bash
# Backend tests (if implemented)
cd backend
npm test

# Frontend tests (if implemented)
cd frontend
npm test
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in the 'dist' directory
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by OpenAI for AI features
- Database hosted on Neon for reliable PostgreSQL hosting
- UI components styled with Tailwind CSS

## 📞 Support

For support, email support@coursequest.com or create an issue in this repository.

---

**CourseQuest Lite** - Making course discovery smarter and easier! 🚀
