"use client";

export const dynamic = "force-dynamic";

import { useEmployeeAuth } from "@/lib/employee-auth";
import { showToast } from "@/components/ui/Toast";
import {
    ArrowLeft,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Database,
    MapPin,
    BarChart3,
    X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ParsedRow {
    state: string;
    district: string;
    company_name: string;
    brand_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    installations?: number;
    capacity_kwp?: number;
    scraped_at?: string;
}

interface UploadResult {
    inserted: number;
    updated: number;
    skipped: number;
    total: number;
    errors?: string[];
}

interface StateStats {
    state: string;
    count: number;
}

function parseCSV(csvText: string): ParsedRow[] {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
        // Handle CSV with commas in quoted fields
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
            row[header] = values[i] || "";
        });

        return {
            state: row.state || "",
            district: row.district || "",
            company_name: row.company_name || "",
            brand_name: row.brand_name || undefined,
            contact_person: row.contact_person || undefined,
            email: row.email || undefined,
            phone: row.phone || undefined,
            installations: parseInt(row.installations) || 0,
            capacity_kwp: parseInt(row.capacity_kwp) || 0,
            scraped_at: row.scraped_at || undefined,
        };
    }).filter((row) => row.company_name && row.state && row.district);
}

export default function VendorDataPage() {
    const { isAdmin, employee } = useEmployeeAuth();

    const [files, setFiles] = useState<File[]>([]);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [stateStats, setStateStats] = useState<StateStats[]>([]);
    const [totalVendors, setTotalVendors] = useState(0);

    const fetchStats = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("vendor_prospects")
                .select("state");

            if (!error && data) {
                setTotalVendors(data.length);
                const counts: Record<string, number> = {};
                data.forEach((row: { state: string }) => {
                    counts[row.state] = (counts[row.state] || 0) + 1;
                });
                setStateStats(
                    Object.entries(counts)
                        .map(([state, count]) => ({ state, count }))
                        .sort((a, b) => b.count - a.count)
                );
            }
        } catch {
            // Stats are non-critical
        }
    }, []);

    useEffect(() => {
        if (isAdmin) fetchStats();
    }, [isAdmin, fetchStats]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        setFiles(selectedFiles);
        setUploadResult(null);

        // Parse all CSV files
        const allRows: ParsedRow[] = [];
        for (const file of selectedFiles) {
            const text = await file.text();
            const rows = parseCSV(text);
            allRows.push(...rows);
        }

        setParsedRows(allRows);

        if (allRows.length === 0) {
            showToast("No valid rows found in the CSV file(s)", "error");
        }
    };

    const handleUpload = async () => {
        if (parsedRows.length === 0) return;

        setIsUploading(true);
        setUploadResult(null);

        try {
            const res = await fetch("/api/vendor-prospects/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: parsedRows }),
            });

            const json = await res.json();

            if (res.ok) {
                setUploadResult(json);
                showToast(
                    `Upload complete: ${json.inserted} vendors processed`,
                    "success"
                );
                fetchStats(); // Refresh stats
            } else {
                showToast(json.error || "Upload failed", "error");
            }
        } catch {
            showToast("Upload failed", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const clearFiles = () => {
        setFiles([]);
        setParsedRows([]);
        setUploadResult(null);
    };

    // Get unique states and districts from parsed data
    const parsedStates = [...new Set(parsedRows.map((r) => r.state))];
    const parsedDistricts = [...new Set(parsedRows.map((r) => r.district))];

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-pink mx-auto" />
                    <h2 className="text-2xl font-bold text-text-primary">Access Denied</h2>
                    <p className="text-text-secondary">Only admins can manage vendor data.</p>
                    <Link
                        href="/tools"
                        className="inline-block px-4 py-2 bg-pink text-white rounded-xl font-bold"
                    >
                        Back to Portal
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-green/10 border-b border-green/20 px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-5xl mx-auto space-y-1">
                    <Link
                        href="/tools"
                        className="text-green flex items-center gap-1 text-sm font-bold hover:underline mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Portal
                    </Link>
                    <h1 className="text-3xl font-bold text-text-primary">Vendor Data Management</h1>
                    <p className="text-text-secondary">
                        Upload CSV files to populate vendor prospects for your team
                    </p>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="card p-5 border-l-4 border-l-green">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-bold">Total Vendors</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">{totalVendors}</p>
                            </div>
                            <Database className="w-8 h-8 text-green/30" />
                        </div>
                    </div>

                    <div className="card p-5 border-l-4 border-l-sky">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-bold">States</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">{stateStats.length}</p>
                            </div>
                            <MapPin className="w-8 h-8 text-sky/30" />
                        </div>
                    </div>

                    <div className="card p-5 border-l-4 border-l-purple">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-bold">Top State</p>
                                <p className="text-lg font-bold text-text-primary mt-1 truncate">
                                    {stateStats[0]?.state || "—"}
                                </p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-purple/30" />
                        </div>
                        {stateStats[0] && (
                            <p className="text-xs text-purple mt-1">{stateStats[0].count} vendors</p>
                        )}
                    </div>
                </div>

                {/* Upload Section */}
                <div className="card p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green/10">
                            <Upload className="w-6 h-6 text-green" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Upload CSV Files</h2>
                            <p className="text-sm text-text-secondary">
                                Upload vendor CSV files (one per district). Duplicate vendors are automatically handled.
                            </p>
                        </div>
                    </div>

                    {/* File Input */}
                    <div className="relative">
                        {files.length === 0 ? (
                            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/50 rounded-xl hover:border-green/30 transition-colors cursor-pointer bg-background">
                                <FileSpreadsheet className="w-12 h-12 text-text-secondary mb-3" />
                                <p className="text-sm font-medium text-text-primary">
                                    Click to select CSV files
                                </p>
                                <p className="text-xs text-text-secondary mt-1">
                                    Expected format: state, district, company_name, brand_name, contact_person, email, phone, installations, capacity_kwp, scraped_at
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </label>
                        ) : (
                            <div className="p-4 bg-background rounded-xl border border-border/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5 text-green" />
                                        <span className="text-sm font-bold text-text-primary">
                                            {files.length} file{files.length > 1 ? "s" : ""} selected
                                        </span>
                                    </div>
                                    <button
                                        onClick={clearFiles}
                                        className="p-1.5 text-text-secondary hover:text-pink transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* File names */}
                                <div className="flex flex-wrap gap-2">
                                    {files.map((f, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-green/10 text-green rounded-md text-xs font-medium"
                                        >
                                            {f.name}
                                        </span>
                                    ))}
                                </div>

                                {/* Parsed summary */}
                                {parsedRows.length > 0 && (
                                    <div className="p-3 bg-background-card rounded-lg space-y-2">
                                        <p className="text-sm font-medium text-text-primary">
                                            📊 {parsedRows.length} vendors parsed
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                                            <span>
                                                States: {parsedStates.join(", ")}
                                            </span>
                                            <span>•</span>
                                            <span>{parsedDistricts.length} district{parsedDistricts.length > 1 ? "s" : ""}</span>
                                        </div>

                                        {/* Preview first 5 rows */}
                                        <div className="overflow-x-auto mt-2">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-border/30">
                                                        <th className="text-left p-1.5 text-text-secondary font-medium">Company</th>
                                                        <th className="text-left p-1.5 text-text-secondary font-medium">District</th>
                                                        <th className="text-left p-1.5 text-text-secondary font-medium">Phone</th>
                                                        <th className="text-right p-1.5 text-text-secondary font-medium">Installations</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {parsedRows.slice(0, 5).map((row, i) => (
                                                        <tr key={i} className="border-b border-border/10">
                                                            <td className="p-1.5 text-text-primary truncate max-w-[200px]">{row.company_name}</td>
                                                            <td className="p-1.5 text-text-secondary">{row.district}</td>
                                                            <td className="p-1.5 text-text-secondary">{row.phone}</td>
                                                            <td className="p-1.5 text-right text-text-secondary">{row.installations}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {parsedRows.length > 5 && (
                                                <p className="text-xs text-text-secondary text-center mt-2">
                                                    ...and {parsedRows.length - 5} more rows
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Upload Button */}
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || parsedRows.length === 0}
                                    className="w-full py-3 bg-green text-white rounded-xl font-bold shadow-lg hover:bg-green/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading {parsedRows.length} vendors...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload {parsedRows.length} Vendors to Database
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Upload Result */}
                    {uploadResult && (
                        <div className="p-4 bg-green/5 border border-green/20 rounded-xl space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green" />
                                <h3 className="font-bold text-green">Upload Complete</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-2 bg-background rounded-lg">
                                    <p className="text-lg font-bold text-green">{uploadResult.inserted}</p>
                                    <p className="text-xs text-text-secondary">Processed</p>
                                </div>
                                <div className="p-2 bg-background rounded-lg">
                                    <p className="text-lg font-bold text-yellow">{uploadResult.skipped}</p>
                                    <p className="text-xs text-text-secondary">Skipped</p>
                                </div>
                                <div className="p-2 bg-background rounded-lg">
                                    <p className="text-lg font-bold text-text-primary">{uploadResult.total}</p>
                                    <p className="text-xs text-text-secondary">Total Rows</p>
                                </div>
                            </div>
                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <div className="p-2 bg-pink/5 border border-pink/20 rounded-lg mt-2">
                                    <p className="text-xs text-pink font-medium">Errors:</p>
                                    {uploadResult.errors.map((err, i) => (
                                        <p key={i} className="text-xs text-text-secondary">{err}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* State Breakdown */}
                {stateStats.length > 0 && (
                    <div className="card p-6">
                        <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-purple" /> Vendors by State
                        </h3>
                        <div className="space-y-2">
                            {stateStats.map((stat) => (
                                <div key={stat.state} className="flex items-center gap-3">
                                    <span className="text-sm text-text-primary font-medium w-40 truncate">
                                        {stat.state}
                                    </span>
                                    <div className="flex-1 h-6 bg-background rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green/80 to-green rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(stat.count / totalVendors) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-text-secondary font-mono w-12 text-right">
                                        {stat.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
