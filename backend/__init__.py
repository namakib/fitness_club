import json
import os
import time
from pathlib import Path

from flask import Flask, g, request, send_from_directory
from flask_cors import CORS  # type: ignore[reportMissingModuleSource]
from .config import Config
from . import db as database

# #region agent log
DEBUG_LOG_PATH = Path(__file__).resolve().parent.parent / '.cursor' / 'debug-08f77b.log'

def _debug_log(msg, data=None, hypothesis_id='H-api'):  # pragma: no cover
    try:
        DEBUG_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            'sessionId': '08f77b',
            'timestamp': int(time.time() * 1000),
            'location': 'backend/__init__.py',
            'message': msg,
            'data': data or {},
            'hypothesisId': hypothesis_id,
        }
        with open(DEBUG_LOG_PATH, 'a') as f:
            f.write(json.dumps(payload, default=str) + '\n')
    except Exception:
        pass
# #endregion


def _log_api(msg, data=None):
    """Print API debug info to console."""
    line = f"[API] {msg}"
    if data is not None:
        try:
            line += "\n" + json.dumps(data, indent=2, default=str)
        except Exception:  # pragma: no cover
            line += f" {data!r}"
    print(line)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    if app.config.get('DEBUG_API_LOGGING'):
        print("[API] Debug logging enabled (DEBUG_API=1)")
        @app.before_request
        def _log_request():
            qs = request.query_string.decode() if request.query_string else None
            parts = [f"{request.method} {request.path}"]
            if qs:
                parts.append(f"?{qs}")
            _log_api(">>> REQUEST: " + "".join(parts))
            _log_api(">>> HEADERS:", dict(request.headers))
            if request.method in ('POST', 'PUT', 'PATCH') and request.get_data():
                try:
                    body = request.get_json(silent=True) or request.get_data(as_text=True)
                    _log_api(">>> BODY:", body)
                except Exception as e:  # pragma: no cover
                    _log_api(">>> BODY (parse error):", str(e))

        @app.after_request
        def _log_response(res):
            _log_api(f"<<< RESPONSE: {res.status_code}")
            _log_api("<<< HEADERS:", dict(res.headers))
            try:
                body = res.get_data(as_text=True)
                if body and 'application/json' in (res.content_type or ''):
                    if len(body) < 3000:
                        try:
                            _log_api("<<< BODY:", json.loads(body))
                        except Exception:  # pragma: no cover
                            _log_api("<<< BODY:", body[:800])
                    else:  # pragma: no cover
                        _log_api("<<< BODY:", f"<{len(body)} bytes>")
            except Exception:  # pragma: no cover
                pass
            return res

    # #region agent log
    @app.before_request
    def _debug_request():  # pragma: no cover
        g._req_start = time.time()
        qs = request.query_string.decode() if request.query_string else None
        req_data = {'method': request.method, 'path': request.path}
        if qs:
            req_data['query'] = qs
        if request.method in ('POST', 'PUT', 'PATCH') and request.get_data():
            try:
                body = request.get_json(silent=True)
                req_data['body'] = body if body is not None else request.get_data(as_text=True)[:500]
            except Exception:
                req_data['body'] = '(parse error)'
        _debug_log('API REQUEST', req_data, 'H-request')

    @app.after_request
    def _debug_response(res):  # pragma: no cover
        try:
            body = res.get_data(as_text=True)
            if body and len(body) < 2000 and 'application/json' in (res.content_type or ''):
                try:
                    body = json.loads(body)
                except Exception:
                    body = body[:500]
            else:
                body = f'<{len(body) if body else 0} bytes>' if body else None
        except Exception:
            body = None
        resp_data = {
            'status': res.status_code,
            'path': request.path,
            'duration_ms': round((time.time() - getattr(g, '_req_start', 0)) * 1000),
        }
        if body is not None:
            resp_data['body'] = body
        _debug_log('API RESPONSE', resp_data, 'H-response')
        return res
    # #endregion

    origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    extra = os.environ.get('CORS_ORIGINS', '')
    if extra:
        origins.extend(o.strip() for o in extra.split(',') if o.strip())
    CORS(app, supports_credentials=True, origins=origins)

    database.init_app(app)

    from .routes import auth, member, trainer, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(member.bp)
    app.register_blueprint(trainer.bp)
    app.register_blueprint(admin.bp)

    # Optional: serve built React app from Flask (set SERVING_FRONTEND=1 when deploying single server)
    dist_path = Path(__file__).resolve().parent.parent / 'frontend' / 'dist'
    if os.environ.get('SERVING_FRONTEND') == '1' and dist_path.exists():  # pragma: no cover
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_frontend(path):
            if path.startswith('api/'):
                return {'error': 'Not found'}, 404
            if path and (dist_path / path).is_file():
                return send_from_directory(dist_path, path)
            return send_from_directory(dist_path, 'index.html')

    return app
