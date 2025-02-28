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

function App() {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [btcChartData, setBtcChartData] = useState({
    datasets: [
      {
        label: "Bitcoin (BTC/USDT)",
        data: [],
        color: {
          up: "rgba(0, 255, 0, 0.8)",
          down: "rgba(255, 0, 0, 0.8)",
          unchanged: "rgba(128, 128, 128, 0.8)",
        },
        barThickness: 4,
      },
    ],
  });
  const [niftyChartData, setNiftyChartData] = useState({
    datasets: [
      {
        label: "Nifty 50",
        data: [],
        color: {
          up: "rgba(0, 255, 0, 0.8)",
          down: "rgba(255, 0, 0, 0.8)",
          unchanged: "rgba(128, 128, 128, 0.8)",
        },
        barThickness: 4,
      },
    ],
  });
  const [midcapChartData, setMidcapChartData] = useState({
    datasets: [
      {
        label: "Nifty Midcap 50",
        data: [],
        color: {
          up: "rgba(0, 255, 0, 0.8)",
          down: "rgba(255, 0, 0, 0.8)",
          unchanged: "rgba(128, 128, 128, 0.8)",
        },
        barThickness: 4,
      },
    ],
  });
  const [sensexChartData, setSensexChartData] = useState({
    datasets: [
      {
        label: "Sensex",
        data: [],
        color: {
          up: "rgba(0, 255, 0, 0.8)",
          down: "rgba(255, 0, 0, 0.8)",
          unchanged: "rgba(128, 128, 128, 0.8)",
        },
        barThickness: 4,
      },
    ],
  });
  const [livePrice, setLivePrice] = useState(null);
  const chartRef = useRef(null);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#ffffff", font: { size: 14 } },
      },
      title: {
        display: true,
        text:
          selectedAsset === "BTC"
            ? "Live Bitcoin Candlestick Chart (5s)"
            : selectedAsset === "NIFTY"
            ? "Nifty 50 Candlestick Chart (5m)"
            : selectedAsset === "MIDCAP"
            ? "Nifty Midcap 50 Candlestick Chart (5m)"
            : "Sensex Candlestick Chart (5m)",
        color: "#ffffff",
        font: { size: 18 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        callbacks: {
          label: (context) => {
            const candle = context.raw;
            return `O: ${candle.o} H: ${candle.h} L: ${candle.l} C: ${candle.c}`;
          },
        },
      },
      annotation: {
        annotations: {
          noData: {
            type: "label",
            xValue: "center",
            yValue: "center",
            content: ["Data Unavailable"],
            color: "#ffffff",
            font: { size: 20 },
            enabled:
              selectedAsset !== "BTC" &&
              (selectedAsset === "NIFTY"
                ? niftyChartData.datasets[0].data.length === 0
                : selectedAsset === "MIDCAP"
                ? midcapChartData.datasets[0].data.length === 0
                : sensexChartData.datasets[0].data.length === 0),
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: selectedAsset === "BTC" ? "second" : "minute",
          stepSize: selectedAsset === "BTC" ? 5 : 5,
          displayFormats: { second: "HH:mm:ss", minute: "HH:mm" },
        },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          color: "#ffffff",
          font: { size: 12 },
        },
        title: {
          display: true,
          text: "Time",
          color: "#ffffff",
          font: { size: 14 },
        },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        barPercentage: 0.98,
        categoryPercentage: 0.99,
      },
      y: {
        title: {
          display: true,
          text: selectedAsset === "BTC" ? "Price (USDT)" : "Index Value",
          color: "#ffffff",
          font: { size: 14 },
        },
        ticks: { color: "#ffffff", font: { size: 12 } },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
    backgroundColor: "transparent",
  };

  // Bitcoin WebSocket Logic
  useEffect(() => {
    if (selectedAsset !== "BTC") return;
    let ws;
    let currentCandle = null;
    let candles = [];

    const connectWebSocket = () => {
      ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1s");
      ws.onopen = () => console.log("Connected to Binance WebSocket");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const kline = data.k;
        if (!kline) return;

        const time = new Date(kline.t).getTime();
        const open = parseFloat(kline.o);
        const high = parseFloat(kline.h);
        const low = parseFloat(kline.l);
        const close = parseFloat(kline.c);
        const isClosed = kline.x;

        const fiveSecondInterval = 5000;
        const currentFiveSecond =
          Math.floor(time / fiveSecondInterval) * fiveSecondInterval;

        if (!currentCandle || currentCandle.x < currentFiveSecond) {
          currentCandle = {
            x: currentFiveSecond,
            o: open,
            h: high,
            l: low,
            c: close,
          };
          if (isClosed) {
            candles = [...candles, currentCandle].slice(-100);
            currentCandle = null;
          }
        } else {
          currentCandle.h = Math.max(currentCandle.h, high);
          currentCandle.l = Math.min(currentCandle.l, low);
          currentCandle.c = close;
          if (isClosed) {
            candles = [...candles, currentCandle].slice(-100);
            currentCandle = null;
          }
        }

        setBtcChartData((prevData) => ({
          datasets: [
            {
              ...prevData.datasets[0],
              data: [...candles, ...(currentCandle ? [currentCandle] : [])],
            },
          ],
        }));
      };
      ws.onerror = (error) => console.error("WebSocket error:", error);
      ws.onclose = () => setTimeout(connectWebSocket, 2000);
    };

    connectWebSocket();
    return () => ws && ws.close();
  }, [selectedAsset]);

  // Nifty 50 yfinance Logic via Backend
  useEffect(() => {
    if (selectedAsset !== "NIFTY") return;
    let candles = [];

    const fetchNiftyData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/nifty50/intraday"
        );
        candles = response.data;

        if (!candles || candles.length === 0) {
          setNiftyChartData((prevData) => ({
            datasets: [{ ...prevData.datasets[0], data: [] }],
          }));
          return;
        }

        const fiveMinuteCandles = [];
        let i = 0;
        while (i < candles.length) {
          const fiveMinStart =
            Math.floor(candles[i].x / (5 * 60 * 1000)) * (5 * 60 * 1000);
          const candle = {
            x: fiveMinStart,
            o: candles[i].o,
            h: candles[i].h,
            l: candles[i].l,
            c: candles[i].c,
          };
          i++;
          while (
            i < candles.length &&
            candles[i].x < fiveMinStart + 5 * 60 * 1000
          ) {
            candle.h = Math.max(candle.h, candles[i].h);
            candle.l = Math.min(candle.l, candles[i].l);
            candle.c = candles[i].c;
            i++;
          }
          fiveMinuteCandles.push(candle);
        }

        setNiftyChartData((prevData) => ({
          datasets: [
            { ...prevData.datasets[0], data: fiveMinuteCandles.slice(-100) },
          ],
        }));
      } catch (error) {
        console.error("Error fetching Nifty 50 data:", error);
        setNiftyChartData((prevData) => ({
          datasets: [{ ...prevData.datasets[0], data: [] }],
        }));
      }
    };

    fetchNiftyData();
    const interval = setInterval(fetchNiftyData, 60000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Nifty Midcap 50 yfinance Logic via Backend
  useEffect(() => {
    if (selectedAsset !== "MIDCAP") return;
    let candles = [];

    const fetchMidcapData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/niftymidcap50/intraday"
        );
        candles = response.data;

        if (!candles || candles.length === 0) {
          setMidcapChartData((prevData) => ({
            datasets: [{ ...prevData.datasets[0], data: [] }],
          }));
          return;
        }

        const fiveMinuteCandles = [];
        let i = 0;
        while (i < candles.length) {
          const fiveMinStart =
            Math.floor(candles[i].x / (5 * 60 * 1000)) * (5 * 60 * 1000);
          const candle = {
            x: fiveMinStart,
            o: candles[i].o,
            h: candles[i].h,
            l: candles[i].l,
            c: candles[i].c,
          };
          i++;
          while (
            i < candles.length &&
            candles[i].x < fiveMinStart + 5 * 60 * 1000
          ) {
            candle.h = Math.max(candle.h, candles[i].h);
            candle.l = Math.min(candle.l, candles[i].l);
            candle.c = candles[i].c;
            i++;
          }
          fiveMinuteCandles.push(candle);
        }

        setMidcapChartData((prevData) => ({
          datasets: [
            { ...prevData.datasets[0], data: fiveMinuteCandles.slice(-100) },
          ],
        }));
      } catch (error) {
        console.error("Error fetching Nifty Midcap 50 data:", error);
        setMidcapChartData((prevData) => ({
          datasets: [{ ...prevData.datasets[0], data: [] }],
        }));
      }
    };

    fetchMidcapData();
    const interval = setInterval(fetchMidcapData, 60000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Sensex yfinance Logic via Backend
  useEffect(() => {
    if (selectedAsset !== "SENSEX") return;
    let candles = [];

    const fetchSensexData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/sensex/intraday"
        );
        candles = response.data;

        if (!candles || candles.length === 0) {
          setSensexChartData((prevData) => ({
            datasets: [{ ...prevData.datasets[0], data: [] }],
          }));
          return;
        }

        const fiveMinuteCandles = [];
        let i = 0;
        while (i < candles.length) {
          const fiveMinStart =
            Math.floor(candles[i].x / (5 * 60 * 1000)) * (5 * 60 * 1000);
          const candle = {
            x: fiveMinStart,
            o: candles[i].o,
            h: candles[i].h,
            l: candles[i].l,
            c: candles[i].c,
          };
          i++;
          while (
            i < candles.length &&
            candles[i].x < fiveMinStart + 5 * 60 * 1000
          ) {
            candle.h = Math.max(candle.h, candles[i].h);
            candle.l = Math.min(candle.l, candles[i].l);
            candle.c = candles[i].c;
            i++;
          }
          fiveMinuteCandles.push(candle);
        }

        setSensexChartData((prevData) => ({
          datasets: [
            { ...prevData.datasets[0], data: fiveMinuteCandles.slice(-100) },
          ],
        }));
      } catch (error) {
        console.error("Error fetching Sensex data:", error);
        setSensexChartData((prevData) => ({
          datasets: [{ ...prevData.datasets[0], data: [] }],
        }));
      }
    };

    fetchSensexData();
    const interval = setInterval(fetchSensexData, 60000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Live Price Logic
  useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        if (selectedAsset === "BTC") {
          const response = await axios.get(
            "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
          );
          const price = parseFloat(response.data.price).toLocaleString(
            "en-US",
            { style: "currency", currency: "USD", minimumFractionDigits: 2 }
          );
          setLivePrice(price);
        } else {
          const endpoint =
            selectedAsset === "NIFTY"
              ? "http://localhost:5000/nifty50/quote"
              : selectedAsset === "MIDCAP"
              ? "http://localhost:5000/niftymidcap50/quote"
              : "http://localhost:5000/sensex/quote";

          const response = await axios.get(endpoint);
          const quoteData = response.data;
          if (quoteData.error || !quoteData.price) {
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
            const istTime = new Date(now.getTime() + istOffset);
            const hours = istTime.getUTCHours();
            const minutes = istTime.getUTCMinutes();
            const isMarketOpen =
              hours >= 9 && (hours < 15 || (hours === 15 && minutes <= 30));
            setLivePrice(isMarketOpen ? "Data Unavailable" : "Market Closed");
            return;
          }

          const price = parseFloat(quoteData.price).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
          });
          setLivePrice(price);
        }
      } catch (error) {
        console.error("Error fetching live price:", error);
        setLivePrice("Price unavailable");
      }
    };

    fetchLivePrice();
    const interval = setInterval(fetchLivePrice, 5000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        minHeight: "100vh",
        padding: "2%",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          color: "#00b4d8",
          textAlign: "center",
          marginBottom: "3%",
          fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        }}
      >
        Crypto & Indices Indian Trading App
      </h1>
      <div
        style={{
          textAlign: "center",
          marginBottom: "3%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => setSelectedAsset("BTC")}
          style={{
            padding: "1% 2%",
            backgroundColor: selectedAsset === "BTC" ? "#00b4d8" : "#2d2d2d",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            cursor: "pointer",
            minWidth: "100px",
          }}
        >
          Bitcoin
        </button>
        <button
          onClick={() => setSelectedAsset("NIFTY")}
          style={{
            padding: "1% 2%",
            backgroundColor: selectedAsset === "NIFTY" ? "#00b4d8" : "#2d2d2d",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            cursor: "pointer",
            minWidth: "100px",
          }}
        >
          Nifty 50
        </button>
        <button
          onClick={() => setSelectedAsset("MIDCAP")}
          style={{
            padding: "1% 2%",
            backgroundColor: selectedAsset === "MIDCAP" ? "#00b4d8" : "#2d2d2d",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            cursor: "pointer",
            minWidth: "100px",
          }}
        >
          Nifty Midcap 50
        </button>
        <button
          onClick={() => setSelectedAsset("SENSEX")}
          style={{
            padding: "1% 2%",
            backgroundColor: selectedAsset === "SENSEX" ? "#00b4d8" : "#2d2d2d",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            cursor: "pointer",
            minWidth: "100px",
          }}
        >
          Sensex
        </button>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "#2d2d2d",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          padding: "2%",
          height: "60vh",
          minHeight: "300px",
        }}
      >
        <Chart
          type="candlestick"
          data={
            selectedAsset === "BTC"
              ? btcChartData
              : selectedAsset === "NIFTY"
              ? niftyChartData
              : selectedAsset === "MIDCAP"
              ? midcapChartData
              : sensexChartData
          }
          options={options}
          ref={chartRef}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "3%",
          padding: "2%",
          background: "linear-gradient(45deg, #2d2d2d, #3a3a3a)",
          borderRadius: "15px",
          boxShadow: "0 6px 15px rgba(0, 0, 0, 0.4)",
          width: "90%",
          maxWidth: "800px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <span
          style={{
            fontSize: "clamp(1.2rem, 4vw, 2rem)",
            color: "#00b4d8",
            fontWeight: "bold",
            textShadow: "0 2px 6px rgba(0, 180, 216, 0.7)",
            animation: "pricePulse 2s infinite",
            textAlign: "center",
          }}
        >
          {livePrice
            ? `Live ${
                selectedAsset === "BTC"
                  ? "Bitcoin"
                  : selectedAsset === "NIFTY"
                  ? "Nifty 50"
                  : selectedAsset === "MIDCAP"
                  ? "Nifty Midcap 50"
                  : "Sensex"
              } Price: ${livePrice}`
            : "Loading live price..."}
        </span>
      </div>
      <style>
        {`
          @keyframes pricePulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @media (max-width: 768px) {
            h1 { font-size: clamp(1.2rem, 4vw, 2rem); }
            button { padding: 8px 16px; min-width: 80px; margin: 5px; }
            div[style*="height: 60vh"] { height: 50vh; min-height: 250px; }
            span[style*="fontSize"] { font-size: clamp(1rem, 3.5vw, 1.5rem); }
          }
          @media (max-width: 480px) {
            h1 { font-size: clamp(1rem, 3vw, 1.5rem); }
            button { padding: 6px 12px; min-width: 70px; }
            div[style*="height: 60vh"] { height: 40vh; min-height: 200px; }
            span[style*="fontSize"] { font-size: clamp(0.8rem, 3vw, 1.2rem); }
          }
        `}
      </style>
    </div>
  );
}

export default App;