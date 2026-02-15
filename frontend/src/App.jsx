// import { useState } from "react";
// import axios from "axios";

// function App() {
//   const [file, setFile] = useState(null);
//   const [result, setResult] = useState(null);

//   const handleUpload = async () => {
//     const formData = new FormData();
//     formData.append("file", file);

//     const response = await axios.post(
//       "http://localhost:8000/analyze",
//       formData
//     );

//     setResult(response.data);
//   };

//   return (
//     <div style={{ padding: 40 }}>
//       <h2>Earnings Call Analyzer</h2>

//       <input
//         type="file"
//         accept=".pdf"
//         onChange={(e) => setFile(e.target.files[0])}
//       />

//       <button onClick={handleUpload}>Analyze</button>

//       {result && (
//         <pre style={{ marginTop: 20 }}>
//           {JSON.stringify(result, null, 2)}
//         </pre>
//       )}
//     </div>
//   );
// }

// export default App;
import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/analyze", formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the document. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <header>
        <h1>📊 Earnings Call Analyzer</h1>
        <p>Upload a PDF to extract key insights instantly.</p>
      </header>

      {/* UPLOAD BOX */}
      <div className="upload-section">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button 
          className="analyze-btn" 
          onClick={handleUpload} 
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Report"}
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* RESULTS GRID */}
      {result && (
        <div className="results-grid">
          
          {/* Tone & Confidence (Spans full width) */}
          <div className="card full-width">
            <h3>Management Tone</h3>
            <p className="metric-value">{result.management_tone}</p>
            <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
              Confidence Level: <strong>{result.confidence_level}</strong>
            </p>
          </div>

          {/* Positives */}
          <div className="card">
            <h3 style={{ color: "var(--success)" }}>Key Positives</h3>
            <ul className="list-group">
              {result.key_positives.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Concerns */}
          <div className="card">
            <h3 style={{ color: "var(--danger)" }}>Key Concerns</h3>
            <ul className="list-group">
              {result.key_concerns.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Guidance Section */}
          <div className="card">
            <h3>Revenue Guidance</h3>
            <p className="metric-value">{result.forward_guidance.revenue}</p>
          </div>

          <div className="card">
            <h3>Margin Guidance</h3>
            <p className="metric-value">{result.forward_guidance.margin}</p>
          </div>

          <div className="card">
            <h3>Capex Guidance</h3>
            <p className="metric-value">{result.forward_guidance.capex}</p>
          </div>

          <div className="card">
            <h3>Capacity Utilization</h3>
            <p className="metric-value">{result.capacity_utilization}</p>
          </div>

          {/* Growth Initiatives (Spans full width) */}
          <div className="card full-width">
            <h3>New Growth Initiatives</h3>
            <ul className="list-group">
              {result.new_growth_initiatives.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;