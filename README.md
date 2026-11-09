# E.D.I.T.H. — Enhanced Digital Identity, Trust & Heuristics

A full-stack prototype that analyzes **simulated** application permission events, produces explainable alerts, assigns a heuristic trust score (0–100), and recommends permission restrictions. It does not inspect installed apps or change permissions on a real device.

## Requirements
- Node.js 18 or newer
- Python 3.10 or newer
- MongoDB local instance or MongoDB Atlas database

## Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and set:
- `MONGO_URI` to your MongoDB connection string
- `JWT_SECRET` to a unique random secret of at least 32 characters
- `DETECTION_URL=http://127.0.0.1:8000`
- `CLIENT_ORIGIN=http://localhost:5173`

Generate a secret with Python:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Never commit `.env` files or share them in ZIP archives. If a credential was previously exposed, rotate it at its provider; deleting the local copy is not sufficient.

## Run locally (three terminals)

### 1. Python detection engine

```bash
cd detection-engine
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Node API

```bash
cd backend
npm install
npm run dev
```

### 3. React frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Health checks: <http://127.0.0.1:8000/health> and <http://localhost:5000/api/health>.

## Demo
1. Register with a valid email and a password of at least 10 characters.
2. Choose **Load sample apps**.
3. Select **Flashlight Plus** and run **Unrelated access** to demonstrate an unexpected granted permission.
4. Select **Calculator**, run **Repeated attempts** to demonstrate repeated blocked attempts (it has revoked permissions by default).
5. Run **Access burst** to demonstrate excessive access frequency.
6. Revoke or approve a permission and verify that the app analysis refreshes.
7. Reset history to clear that app's events and restore its baseline score.

## Detection rules
- Successful use of a resource outside the app's expected permission list: −10 per resource
- Blocked access attempts: −25 per resource (critical severity at 3 or more attempts)
- More than 8 events in a 60-second window: −15

The score is clamped to 0–100. Bands: Trusted (80+), Medium (50–79), Suspicious (below 50). These are illustrative prototype weights, not a certified security assessment.

## API
All routes except `/api/auth/register`, `/api/auth/login`, and `/api/health` require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Register or sign in |
| GET | `/api/auth/me` | Current account |
| GET | `/api/apps` | List the signed-in user's apps |
| POST | `/api/apps/seed` | Load sample apps |
| POST | `/api/apps` | Create an app |
| PATCH | `/api/apps/:id/permissions` | Approve/revoke a simulated permission |
| DELETE | `/api/apps/:id/events` | Reset one app's event history |
| DELETE | `/api/apps/:id` | Delete an app and its events/alerts |
| POST | `/api/simulate` | Simulate `normal`, `suspicious`, `repeated`, `burst`, or `random` events |
| GET | `/api/events`, `/api/alerts`, `/api/dashboard` | Events, alerts, dashboard metrics |

## Operational notes
- Login and registration have a basic in-memory per-IP rate limit. For multiple backend instances, replace it with a shared store such as Redis.
- Use HTTPS, a managed secrets store, MongoDB least-privilege credentials, and a shared rate-limit store before production deployment.
- The detection engine should be network-restricted so only the backend can call it; it is not an authenticated public API in this prototype.
- The app's monitoring and permission changes are simulated only. Real device monitoring requires Android/iOS platform integrations and user-granted OS permissions.
