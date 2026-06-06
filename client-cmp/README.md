# Coffee Movement Permit System - Frontend

## Getting Started

Follow these steps to install and run the frontend locally on your machine.

### 1. Clone the Repository

You can clone the repository using **SSH** or **HTTPS**:

**Using SSH**  
```bash
git clone git@github.com:kipkurui26/client-cmp.git  
```

**Using HTTPS**
```bash
git clone https://github.com/kipkurui26/client-cmp.git
```

### 2. Navigate into the Project Directory
```bash
cd client-cmp
```

### 3. Installing Dependencies
Make sure you have `Node.js` installed, then run:

```bash
npm install
```

### 4. Configure Environment Variables

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


### 5. Start the Development Server
```bash
npm run dev
```

The development server should now be running. By default, it can be accessed at:

```aduino
https://localhost:3000/
