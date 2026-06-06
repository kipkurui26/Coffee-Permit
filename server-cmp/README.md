# Coffee Movement Permit System - Backend

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Settings.py Toggle Reference](#settingspy-toggle-reference)

---

## Getting Started

### 1. Navigate into the Project Directory

```bash
cd server-cmp
```

### 2. Set Up a Virtual Environment

**Linux / macOS:**
```bash
python -m venv .venv
source .venv/bin/activate
```

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Development Setup

### 4. Configure Environment Variables

Copy the development environment file:

```bash
cp .env.dev .env
```

Generate a Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Open `.env` and replace `generated-secret-key` with the key you just generated. That is the **only required change** to get the project running locally.

Your `.env` for development should look like this:

```env
SECRET_KEY=your-generated-secret-key

CLIENT_URL=http://localhost:3000
SERVER_URL=http://127.0.0.1:8000

DEBUG=True

ALLOWED_HOSTS=localhost,127.0.0.1

CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Admin Contact
ADMIN_USER_NAME=admin-name
ADMIN_USER_EMAIL=admin-email

# Superuser Credentials
DEFAULT_ADMIN_EMAIL=superuser-email
DEFAULT_ADMIN_PASSWORD=superuser-password
```

> **Note:** In development, the database, Redis, and email settings below are optional — SQLite is used by default, and email falls back to the SMTP backend with `None` values (no emails are actually sent unless you configure SMTP).

### 5. Configure settings.py for Development

In `settings.py`, the following blocks must be in their **development state**:

**Database** — keep the SQLite block active and the PostgreSQL block commented out:
```python
# ACTIVE (development)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# COMMENTED OUT (development)
# DATABASES = {
#     "default": {
#         "ENGINE": config("DB_ENGINE"),
#         ...
#     }
# }
```

**Redis** — keep the development Redis block active and the production block commented out:
```python
# ACTIVE (development)
redis_config = {
    "host": config("REDIS_HOST", default="127.0.0.1"),
    "port": config("REDIS_PORT", default=6379, cast=int),
}

# COMMENTED OUT (development)
# redis_config = {
#     "host": config("REDIS_HOST"),
#     "port": config("REDIS_PORT", cast=int),
#     "password": config("REDIS_PASSWORD"),
# }
```

### 6. Start Redis

Redis is required for Django Channels (real-time WebSocket features). Make sure Redis is running before starting the server.

**Linux:**
```bash
sudo service redis-server start
```

**macOS (Homebrew):**
```bash
brew services start redis
```

**Windows:** Download and run [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or use WSL.

Verify Redis is running:
```bash
redis-cli ping
# Expected output: PONG
```

### 7. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 8. Create a Superuser

```bash
python manage.py create_admin
```

This uses the `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` values from your `.env` file.

### 9. Start the Development Server

```bash
daphne -p 8000 server.asgi:application
```

The backend will be available at `http://127.0.0.1:8000`.

### 10. Access the Admin Panel

Visit `http://127.0.0.1:8000/admin` and log in with your superuser credentials.

### 11. Elevate Your Account to Admin

1. Go to `http://127.0.0.1:8000/admin/users/user/`
2. Click on your email address.
3. Navigate to **Permissions**.
4. Change your role from `Farmer` to `Admin`.

### 12. Use the Frontend

1. Go to `http://localhost:3000`
2. Log in using your credentials — you will be redirected to the admin dashboard.
3. To register a new farmer, visit `http://localhost:3000/registration`.

---

## Production Setup

### 4. Configure Environment Variables

Copy the production environment file:

```bash
cp .env.prod .env
```

Generate a Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Open `.env` and fill in **all** values — every placeholder must be replaced:

```env
SECRET_KEY=your-generated-secret-key

CLIENT_URL=https://your-client-url.com
SERVER_URL=https://your-server-url.com

DEBUG=False

ALLOWED_HOSTS=your-client-url.com,your-server-url.com,127.0.0.1

CORS_ALLOWED_ORIGINS=https://your-client-url.com
CSRF_TRUSTED_ORIGINS=https://your-client-url.com

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
REDIS_SSL=False

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=your-db-port

# SMTP Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=yourname@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# Admin Contact
ADMIN_USER_NAME=Admin Name
ADMIN_USER_EMAIL=admin@your-domain.com

# Superuser Credentials
DEFAULT_ADMIN_EMAIL=superuser@your-domain.com
DEFAULT_ADMIN_PASSWORD=strong-superuser-password
```

> **Gmail App Password:** Do not use your Gmail account password. Generate an App Password at Google Account → Security → 2-Step Verification → App Passwords.

### 5. Configure settings.py for Production

In `settings.py`, you need to swap three blocks from development to production state:

---

**Database** — comment out SQLite, uncomment PostgreSQL:

```python
# COMMENTED OUT (production)
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.sqlite3",
#         "NAME": BASE_DIR / "db.sqlite3",
#     }
# }

# ACTIVE (production)
DATABASES = {
    "default": {
        "ENGINE": config("DB_ENGINE"),
        "NAME": config("DB_NAME"),
        "USER": config("DB_USER"),
        "PASSWORD": config("DB_PASSWORD"),
        "HOST": config("DB_HOST"),
        "PORT": config("DB_PORT"),
        "OPTIONS": {"sslmode": "require"},
    }
}
```

---

**Redis** — comment out the development block, uncomment the production block:

```python
# COMMENTED OUT (production)
# redis_config = {
#     "host": config("REDIS_HOST", default="127.0.0.1"),
#     "port": config("REDIS_PORT", default=6379, cast=int),
# }

# ACTIVE (production)
redis_config = {
    "host": config("REDIS_HOST"),
    "port": config("REDIS_PORT", cast=int),
    "password": config("REDIS_PASSWORD"),
}

if config("REDIS_SSL", default=False, cast=bool):
    redis_config["ssl"] = True
```

---

**Email** — the SMTP backend is already active by default. No change needed in `settings.py` for email — just ensure all `EMAIL_*` variables are set in your `.env`.

---

### 6. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 7. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 8. Create a Superuser

```bash
python manage.py create_admin
```

### 9. Start the Production Server

```bash
daphne -p 8000 server.asgi:application
```

> In production, run Daphne behind a reverse proxy (Nginx or Caddy) with SSL termination. Do not expose port 8000 directly to the internet.

---

## Settings.py Toggle Reference

A quick summary of every block in `settings.py` that you need to switch between development and production:

| Setting | Development | Production |
|---|---|---|
| `DEBUG` | `True` (via `.env`) | `False` (via `.env`) |
| `DATABASES` | SQLite block **active** | PostgreSQL block **active** |
| `redis_config` | Default host/port block **active** | Password + SSL block **active** |
| `CHANNEL_LAYERS` | Follows whichever `redis_config` is active | Follows whichever `redis_config` is active |
| `SECURE_SSL_REDIRECT` | Automatically `False` when `DEBUG=True` | Automatically `True` when `DEBUG=False` |
| `CORS_ALLOW_ALL_ORIGINS` | Automatically `True` when `DEBUG=True` | Automatically `False` when `DEBUG=False` |
| `CSRF_COOKIE_SECURE` / `SESSION_COOKIE_SECURE` | Automatically `False` when `DEBUG=True` | Automatically `True` when `DEBUG=False` |
| Email backend | SMTP with `default=None` (no emails sent) | SMTP with real credentials in `.env` |

> **Note:** The `DEBUG`-based toggles (CORS, cookies, SSL redirect) are handled automatically by `settings.py` — you only need to set `DEBUG` correctly in your `.env`. The only manual switches are **Database** and **Redis**.