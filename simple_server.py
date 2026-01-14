#!/usr/bin/env python3
"""
Simple Python server for PreoCrypto - temporary alternative to server.js
Run with: python simple_server.py
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import jwt
import os
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs
import base64

PORT = 5000
JWT_SECRET = os.environ.get('JWT_SECRET', 'preocrypto-secret-key-change-in-production')
DB_FILE = 'db.json'

# Load .env file manually
def load_env():
    env_file = '.env'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

load_env()

# PayHero credentials from .env
PAYHERO_BASIC_AUTH = os.environ.get('PAYHERO_BASIC_AUTH', '')
PAYHERO_ACCOUNT_ID = os.environ.get('PAYHERO_ACCOUNT_ID', '')
PAYHERO_CALLBACK_URL = os.environ.get('PAYHERO_CALLBACK_URL', 'https://www.preocrypto.com/webhook/mpesa-callback')

DEMO_USERS = {
    'demo': {'username': 'demo', 'password': 'demo123', 'name': 'Demo User', 'email': 'demo@preocrypto.com'},
    'testuser': {'username': 'testuser', 'password': 'test123', 'name': 'Test User', 'email': 'test@preocrypto.com'}
}

def load_db():
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except:
        return {
            'users': {},
            'tokens': [],
            'privileged': [],
            'withdrawals': [],
            'trades': [],
            'payments': [],
            'transactions': [],
            'resetCodes': {}
        }

def save_db(db):
    with open(DB_FILE, 'w') as f:
        json.dump(db, f, indent=2)

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        path = self.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        try:
            data = json.loads(body)
        except:
            data = {}

        # CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

        # Register endpoint
        if path == '/api/auth/register':
            username = data.get('username', '').strip()
            password = data.get('password', '')
            name = data.get('name', '').strip()
            email = data.get('email', '').strip()
            country = data.get('country')

            if not username or not password or not name or not email:
                response = {'error': 'Username, password, name and email are required'}
                self.wfile.write(json.dumps(response).encode())
                return

            db = load_db()
            
            # Check if user exists
            if username in db['users'] or username in DEMO_USERS:
                response = {'error': 'User already exists'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Check email exists
            for user in db['users'].values():
                if user.get('email', '').lower() == email.lower():
                    response = {'error': 'Email already registered'}
                    self.wfile.write(json.dumps(response).encode())
                    return

            # Create user
            db['users'][username] = {
                'username': username,
                'password': password,
                'name': name,
                'email': email,
                'country': country,
                'demoBalance': 10000,
                'realBalance': 0,
                'createdAt': datetime.now().isoformat(),
                'isAdmin': False
            }
            save_db(db)

            # Generate token
            token = jwt.encode(
                {'username': username, 'exp': datetime.utcnow() + timedelta(hours=24)},
                JWT_SECRET,
                algorithm='HS256'
            )

            response = {
                'success': True,
                'token': token,
                'user': {'username': username, 'name': name}
            }
            self.wfile.write(json.dumps(response).encode())
            return

        # Login endpoint
        elif path == '/api/auth/login':
            username = data.get('username', '').strip()
            password = data.get('password', '')

            if not username or not password:
                response = {'error': 'username and password required'}
                self.wfile.write(json.dumps(response).encode())
                return

            db = load_db()
            user = db['users'].get(username) or DEMO_USERS.get(username)

            # Try email lookup
            if not user and '@' in username:
                for u in db['users'].values():
                    if u.get('email', '').lower() == username.lower():
                        user = u
                        break

            if not user or user.get('password') != password:
                response = {'error': 'Invalid credentials'}
                self.wfile.write(json.dumps(response).encode())
                return

            # Generate token
            token = jwt.encode(
                {'username': user['username'], 'exp': datetime.utcnow() + timedelta(hours=24)},
                JWT_SECRET,
                algorithm='HS256'
            )

            # Store token
            db['tokens'] = db.get('tokens', [])
            db['tokens'].append({
                'token': token,
                'username': user['username'],
                'issuedAt': datetime.now().isoformat()
            })
            save_db(db)

            response = {
                'success': True,
                'token': token,
                'user': {
                    'username': user['username'],
                    'name': user.get('name', user['username']),
                    'email': user.get('email'),
                    'isAdmin': user.get('isAdmin', False)
                }
            }
            self.wfile.write(json.dumps(response).encode())
            return

        # M-Pesa STK Push endpoint
        elif path == '/api/payment/mpesa-stk' or path == '/.netlify/functions/create-payment':
            phone = data.get('phone', '')
            amount = data.get('amount', 0)
            email = data.get('email', '')
            metadata = data.get('metadata', {})
            customer = data.get('customer', {})

            if not phone or not amount:
                response = {'success': False, 'error': 'Phone and amount are required'}
                self.wfile.write(json.dumps(response).encode())
                return

            # Normalize phone number
            def normalize_phone(p):
                if not p:
                    return None
                s = str(p).strip().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
                if s.startswith('+'):
                    s = s[1:]
                if len(s) == 10 and s.startswith('0'):
                    return '254' + s[1:]
                if len(s) == 9 and s.startswith('7'):
                    return '254' + s
                return s

            normalized_phone = normalize_phone(phone)

            # Prepare PayHero payload
            payhero_payload = {
                'amount': int(amount),
                'currency': 'KES',
                'payment_method': 'mpesa_stk',
                'description': f'PreoCrypto Deposit - {amount} KES',
                'metadata': dict(metadata, user_email=email, original_amount=amount),
                'customer': dict(customer, email=email, phone=normalized_phone or phone),
                'webhook_url': PAYHERO_CALLBACK_URL
            }

            # Call PayHero API
            try:
                payhero_url = 'https://api.payhero.io/v1/payment/create'
                headers = {
                    'Content-Type': 'application/json',
                    'X-Account-Id': PAYHERO_ACCOUNT_ID,
                    'X-Request-ID': f"req_{int(datetime.now().timestamp())}_{os.urandom(4).hex()}"
                }

                if PAYHERO_BASIC_AUTH:
                    auth_header = PAYHERO_BASIC_AUTH if PAYHERO_BASIC_AUTH.startswith('Basic ') else f'Basic {PAYHERO_BASIC_AUTH}'
                    headers['Authorization'] = auth_header

                req = urllib.request.Request(
                    payhero_url,
                    data=json.dumps(payhero_payload).encode('utf-8'),
                    headers=headers,
                    method='POST'
                )

                with urllib.request.urlopen(req) as resp:
                    result = json.loads(resp.read().decode('utf-8'))
                    response = {
                        'success': True,
                        'result': result,
                        'status': resp.status
                    }
                    self.wfile.write(json.dumps(response).encode())
                    return

            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                try:
                    error_json = json.loads(error_body)
                except:
                    error_json = {'error': error_body}
                
                response = {
                    'success': False,
                    'error': f'PayHero API error: {e.code}',
                    'details': error_json
                }
                self.wfile.write(json.dumps(response).encode())
                return
            except Exception as e:
                response = {'success': False, 'error': f'Network error: {str(e)}'}
                self.wfile.write(json.dumps(response).encode())
                return

        # Default 404
        response = {'error': 'Not found'}
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {format % args}")

if __name__ == '__main__':
    print(f"Starting PreoCrypto Python server on http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    server = HTTPServer(('localhost', PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()
