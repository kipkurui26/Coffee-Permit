# Coffee Movement Permit System - Frontend

## Getting Started

### 1. Navigate into the Frontend Directory

```bash
cd client-cmp
```

### 2. Install Dependencies

Make sure you have `Node.js` installed, then run:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Or create it manually and add the following:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

For production, update the values to point to your live server:

```env
VITE_API_BASE_URL=https://your-server-url.com/api
VITE_WS_BASE_URL=wss://your-server-url.com/ws
```


### 4. Start the Development Server
```bash
npm run dev
```

The development server should now be running. By default, it can be accessed at:

```aduino
https://localhost:3000/
