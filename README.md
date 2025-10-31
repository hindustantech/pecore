
# my-project

## Project Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update `.env` with your MongoDB URI, JWT secret, and email credentials

3. **Run the Application**
   - Development mode: `npm run dev`
   - Production mode: `npm start`

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Lint Code**
   ```bash
   npm run lint
   ```

## Project Structure
- `src/config/`: Configuration files
- `src/controllers/`: Request handlers
- `src/models/`: Database schemas
- `src/routes/`: API routes
- `src/middleware/`: Middleware functions
- `src/services/`: Business logic
- `src/utils/`: Utility functions
- `src/logs/`: Log files
- `src/__tests__/`: Test files

## API Endpoints
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/change-password - Change password with OTP
- POST /api/auth/logout - Logout user
