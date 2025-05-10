from flask import Flask, render_template, redirect, request, session, url_for, jsonify
from services.zerodha_auth import ZerodhaAuth
import os

app = Flask(__name__,
            static_url_path='/static',
            static_folder='static',
            template_folder='templates')
app.secret_key = 'It can be anything, but should be kept secret. So i thought of this.'


@app.route('/')
def home():
    return redirect(url_for('index'))


@app.route('/index')
def index():
    zerodha_connected = session.get('zerodha_access_token') is not None
    return render_template('index.html', zerodha_connected=zerodha_connected)

@app.route('/signUp')
def signUp():
    zerodha_connected = session.get('zerodha_access_token') is not None
    return render_template('signUp.html', zerodha_connected=zerodha_connected)

@app.route('/dashboard')
def dashboard():
    zerodha_connected = session.get('zerodha_access_token') is not None
    return render_template('dashboard.html', zerodha_connected=zerodha_connected)


@app.route('/login/zerodha')
def login_zerodha():
    zerodha = ZerodhaAuth()
    return redirect(zerodha.get_login_url())


@app.route('/callback/zerodha')
def callback_zerodha():
    request_token = request.args.get('request_token')
    if not request_token:
        return "Login failed. Request token missing.", 400

    zerodha = ZerodhaAuth()
    access_token = zerodha.generate_session(request_token)
    if access_token:
        session['zerodha_access_token'] = access_token
        return redirect(url_for('portfolio'))
    else:
        return "Login failed. Unable to get access token.", 500


@app.route('/logout/zerodha')
def logout_zerodha():
    session.pop('zerodha_access_token', None)
    return redirect(url_for('dashboard'))


# API endpoint to fetch holdings
@app.route('/api/zerodha/holdings')
def api_zerodha_holdings():
    access_token = session.get('zerodha_access_token')
    if not access_token:
        return jsonify(error="Not authenticated"), 401

    zerodha = ZerodhaAuth()
    zerodha.set_access_token(access_token)

    holdings = []

    # 1) Equity / ETFs / Bonds
    try:
        raw_eq = zerodha.kite.holdings()
    except Exception as e:
        return jsonify(error=f"Error fetching equity holdings: {e}"), 500

    for h in raw_eq:
        try:
            sym   = h.get('tradingsymbol', 'Unknown')
            qty   = float(h.get('quantity', 0))
            avg   = float(h.get('average_price', 0))
            last  = float(h.get('last_price', avg))
            val   = round(qty * last, 2)
            pl    = round((last - avg) * qty, 2)
            pct   = round(((last - avg) / avg * 100) if avg > 0 else 0, 2)
            dayCh = round((last - float(h.get('close_price', last))) * qty, 2)

            kind = 'stocks'
            if 'ETF' in sym.upper():
                kind = 'etfs'
            elif 'BOND' in sym.upper():
                kind = 'bonds'

            holdings.append({
                "instrument":      sym,
                "name":            sym,
                "broker":          "Zerodha",
                "quantity":        qty,
                "average_price":   avg,
                "current_price":   last,
                "current_value":   val,
                "total_returns":   pl,
                "returns_percent": pct,
                "day_change":      dayCh,
                "type":            kind
            })
        except Exception as inner:
            app.logger.warning(f"Skipping EQ entry due to error: {inner}")
            continue

    # 2) Mutual Funds
    try:
        raw_mf = zerodha.kite.mf_holdings()
    except Exception as e:
        raw_mf = []
        app.logger.warning(f"Could not fetch MF holdings: {e}")

    for m in raw_mf:
        try:
            # Prioritize user-friendly name
            name = m.get("fund") or m.get("fund_name") or m.get("tradingsymbol") or "Unknown"
            qty  = float(m.get('quantity', 0))
            avg  = float(m.get('average_price', 0))
            last = float(m.get('last_price', m.get('net_asset_value', avg)))
            val  = round(qty * last, 2)
            pl   = round((last - avg) * qty, 2)
            pct  = round(((last - avg) / avg * 100) if avg > 0 else 0, 2)

            holdings.append({
                "instrument":      name,
                "name":            name,
                "broker":          "Zerodha",
                "quantity":        qty,
                "average_price":   avg,
                "current_price":   last,
                "current_value":   val,
                "total_returns":   pl,
                "returns_percent": pct,
                "day_change":      0,
                "type":            "mutual-funds"
            })
        except Exception as inner:
            app.logger.warning(f"Skipping MF entry due to error: {inner}")
            continue

    return jsonify(holdings=holdings)



@app.route('/portfolio')
def portfolio():
    # no initial data needed; portfolio.html+JS will fetch it
    return render_template('portfolio.html')


if __name__ == '__main__':
    app.run(debug=True)
