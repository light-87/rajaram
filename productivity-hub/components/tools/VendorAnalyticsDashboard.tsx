"use client";

import { useState, useEffect, useCallback } from "react";
import Loading from "@/components/ui/Loading";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/database";
import {
    Database,
    MapPin,
    Flame,
    Thermometer,
    Snowflake,
    Filter,
    BarChart3,
    TrendingUp,
    IndianRupee,
    ArrowDownToLine,
    Users,
    User,
    ChevronDown,
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
} from "recharts";

// Shared tooltip style for dark theme
const TOOLTIP_STYLE = {
    backgroundColor: "#1A1425",
    border: "1px solid #2D2640",
    borderRadius: "12px",
    color: "#F5F5F5",
    fontSize: "12px",
};

const TIER_COLORS: Record<string, string> = {
    "500+": "#22C55E",
    "200-499": "#38BDF8",
    "100-199": "#8B5CF6",
    "10-99": "#FACC15",
    "<10": "#EC4899",
};

const STATUS_COLORS: Record<string, string> = {
    // Kuberbook (legacy)
    new: "#38BDF8",
    contacted: "#FACC15",
    follow_up: "#FB923C",
    qualified: "#8B5CF6",
    converted: "#22C55E",
    lost: "#EC4899",
    // Solar Vendor
    not_called: "#94A3B8",
    no_answer: "#FACC15",
    not_interested: "#EC4899",
    interested: "#4ADE80",
    demo_scheduled: "#8B5CF6",
    disqualified: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
    // Kuberbook (legacy)
    new: "New",
    contacted: "Contacted",
    follow_up: "Follow Up",
    qualified: "Qualified",
    converted: "Converted",
    lost: "Lost",
    // Solar Vendor
    not_called: "Not Called",
    no_answer: "No Answer",
    not_interested: "Not Interested",
    interested: "Interested",
    demo_scheduled: "Demo Scheduled",
    disqualified: "Disqualified",
};

interface DistrictStat {
    district: string;
    count: number;
    total_installations: number;
    total_capacity: number;
    imported_count: number;
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

interface LeadStatusStat {
    status: string;
    count: number;
}

interface DistrictLeadStatusStat {
    district: string;
    status: string;
    count: number;
}

interface AnalyticsData {
    districtDistribution: DistrictStat[];
    tierBreakdown: TierStat[];
    stateSummary: StateStat[];
    importStatus: { imported: number; available: number; total: number };
    temperature: { hot: number; warm: number; cold: number };
    leadStatus: LeadStatusStat[];
    clientRevenue: {
        client_count: number;
        total_setup_profit: number;
        total_recurring_profit: number;
        total_contract_value: number;
    };
    districtLeadStatus: DistrictLeadStatusStat[];
    districts: string[];
}

const TIER_FILTERS = [
    { label: "All", value: "" },
    { label: "Hot (500+)", value: "500+", color: "text-green" },
    { label: "Warm (100-499)", value: "100-499", color: "text-yellow" },
    { label: "Cold (<100)", value: "<100", color: "text-sky" },
];

export default function VendorAnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedState, setSelectedState] = useState("MAHARASHTRA");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedTier, setSelectedTier] = useState("");
    const [selectedIntern, setSelectedIntern] = useState("");
    const [employees, setEmployees] = useState<Profile[]>([]);

    // Fetch employees for intern filter
    useEffect(() => {
        supabase.from("profiles").select("*").eq("is_active", true).order("full_name").then(({ data: profiles }) => {
            setEmployees(profiles || []);
        });
    }, []);

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedState) params.set("state", selectedState);
            if (selectedDistrict) params.set("district", selectedDistrict);
            if (selectedTier) params.set("tier", selectedTier);
            if (selectedIntern) params.set("assigned_to", selectedIntern);
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
    }, [selectedState, selectedDistrict, selectedTier, selectedIntern]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Reset district when state changes
    useEffect(() => {
        setSelectedDistrict("");
    }, [selectedState]);

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

    const leadStatusData = data.leadStatus.map(s => ({
        name: STATUS_LABELS[s.status] || s.status,
        value: s.count,
        color: STATUS_COLORS[s.status] || "#A1A1AA",
    }));

    // Build per-district lead status table
    const districtLeadMap: Record<string, Record<string, number>> = {};
    for (const row of data.districtLeadStatus) {
        if (!districtLeadMap[row.district]) districtLeadMap[row.district] = {};
        districtLeadMap[row.district][row.status] = row.count;
    }
    const allStatuses = [...new Set(data.districtLeadStatus.map(r => r.status))];

    // Limit district chart to top 25
    const districtChartData = data.districtDistribution.slice(0, 25);

    const formatCurrency = (val: number) => {
        if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    return (
        <div className="space-y-8">
            {/* Filters Row */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-purple" />
                    <span className="text-sm font-bold text-text-primary">Filters</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* State Filter */}
                    <div>
                        <label className="text-xs text-text-secondary font-bold block mb-1">State</label>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple/50"
                        >
                            <option value="">All States</option>
                            {data.stateSummary.map((s) => (
                                <option key={s.state} value={s.state}>
                                    {s.state} ({s.count})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* District Filter */}
                    <div>
                        <label className="text-xs text-text-secondary font-bold block mb-1">District</label>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple/50"
                        >
                            <option value="">All Districts</option>
                            {data.districts.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tier Filter */}
                    <div>
                        <label className="text-xs text-text-secondary font-bold block mb-1">Installation Tier</label>
                        <div className="flex gap-1">
                            {TIER_FILTERS.map((tf) => (
                                <button
                                    key={tf.value}
                                    onClick={() => setSelectedTier(tf.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                        selectedTier === tf.value
                                            ? "bg-purple/20 border-purple/50 text-purple"
                                            : "bg-background border-border/30 text-text-secondary hover:text-text-primary"
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Intern Filter */}
                    {employees.length > 0 && (
                        <div>
                            <label className="text-xs text-text-secondary font-bold block mb-1">Intern / Employee</label>
                            <div className="relative">
                                <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
                                <select
                                    value={selectedIntern}
                                    onChange={(e) => setSelectedIntern(e.target.value)}
                                    className="pl-7 pr-7 py-2 bg-background border border-border/50 rounded-lg text-sm text-text-primary focus:outline-none focus:border-purple/50 appearance-none cursor-pointer"
                                >
                                    <option value="">All Interns</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards Row 1 */}
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
                    <p className="text-xs text-text-secondary uppercase font-bold">Imported as Leads</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{data.importStatus.imported.toLocaleString()}</p>
                    <ArrowDownToLine className="w-5 h-5 text-purple/40 mt-1" />
                </div>
                <div className="card p-4 border-l-4 border-l-yellow">
                    <p className="text-xs text-text-secondary uppercase font-bold">Available</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{data.importStatus.available.toLocaleString()}</p>
                    <p className="text-xs text-yellow mt-0.5">Not yet imported</p>
                </div>
            </div>

            {/* Revenue & Clients Card */}
            <div className="card p-5 border-l-4 border-l-green">
                <h3 className="font-bold text-text-primary flex items-center gap-2 mb-3">
                    <IndianRupee className="w-5 h-5 text-green" /> Converted Clients & Revenue
                    {selectedState && <span className="text-xs text-text-secondary font-normal">({selectedState}{selectedDistrict ? ` / ${selectedDistrict}` : ""})</span>}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-text-secondary">Clients Converted</p>
                        <p className="text-xl font-bold text-green">{data.clientRevenue.client_count}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Setup Profit</p>
                        <p className="text-xl font-bold text-text-primary">
                            {formatCurrency(Number(data.clientRevenue.total_setup_profit))}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Recurring Profit</p>
                        <p className="text-xl font-bold text-text-primary">
                            {formatCurrency(Number(data.clientRevenue.total_recurring_profit))}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Contract Value</p>
                        <p className="text-xl font-bold text-text-primary">
                            {formatCurrency(Number(data.clientRevenue.total_contract_value))}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Row: Temperature + Lead Status */}
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
                                    contentStyle={TOOLTIP_STYLE}
                                    itemStyle={{ color: "#F5F5F5" }}
                                    labelStyle={{ color: "#A1A1AA" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-text-secondary text-center py-8">No data available</p>
                    )}
                </div>

                {/* Lead Status Breakdown */}
                <div className="card p-6">
                    <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-green" /> Lead Pipeline Status
                    </h3>
                    {leadStatusData.length > 0 ? (
                        <>
                            <div className="space-y-2 mb-4">
                                {leadStatusData.map((s) => {
                                    const total = leadStatusData.reduce((sum, x) => sum + x.value, 0);
                                    const pct = total > 0 ? ((s.value / total) * 100).toFixed(0) : "0";
                                    return (
                                        <div key={s.name} className="flex items-center gap-3">
                                            <span className="text-xs text-text-primary font-medium w-24">{s.name}</span>
                                            <div className="flex-1 h-5 bg-background rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: s.color,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-text-secondary font-mono w-16 text-right">
                                                {s.value} ({pct}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="text-xs text-text-secondary">
                                Total leads from vendors: <strong className="text-text-primary">{leadStatusData.reduce((s, x) => s + x.value, 0)}</strong>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-text-secondary text-center py-8">No leads imported from vendors yet</p>
                    )}
                </div>
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
                                contentStyle={TOOLTIP_STYLE}
                                itemStyle={{ color: "#F5F5F5" }}
                                labelStyle={{ color: "#A1A1AA" }}
                                formatter={(value: number) => [value.toLocaleString(), "Vendors"]}
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

            {/* District Distribution */}
            <div className="card p-6">
                <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green" /> Vendor Distribution by District
                    {data.districtDistribution.length > 25 && (
                        <span className="text-xs text-text-secondary font-normal ml-2">
                            (Top 25 of {data.districtDistribution.length})
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
                                contentStyle={TOOLTIP_STYLE}
                                itemStyle={{ color: "#F5F5F5" }}
                                labelStyle={{ color: "#F5F5F5" }}
                                formatter={(value: number, name: string) => {
                                    if (name === "count") return [value.toLocaleString(), "Vendors"];
                                    if (name === "imported_count") return [value.toLocaleString(), "Imported"];
                                    return [value.toLocaleString(), name];
                                }}
                            />
                            <Bar dataKey="count" fill="#22C55E" radius={[0, 6, 6, 0]} name="count" />
                            <Bar dataKey="imported_count" fill="#8B5CF6" radius={[0, 6, 6, 0]} name="imported_count" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-text-secondary text-center py-8">No district data available</p>
                )}
            </div>

            {/* Per-District Lead Status Table */}
            {Object.keys(districtLeadMap).length > 0 && (
                <div className="card p-6">
                    <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-sky" /> Lead Status by District
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/30">
                                    <th className="text-left p-2 text-text-secondary font-medium">District</th>
                                    {allStatuses.map((s) => (
                                        <th key={s} className="text-center p-2 font-medium" style={{ color: STATUS_COLORS[s] || "#A1A1AA" }}>
                                            {STATUS_LABELS[s] || s}
                                        </th>
                                    ))}
                                    <th className="text-center p-2 text-text-secondary font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(districtLeadMap).map(([district, statuses]) => {
                                    const total = Object.values(statuses).reduce((s, v) => s + v, 0);
                                    return (
                                        <tr key={district} className="border-b border-border/10 hover:bg-background-elevated/50">
                                            <td className="p-2 text-text-primary font-medium">{district}</td>
                                            {allStatuses.map((s) => (
                                                <td key={s} className="text-center p-2 text-text-secondary">
                                                    {statuses[s] || 0}
                                                </td>
                                            ))}
                                            <td className="text-center p-2 text-text-primary font-bold">{total}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
