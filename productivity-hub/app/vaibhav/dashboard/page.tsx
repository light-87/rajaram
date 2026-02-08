"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Home,
  Target,
  Wallet,
  CheckSquare,
  Heart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Zap,
  ArrowRight,
  BookOpen,
  Users,
  Banknote,
  RefreshCw,
} from "lucide-react";
import { format, startOfWeek, addDays, parseISO, differenceInDays } from "date-fns";
import StatCard from "@/components/ui/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import ActivityCalendar from "@/components/dashboard/ActivityCalendar";
import { Loan, Client, Todo } from "@/types/database";

// Dashboard data interfaces
interface DashboardData {
  loan: Loan | null;
  freedomPercentage: number;
  dailyInterest: number;
  monthsToFreedom: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  monthlyRecurring: number;
  activeTodos: number;
  overdueTodos: Todo[];
  todayTodos: Todo[];
  todayMood: number | null;
  todayEnergy: number | null;
  weeklyMood: number[];
  journalStreak: number;
  totalARR: number;
  revenueDueToday: number;
  upcomingPayments: Client[];
  activeClients: number;
  upcomingRecurring: any[];
}

// Quick access features with colorful styling
const quickAccessFeatures = [
  {
    name: "Todos",
    description: "Track your tasks",
    bgColor: "bg-pink/10",
    borderColor: "border-pink/30 hover:border-pink/50",
    iconColor: "text-pink",
    href: "/vaibhav/todos",
    icon: CheckSquare,
  },
  {
    name: "Finance",
    description: "Track money flow",
    bgColor: "bg-sky/10",
    borderColor: "border-sky/30 hover:border-sky/50",
    iconColor: "text-sky",
    href: "/vaibhav/finance",
    icon: Wallet,
  },
  {
    name: "Journal",
    description: "Reflect daily",
    bgColor: "bg-purple/10",
    borderColor: "border-purple/30 hover:border-purple/50",
    iconColor: "text-purple",
    href: "/vaibhav/journal",
    icon: BookOpen,
  },
  {
    name: "Clients",
    description: "Manage clients",
    bgColor: "bg-green/10",
    borderColor: "border-green/30 hover:border-green/50",
    iconColor: "text-green",
    href: "/vaibhav/clients",
    icon: Users,
  },
  {
    name: "Loans",
    description: "Track loans",
    bgColor: "bg-coral/10",
    borderColor: "border-coral/30 hover:border-coral/50",
    iconColor: "text-coral",
    href: "/vaibhav/loans",
    icon: Banknote,
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    loan: null,
    freedomPercentage: 0,
    dailyInterest: 0,
    monthsToFreedom: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    monthlyRecurring: 0,
    activeTodos: 0,
    overdueTodos: [],
    todayTodos: [],
    todayMood: null,
    todayEnergy: null,
    weeklyMood: [],
    journalStreak: 0,
    totalARR: 0,
    revenueDueToday: 0,
    upcomingPayments: [],
    activeClients: 0,
    upcomingRecurring: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [loanData, financeData, todosData, journalData, clientsData] = await Promise.all([
        fetchLoanData(),
        fetchFinanceData(),
        fetchTodosData(),
        fetchJournalData(),
        fetchClientsData(),
      ]);

      setData({
        ...loanData,
        ...financeData,
        ...todosData,
        ...journalData,
        ...clientsData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoanData = async () => {
    try {
      const { data: loans } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (loans && loans.length > 0) {
        const loan = loans[0];
        const currentBalance = parseFloat(loan.current_balance);
        const initialPrincipal = parseFloat(loan.initial_principal);
        const interestRate = parseFloat(loan.interest_rate);

        const freedomPercentage = ((initialPrincipal - currentBalance) / initialPrincipal) * 100;
        const dailyInterest = (currentBalance * (interestRate / 100)) / 365;

        const { data: payments } = await supabase
          .from("loan_payments")
          .select("principal_paid")
          .eq("loan_id", loan.id);

        const avgMonthlyPayment =
          payments && payments.length > 0
            ? payments.reduce((sum: number, p: any) => sum + parseFloat(p.principal_paid), 0) / payments.length
            : 0;

        const monthsToFreedom = avgMonthlyPayment > 0 ? Math.ceil(currentBalance / avgMonthlyPayment) : 0;

        return { loan, freedomPercentage, dailyInterest, monthsToFreedom };
      }
    } catch (error) {
      console.error("Error fetching loan data:", error);
    }
    return { loan: null, freedomPercentage: 0, dailyInterest: 0, monthsToFreedom: 0 };
  };

  const fetchFinanceData = async () => {
    try {
      const currentMonth = format(new Date(), "yyyy-MM");

      const [incomeRes, expensesRes, recurringRes] = await Promise.all([
        supabase.from("personal_income").select("amount, date"),
        supabase.from("personal_expenses").select("amount, date"),
        supabase.from("recurring_payments").select("*").eq("is_active", true),
      ]);

      const allIncome = (incomeRes.data || []).map((d: any) => ({ ...d, amount: parseFloat(d.amount) }));
      const allExpenses = (expensesRes.data || []).map((d: any) => ({ ...d, amount: parseFloat(d.amount) }));
      const recurring = (recurringRes.data || []).map((d: any) => ({ ...d, amount: parseFloat(d.amount) }));

      const thisMonthIncome = allIncome
        .filter((e: any) => e.date.startsWith(currentMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      const thisMonthExpenses = allExpenses
        .filter((e: any) => e.date.startsWith(currentMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      const monthlyRecurring = recurring.reduce((sum: number, r: any) => {
        switch (r.frequency) {
          case "weekly": return sum + r.amount * 4.33;
          case "monthly": return sum + r.amount;
          case "quarterly": return sum + r.amount / 3;
          case "yearly": return sum + r.amount / 12;
          default: return sum;
        }
      }, 0);

      // Upcoming recurring in next 7 days
      const upcomingRecurring = recurring.filter((r: any) => {
        if (!r.next_due_date) return false;
        const days = differenceInDays(new Date(r.next_due_date), new Date());
        return days >= 0 && days <= 7;
      });

      return { thisMonthIncome, thisMonthExpenses, monthlyRecurring, upcomingRecurring };
    } catch (error) {
      console.error("Error fetching finance data:", error);
    }
    return { thisMonthIncome: 0, thisMonthExpenses: 0, monthlyRecurring: 0, upcomingRecurring: [] };
  };

  const fetchTodosData = async () => {
    try {
      const { data: todos } = await supabase.from("todos").select("*").eq("completed", false);

      const now = new Date();
      const today = format(now, "yyyy-MM-dd");

      const activeTodos = todos?.length || 0;
      const overdueTodos =
        todos?.filter((todo: any) => {
          if (!todo.due_date) return false;
          return new Date(todo.due_date) < now && todo.due_date !== today;
        }) || [];

      const todayTodos = todos?.filter((todo: any) => todo.due_date === today) || [];

      return { activeTodos, overdueTodos, todayTodos };
    } catch (error) {
      console.error("Error fetching todos data:", error);
    }
    return { activeTodos: 0, overdueTodos: [], todayTodos: [] };
  };

  const fetchJournalData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 0 });

      const { data: todayEntry } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("entry_date", today)
        .single();

      const todayMood = todayEntry?.mood ? Number(todayEntry.mood) : null;
      const todayEnergy = todayEntry?.energy ? Number(todayEntry.energy) : null;

      const weeklyMood: number[] = [];
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(startOfThisWeek, i), "yyyy-MM-dd");
        const { data: dayEntry } = await supabase
          .from("journal_entries")
          .select("mood")
          .eq("entry_date", date)
          .single();
        weeklyMood.push(dayEntry?.mood ? Number(dayEntry.mood) : 0);
      }

      const { data: allEntries } = await supabase
        .from("journal_entries")
        .select("entry_date")
        .order("entry_date", { ascending: false });

      let journalStreak = 0;
      if (allEntries && allEntries.length > 0) {
        let currentDate = new Date();
        for (const entry of allEntries) {
          const entryDate = parseISO(entry.entry_date);
          const daysDiff = differenceInDays(currentDate, entryDate);
          if (daysDiff === journalStreak) {
            journalStreak++;
          } else if (daysDiff > journalStreak) {
            break;
          }
        }
      }

      return { todayMood, todayEnergy, weeklyMood, journalStreak };
    } catch (error) {
      console.error("Error fetching journal data:", error);
    }
    return { todayMood: null, todayEnergy: null, weeklyMood: [], journalStreak: 0 };
  };

  const fetchClientsData = async () => {
    try {
      const { data: clients } = await supabase.from("clients").select("*").eq("status", "active");

      const activeClients = clients?.length || 0;

      let totalARR = 0;
      clients?.forEach((client: any) => {
        const value = parseFloat(client.contract_value || "0");
        const frequency = client.payment_frequency;

        let annualValue = 0;
        switch (frequency) {
          case "monthly":
            annualValue = value * 12;
            break;
          case "quarterly":
            annualValue = value * 4;
            break;
          case "annual":
            annualValue = value;
            break;
          default:
            annualValue = 0;
        }
        totalARR += annualValue;
      });

      const today = format(new Date(), "yyyy-MM-dd");
      const revenueDueToday =
        clients
          ?.filter((c: any) => c.next_payment_date === today)
          ?.reduce((sum: number, c: any) => sum + parseFloat(c.contract_value || "0"), 0) || 0;

      const sevenDaysLater = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const upcomingPayments =
        clients
          ?.filter((c: any) => {
            if (!c.next_payment_date) return false;
            return c.next_payment_date >= today && c.next_payment_date <= sevenDaysLater;
          })
          ?.sort((a: any, b: any) => (a.next_payment_date || "").localeCompare(b.next_payment_date || "")) || [];

      return { totalARR, revenueDueToday, upcomingPayments, activeClients };
    } catch (error) {
      console.error("Error fetching clients data:", error);
    }
    return { totalARR: 0, revenueDueToday: 0, upcomingPayments: [], activeClients: 0 };
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  const getMoodEmoji = (mood: number | null): string => {
    if (!mood) return "😐";
    const emojis = ["😢", "😕", "😐", "🙂", "😄"];
    return emojis[mood - 1] || "😐";
  };

  const getEnergyEmoji = (energy: number | null): string => {
    if (!energy) return "⚡";
    const emojis = ["🔋", "🪫", "⚡", "⚡⚡", "🔥"];
    return emojis[energy - 1] || "⚡";
  };

  const netThisMonth = data.thisMonthIncome - data.thisMonthExpenses - data.monthlyRecurring;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-yellow/15">
          <Home className="w-7 h-7 text-yellow" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm">Your productivity command center</p>
        </div>
      </div>

      {/* Freedom Progress Hero Section */}
      <div className="card p-8 mb-8 relative overflow-hidden">
        {/* Gradient background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink/20 to-transparent rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-pink-purple">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Freedom Journey</h2>
              <p className="text-text-secondary italic text-sm">
                &ldquo;I&apos;m not building a business today. I&apos;m buying my freedom.&rdquo;
              </p>
            </div>
          </div>

          {data.loan ? (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-text-primary">Debt Freedom Progress</span>
                  <span className="text-3xl font-bold text-green">{data.freedomPercentage.toFixed(1)}%</span>
                </div>
                <ProgressBar percentage={data.freedomPercentage} showLabel={false} size="lg" color="rainbow" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background/50 rounded-xl p-4 border border-coral/30">
                  <p className="text-sm text-text-secondary mb-1">Current Balance</p>
                  <p className="text-xl font-bold text-coral">{formatCurrency(Number(data.loan.current_balance))}</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4 border border-green/30">
                  <p className="text-sm text-text-secondary mb-1">Monthly ARR</p>
                  <p className="text-xl font-bold text-green">{formatCurrency(data.totalARR / 12)}</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4 border border-red-500/30">
                  <p className="text-sm text-text-secondary mb-1">Daily Interest</p>
                  <p className="text-xl font-bold text-red-400">-{formatCurrency(data.dailyInterest)}</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4 border border-sky/30">
                  <p className="text-sm text-text-secondary mb-1">Est. Freedom</p>
                  <p className="text-xl font-bold text-sky">{data.monthsToFreedom > 0 ? `${data.monthsToFreedom} mo` : "TBD"}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary">No loan data available. Set up your loan tracker to see freedom progress.</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Monthly Cash Flow"
          value={`${netThisMonth >= 0 ? "+" : ""}${formatCurrency(netThisMonth)}`}
          icon={Wallet}
          color="sky"
        >
          <div className="mt-2 space-y-1">
            <p className="text-xs text-green">In: {formatCurrency(data.thisMonthIncome)}</p>
            <p className="text-xs text-coral">Out: {formatCurrency(data.thisMonthExpenses + data.monthlyRecurring)}</p>
          </div>
        </StatCard>

        <StatCard title="Active Todos" value={data.activeTodos} icon={CheckSquare} color="pink">
          <div className="flex gap-2 mt-2 flex-wrap">
            {data.overdueTodos.length > 0 && <Badge variant="danger">{data.overdueTodos.length} overdue</Badge>}
            {data.todayTodos.length > 0 && <Badge variant="warning">{data.todayTodos.length} today</Badge>}
          </div>
        </StatCard>

        <StatCard
          title="Well-being"
          value={data.todayMood ? `${getMoodEmoji(data.todayMood)} ${getEnergyEmoji(data.todayEnergy)}` : "Not logged"}
          icon={Heart}
          color="purple"
        >
          {data.todayMood && (
            <div className="text-sm text-text-secondary mt-2">
              Mood: {data.todayMood}/5 • Energy: {data.todayEnergy}/5
            </div>
          )}
        </StatCard>

        <StatCard title="Revenue Due" value={formatCurrency(data.revenueDueToday)} icon={DollarSign} color="green">
          <div className="text-sm text-text-secondary mt-2">{data.activeClients} active clients</div>
        </StatCard>
      </div>

      {/* Two Column Layout: Finance Summary + Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Finance Summary */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-sky/15">
              <TrendingUp className="w-5 h-5 text-sky" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Finance Summary</h3>
          </div>

          {/* Monthly Breakdown */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green/10 border border-green/30">
              <span className="text-sm font-medium text-text-primary">Income This Month</span>
              <span className="font-bold text-green">{formatCurrency(data.thisMonthIncome)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-coral/10 border border-coral/30">
              <span className="text-sm font-medium text-text-primary">Expenses This Month</span>
              <span className="font-bold text-coral">{formatCurrency(data.thisMonthExpenses)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple/10 border border-purple/30">
              <span className="text-sm font-medium text-text-primary">Monthly Recurring</span>
              <span className="font-bold text-purple">{formatCurrency(data.monthlyRecurring)}</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg border ${netThisMonth >= 0 ? "bg-green/10 border-green/30" : "bg-red-500/10 border-red-500/30"}`}>
              <span className="text-sm font-bold text-text-primary">Net Savings</span>
              <span className={`font-bold text-lg ${netThisMonth >= 0 ? "text-green" : "text-red-400"}`}>
                {netThisMonth >= 0 ? "+" : ""}{formatCurrency(netThisMonth)}
              </span>
            </div>
          </div>

          {/* Upcoming Recurring */}
          {data.upcomingRecurring.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <RefreshCw className="w-3 h-3" /> Upcoming Recurring (7 days)
              </h4>
              <div className="space-y-2">
                {data.upcomingRecurring.slice(0, 4).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">
                        {r.next_due_date && format(new Date(r.next_due_date), "dd MMM")}
                      </span>
                      <span className="font-semibold text-coral">{formatCurrency(parseFloat(r.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood & Streak */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-purple/10 rounded-xl p-4 border border-purple/30">
              <p className="text-sm text-text-secondary mb-2">Avg Mood</p>
              <p className="text-2xl font-bold text-purple">
                {data.weeklyMood.filter((m: number) => m > 0).length > 0
                  ? `${getMoodEmoji(
                    Math.round(
                      data.weeklyMood.filter((m: number) => m > 0).reduce((a: number, b: number) => a + b, 0) /
                      data.weeklyMood.filter((m: number) => m > 0).length
                    )
                  )} ${(
                    data.weeklyMood.filter((m: number) => m > 0).reduce((a: number, b: number) => a + b, 0) /
                    data.weeklyMood.filter((m: number) => m > 0).length
                  ).toFixed(1)}`
                  : "No data"}
              </p>
            </div>
            <div className="bg-coral/10 rounded-xl p-4 border border-coral/30">
              <p className="text-sm text-text-secondary mb-2">Journal Streak</p>
              <p className="text-2xl font-bold text-coral">{data.journalStreak} days 🔥</p>
            </div>
          </div>
        </div>

        {/* Urgent Actions */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-red-500/15">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Urgent & Upcoming</h3>
          </div>

          <div className="space-y-4">
            {/* Overdue Todos */}
            {data.overdueTodos.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-red-400">
                    {data.overdueTodos.length} Overdue Todo{data.overdueTodos.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-1">
                  {data.overdueTodos.slice(0, 3).map((todo: any) => (
                    <div key={todo.id} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span className="flex-1">{todo.title}</span>
                    </div>
                  ))}
                  {data.overdueTodos.length > 3 && (
                    <p className="text-xs text-text-secondary pl-4">+{data.overdueTodos.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Today's Todos */}
            {data.todayTodos.length > 0 && (
              <div className="bg-yellow/10 border border-yellow/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-yellow" />
                  <span className="font-semibold text-yellow">{data.todayTodos.length} Due Today</span>
                </div>
                <div className="space-y-1">
                  {data.todayTodos.slice(0, 3).map((todo: any) => (
                    <div key={todo.id} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-yellow">•</span>
                      <span className="flex-1">{todo.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Client Payments */}
            {data.upcomingPayments.length > 0 && (
              <div className="bg-green/10 border border-green/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green" />
                  <span className="font-semibold text-green">Upcoming Client Payments (7 days)</span>
                </div>
                <div className="space-y-2">
                  {data.upcomingPayments.slice(0, 3).map((client: any) => (
                    <div key={client.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="text-text-primary font-medium">{client.name}</p>
                        <p className="text-xs text-text-secondary">
                          {client.next_payment_date && format(parseISO(client.next_payment_date), "MMM d")}
                        </p>
                      </div>
                      <span className="font-semibold text-green">
                        {formatCurrency(parseFloat(client.contract_value || "0"))}
                      </span>
                    </div>
                  ))}
                  {data.upcomingPayments.length > 3 && (
                    <p className="text-xs text-text-secondary">+{data.upcomingPayments.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Daily Interest Burn */}
            {data.loan && data.dailyInterest > 0 && (
              <div className="bg-coral/10 border border-coral/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-coral" />
                  <span className="font-semibold text-text-primary">Daily Interest Burn</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(data.dailyInterest)}</p>
                <p className="text-xs text-text-secondary mt-1">Every day costs you this much in interest</p>
              </div>
            )}

            {/* No Journal Entry Warning */}
            {!data.todayMood && (
              <div className="bg-purple/10 border border-purple/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple" />
                  <span className="font-semibold text-purple">Haven&apos;t journaled today</span>
                </div>
                <p className="text-sm text-text-secondary mt-1">Take a moment to reflect on your day</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="mb-8">
        <ActivityCalendar />
      </div>

      {/* Quick Access Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-pink-purple rounded-full" />
          Quick Access
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickAccessFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.name}
                href={feature.href}
                className={`group p-5 rounded-xl border ${feature.borderColor} ${feature.bgColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`p-2 rounded-lg ${feature.bgColor} w-fit mb-3`}>
                  <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <p className="font-semibold text-text-primary text-sm mb-1">{feature.name}</p>
                <p className="text-xs text-text-secondary">{feature.description}</p>
                <ArrowRight className={`w-4 h-4 ${feature.iconColor} mt-2 opacity-0 group-hover:opacity-100 transition-opacity`} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
