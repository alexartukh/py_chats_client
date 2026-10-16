# Django + React

Two parts:
- `backend/` - Django, one JSON endpoint: `GET /api/hello/`
- `frontend/` - React (Vite), one page that shows the message from Django

## 1. Run Django (terminal 1)

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Check: http://127.0.0.1:8000/api/hello/

## 2. Run React (terminal 2)

```
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

Vite forwards every `/api/...` request to Django (see `vite.config.js`),
so the browser sees one origin and no CORS settings are needed.
