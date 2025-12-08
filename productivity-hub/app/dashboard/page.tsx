"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Home,
  Target,
  Clock,
  CheckSquare,
  Heart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Zap,
  ArrowRight
} from "lucide-react";
import { format, startOfWeek, addDays, isToday, parseISO, differenceInDays } from "date-fns";
import StatCard from "@/components/ui/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import { Loan, TimeEntry, Client, JournalEntry, Todo } from "@/types/database";

// Dashboard data interfaces
interface DashboardData {
  // Loan data
  loan: Loan | null;
  freedomPercentage: number;
  dailyInterest: number;
  monthsToFreedom: number;

  // Time tracking data
  todayHours: number;
  todayPoints: number;
  weeklyHours: number[];

  // Todos data
  activeTodos: number;
  overdueTodos: Todo[];
  todayTodos: Todo[];

  // Journal data
  todayMood: number | null;
  todayEnergy: number | null;
  weeklyMood: number[];
  journalStreak: number;

  // Clients data
  totalARR: number;
  revenueDueToday: number;
  upcomingPayments: Client[];
  activeClients: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    loan: null,
    freedomPercentage: 0,
    dailyInterest: 0,
    monthsToFreedom: 0,
    todayHours: 0,
    todayPoints: 0,
    weeklyHours: [],
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
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [
        loanData,
        timeData,
        todosData,
        journalData,
        clientsData
      ] = await Promise.all([
        fetchLoanData(),
        fetchTimeData(),
        fetchTodosData(),
        fetchJournalData(),
        fetchClientsData(),
      ]);

      setData({
        ...loanData,
        ...timeData,
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

        // Estimate months to freedom assuming average monthly payment
        const { data: payments } = await supabase
          .from("loan_payments")
          .select("principal_paid")
          .eq("loan_id", loan.id);

        const avgMonthlyPayment = payments && payments.length > 0
          ? payments.reduce((sum: number, p: any) => sum + parseFloat(p.principal_paid), 0) / payments.length
          : 0;

        const monthsToFreedom = avgMonthlyPayment > 0
          ? Math.ceil(currentBalance / avgMonthlyPayment)
          : 0;

        return {
          loan,
          freedomPercentage,
          dailyInterest,
          monthsToFreedom,
        };
      }
    } catch (error) {
      console.error("Error fetching loan data:", error);
    }
    return { loan: null, freedomPercentage: 0, dailyInterest: 0, monthsToFreedom: 0 };
  };

  const fetchTimeData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 0 });

      // Today's hours
      const { data: todayEntries } = await supabase
        .from("time_entries")
        .select("*")
        .eq("date", today);

      const todayHours = todayEntries?.reduce((sum: number, entry: any) => sum + parseFloat(entry.hours || "0"), 0) || 0;
      const todayPoints = todayEntries?.reduce((sum: number, entry: any) => sum + parseFloat(entry.effort_points || "0"), 0) || 0;

      // Weekly hours (last 7 days)
      const weeklyHours: number[] = [];
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(startOfThisWeek, i), "yyyy-MM-dd");
        const { data: dayEntries } = await supabase
          .from("time_entries")
          .select("hours")
          .eq("date", date);

        const dayTotal = dayEntries?.reduce((sum: number, entry: any) => sum + parseFloat(entry.hours || "0"), 0) || 0;
        weeklyHours.push(dayTotal);
      }

      return { todayHours, todayPoints, weeklyHours };
    } catch (error) {
      console.error("Error fetching time data:", error);
    }
    return { todayHours: 0, todayPoints: 0, weeklyHours: [] };
  };

  const fetchTodosData = async () => {
    try {
      const { data: todos } = await supabase
        .from("todos")
        .select("*")
        .eq("completed", false);

      const now = new Date();
      const today = format(now, "yyyy-MM-dd");

      const activeTodos = todos?.length || 0;
      const overdueTodos = todos?.filter((todo: any) => {
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

      // Today's journal
      const { data: todayEntry } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("entry_date", today)
        .single();

      const todayMood = todayEntry?.mood ? Number(todayEntry.mood) : null;
      const todayEnergy = todayEntry?.energy ? Number(todayEntry.energy) : null;

      // Weekly mood
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

      // Calculate streak
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
      const { data: clients } = await supabase
        .from("clients")
        .select("*")
        .eq("status", "active");

      const activeClients = clients?.length || 0;

      // Calculate ARR
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

      // Revenue due today
      const today = format(new Date(), "yyyy-MM-dd");
      const revenueDueToday = clients
        ?.filter((c: any) => c.next_payment_date === today)
        ?.reduce((sum: number, c: any) => sum + parseFloat(c.contract_value || "0"), 0) || 0;

      // Upcoming payments (next 7 days)
      const sevenDaysLater = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const upcomingPayments = clients
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
        <Home className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      </div>

      {/* Freedom Progress Hero Section */}
      <div className="card p-8 mb-8 bg-gradient-to-br from-card-bg to-background border-accent-primary/30">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-8 h-8 text-accent-primary" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Freedom Journey</h2>
            <p className="text-text-secondary italic">
              &ldquo;I&apos;m not building a business today. I&apos;m buying my freedom.&rdquo;
            </p>
          </div>
        </div>

        {data.loan ? (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-text-primary">Debt Freedom Progress</span>
                <span className="text-3xl font-bold text-accent-success">
                  {data.freedomPercentage.toFixed(1)}%
                </span>
              </div>
              <ProgressBar percentage={data.freedomPercentage} showLabel={false} size="lg" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">Current Balance</p>
                <p className="text-xl font-bold text-text-primary">
                  {formatCurrency(Number(data.loan.current_balance))}
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">Monthly ARR</p>
                <p className="text-xl font-bold text-accent-success">
                  {formatCurrency(data.totalARR / 12)}
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">Daily Interest</p>
                <p className="text-xl font-bold text-red-500">
                  -{formatCurrency(data.dailyInterest)}
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">Est. Freedom</p>
                <p className="text-xl font-bold text-accent-secondary">
                  {data.monthsToFreedom > 0 ? `${data.monthsToFreedom} mo` : "TBD"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">No loan data available. Set up your loan tracker to see freedom progress.</p>
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Effort"
          value={`${data.todayHours.toFixed(1)}/10`}
          icon={Clock}
        >
          <div className="mt-2">
            <ProgressBar
              percentage={(data.todayHours / 10) * 100}
              showLabel={false}
              size="sm"
            />
            <p className="text-sm text-text-secondary mt-2">
              {data.todayPoints.toFixed(1)} points earned
            </p>
          </div>
        </StatCard>

        <StatCard
          title="Active Todos"
          value={data.activeTodos}
          icon={CheckSquare}
        >
          <div className="flex gap-2 mt-2">
            {data.overdueTodos.length > 0 && (
              <Badge variant="danger">{data.overdueTodos.length} overdue</Badge>
            )}
            {data.todayTodos.length > 0 && (
              <Badge variant="warning">{data.todayTodos.length} today</Badge>
            )}
          </div>
        </StatCard>

        <StatCard
          title="Well-being"
          value={data.todayMood ? `${getMoodEmoji(data.todayMood)} ${getEnergyEmoji(data.todayEnergy)}` : "Not logged"}
          icon={Heart}
        >
          {data.todayMood && (
            <div className="text-sm text-text-secondary mt-2">
              Mood: {data.todayMood}/5 • Energy: {data.todayEnergy}/5
            </div>
          )}
        </StatCard>

        <StatCard
          title="Revenue Due"
          value={formatCurrency(data.revenueDueToday)}
          icon={DollarSign}
        >
          <div className="text-sm text-text-secondary mt-2">
            {data.activeClients} active clients
          </div>
        </StatCard>
      </div>

      {/* Two Column Layout: 7-Day Trends + Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 7-Day Trends */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-accent-secondary" />
            <h3 className="text-xl font-bold text-text-primary">7-Day Trends</h3>
          </div>

          {/* Effort Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-text-secondary mb-3">Daily Effort (Hours)</h4>
            <div className="flex items-end gap-2 h-32 mb-2">
              {data.weeklyHours.map((hours: number, index: number) => {
                const dayLabel = format(addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), index), "EEE");
                const percentage = (hours / 10) * 100;
                const color = hours >= 10 ? "bg-accent-success" : hours > 0 ? "bg-accent-primary" : "bg-border";

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-background rounded-sm overflow-hidden h-20 flex items-end">
                      <div
                        className={`w-full ${color} transition-all`}
                        style={{ height: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary">{dayLabel}</span>
                    <span className="text-xs font-semibold text-text-primary">{hours.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 text-sm text-text-secondary border-t border-border">
              Week total: <span className="font-semibold text-text-primary">
                {data.weeklyHours.reduce((a: number, b: number) => a + b, 0).toFixed(1)} hrs
              </span>
            </div>
          </div>

          {/* Mood & Streak */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-text-secondary mb-2">Avg Mood</p>
              <p className="text-2xl font-bold text-text-primary">
                {data.weeklyMood.filter((m: number) => m > 0).length > 0
                  ? `${getMoodEmoji(Math.round(
                      data.weeklyMood.filter((m: number) => m > 0).reduce((a: number, b: number) => a + b, 0) /
                      data.weeklyMood.filter((m: number) => m > 0).length
                    ))} ${(
                      data.weeklyMood.filter((m: number) => m > 0).reduce((a: number, b: number) => a + b, 0) /
                      data.weeklyMood.filter((m: number) => m > 0).length
                    ).toFixed(1)}`
                  : "No data"}
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-text-secondary mb-2">Journal Streak</p>
              <p className="text-2xl font-bold text-accent-success">
                {data.journalStreak} days 🔥
              </p>
            </div>
          </div>
        </div>

        {/* Urgent Actions */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold text-text-primary">Urgent & Upcoming</h3>
          </div>

          <div className="space-y-4">
            {/* Overdue Todos */}
            {data.overdueTodos.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-red-500">
                    {data.overdueTodos.length} Overdue Todo{data.overdueTodos.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-1">
                  {data.overdueTodos.slice(0, 3).map((todo: any) => (
                    <div key={todo.id} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span className="flex-1">{todo.title}</span>
                    </div>
                  ))}
                  {data.overdueTodos.length > 3 && (
                    <p className="text-xs text-text-secondary pl-4">
                      +{data.overdueTodos.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Today's Todos */}
            {data.todayTodos.length > 0 && (
              <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-accent-primary" />
                  <span className="font-semibold text-accent-primary">
                    {data.todayTodos.length} Due Today
                  </span>
                </div>
                <div className="space-y-1">
                  {data.todayTodos.slice(0, 3).map((todo: any) => (
                    <div key={todo.id} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-accent-primary">•</span>
                      <span className="flex-1">{todo.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Payments */}
            {data.upcomingPayments.length > 0 && (
              <div className="bg-accent-success/10 border border-accent-success/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-accent-success" />
                  <span className="font-semibold text-accent-success">
                    Upcoming Payments (7 days)
                  </span>
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
                      <span className="font-semibold text-accent-success">
                        {formatCurrency(parseFloat(client.contract_value || "0"))}
                      </span>
                    </div>
                  ))}
                  {data.upcomingPayments.length > 3 && (
                    <p className="text-xs text-text-secondary">
                      +{data.upcomingPayments.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Daily Interest Burn */}
            {data.loan && data.dailyInterest > 0 && (
              <div className="bg-background/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-accent-primary" />
                  <span className="font-semibold text-text-primary">Daily Interest Burn</span>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(data.dailyInterest)}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Every day costs you this much in interest
                </p>
              </div>
            )}

            {/* No Journal Entry Warning */}
            {!data.todayMood && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">
                    Haven&apos;t journaled today
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  Take a moment to reflect on your day
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (Optional - can be added later) */}
      <div className="card p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/time-tracker"
            className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border hover:border-accent-secondary/50 transition-all group"
          >
            <Clock className="w-5 h-5 text-accent-secondary" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">Log Time</p>
              <p className="text-xs text-text-secondary">Track your effort</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-accent-secondary transition-colors" />
          </a>

          <a
            href="/todos"
            className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border hover:border-accent-secondary/50 transition-all group"
          >
            <CheckSquare className="w-5 h-5 text-accent-secondary" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">Todos</p>
              <p className="text-xs text-text-secondary">Manage tasks</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-accent-secondary transition-colors" />
          </a>

          <a
            href="/journal"
            className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border hover:border-accent-secondary/50 transition-all group"
          >
            <Heart className="w-5 h-5 text-accent-secondary" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">Journal</p>
              <p className="text-xs text-text-secondary">Reflect today</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-accent-secondary transition-colors" />
          </a>

          <a
            href="/clients"
            className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border hover:border-accent-secondary/50 transition-all group"
          >
            <DollarSign className="w-5 h-5 text-accent-secondary" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">Clients</p>
              <p className="text-xs text-text-secondary">Track revenue</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-accent-secondary transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}
