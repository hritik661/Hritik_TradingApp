from flask import Flask, jsonify
import yfinance as yf
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/nifty50/quote')
def get_nifty50_quote():
    nifty = yf.Ticker("^NSEI")
    quote = nifty.info
    return jsonify({
        "price": quote["regularMarketPrice"],
        "open": quote["open"],
        "high": quote["dayHigh"],
        "low": quote["dayLow"]
    })

@app.route('/nifty50/intraday')
def get_nifty50_intraday():
    nifty = yf.Ticker("^NSEI")
    data = nifty.history(period="1d", interval="1m")
    candles = [
        {"x": row.name.timestamp() * 1000, "o": row["Open"], "h": row["High"], "l": row["Low"], "c": row["Close"]}
        for _, row in data.iterrows()
    ]
    return jsonify(candles)

@app.route('/niftymidcap50/quote')
def get_niftymidcap50_quote():
    midcap = yf.Ticker("^NSEMDCP50")
    quote = midcap.info
    return jsonify({
        "price": quote["regularMarketPrice"],
        "open": quote["open"],
        "high": quote["dayHigh"],
        "low": quote["dayLow"]
    })

@app.route('/niftymidcap50/intraday')
def get_niftymidcap50_intraday():
    midcap = yf.Ticker("^NSEMDCP50")
    data = midcap.history(period="1d", interval="1m")
    candles = [
        {"x": row.name.timestamp() * 1000, "o": row["Open"], "h": row["High"], "l": row["Low"], "c": row["Close"]}
        for _, row in data.iterrows()
    ]
    return jsonify(candles)

@app.route('/sensex/quote')
def get_sensex_quote():
    sensex = yf.Ticker("^BSESN")
    quote = sensex.info
    return jsonify({
        "price": quote["regularMarketPrice"],
        "open": quote["open"],
        "high": quote["dayHigh"],
        "low": quote["dayLow"]
    })

@app.route('/sensex/intraday')
def get_sensex_intraday():
    sensex = yf.Ticker("^BSESN")
    data = sensex.history(period="1d", interval="1m")
    candles = [
        {"x": row.name.timestamp() * 1000, "o": row["Open"], "h": row["High"], "l": row["Low"], "c": row["Close"]}
        for _, row in data.iterrows()
    ]
    return jsonify(candles)

@app.route('/banknifty/quote')
def get_banknifty_quote():
    banknifty = yf.Ticker("^NIFTYBANK")
    quote = banknifty.info
    return jsonify({
        "price": quote["regularMarketPrice"],
        "open": quote["open"],
        "high": quote["dayHigh"],
        "low": quote["dayLow"]
    })

@app.route('/banknifty/intraday')
def get_banknifty_intraday():
    banknifty = yf.Ticker("^NIFTYBANK")
    data = banknifty.history(period="1d", interval="1m")
    candles = [
        {"x": row.name.timestamp() * 1000, "o": row["Open"], "h": row["High"], "l": row["Low"], "c": row["Close"]}
        for _, row in data.iterrows()
    ]
    return jsonify(candles)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)