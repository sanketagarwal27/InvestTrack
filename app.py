from flask import Flask, render_template, redirect, request, session, url_for, jsonify
from services.zerodha_auth import ZerodhaAuth
import os
import requests
import feedparser
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

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
                "broker":          "Zerodha",
                "quantity":        qty,
                "average_price":   avg,
                "current_price":   last,
                "current_value":   val,
                "total_returns":   pl,
                "returns_percent": pct,
                "day_change":      0, #Not yet done 
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

@app.route('/news')
def news():
    return render_template('news.html')

@app.route('/get-news')
def get_news():
    rss_url = 'https://news.google.com/rss/search?q=business+india&hl=en-IN&gl=IN&ceid=IN:en'
    try:
        resp = requests.get(rss_url)
        return resp.text, 200, {'Content-Type': 'application/xml'}
    except Exception as e:
        return jsonify({'error': str(e)}), 500

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

@app.route("/api/ai-suggestions", methods=["POST"])
def ai_suggestions():
    data = request.json
    holdings = data.get("holdings", [])

    # Fetch news for each stock
    news_by_stock = {}
    for h in holdings:
        symbol = h.get("instrument")
        news_feed = f"https://news.google.com/rss/search?q={symbol}+stock&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(news_feed)

        articles = []
        for entry in feed.entries[:2]:  # Limit to top 2 articles
            articles.append({
                "title": entry.title,
                "summary": getattr(entry, "summary", ""),
                "link": entry.link
            })
        
        if articles:
            news_by_stock[symbol] = articles

    if not news_by_stock:
        return jsonify({ "summary": "No recent news found for your holdings." })

    # Construct prompt
    prompt = "You are an investment assistant. Analyze the following news articles and their potential impact on the user's portfolio:\n\n"

    for stock, articles in news_by_stock.items():
        prompt += f"\n Stock: {stock}\n"
        for article in articles:
            prompt += f" Title: {article['title']}\n"
            prompt += f" Summary: {article['summary']}\n"

    prompt += "\nGive buy/hold/sell suggestions based only on this news. If any stock has no news, ignore it."

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return jsonify({ "summary": response.text })
    except Exception as e:
        print("Error:", e)
        return jsonify({ "summary": "Something went wrong while processing AI analysis." }), 500

# @app.route("/api/chatbot", methods=["POST"])
# def chatbot():
#     try:
#         data = request.json
#         message = data.get("message", "")
#         response = model.generate_content(message)
#         return jsonify({"reply": response.text})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)
