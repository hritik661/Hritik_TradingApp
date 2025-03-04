  import React, { useState, useEffect, useRef } from "react";
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
  } from "chart.js";
  import {
    CandlestickController,
    CandlestickElement,
  } from "chartjs-chart-financial";
  import { Chart } from "react-chartjs-2";
  import "chartjs-adapter-date-fns";
  import axios from "axios";

  // Register Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    CandlestickController,
    CandlestickElement
  );

  // Last closing prices for default assets
  const lastClosingPrices = {
    BTC: { close: 92500.00, change: 407.00, percentChange: 0.44 },
    NIFTY: { close: 22124.7, change: -420.35, percentChange: -1.86 },
    SENSEX: { close: 73198.1, change: -1414.33, percentChange: -1.90 },
    BANKNIFTY: { close: 48344.7, change: -399.10, percentChange: -0.82 },
    MIDCAP: { close: 13540.15, change: -284.30, percentChange: -2.06 },
    IT: { close: 37318.3, change: -1628.35, percentChange: -4.18 },
    FINSRV25: { close: 24485.75, change: -316.85, percentChange: -1.28 },
    NIFTY100: { close: 22479.45, change: -468.85, percentChange: -2.04 },
    NEXT50: { close: 57063.05, change: -1704.15, percentChange: -2.90 },
  };

  // Default assets with type property
  const defaultAssets = [
    { key: "NIFTY", name: "Nifty 50", chartSetter: "setNiftyChartData", endpoint: "/nifty50", type: "index" },
    { key: "SENSEX", name: "Sensex", chartSetter: "setSensexChartData", endpoint: "/sensex", type: "index" },
    { key: "BANKNIFTY", name: "Bank Nifty", chartSetter: "setBankNiftyChartData", endpoint: "/banknifty", type: "index" },
    { key: "MIDCAP", name: "Nifty Midcap 50", chartSetter: "setMidcapChartData", endpoint: "/niftymidcap50", type: "index" },
    { key: "IT", name: "Nifty IT", chartSetter: "setItChartData", endpoint: "/niftyit", type: "index" },
    { key: "FINSRV25", name: "Nifty Finsrv25 50", chartSetter: "setFinsrv25ChartData", endpoint: "/niftyfinsrv25", type: "index" },
    { key: "NIFTY100", name: "Nifty 100", chartSetter: "setNifty100ChartData", endpoint: "/nifty100", type: "index" },
    { key: "NEXT50", name: "Nifty Next 50", chartSetter: "setNext50ChartData", endpoint: "/niftynext50", type: "index" },
    { key: "BTC", name: "Bitcoin", chartSetter: "setBtcChartData", type: "crypto" },
  ];

  // Helper function to format volume
  const formatVolume = (volume) => {
    if (!volume || isNaN(volume)) return "N/A";
    if (volume >= 10000000) return `${(volume / 10000000).toFixed(2)}Cr`;
    if (volume >= 100000) return `${(volume / 100000).toFixed(2)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toLocaleString("en-IN");
  };

  // TradeModal Component for Buy/Sell
  const TradeModal = ({ isOpen, onClose, asset, action, price, balance = 1000 }) => {
    const [quantity, setQuantity] = useState(1);
    const [orderType, setOrderType] = useState("Delivery");
    const [priceLimit, setPriceLimit] = useState(parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0);

    if (!isOpen) return null;

    const numericPrice = parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0;
    const totalCost = quantity * priceLimit;
    const formattedPriceLimit = priceLimit.toLocaleString("en-IN", { minimumFractionDigits: 2 });

    const handleConfirm = () => {
      console.log(`${action} order placed:`, {
        asset: asset.name,
        quantity,
        orderType,
        priceLimit,
        totalCost,
      });
      alert(`${action} order placed for ${quantity} shares of ${asset.name} at ₹${formattedPriceLimit} each (Total: ₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })})`);
      onClose();
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>{asset.name}</h2>
          <p className="modal-price">
            NSE: ₹{numericPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            <span className={numericPrice < priceLimit ? "negative" : "positive"}>
              ({numericPrice < priceLimit ? "Limit above" : "Limit below"} market)
            </span>
          </p>
          <div className="modal-buttons">
            <button className={`action-button ${action === "Buy" ? "active" : ""}`}>
              {action}
            </button>
            <button className={`action-button ${action === "Sell" ? "active" : ""}`}>
              Sell
            </button>
          </div>
          <div className="order-type-buttons">
            <button
              className={`order-type-button ${orderType === "Delivery" ? "active" : ""}`}
              onClick={() => setOrderType("Delivery")}
            >
              Delivery
            </button>
            <button
              className={`order-type-button ${orderType === "Intraday" ? "active" : ""}`}
              onClick={() => setOrderType("Intraday")}
            >
              Intraday
            </button>
            <button
              className={`order-type-button ${orderType === "MTF" ? "active" : ""}`}
              onClick={() => setOrderType("MTF")}
            >
              MTF
            </button>
          </div>
          <div className="modal-inputs">
            <label>
              Qty NSE
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
            </label>
            <label>
              Price Limit
              <input
                type="number"
                value={priceLimit}
                onChange={(e) => setPriceLimit(Math.max(0, parseFloat(e.target.value) || 0))}
                step="0.1"
              />
            </label>
          </div>
          <p className="order-info">
            Order will be executed at ₹{formattedPriceLimit} or lower price
          </p>
          <p className="balance-info">
            Balance: ₹{balance.toLocaleString("en-IN")}    Approx req.: ₹{totalCost.toLocaleString("en-IN")}
          </p>
          <div className="modal-actions">
            <button
              className={`confirm-button ${action === "Buy" ? "buy" : "sell"}`}
              onClick={handleConfirm}
              disabled={totalCost > balance}
            >
              {action}
            </button>
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
        <style jsx="true">{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 10px;
          }

          .modal-content {
            background: var(--bg-secondary);
            padding: 15px;
            border-radius: 10px;
            width: 100%;
            max-width: 350px;
            box-shadow: 0 4px 15px var(--shadow-color);
            color: var(--text-primary);
          }

          .modal-content h2 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .modal-price {
            font-size: 12px;
            margin-bottom: 8px;
          }

          .modal-buttons {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
          }

          .action-button {
            flex: 1;
            padding: 6px;
            border: 2px solid var(--border-color);
            border-radius: 15px;
            background: none;
            color: var(--text-primary);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .action-button.active {
            background: ${action === "Buy" ? "var(--buy-color)" : "var(--sell-color)"};
            color: #fff;
            border-color: transparent;
          }

          .order-type-buttons {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }

          .order-type-button {
            flex: 1;
            padding: 6px;
            border: 2px solid var(--border-color);
            border-radius: 15px;
            background: none;
            color: var(--text-primary);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            min-width: 80px;
          }

          .order-type-button.active {
            background: var(--accent-color);
            color: #fff;
            border-color: transparent;
          }

          .modal-inputs {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
          }

          .modal-inputs label {
            display: flex;
            flex-direction: column;
            font-size: 12px;
            color: var(--text-primary);
          }

          .modal-inputs input {
            padding: 6px;
            border: 2px solid var(--border-color);
            border-radius: 6px;
            margin-top: 4px;
            font-size: 12px;
            color: var(--text-primary);
            background: transparent;
            outline: none;
          }

          .order-info {
            font-size: 10px;
            color: var(--text-secondary);
            margin-bottom: 8px;
          }

          .balance-info {
            font-size: 10px;
            color: var(--text-primary);
            margin-bottom: 12px;
          }

          .modal-actions {
            display: flex;
            gap: 8px;
          }

          .confirm-button {
            flex: 2;
            padding: 8px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            color: #fff;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .confirm-button.buy { background: var(--buy-color); }
          .confirm-button.sell { background: var(--sell-color); }
          .confirm-button:disabled { opacity: 0.5; cursor: not-allowed; }
          .confirm-button:hover:not(:disabled) { transform: scale(1.05); }

          .cancel-button {
            flex: 1;
            padding: 8px;
            border: 2px solid var(--border-color);
            border-radius: 6px;
            background: none;
            color: var(--text-primary);
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .cancel-button:hover { transform: scale(1.05); }

          @media (max-width: 480px) {
            .modal-content { padding: 10px; max-width: 300px; }
            .modal-content h2 { font-size: 14px; }
            .modal-price { font-size: 11px; }
            .action-button, .order-type-button { padding: 5px; font-size: 11px; }
            .modal-inputs label { font-size: 11px; }
            .modal-inputs input { padding: 5px; font-size: 11px; }
            .order-info, .balance-info { font-size: 9px; }
            .confirm-button, .cancel-button { padding: 6px; font-size: 11px; }
          }

          @media (max-width: 320px) {
            .modal-content { max-width: 280px; }
            .modal-buttons, .order-type-buttons { flex-direction: column; }
            .action-button, .order-type-button { min-width: 100%; }
          }
        `}</style>
      </div>
    );
  };

  function App() {
    const [selectedAsset, setSelectedAsset] = useState("BTC");
    const [darkMode, setDarkMode] = useState(false);
    const [animateCards, setAnimateCards] = useState(false);
    const [livePrices, setLivePrices] = useState(
      Object.fromEntries(defaultAssets.map(a => [a.key, { price: null, volume: null }]))
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [customChartData, setCustomChartData] = useState(null);
    const [topStocks, setTopStocks] = useState([]);
    const [bitcoinLastClose, setBitcoinLastClose] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState("Buy");
    const [modalAsset, setModalAsset] = useState(null);
    const [modalPrice, setModalPrice] = useState("");

    const chartDataStates = Object.fromEntries(
      defaultAssets.map(a => [
        a.chartSetter,
        useState({
          datasets: [{
            label: a.name,
            data: [],
            color: { up: "#00C4B4", down: "#FF5252", unchanged: "#B0BEC5" },
            borderWidth: 1,
            backgroundColor: (context) => {
              const index = context.dataIndex;
              const dataset = context.dataset.data;
              if (!dataset || !dataset[index]) return "#B0BEC5";
              const isLastCandle = index === dataset.length - 1 && !context.dataset.isClosed;
              return isLastCandle ? "#B0BEC5" : (dataset[index].c >= dataset[index].o ? "#00C4B4" : "#FF5252");
            },
            borderColor: (context) => {
              const index = context.dataIndex;
              const dataset = context.dataset.data;
              if (!dataset || !dataset[index]) return "#B0BEC5";
              const isLastCandle = index === dataset.length - 1 && !context.dataset.isClosed;
              return isLastCandle ? "#B0BEC5" : (dataset[index].c >= dataset[index].o ? "#00C4B4" : "#FF5252");
            },
          }],
        }),
      ])
    );
    const chartRef = useRef(null);

    useEffect(() => {
      setTimeout(() => setAnimateCards(true), 300);
    }, []);

    useEffect(() => {
      document.body.classList.toggle("dark-mode", darkMode);
    }, [darkMode]);

    useEffect(() => {
      const fetchTopStocks = async () => {
        try {
          const response = await axios.get("http://localhost:5000/top-stocks");
          setTopStocks(response.data);
        } catch (error) {
          console.error("Error fetching top stocks:", error);
          setTopStocks([]);
        }
      };
      fetchTopStocks();
      const interval = setInterval(fetchTopStocks, 60000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      const fetchBitcoinLastClose = async () => {
        try {
          const ticker = "BTC-USD";
          const response = await axios.get(`http://localhost:5000/stock/quote?ticker=${ticker}`);
          const quoteData = response.data;
          if (quoteData.error) throw new Error(quoteData.error);

          const lastCloseData = quoteData.lastClose && quoteData.change && quoteData.percentChange
            ? {
                close: parseFloat(quoteData.lastClose),
                change: parseFloat(quoteData.change),
                percentChange: parseFloat(quoteData.percentChange),
              }
            : null;

          setBitcoinLastClose(lastCloseData);
        } catch (error) {
          console.error("Error fetching Bitcoin last close:", error);
          setBitcoinLastClose(null);
        }
      };
      fetchBitcoinLastClose();
    }, []);

    const getOptions = () => {
      const theme = darkMode
        ? {
            backgroundColor: "rgba(26, 32, 44, 0.95)",
            titleColor: "#E2E8F0",
            bodyColor: "#E2E8F0",
            borderColor: "#2D3748",
            textColor: "#A0AEC0",
            gridColor: "#2D3748",
          }
        : {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            titleColor: "#1E293B",
            bodyColor: "#1E293B",
            borderColor: "#E0E7FF",
            textColor: "#64748B",
            gridColor: "#E0E7FF",
          };

      const selectedAssetName =
        searchResult && selectedAsset === searchQuery
          ? searchResult.name
          : defaultAssets.find(a => a.key === selectedAsset)?.name || "Unknown Asset";

      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: selectedAssetName,
            color: theme.titleColor,
            font: { size: 18, family: "'Roboto', sans-serif", weight: "600" },
            padding: { top: 8, bottom: 15 },
          },
          tooltip: {
            backgroundColor: theme.backgroundColor,
            titleColor: theme.titleColor,
            bodyColor: theme.bodyColor,
            borderColor: theme.borderColor,
            borderWidth: 1,
            callbacks: {
              label: ctx =>
                `O: ${ctx.raw?.o?.toFixed(2) || "N/A"} H: ${ctx.raw?.h?.toFixed(2) || "N/A"} L: ${ctx.raw?.l?.toFixed(2) || "N/A"} C: ${ctx.raw?.c?.toFixed(2) || "N/A"}`,
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: { unit: "minute", stepSize: 1, displayFormats: { minute: "HH:mm" } },
            ticks: { color: theme.textColor, font: { size: 10, family: "'Roboto', sans-serif" } },
            grid: { display: false },
          },
          y: {
            ticks: { color: theme.textColor, font: { size: 10, family: "'Roboto', sans-serif" } },
            grid: { color: theme.gridColor, lineWidth: 1 },
          },
        },
      };
    };

    useEffect(() => {
      let ws;
      let currentCandle = null;
      let oneMinuteCandles = [];

      const connectWebSocket = () => {
        ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");
        ws.onopen = () => console.log("Connected to Binance WebSocket");
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const kline = data.k;
          if (!kline) return;

          const time = kline.t;
          const open = parseFloat(kline.o);
          const high = parseFloat(kline.h);
          const low = parseFloat(kline.l);
          const close = parseFloat(kline.c);
          const volume = parseFloat(kline.v);
          const isClosed = kline.x;

          setLivePrices(prev => ({
            ...prev,
            BTC: { price: `$${close.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, volume: formatVolume(volume) },
          }));

          if (selectedAsset === "BTC") {
            const newCandle = { x: time, o: open, h: high, l: low, c: close, v: volume };
            if (isClosed) {
              oneMinuteCandles.push(newCandle);
              oneMinuteCandles = oneMinuteCandles.slice(-100);
              currentCandle = null;
            } else {
              currentCandle = newCandle;
            }

            chartDataStates.setBtcChartData[1](prev => ({
              datasets: [
                {
                  ...prev.datasets[0],
                  data: [...oneMinuteCandles, ...(currentCandle ? [currentCandle] : [])],
                  isClosed: !currentCandle,
                },
              ],
            }));
          }
        };
        ws.onerror = error => console.error("WebSocket error:", error);
        ws.onclose = () => {
          console.log("WebSocket closed, reconnecting...");
          setTimeout(connectWebSocket, 2000);
        };
      };

      connectWebSocket();
      return () => ws && ws.close();
    }, [selectedAsset]);

    useEffect(() => {
      const fetchIndexData = async asset => {
        if (!asset.endpoint) {
          if (asset.key === "BTC") {
            setLivePrices(prev => ({ ...prev, BTC: { price: "Loading...", volume: "N/A" } }));
            try {
              const wsData = livePrices.BTC;
              if (wsData && wsData.price !== "Loading..." && wsData.price !== "Data Unavailable") {
                setLivePrices(prev => ({ ...prev, BTC: wsData }));
              } else {
                setLivePrices(prev => ({ ...prev, BTC: { price: "Data Unavailable", volume: "N/A" } }));
              }
            } catch (error) {
              console.error(`Error fetching Bitcoin data:`, error);
              setLivePrices(prev => ({ ...prev, BTC: { price: "Data Unavailable", volume: "N/A" } }));
            }
            return;
          }
          return;
        }

        try {
          const quoteResponse = await axios.get(`http://localhost:5000${asset.endpoint}/quote`);
          const quoteData = quoteResponse.data;
          const isOpen = isMarketOpen();
          setLivePrices(prev => ({
            ...prev,
            [asset.key]: {
              price: quoteData.error || !quoteData.price
                ? isOpen
                  ? "Data Unavailable"
                  : "Market Closed"
                : `₹${parseFloat(quoteData.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              volume: quoteData.volume ? formatVolume(quoteData.volume) : "N/A",
            },
          }));

          if (selectedAsset === asset.key) {
            const intradayResponse = await axios.get(`http://localhost:5000${asset.endpoint}/intraday`);
            const rawCandles = intradayResponse.data || [];
            const { oneMinuteCandles, currentCandle } = aggregateOneMinuteCandles(rawCandles);
            chartDataStates[asset.chartSetter][1](prev => ({
              datasets: [{ ...prev.datasets[0], data: [...oneMinuteCandles.slice(-100), ...(currentCandle ? [currentCandle] : [])], isClosed: !currentCandle }],
            }));
          }
        } catch (error) {
          console.error(`Error fetching ${asset.key} data:`, error);
          setLivePrices(prev => ({ ...prev, [asset.key]: { price: "Data Unavailable", volume: "N/A" } }));
          if (selectedAsset === asset.key)
            chartDataStates[asset.chartSetter][1](prev => ({ datasets: [{ ...prev.datasets[0], data: [], isClosed: false }] }));
        }
      };

      const isMarketOpen = () => {
        const now = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
        const hours = now.getUTCHours();
        const minutes = now.getUTCMinutes();
        return hours >= 9 && (hours < 15 || (hours === 15 && minutes <= 30));
      };

      const aggregateOneMinuteCandles = candles => {
        const oneMinuteCandles = [];
        let currentCandle = null;

        if (!candles.length) return { oneMinuteCandles, currentCandle };

        candles.forEach(candle => {
          const time = candle.x;
          const oneMinuteInterval = 60 * 1000;
          const minuteStart = Math.floor(time / oneMinuteInterval) * oneMinuteInterval;

          if (!currentCandle || currentCandle.x !== minuteStart) {
            if (currentCandle) oneMinuteCandles.push(currentCandle);
            currentCandle = { x: minuteStart, o: candle.o, h: candle.h, l: candle.l, c: candle.c };
          } else {
            currentCandle.h = Math.max(currentCandle.h, candle.h);
            currentCandle.l = Math.min(currentCandle.l, candle.l);
            currentCandle.c = candle.c;
          }
        });

        return { oneMinuteCandles, currentCandle };
      };

      const fetchAllData = () => defaultAssets.forEach(fetchIndexData);
      fetchAllData();
      const interval = setInterval(fetchAllData, 1000);
      return () => clearInterval(interval);
    }, [selectedAsset]);

    useEffect(() => {
      const fetchStockData = async () => {
        if (defaultAssets.some(a => a.key === selectedAsset)) return;

        try {
          const quoteResponse = await axios.get(`http://localhost:5000/stock/quote?ticker=${selectedAsset}`);
          const quoteData = quoteResponse.data;
          if (quoteData.error) throw new Error(quoteData.error);

          const intradayResponse = await axios.get(`http://localhost:5000/stock/intraday?ticker=${selectedAsset}`);
          const rawCandles = intradayResponse.data || [];
          const { oneMinuteCandles, currentCandle } = aggregateOneMinuteCandles(rawCandles);

          const customData = {
            datasets: [{
              label: quoteData.name,
              data: [...oneMinuteCandles.slice(-100), ...(currentCandle ? [currentCandle] : [])],
              color: { up: "#00C4B4", down: "#FF5252", unchanged: "#B0BEC5" },
              borderWidth: 1,
              backgroundColor: context => {
                const index = context.dataIndex;
                const dataset = context.dataset.data;
                if (!dataset || !dataset[index]) return "#B0BEC5";
                const isLastCandle = index === dataset.length - 1 && !context.dataset.isClosed;
                return isLastCandle ? "#B0BEC5" : dataset[index].c >= dataset[index].o ? "#00C4B4" : "#FF5252";
              },
              borderColor: context => {
                const index = context.dataIndex;
                const dataset = context.dataset.data;
                if (!dataset || !dataset[index]) return "#B0BEC5";
                const isLastCandle = index === dataset.length - 1 && !context.dataset.isClosed;
                return isLastCandle ? "#B0BEC5" : dataset[index].c >= dataset[index].o ? "#00C4B4" : "#FF5252";
              },
              isClosed: !currentCandle,
            }],
          };

          const lastCloseData = quoteData.lastClose && quoteData.change && quoteData.percentChange
            ? {
                close: parseFloat(quoteData.lastClose),
                change: parseFloat(quoteData.change),
                percentChange: parseFloat(quoteData.percentChange),
              }
            : null;

          setSearchResult({
            key: selectedAsset,
            name: quoteData.name,
            price: `₹${parseFloat(quoteData.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            volume: formatVolume(quoteData.volume),
            lastClose: lastCloseData,
            type: "stock",
          });
          setCustomChartData(customData);
          setLivePrices(prev => ({
            ...prev,
            [selectedAsset]: {
              price: `₹${parseFloat(quoteData.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              volume: formatVolume(quoteData.volume),
            },
          }));
        } catch (error) {
          console.error("Stock fetch error:", error);
          setSearchResult({ key: selectedAsset, name: selectedAsset, price: "Data Unavailable", volume: "N/A", lastClose: null, type: "stock" });
          setCustomChartData({ datasets: [{ label: selectedAsset, data: [], isClosed: false }] });
          setLivePrices(prev => ({ ...prev, [selectedAsset]: { price: "Data Unavailable", volume: "N/A" } }));
        }
      };

      fetchStockData();
    }, [selectedAsset]);

    const handleSearch = async e => {
      e.preventDefault();
      if (!searchQuery.trim()) {
        setSearchResult(null);
        setCustomChartData(null);
        setSelectedAsset("BTC");
        return;
      }

      try {
        const quoteResponse = await axios.get(`http://localhost:5000/stock/quote?ticker=${searchQuery}`);
        const quoteData = quoteResponse.data;
        if (quoteData.error) throw new Error(quoteData.error);

        const intradayResponse = await axios.get(`http://localhost:5000/stock/intraday?ticker=${searchQuery}`);
        const rawCandles = intradayResponse.data || [];
        const { oneMinuteCandles, currentCandle } = aggregateOneMinuteCandles(rawCandles);

        const customData = {
          datasets: [{
            label: quoteData.name,
            data: [...oneMinuteCandles.slice(-100), ...(currentCandle ? [currentCandle] : [])],
            color: { up: "#00C4B4", down: "#FF5252", unchanged: "#B0BEC5" },
            borderWidth: 1,
            backgroundColor: context => {
              const index = context.dataIndex;
              const dataset = context.dataset.data;
              if (!dataset || !dataset[index]) return "#B0BEC5";
              const isLastCandle = index === dataset.length - 1 && !context.dataset.isClosed;
              return isLastCandle ? "#B0BEC5" : dataset[index].c >= dataset[index].o ? "#00C4B4" : "#FF5252";
            },
            borderColor: context => {
              const index = context.dataIndex;
              const dataset = context.dataset.data;
              if (!dataset || !dataset[index]) return "#B0BEC5";
              const isLastCandle = index === dataset.length - 1 && !context.dataset.isClosed;
              return isLastCandle ? "#B0BEC5" : dataset[index].c >= dataset[index].o ? "#00C4B4" : "#FF5252";
            },
            isClosed: !currentCandle,
          }],
        };

        const lastCloseData = quoteData.lastClose && quoteData.change && quoteData.percentChange
          ? {
              close: parseFloat(quoteData.lastClose),
              change: parseFloat(quoteData.change),
              percentChange: parseFloat(quoteData.percentChange),
            }
          : null;

        setSearchResult({
          key: searchQuery,
          name: quoteData.name,
          price: `₹${parseFloat(quoteData.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          volume: formatVolume(quoteData.volume),
          lastClose: lastCloseData,
          type: "stock",
        });
        setCustomChartData(customData);
        setSelectedAsset(searchQuery);
        setLivePrices(prev => ({
          ...prev,
          [searchQuery]: {
            price: `₹${parseFloat(quoteData.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            volume: formatVolume(quoteData.volume),
          },
        }));
      } catch (error) {
        console.error("Search error:", error);
        setSearchResult({ key: searchQuery, name: searchQuery, price: "Data Unavailable", volume: "N/A", lastClose: null, type: "stock" });
        setCustomChartData({ datasets: [{ label: searchQuery, data: [], isClosed: false }] });
        setSelectedAsset(searchQuery);
      }
    };

    const aggregateOneMinuteCandles = candles => {
      const oneMinuteCandles = [];
      let currentCandle = null;

      if (!candles.length) return { oneMinuteCandles, currentCandle };

      candles.forEach(candle => {
        const time = candle.x;
        const oneMinuteInterval = 60 * 1000;
        const minuteStart = Math.floor(time / oneMinuteInterval) * oneMinuteInterval;

        if (!currentCandle || currentCandle.x !== minuteStart) {
          if (currentCandle) oneMinuteCandles.push(currentCandle);
          currentCandle = { x: minuteStart, o: candle.o, h: candle.h, l: candle.l, c: candle.c };
        } else {
          currentCandle.h = Math.max(currentCandle.h, candle.h);
          currentCandle.l = Math.min(currentCandle.l, candle.l);
          currentCandle.c = candle.c;
        }
      });

      return { oneMinuteCandles, currentCandle };
    };

    const displayedChartData =
      searchResult && selectedAsset === searchQuery
        ? customChartData
        : chartDataStates[defaultAssets.find(a => a.key === selectedAsset)?.chartSetter]?.[0] || {
            datasets: [{ label: "No Data", data: [] }],
          };

    const selectedAssetName =
      searchResult && selectedAsset === searchQuery
        ? searchResult.name
        : defaultAssets.find(a => a.key === selectedAsset)?.name || "Unknown Asset";

    const handleStockClick = ticker => {
      setSearchQuery(ticker);
      setSelectedAsset(ticker);
    };

    const openModal = (action, asset, price) => {
      setModalAction(action);
      setModalAsset(asset);
      setModalPrice(price);
      setIsModalOpen(true);
    };

    return (
      <div className={`app-container ${darkMode ? "dark" : "light"}`}>
        <header className="header">
          <h1 className="logo">Hritik Trading App</h1>
          <div className="header-date">
            Live Market Data • {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1126 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.7479 21.1181 10.0795 20.7461C8.41111 20.3741 6.88058 19.5345 5.67453 18.3285C4.46847 17.1224 3.62885 15.5919 3.25689 13.9235C2.88493 12.2551 2.99571 10.5151 3.57648 8.9073C4.15725 7.29952 5.18387 5.89039 6.53618 4.84474C7.88849 3.79908 9.51071 3.16029 11.213 3.00303C10.2555 4.1482 9.75149 5.59284 9.79786 7.06901C9.84423 8.54517 10.4382 9.95479 11.4743 11.0358C12.5103 12.1168 13.9241 12.7832 15.4036 12.9052C16.8831 13.0272 18.3608 12.6954 19.597 11.897C20.137 12.1643 20.6073 12.4531 21 12.79Z" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </header>

        <div className="search-bar">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value.toUpperCase())}
              placeholder="Search stocks..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>

        <TopStocks stocks={topStocks} animate={animateCards} onStockClick={handleStockClick} />

        <div className="asset-tabs">
          {defaultAssets.map((asset, index) => (
            <button
              key={asset.key}
              onClick={() => setSelectedAsset(asset.key)}
              className={`asset-tab ${selectedAsset === asset.key ? "active" : ""}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {asset.name}
            </button>
          ))}
        </div>

        <div className="content-grid">
          <div className="chart-section">
            <div className={`chart-container ${animateCards ? "animate-in" : ""}`}>
              <Chart type="candlestick" data={displayedChartData} options={getOptions()} ref={chartRef} />
            </div>
            <PriceCard
              asset={{ key: selectedAsset, name: selectedAssetName, type: searchResult && selectedAsset === searchQuery ? "stock" : defaultAssets.find(a => a.key === selectedAsset)?.type }}
              price={livePrices[selectedAsset]?.price ?? "Loading..."}
              volume={livePrices[selectedAsset]?.volume ?? "N/A"}
              lastClose={
                selectedAsset === "BTC"
                  ? bitcoinLastClose
                  : searchResult && selectedAsset === searchQuery
                  ? searchResult.lastClose
                  : lastClosingPrices[selectedAsset]
              }
              animate={animateCards}
              onTradeAction={openModal}
            />
          </div>

          <div className={`price-dashboard ${animateCards ? "animate-in" : ""}`} style={{ animationDelay: "0.2s" }}>
            <h2 className="dashboard-title">Market Overview</h2>
            {defaultAssets.map((asset, index) => (
              <PriceCard
                key={asset.key}
                asset={asset}
                price={livePrices[asset.key]?.price ?? "Loading..."}
                volume={livePrices[asset.key]?.volume ?? "N/A"}
                lastClose={asset.key === "BTC" ? bitcoinLastClose : lastClosingPrices[asset.key]}
                animate={animateCards}
                delay={`${0.3 + index * 0.05}s`}
                onTradeAction={openModal}
              />
            ))}
            {searchResult && selectedAsset === searchQuery && (
              <PriceCard
                key={searchResult.key}
                asset={searchResult}
                price={livePrices[searchResult.key]?.price ?? "Loading..."}
                volume={livePrices[searchResult.key]?.volume ?? "N/A"}
                lastClose={searchResult.lastClose}
                animate={animateCards}
                delay={`${0.3 + defaultAssets.length * 0.05}s`}
                onTradeAction={openModal}
              />
            )}
          </div>
        </div>

        <TradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          asset={modalAsset}
          action={modalAction}
          price={modalPrice}
          balance={1000}
        />

        <style jsx="true">{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Roboto", sans-serif;
            transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
          }

          .dark {
            --bg-primary: linear-gradient(135deg, #0D131E, #1A2332);
            --bg-secondary: #1A2332;
            --text-primary: #E2E8F0;
            --text-secondary: #A0AEC0;
            --border-color: #2D3748;
            --accent-color: #00D4C7;
            --accent-hover: #00B8AA;
            --card-bg: linear-gradient(145deg, #1E293B, #2D3748);
            --shadow-color: rgba(0, 0, 0, 0.6);
            --negative: #FF6B6B;
            --positive: #4ADE80;
            --buy-color: #4ADE80;
            --sell-color: #FF6B6B;
          }

          .light {
            --bg-primary: linear-gradient(135deg, #F0F4F8, #E5E9EF);
            --bg-secondary: #FFFFFF;
            --text-primary: #1E293B;
            --text-secondary: #64748B;
            --border-color: #D1D5DB;
            --accent-color: #4F46E5;
            --accent-hover: #4338CA;
            --card-bg: linear-gradient(145deg, #FFFFFF, #F8FAFC);
            --shadow-color: rgba(79, 70, 229, 0.15);
            --negative: #EF4444;
            --positive: #10B981;
            --buy-color: #10B981;
            --sell-color: #EF4444;
          }

          .app-container {
            background: var(--bg-primary);
            min-height: 100vh;
            padding: 15px;
            overflow-x: hidden;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 20px;
            background: var(--card-bg);
            border-radius: 10px;
            box-shadow: 0 3px 12px var(--shadow-color);
            margin-bottom: 15px;
            animation: slideDown 0.5s ease-out;
            flex-wrap: wrap;
            gap: 10px;
          }

          .logo {
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(90deg, var(--accent-color), #A5B4FC);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .header-date {
            font-size: 12px;
            color: var(--text-secondary);
            text-align: center;
            flex: 1;
          }

          .theme-toggle {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            border: none;
            background: var(--bg-secondary);
            cursor: pointer;
            box-shadow: 0 2px 8px var(--shadow-color);
            transition: transform 0.3s, background 0.3s;
          }

          .theme-toggle:hover {
            transform: scale(1.1);
            background: var(--accent-hover);
          }

          .search-bar {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
          }

          .search-bar form {
            display: flex;
            gap: 5px;
            width: 100%;
            max-width: 280px;
          }

          .search-input {
            flex: 1;
            padding: 6px 10px;
            background: var(--bg-secondary);
            border: 2px solid var(--border-color);
            border-radius: 15px;
            font-size: 12px;
            color: var(--text-primary);
            outline: none;
            box-shadow: 0 2px 5px var(--shadow-color);
            transition: border-color 0.3s, box-shadow 0.3s;
          }

          .search-input:focus {
            border-color: var(--accent-color);
            box-shadow: 0 3px 8px var(--shadow-color);
          }

          .search-button {
            padding: 6px;
            background: var(--accent-color);
            color: #fff;
            border: none;
            border-radius: 15px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px var(--shadow-color);
            transition: background 0.3s, transform 0.3s;
            width: 30px;
            height: 30px;
          }

          .search-button:hover {
            background: var(--accent-hover);
            transform: scale(1.05);
          }

          .asset-tabs {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 10px;
            padding: 10px 0;
            margin-bottom: 20px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .asset-tabs::-webkit-scrollbar {
            display: none;
          }

          .asset-tab {
            padding: 8px 15px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 2px solid var(--border-color);
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            box-shadow: 0 2px 6px var(--shadow-color);
            transition: all 0.3s ease;
          }

          .asset-tab:hover {
            background: var(--accent-color);
            color: #fff;
            transform: scale(1.05);
          }

          .asset-tab.active {
            background: var(--accent-color);
            color: #fff;
            border-color: var(--accent-hover);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            transform: scale(1.05);
          }

          .content-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .chart-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .chart-container {
            background: var(--card-bg);
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 5px 15px var(--shadow-color);
            height: 300px;
            border: 1px solid var(--border-color);
            position: relative;
            backdrop-filter: blur(5px);
          }

          .price-dashboard {
            background: var(--card-bg);
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 5px 15px var(--shadow-color);
            max-height: 450px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--accent-color) var(--border-color);
            backdrop-filter: blur(5px);
          }

          .dashboard-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 12px;
            position: sticky;
            top: 0;
            background: var(--card-bg);
            z-index: 1;
          }

          .animate-in {
            animation: bounceIn 0.7s ease-out both;
          }

          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.95); }
            60% { opacity: 1; transform: scale(1.02); }
            100% { transform: scale(1); }
          }

          @media (min-width: 1024px) {
            .content-grid { grid-template-columns: 2fr 1fr; }
            .chart-container { height: 400px; }
            .price-dashboard { max-height: 500px; }
            .header { padding: 15px 25px; }
            .logo { font-size: 28px; }
            .header-date { font-size: 14px; }
            .search-bar form { max-width: 300px; }
            .search-input { padding: 8px 12px; font-size: 12px; }
            .search-button { padding: 8px; width: 32px; height: 32px; }
            .asset-tab { padding: 10px 20px; font-size: 14px; }
          }

          @media (max-width: 768px) {
            .header { padding: 10px 15px; flex-direction: column; gap: 8px; }
            .logo { font-size: 22px; }
            .header-date { font-size: 11px; }
            .theme-toggle { width: 32px; height: 32px; }
            .search-bar form { max-width: 250px; }
            .search-input { padding: 6px 10px; font-size: 11px; }
            .search-button { padding: 6px; width: 28px; height: 28px; }
            .asset-tab { padding: 7px 12px; font-size: 12px; }
            .chart-container { height: 280px; padding: 12px; }
            .price-dashboard { max-height: 400px; padding: 12px; }
            .dashboard-title { font-size: 14px; }
          }

          @media (max-width: 480px) {
            .app-container { padding: 10px; }
            .header { padding: 8px 12px; }
            .logo { font-size: 20px; }
            .header-date { font-size: 10px; }
            .theme-toggle { width: 30px; height: 30px; }
            .search-bar form { max-width: 220px; }
            .search-input { padding: 5px 8px; font-size: 10px; }
            .search-button { padding: 5px; width: 26px; height: 26px; }
            .search-button svg { width: 8px; height: 8px; }
            .asset-tab { padding: 6px 10px; font-size: 11px; }
            .chart-container { height: 250px; padding: 10px; }
            .price-dashboard { max-height: 350px; padding: 10px; }
            .dashboard-title { font-size: 13px; }
          }

          @media (max-width: 320px) {
            .app-container { padding: 8px; }
            .header { padding: 6px 10px; }
            .logo { font-size: 18px; }
            .header-date { font-size: 9px; }
            .theme-toggle { width: 28px; height: 28px; }
            .search-bar form { max-width: 200px; }
            .search-input { padding: 4px 6px; font-size: 9px; }
            .search-button { padding: 4px; width: 24px; height: 24px; }
            .asset-tab { padding: 5px 8px; font-size: 10px; }
            .chart-container { height: 220px; padding: 8px; }
            .price-dashboard { max-height: 300px; padding: 8px; }
            .dashboard-title { font-size: 12px; }
          }
        `}</style>
      </div>
    );
  }

  const PriceCard = ({ asset, price, volume, lastClose, animate, delay, onTradeAction }) => {
    const isBitcoin = asset.key === "BTC";
    const currencySymbol = isBitcoin ? "$" : "₹";
    const formattedPrice =
      price && price !== "Market Closed" && price !== "Data Unavailable" && price !== "Loading..."
        ? `${currencySymbol}${parseFloat(price.replace(/[^0-9.-]+/g, "")).toLocaleString(isBitcoin ? "en-US" : "en-IN", { minimumFractionDigits: 2 })}`
        : price;
    const formattedLastClose =
      lastClose && lastClose.close
        ? `${currencySymbol}${parseFloat(lastClose.close).toLocaleString(isBitcoin ? "en-US" : "en-IN", { minimumFractionDigits: 2 })}`
        : "N/A";
    const formattedVolume = volume || "N/A";
    const assetType = asset.type || "index";

    const handleTradeAction = (action) => {
      onTradeAction(action, asset, formattedPrice);
    };

    return (
      <div className={`price-card ${animate ? "animate-in" : ""}`} style={{ animationDelay: delay || "0.4s" }}>
        <div>
          <h3 className="asset-name">{asset.name || "Unknown Asset"}</h3>
          <p className="last-close">
            Last Close: {formattedLastClose}{" "}
            {lastClose && lastClose.percentChange && (
              <span className={lastClose.percentChange < 0 ? "negative" : "positive"}>
                ({lastClose.percentChange >= 0 ? "+" : ""}{lastClose.percentChange.toFixed(2)}%)
              </span>
            )}
          </p>
          {assetType !== "index" && (
            <p className="volume">Volume: {formattedVolume}</p>
          )}
        </div>
        <div className="price-display">
          <p className={`current-price ${formattedPrice === "Market Closed" || formattedPrice === "Data Unavailable" ? "unavailable" : "available"}`}>
            {formattedPrice || "Loading..."}
          </p>
          {assetType === "stock" && (
            <div className="trade-buttons">
              <button
                className="buy-button"
                onClick={() => handleTradeAction("Buy")}
                disabled={formattedPrice === "Market Closed" || formattedPrice === "Data Unavailable" || formattedPrice === "Loading..."}
              >
                Buy
              </button>
              <button
                className="sell-button"
                onClick={() => handleTradeAction("Sell")}
                disabled={formattedPrice === "Market Closed" || formattedPrice === "Data Unavailable" || formattedPrice === "Loading..."}
              >
                Sell
              </button>
            </div>
          )}
        </div>
        <style jsx="true">{`
          .price-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 3px 10px var(--shadow-color);
            border: 1px solid var(--border-color);
            transition: transform 0.3s, box-shadow 0.3s;
          }

          .price-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 12px var(--shadow-color);
          }

          .asset-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 3px;
          }

          .last-close {
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 2px;
          }

          .volume {
            font-size: 11px;
            color: var(--text-secondary);
          }

          .price-display {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }

          .current-price {
            font-size: 14px;
            font-weight: 600;
            transition: transform 0.2s;
          }

          .current-price.available { color: var(--positive); }
          .current-price.unavailable { color: var(--negative); }
          .price-card:hover .current-price { transform: scale(1.05); }
          .positive { color: var(--positive); }
          .negative { color: var(--negative); }

          .trade-buttons {
            display: flex;
            gap: 6px;
          }

          .buy-button, .sell-button {
            padding: 5px 10px;
            border: none;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 600;
            color: #fff;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
          }

          .buy-button { background: var(--buy-color); }
          .sell-button { background: var(--sell-color); }
          .buy-button:hover, .sell-button:hover { transform: scale(1.05); }
          .buy-button:disabled, .sell-button:disabled { opacity: 0.5; cursor: not-allowed; }

          @media (max-width: 768px) {
            .price-card { padding: 8px 10px; }
            .asset-name { font-size: 12px; }
            .last-close, .volume { font-size: 10px; }
            .current-price { font-size: 13px; }
            .buy-button, .sell-button { padding: 4px 8px; font-size: 10px; }
          }

          @media (max-width: 480px) {
            .price-card { padding: 6px 8px; flex-direction: column; align-items: flex-start; gap: 6px; }
            .asset-name { font-size: 11px; }
            .last-close, .volume { font-size: 9px; }
            .current-price { font-size: 12px; }
            .price-display { align-items: flex-start; width: 100%; }
            .trade-buttons { width: 100%; justify-content: space-between; }
            .buy-button, .sell-button { padding: 4px 6px; font-size: 9px; flex: 1; }
          }

          @media (max-width: 320px) {
            .price-card { padding: 5px 6px; }
            .asset-name { font-size: 10px; }
            .last-close, .volume { font-size: 8px; }
            .current-price { font-size: 11px; }
            .buy-button, .sell-button { padding: 3px 5px; font-size: 8px; }
          }
        `}</style>
      </div>
    );
  };

  const TopStocks = ({ stocks, animate, onStockClick }) => (
    <div className={`top-stocks ${animate ? "animate-in" : ""}`} style={{ animationDelay: "0.1s" }}>
      <h2 className="top-stocks-title">Most Traded Stocks</h2>
      <div className="top-stocks-container">
        {stocks.length > 0 ? (
          stocks.map((stock, index) => (
            <div
              key={stock.ticker}
              className="top-stock-card"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              onClick={() => onStockClick(stock.ticker)}
            >
              <div className="stock-info">
                <h3 className="stock-name">{stock.name}</h3>
                <p className="stock-price">
                  ₹{parseFloat(stock.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className={`stock-change ${stock.percentChange >= 0 ? "positive" : "negative"}`}>
                  {stock.percentChange >= 0 ? "+" : ""}{stock.percentChange.toFixed(2)}%
                </p>
                <p className="stock-volume">Vol: {formatVolume(stock.volume)}</p>
              </div>
            </div>
          ))
        ) : (
          <p>Loading top stocks...</p>
        )}
      </div>
      <style jsx="true">{`
        .top-stocks {
          background: var(--card-bg);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 5px 15px var(--shadow-color);
          backdrop-filter: blur(5px);
        }

        .top-stocks-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 12px;
          text-align: center;
        }

        .top-stocks-container {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          gap: 12px;
          padding-bottom: 8px;
          scrollbar-width: thin;
          scrollbar-color: var(--accent-color) var(--border-color);
        }

        .top-stocks-container::-webkit-scrollbar {
          height: 6px;
        }

        .top-stocks-container::-webkit-scrollbar-track {
          background: var(--border-color);
          border-radius: 3px;
        }

        .top-stocks-container::-webkit-scrollbar-thumb {
          background: var(--accent-color);
          border-radius: 3px;
        }

        .top-stocks-container::-webkit-scrollbar-thumb:hover {
          background: var(--accent-hover);
        }

        .top-stock-card {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 12px;
          min-width: 180px;
          flex-shrink: 0;
          transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
          box-shadow: 0 2px 6px var(--shadow-color);
          cursor: pointer;
        }

        .top-stock-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 15px var(--shadow-color);
          background: var(--accent-color);
          color: #fff;
        }

        .top-stock-card:hover .stock-name,
        .top-stock-card:hover .stock-price,
        .top-stock-card:hover .stock-change,
        .top-stock-card:hover .stock-volume {
          color: #fff;
        }

        .stock-info {
          display: flex;
          flex-direction: column;
        }

        .stock-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .stock-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--positive);
          margin-bottom: 4px;
        }

        .stock-change {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .stock-volume {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .positive { color: var(--positive); }
        .negative { color: var(--negative); }

        @media (max-width: 768px) {
          .top-stocks { padding: 12px; }
          .top-stocks-title { font-size: 14px; }
          .top-stock-card { padding: 10px; min-width: 160px; }
          .stock-name { font-size: 13px; }
          .stock-price { font-size: 14px; }
          .stock-change, .stock-volume { font-size: 11px; }
        }

        @media (max-width: 480px) {
          .top-stocks { padding: 10px; }
          .top-stocks-title { font-size: 13px; }
          .top-stock-card { padding: 8px; min-width: 140px; }
          .stock-name { font-size: 12px; }
          .stock-price { font-size: 13px; }
          .stock-change, .stock-volume { font-size: 10px; }
        }

        @media (max-width: 320px) {
          .top-stocks { padding: 8px; }
          .top-stocks-title { font-size: 12px; }
          .top-stock-card { padding: 6px; min-width: 120px; }
          .stock-name { font-size: 11px; }
          .stock-price { font-size: 12px; }
          .stock-change, .stock-volume { font-size: 9px; }
        }
      `}</style>
    </div>
  );

  export default App;