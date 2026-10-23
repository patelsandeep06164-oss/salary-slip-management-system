
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUsers,
  FaMoneyBillWave,
  FaFileInvoice,
  FaBuilding,
  FaArrowRight,
} from "react-icons/fa";

import api, { getApiError } from "../../services/api";

const icons = {
  Employee: FaUsers,
  Payroll: FaMoneyBillWave,
  "Salary Slip": FaFileInvoice,
  Department: FaBuilding,
};

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search).get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const search = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setError("Enter at least 2 characters to search.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get("/search", {
          params: { q: query.trim() },
        });

        if (!active) return;

        setResults(response.data?.results || []);
      } catch (err) {
        if (active) {
          setError(
            getApiError(err, "Unable to search. Please try again.")
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    search();

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div style={styles.headingIcon}>
          <FaSearch />
        </div>
        <div>
          <h1 style={styles.title}>Search Results</h1>
          <p style={styles.subtitle}>
            Results for <strong>"{query}"</strong>
          </p>
        </div>
      </div>

      {loading && <p style={styles.message}>Searching records...</p>}

      {!loading && error && (
        <p style={styles.error}>{error}</p>
      )}

      {!loading && !error && results.length === 0 && (
        <div style={styles.empty}>
          <FaSearch style={{ fontSize: 28, color: "#0a9fb7" }} />
          <h3>No results found</h3>
          <p>Try another employee name, ID, payroll status or slip number.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p style={styles.count}>
            Found {results.length} result(s)
          </p>

          <div style={styles.list}>
            {results.map((item) => {
              const Icon = icons[item.type] || FaSearch;

              return (
                <button
                  type="button"
                  key={`${item.type}-${item.id}`}
                  style={styles.result}
                  onClick={() => navigate(item.path)}
                >
                  <span style={styles.icon}>
                    <Icon />
                  </span>

                  <span style={styles.resultText}>
                    <span style={styles.type}>{item.type}</span>
                    <strong style={styles.resultTitle}>
                      {item.title}
                    </strong>
                    <span style={styles.description}>
                      {item.description || "No additional details"}
                    </span>
                  </span>

                  <FaArrowRight style={styles.arrow} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    color: "#19344d",
  },
  heading: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    marginBottom: 25,
  },
  headingIcon: {
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    borderRadius: 15,
    background: "linear-gradient(135deg, #10b9c7, #0878e8)",
    color: "#fff",
    fontSize: 21,
  },
  title: {
    margin: 0,
    fontSize: 27,
    fontWeight: 800,
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#71879b",
    fontSize: 13,
    overflowWrap: "anywhere",
  },
  count: {
    color: "#6c8397",
    fontSize: 13,
    marginBottom: 12,
  },
  list: {
    display: "grid",
    gap: 12,
  },
  result: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 17,
    border: "1px solid #e0edf3",
    borderRadius: 14,
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },
  icon: {
    width: 44,
    height: 44,
    flex: "0 0 44px",
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    background: "#e8f9fb",
    color: "#078ba7",
    fontSize: 17,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  type: {
    color: "#078ba7",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  resultTitle: {
    color: "#24445d",
    fontSize: 14,
    overflowWrap: "anywhere",
  },
  description: {
    color: "#7b90a1",
    fontSize: 12,
    overflowWrap: "anywhere",
  },
  arrow: {
    flex: "0 0 auto",
    color: "#8299ad",
  },
  empty: {
    display: "grid",
    justifyItems: "center",
    gap: 10,
    padding: 40,
    border: "1px solid #e0edf3",
    borderRadius: 16,
    background: "#fff",
    textAlign: "center",
  },
  message: {
    color: "#71879b",
    padding: 20,
  },
  error: {
    color: "#b42332",
    padding: 16,
    borderRadius: 10,
    background: "#fff0f0",
  },
};

export default SearchResults;
