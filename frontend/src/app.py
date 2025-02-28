from flask import Flask, jsonify
import yfinance as yf
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Helper function to fetch quote with error handling
def fetch_quote(ticker_symbol):
    try:
        ticker = yf.Ticker(ticker_symbol)
        quote = ticker.info
        return {
            "price": quote.get("regularMarketPrice", None),
            "open": quote.get("open", None),
            "high": quote.get("dayHigh", None),
            "low": quote.get("dayLow", None)
        }
    except Exception as e:
        print(f"Error fetching quote for {ticker_symbol}: {str(e)}")
        return None

# Helper function to fetch intraday data with error handling
def fetch_intraday(ticker_symbol):
    try:
        ticker = yf.Ticker(ticker_symbol)
        data = ticker.history(period="1d", interval="1m")
        candles = [
            {"x": row.name.timestamp() * 1000, "o": row["Open"], "h": row["High"], "l": row["Low"], "c": row["Close"]}
            for _, row in data.iterrows()
        ]
        return candles
    except Exception as e:
        print(f"Error fetching intraday data for {ticker_symbol}: {str(e)}")
        return []

# Nifty 50 Endpoints
@app.route('/nifty50/quote')
def get_nifty50_quote():
    quote = fetch_quote("^NSEI")
    return jsonify(quote if quote else {"error": "Failed to fetch Nifty 50 quote"})

@app.route('/nifty50/intraday')
def get_nifty50_intraday():
    return jsonify(fetch_intraday("^NSEI"))

# Nifty Midcap 50 Endpoints
@app.route('/niftymidcap50/quote')
def get_niftymidcap50_quote():
    quote = fetch_quote("^NSEMDCP50")
    return jsonify(quote if quote else {"error": "Failed to fetch Nifty Midcap 50 quote"})

@app.route('/niftymidcap50/intraday')
def get_niftymidcap50_intraday():
    return jsonify(fetch_intraday("^NSEMDCP50"))

# Sensex Endpoints
@app.route('/sensex/quote')
def get_sensex_quote():
    quote = fetch_quote("^BSESN")
    return jsonify(quote if quote else {"error": "Failed to fetch Sensex quote"})

@app.route('/sensex/intraday')
def get_sensex_intraday():
    return jsonify(fetch_intraday("^BSESN"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)