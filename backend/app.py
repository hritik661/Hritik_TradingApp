from flask import Flask, jsonify, request
import yfinance as yf
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS to allow frontend requests from a different origin (e.g., localhost:3000)

# Set up logging for debugging and error tracking
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler("flask.log"),  # Log to a file
        logging.StreamHandler()  # Also log to console
    ]
)
logger = logging.getLogger(__name__)

# Helper function to fetch quote data for a ticker
def fetch_quote(ticker_symbol):
    logger.info(f"Fetching quote for ticker: {ticker_symbol}")
    try:
        ticker = yf.Ticker(ticker_symbol)
        quote = ticker.info
        # Use regularMarketPrice or previousClose as the current price
        price = quote.get("regularMarketPrice", quote.get("previousClose", None))
        if price is None:
            logger.warning(f"No price data available for {ticker_symbol}")
            return {"error": "No price data available"}

        # Fetch historical data to get the previous close if needed
        hist = ticker.history(period="2d")
        last_close = hist["Close"].iloc[-2] if len(hist) > 1 else price  # Previous day's close
        change = price - last_close if price and last_close else 0
        percent_change = (change / last_close * 100) if last_close else 0

        response = {
            "ticker": ticker_symbol,
            "name": quote.get("longName", ticker_symbol),
            "price": price,
            "volume": quote.get("regularMarketVolume", quote.get("volume", 0)),  # Volume data
            "lastClose": last_close,  # Previous day's close
            "change": change,  # Absolute change
            "percentChange": percent_change,  # Percentage change
            "open": quote.get("open", 0),
            "high": quote.get("dayHigh", 0),
            "low": quote.get("dayLow", 0),
        }
        logger.info(f"Successfully fetched quote for {ticker_symbol}: {response}")
        return response
    except Exception as e:
        logger.error(f"Error fetching quote for {ticker_symbol}: {str(e)}", exc_info=True)
        return {"error": f"Failed to fetch quote: {str(e)}"}

# Helper function to fetch intraday data for a ticker
def fetch_intraday(ticker_symbol):
    logger.info(f"Fetching intraday data for ticker: {ticker_symbol}")
    try:
        ticker = yf.Ticker(ticker_symbol)
        data = ticker.history(period="1d", interval="1m")
        if data.empty:
            logger.warning(f"No intraday data available for {ticker_symbol}")
            return {"error": "No intraday data available"}
        candles = [
            {
                "x": int(row.name.timestamp() * 1000),  # Convert timestamp to milliseconds
                "o": row["Open"],
                "h": row["High"],
                "l": row["Low"],
                "c": row["Close"],
                "v": row["Volume"]  # Include volume data in intraday candles
            }
            for _, row in data.iterrows()
        ]
        logger.info(f"Successfully fetched {len(candles)} candles for {ticker_symbol}")
        return candles
    except Exception as e:
        logger.error(f"Error fetching intraday data for {ticker_symbol}: {str(e)}", exc_info=True)
        return {"error": f"Failed to fetch intraday data: {str(e)}"}

# Endpoint to fetch top 50 stocks based on percentage change
@app.route('/top-stocks', methods=['GET'])
def get_top_stocks():
    logger.info("Fetching top 50 stocks based on percentage change")
    try:
        # List of Nifty 50 tickers
        nifty50_tickers = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
            "SBIN.NS", "HINDUNILVR.NS", "BAJFINANCE.NS", "KOTAKBANK.NS", "BHARTIARTL.NS",
            "ITC.NS", "ASIANPAINT.NS", "AXISBANK.NS", "LT.NS", "MARUTI.NS",
            "SUNPHARMA.NS", "TITAN.NS", "BAJAJFINSV.NS", "NESTLEIND.NS", "ULTRACEMCO.NS",
            "POWERGRID.NS", "HCLTECH.NS", "WIPRO.NS", "TECHM.NS", "ONGC.NS",
            "DIVISLAB.NS", "EICHERMOT.NS", "JSWSTEEL.NS", "ADANIENT.NS", "NTPC.NS",
            "TATASTEEL.NS", "GRASIM.NS", "CIPLA.NS", "BRITANNIA.NS", "M&M.NS",
            "HEROMOTOCO.NS", "DRREDDY.NS", "INDUSINDBK.NS", "SBILIFE.NS", "BAJAJ-AUTO.NS",
            "TATAMOTORS.NS", "HDFCLIFE.NS", "COALINDIA.NS", "ADANIPORTS.NS", "UPL.NS",
            "BPCL.NS", "SHRIRAMFIN.NS", "APOLLOHOSP.NS", "HINDALCO.NS", "TATACONSUM.NS"
        ]

        stock_data = []
        for ticker in nifty50_tickers:
            data = fetch_quote(ticker)
            if "error" not in data:
                stock_data.append(data)

        # Sort stocks by percentage change in descending order
        top_stocks = sorted(stock_data, key=lambda x: x.get("percentChange", 0), reverse=True)
        logger.info(f"Fetched {len(top_stocks)} stocks: {top_stocks}")
        return jsonify(top_stocks)
    except Exception as e:
        logger.error(f"Error fetching top stocks: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to fetch top stocks: {str(e)}"}), 500

# Index endpoints for Nifty 50
@app.route('/nifty50/quote')
def get_nifty50_quote():
    return jsonify(fetch_quote("^NSEI"))

@app.route('/nifty50/intraday')
def get_nifty50_intraday():
    return jsonify(fetch_intraday("^NSEI"))

# Index endpoints for Sensex
@app.route('/sensex/quote')
def get_sensex_quote():
    return jsonify(fetch_quote("^BSESN"))

@app.route('/sensex/intraday')
def get_sensex_intraday():
    return jsonify(fetch_intraday("^BSESN"))

# Index endpoints for Bank Nifty
@app.route('/banknifty/quote')
def get_banknifty_quote():
    return jsonify(fetch_quote("^NSEBANK"))

@app.route('/banknifty/intraday')
def get_banknifty_intraday():
    return jsonify(fetch_intraday("^NSEBANK"))

# Index endpoints for Nifty Midcap 50
@app.route('/niftymidcap50/quote')
def get_niftymidcap50_quote():
    return jsonify(fetch_quote("^NSEMDCP50"))

@app.route('/niftymidcap50/intraday')
def get_niftymidcap50_intraday():
    return jsonify(fetch_intraday("^NSEMDCP50"))

# Index endpoints for Nifty IT
@app.route('/niftyit/quote')
def get_niftyit_quote():
    return jsonify(fetch_quote("^CNXIT"))

@app.route('/niftyit/intraday')
def get_niftyit_intraday():
    return jsonify(fetch_intraday("^CNXIT"))

# Index endpoints for Nifty Financial Services 25/50
@app.route('/niftyfinsrv25/quote')
def get_niftyfinsrv25_quote():
    return jsonify(fetch_quote("^CNXFIN"))

@app.route('/niftyfinsrv25/intraday')
def get_niftyfinsrv25_intraday():
    return jsonify(fetch_intraday("^CNXFIN"))

# Index endpoints for Nifty 100
@app.route('/nifty100/quote')
def get_nifty100_quote():
    return jsonify(fetch_quote("^CNX100"))

@app.route('/nifty100/intraday')
def get_nifty100_intraday():
    return jsonify(fetch_intraday("^CNX100"))

# Index endpoints for Nifty Next 50
@app.route('/niftynext50/quote')
def get_niftynext50_quote():
    return jsonify(fetch_quote("^NSMIDCP"))

@app.route('/niftynext50/intraday')
def get_niftynext50_intraday():
    return jsonify(fetch_intraday("^NSMIDCP"))

# Endpoint to fetch quote data for a specific stock
@app.route('/stock/quote', methods=['GET'])
def get_stock_quote():
    ticker = request.args.get('ticker')
    if not ticker:
        logger.warning("No ticker provided in /stock/quote request")
        return jsonify({"error": "Ticker parameter is required"}), 400
    return jsonify(fetch_quote(ticker))

# Endpoint to fetch intraday data for a specific stock
@app.route('/stock/intraday', methods=['GET'])
def get_stock_intraday():
    ticker = request.args.get('ticker')
    if not ticker:
        logger.warning("No ticker provided in /stock/intraday request")
        return jsonify({"error": "Ticker parameter is required"}), 400
    return jsonify(fetch_intraday(ticker))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)