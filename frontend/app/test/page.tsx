"use client";

import React, { useState } from "react";
import { ArrowLeft, Upload, TestTube, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PredictionResult {
  prediction: string;
  confidence: number;
  processing_time: number;
}

interface ApiResponse {
  prediction: string;
  confidence: number;
  processing_time: number;
}

interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
}

export default function TestPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const API_BASE_URL = "http://localhost:8000";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError("");
    }
  };

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data: HealthResponse = await response.json();
        setHealthStatus(data);
      } else {
        setError("Failed to check backend health");
      }
    } catch (err) {
      setError("Backend is not running or unreachable");
      setHealthStatus(null);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/predict/image`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        setResult(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Prediction failed");
      }
    } catch (err) {
      setError("Failed to connect to backend. Make sure the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <TestTube className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">TerraViT Backend Testing</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Health Check */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Backend Health</h2>
                <button
                  onClick={checkHealth}
                  disabled={isCheckingHealth}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {isCheckingHealth ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Check Health
                </button>
              </div>
              
              {healthStatus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {healthStatus.status === "ok" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">Status: {healthStatus.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Model Loaded: {healthStatus.model_loaded ? "Yes" : "No"}</p>
                    <p>Device: {healthStatus.device}</p>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Satellite Image</h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Choose an image file</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <button
                      onClick={clearSelection}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <button
                  onClick={handlePredict}
                  disabled={!selectedFile || isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-5 w-5" />
                      Run Prediction
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-800">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Image Preview */}
            {previewUrl && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Image Preview</h2>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Selected image"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Prediction Complete</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Prediction</p>
                      <p className="text-lg font-semibold">{result.prediction}</p>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-lg font-semibold">{(result.confidence * 100).toFixed(2)}%</p>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Processing Time</p>
                      <p className="text-lg font-semibold">{result.processing_time.toFixed(3)}s</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Documentation */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
              <div className="space-y-3 text-sm">
                <div className="bg-muted rounded p-3">
                  <code className="text-green-600">GET /health</code>
                  <p className="text-muted-foreground mt-1">Check backend health and model status</p>
                </div>
                <div className="bg-muted rounded p-3">
                  <code className="text-blue-600">POST /predict/image</code>
                  <p className="text-muted-foreground mt-1">Upload image for TerraViT prediction</p>
                </div>
                <div className="bg-muted rounded p-3">
                  <code className="text-purple-600">GET /</code>
                  <p className="text-muted-foreground mt-1">Root endpoint verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
