# Volt Code AGI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/motherskitchenblr2/CODE-EDITOR-V5-DESIGNARENA-AI.git
cd CODE-EDITOR-V5-DESIGNARENA-AI

# Install dependencies (includes new backend packages)
npm install
```

### 2️⃣ Set Up Supabase

1. **Create a Supabase project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name and region
   - Wait for project to initialize

2. **Get your credentials:**
   - Go to Project Settings (gear icon)
   - Navigate to "API" section
   - Copy these values:
     - **Project URL** → `SUPABASE_URL`
     - **anon (public) key** → `SUPABASE_ANON_KEY`
     - **service_role (secret) key** → `SUPABASE_SERVICE_KEY`

3. **Run the database schema:**
   - In Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Copy and paste the entire content of `database/schema.sql`
   - Click "Run"

### 3️⃣ Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# You can use any text editor, or run:
nano .env

# Add your Supabase credentials:
SUPABASE_URL=your-project-url-from-supabase
SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_KEY=your-service-key-from-supabase

# Save and exit (Ctrl+O, Enter, Ctrl+X in nano)
```

### 4️⃣ Start the Servers

#### Option A: Run Both Servers Together

```bash
# This starts both frontend (Vite) and backend (Express) in parallel
npm run dev:full
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)
- **Socket.io:** [http://localhost:3001](http://localhost:3001)

#### Option B: Run Servers Separately

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5️⃣ Explore Volt Code AGI

Open your browser and navigate to:

- **[Code Editor](http://localhost:5173/)** - Original code editor with AI analysis
- **[Agent Team](http://localhost:5173/agents)** - View all agents, their status, and tasks
- **[Agent Orchestrator](http://localhost:5173/agent-orchestrator)** - Central hub for managing all agents

## 🎯 What You'll See

### Agent Team Page (`/agents`)
- **Overview of all 8 agents** organized by tab (Editor, GitHub, Dashboard)
- **Real-time status indicators** (Idle, Busy, Error, Offline)
- **Task lists** for each tab
- **Quick actions** to create tasks

### Agent Orchestrator Page (`/agent-orchestrator`)
- **Central dashboard** with system statistics
- **Agent grid** showing all agents with live status
- **Task management** across all agents
- **Chat interface** to communicate with agents
- **Tab switching** between Editor, GitHub, and Dashboard views

### Editor Tab Agents
- **Editor Agent** - Write and refactor code
- **Security Agent** - Scan for vulnerabilities
- **Code Monitor Agent** - Monitor code quality and drift

### GitHub Tab Agents
- **PR Agent** - Create and manage pull requests
- **Branch & Conflict Agent** - Manage branches and resolve conflicts
- **Bug Fix Agent** - Triage and fix bugs
- **Dependency Agent** - Update and manage dependencies

### Dashboard
- **Orchestrator Agent** - Coordinates all other agents

## 📡 Socket.io Events in Action

Watch for these real-time events:

1. **Agent Status Updates** - Agents change from "offline" to "idle" as they connect
2. **Heartbeats** - Every 10 seconds, agents send heartbeat signals
3. **Task Assignments** - Tasks are automatically assigned to appropriate agents
4. **Messages** - Agents communicate with each other and with you
5. **Vulnerability Alerts** - Security agent detects and reports vulnerabilities
6. **Dependency Updates** - Dependency agent notifies about available updates

## 🎨 Try These Actions

### In Agent Team Page:
1. Click on an agent to see its details
2. Switch between tabs to see agents by category
3. View active and completed tasks

### In Agent Orchestrator:
1. **Create a task:**
   - Go to the "chat" tab
   - Type a message like "Write a new React component"
   - Press Enter to send

2. **Check agent status:**
   - Go to the "status" tab
   - See all agents with their current status

3. **Monitor tasks:**
   - Go to the "tasks" tab
   - Watch tasks move from "pending" to "assigned" to "completed"

4. **Use quick actions:**
   - Click any quick action button (Write Code, Create PR, etc.)
   - Watch the agents spring into action!

## ⚡ Advanced Usage

### Customize Agent Behavior

Each agent has its own configuration. You can modify agent behavior by editing the agent configuration files in:
- `server/jobs/multiAgent/`

### Add New Agents

To add a new agent:
1. Create a new file in `server/jobs/multiAgent/`
2. Extend the `BaseAgent` class
3. Implement the required methods
4. Register the agent in `server/jobs/multiAgent/index.ts`
5. Add it to the `DEFAULT_AGENT_CONFIGS` in `shared/types.ts`

### Extend the API

Add new API endpoints in:
- `server/api/`

Then register them in `server/index.ts`.

### Customize the UI

All UI components are in:
- `src/components/Agents/`

Pages are in:
- `src/pages/`

### Configure Database

The database schema is in:
- `database/schema.sql`

You can extend it with new tables as needed.

## 🔧 Troubleshooting

### Agents not coming online?
- Check that the backend server is running (`npm run dev:server`)
- Verify Supabase credentials in `.env`
- Check the browser console for Socket.io connection errors
- Ensure CORS is properly configured

### Socket.io connection refused?
- Make sure the backend is running on port 3001
- Check that `SOCKET_IO_CORS_ORIGIN` includes your frontend URL
- Verify no firewall is blocking the connection

### Database errors?
- Check that you've run the schema in Supabase
- Verify your Supabase credentials
- Check RLS policies in Supabase (they should allow public access for development)

### Dependencies not installing?
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Make sure you have Node.js 22.x installed

## 📊 Monitoring

### Development Mode
- Frontend logs appear in the terminal where you ran `npm run dev`
- Backend logs appear in the terminal where you ran `npm run dev:server`
- Browser console shows client-side logs and errors

### Production Mode
- Use a logging service like Winston or Pino
- Set up monitoring for the Express server
- Use Supabase's built-in monitoring for database queries

## 🚀 Production Deployment

### 1. Build the Application

```bash
npm run build
```

This will:
- Compile the TypeScript server code to `dist/server/`
- Build the Vite frontend to `dist/`

### 2. Configure for Production

Update your `.env` file:
```env
NODE_ENV=production
PORT=3000
SOCKET_IO_CORS_ORIGIN=https://your-production-domain.com
```

### 3. Deploy

#### Option A: Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

#### Option B: Deploy to Any Node.js Hosting

1. Upload all files to your server
2. Install dependencies:
```bash
npm install --production
```
3. Start the server:
```bash
npm start
```

#### Option C: Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Then build and run:
```bash
docker build -t volt-code-agi .
docker run -p 3000:3000 -d volt-code-agi
```

## 📚 Learn More

- **[Implementation Documentation](VOLT_CODE_AGI_IMPLEMENTATION.md)** - Complete technical documentation
- **[Database Schema](database/schema.sql)** - Supabase database structure
- **[Original Plan](Volt%20Code%20AGI%20-%20Complete%20Documentation.md)** - Detailed build plan

## 🤝 Support

For issues, questions, or contributions:
- Open a GitHub issue
- Submit a pull request
- Check the documentation

---

**Happy Coding with Volt Code AGI! ⚡**
