"use client";

import { useState, useEffect, useCallback } from "react";
import Loading from "@/components/ui/Loading";
import {
    Database,
    MapPin,
    Flame,
    Thermometer,
    Snowflake,
    Users,
    Filter,
    BarChart3,
    PieChart as PieChartIcon,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const TIER_COLORS: Record<string, string> = {
    "500+": "#22C55E",
    "200-499": "#38BDF8",
    "100-199": "#8B5CF6",
    "10-99": "#FACC15",
    "<10": "#EC4899",
};

const INTERN_COLORS = ["#22C55E", "#38BDF8", "#8B5CF6", "#FACC15"];
const INTERN_BG = ["bg-green/10", "bg-sky/10", "bg-purple/10", "bg-yellow/10"];
const INTERN_BORDER = ["border-green/30", "border-sky/30", "border-purple/30", "border-yellow/30"];
const INTERN_TEXT = ["text-green", "text-sky", "text-purple", "text-yellow"];

interface DistrictStat {
    district: string;
    count: number;
    total_installations: number;
    total_capacity: number;
}

interface TierStat {
    tier: string;
    count: number;
}

interface StateStat {
    state: string;
    count: number;
    total_installations: number;
}

interface TerritoryAssignment {
    label: string;
    districts: string[];
    vendorCount: number;
    installationCount: number;
}

interface AnalyticsData {
    districtDistribution: DistrictStat[];
    tierBreakdown: TierStat[];
    stateSummary: StateStat[];
    importStatus: { imported: number; available: number; total: number };
    temperature: { hot: number; warm: number; cold: number };
    territorySplit: TerritoryAssignment[];
}

export default function VendorAnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedState, setSelectedState] = useState("MAHARASHTRA");

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedState) params.set("state", selectedState);
            const res = await fetch(`/api/vendor-prospects/analytics?${params}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedState]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (isLoading && !data) {
        return <Loading text="Loading analytics..." />;
    }

    if (!data) {
        return (
            <div className="text-center py-12 text-text-secondary">
                Failed to load analytics data.
            </div>
        );
    }

    const totalVendors = data.importStatus.total;
    const totalDistricts = data.districtDistribution.length;
    const tempData = [
        { name: "Hot (500+)", value: data.temperature.hot, color: "#EF4444" },
        { name: "Warm (100-499)", value: data.temperature.warm, color: "#FB923C" },
        { name: "Cold (<100)", value: data.temperature.cold, color: "#38BDF8" },
    ].filter(d => d.value > 0);

    // Limit district chart to top 20 for readability
    const districtChartData = data.districtDistribution.slice(0, 20);

    return (
        <div className="space-y-8">
            {/* State Filter */}
            <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-purple" />
                <label className="text-sm font-bold text-text-secondary">Filter by State:</label>
                <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="bg-background-card border border-border/50 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-purple/50"
                >
                    <option value="">All States</option>
                    {data.stateSummary.map((s) => (
                        <option key={s.state} value={s.state}>
                            {s.state} ({s.count})
                        </option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card p-4 border-l-4 border-l-green">
                    <p className="text-xs text-text-secondary uppercase font-bold">Total Vendors</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{totalVendors.toLocaleString()}</p>
                    <Database className="w-5 h-5 text-green/40 mt-1" />
                </div>
                <div className="card p-4 border-l-4 border-l-sky">
                    <p className="text-xs text-text-secondary uppercase font-bold">Districts</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{totalDistricts}</p>
                    <MapPin className="w-5 h-5 text-sky/40 mt-1" />
                </div>
                <div className="card p-4 border-l-4 border-l-purple">
                    <p className="text-xs text-text-secondary uppercase font-bold">Available</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{data.importStatus.available.toLocaleString()}</p>
                    <p className="text-xs text-purple mt-0.5">Not yet imported</p>
                </div>
                <div className="card p-4 border-l-4 border-l-yellow">
                    <p className="text-xs text-text-secondary uppercase font-bold">Imported</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{data.importStatus.imported.toLocaleString()}</p>
                    <p className="text-xs text-yellow mt-0.5">Converted to leads</p>
                </div>
            </div>

            {/* Charts Row: Temperature + Installation Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lead Temperature Pie Chart */}
                <div className="card p-6">
                    <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                        <Flame className="w-5 h-5 text-coral" /> Lead Temperature
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-text-secondary">Hot: <strong className="text-text-primary">{data.temperature.hot}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Thermometer className="w-4 h-4 text-coral" />
                            <span className="text-xs text-text-secondary">Warm: <strong className="text-text-primary">{data.temperature.warm}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Snowflake className="w-4 h-4 text-sky" />
                            <span className="text-xs text-text-secondary">Cold: <strong className="text-text-primary">{data.temperature.cold}</strong></span>
                        </div>
                    </div>
                    {tempData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={tempData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) =>
                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={false}
                                >
                                    {tempData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1A1425",
                                        border: "1px solid #2D2640",
                                        borderRadius: "12px",
                                        color: "#F5F5F5",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-text-secondary text-center py-8">No data available</p>
                    )}
                </div>

                {/* Installation Tiers Bar Chart */}
                <div className="card p-6">
                    <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-purple" /> Installation Tiers
                    </h3>
                    {data.tierBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.tierBreakdown} layout="vertical">
                                <XAxis type="number" tick={{ fill: "#A1A1AA", fontSize: 12 }} />
                                <YAxis
                                    type="category"
                                    dataKey="tier"
                                    tick={{ fill: "#F5F5F5", fontSize: 12 }}
                                    width={70}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1A1425",
                                        border: "1px solid #2D2640",
                                        borderRadius: "12px",
                                        color: "#F5F5F5",
                                    }}
                                    formatter={(value: number) => [value, "Vendors"]}
                                />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                    {data.tierBreakdown.map((entry, i) => (
                                        <Cell key={i} fill={TIER_COLORS[entry.tier] || "#8B5CF6"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-text-secondary text-center py-8">No data available</p>
                    )}
                </div>
            </div>

            {/* District Distribution */}
            <div className="card p-6">
                <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green" /> Vendor Distribution by District
                    {data.districtDistribution.length > 20 && (
                        <span className="text-xs text-text-secondary font-normal ml-2">
                            (Top 20 of {data.districtDistribution.length})
                        </span>
                    )}
                </h3>
                {districtChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(300, districtChartData.length * 32)}>
                        <BarChart data={districtChartData} layout="vertical" margin={{ left: 10 }}>
                            <XAxis type="number" tick={{ fill: "#A1A1AA", fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="district"
                                tick={{ fill: "#F5F5F5", fontSize: 11 }}
                                width={130}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1A1425",
                                    border: "1px solid #2D2640",
                                    borderRadius: "12px",
                                    color: "#F5F5F5",
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === "count") return [value, "Vendors"];
                                    return [value, name];
                                }}
                            />
                            <Bar dataKey="count" fill="#22C55E" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-text-secondary text-center py-8">No district data available</p>
                )}
            </div>

            {/* 4-Intern Territory Split */}
            <div className="card p-6">
                <h3 className="font-bold text-text-primary flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-sky" /> Suggested 4-Intern Territory Split
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                    Districts are distributed to balance vendor counts evenly across 4 interns.
                </p>
                {data.territorySplit.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.territorySplit.map((intern, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${INTERN_BG[i]} ${INTERN_BORDER[i]}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className={`font-bold ${INTERN_TEXT[i]}`}>{intern.label}</h4>
                                    <span className="text-xs text-text-secondary">
                                        {totalVendors > 0
                                            ? `${((intern.vendorCount / totalVendors) * 100).toFixed(0)}%`
                                            : "0%"}{" "}
                                        of total
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-4 mb-3">
                                    <div>
                                        <p className="text-xl font-bold text-text-primary">
                                            {intern.vendorCount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-text-secondary">Vendors</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-text-primary">
                                            {intern.installationCount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-text-secondary">Installations</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-text-primary">
                                            {intern.districts.length}
                                        </p>
                                        <p className="text-xs text-text-secondary">Districts</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {intern.districts.map((d) => (
                                        <span
                                            key={d}
                                            className={`px-2 py-0.5 rounded-md text-xs font-medium ${INTERN_BG[i]} ${INTERN_TEXT[i]} border ${INTERN_BORDER[i]}`}
                                        >
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-secondary text-center py-8">
                        Not enough districts for territory split
                    </p>
                )}
            </div>
        </div>
    );
}
