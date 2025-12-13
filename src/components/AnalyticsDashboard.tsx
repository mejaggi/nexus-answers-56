import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  MessageSquare,
  Users,
  Zap,
  Clock,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Activity,
  Shield,
} from "lucide-react";

// Mock data for charts
const usageData = [
  { date: "Mon", messages: 245, users: 89 },
  { date: "Tue", messages: 312, users: 102 },
  { date: "Wed", messages: 287, users: 95 },
  { date: "Thu", messages: 398, users: 128 },
  { date: "Fri", messages: 356, users: 115 },
  { date: "Sat", messages: 124, users: 45 },
  { date: "Sun", messages: 98, users: 32 },
];

const tokenData = [
  { date: "Week 1", tokens: 125000, cost: 12.5 },
  { date: "Week 2", tokens: 148000, cost: 14.8 },
  { date: "Week 3", tokens: 162000, cost: 16.2 },
  { date: "Week 4", tokens: 189000, cost: 18.9 },
];

const channelData = [
  { name: "Web", value: 45, color: "hsl(var(--accent))" },
  { name: "Teams", value: 30, color: "hsl(var(--primary))" },
  { name: "Mobile", value: 15, color: "hsl(var(--chart-3))" },
  { name: "API", value: 10, color: "hsl(var(--chart-4))" },
];

const performanceData = [
  { time: "00:00", p50: 0.8, p95: 1.2 },
  { time: "04:00", p50: 0.7, p95: 1.1 },
  { time: "08:00", p50: 1.2, p95: 2.1 },
  { time: "12:00", p50: 1.5, p95: 2.8 },
  { time: "16:00", p50: 1.3, p95: 2.4 },
  { time: "20:00", p50: 0.9, p95: 1.5 },
];

const csatData = [
  { month: "Jan", score: 4.2 },
  { month: "Feb", score: 4.3 },
  { month: "Mar", score: 4.1 },
  { month: "Apr", score: 4.5 },
  { month: "May", score: 4.6 },
  { month: "Jun", score: 4.4 },
];

const KPICard = ({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
}: {
  title: string;
  value: string;
  change?: string;
  icon: typeof MessageSquare;
  trend?: "up" | "down";
}) => (
  <Card className="bg-card border-border">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={`text-xs ${
                trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend === "up" ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const GaugeChart = ({ value, max, label }: { value: number; max: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative h-24 w-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="hsl(var(--accent))"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(value / max) * 251} 251`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{value}%</span>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mt-2">{label}</p>
  </div>
);

export const AnalyticsDashboard = () => {
  return (
    <div className="h-full flex flex-col bg-background">
      <header className="border-b border-border bg-card shadow-soft px-6 py-4">
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Monitor chatbot performance, usage, and costs
        </p>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="usage">Usage & Adoption</TabsTrigger>
            <TabsTrigger value="cost">Cost & Consumption</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="satisfaction">User Satisfaction</TabsTrigger>
          </TabsList>

          {/* Usage & Adoption Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="Total Messages"
                value="12,847"
                change="12.5% vs last week"
                icon={MessageSquare}
              />
              <KPICard
                title="Active Users (DAU)"
                value="342"
                change="8.3% vs last week"
                icon={Users}
              />
              <KPICard
                title="Sessions Today"
                value="1,247"
                change="5.2% vs yesterday"
                icon={Zap}
              />
              <KPICard
                title="Avg Messages/Session"
                value="4.2"
                change="0.3 improvement"
                icon={TrendingUp}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Messages & Users Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="messages"
                          stroke="hsl(var(--accent))"
                          fill="hsl(var(--accent) / 0.2)"
                          name="Messages"
                        />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary) / 0.2)"
                          name="Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Channel Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {channelData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {entry.name} ({entry.value}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around py-4">
                  <GaugeChart value={78} max={100} label="Repeat Users" />
                  <GaugeChart value={92} max={100} label="Resolution Rate" />
                  <GaugeChart value={65} max={100} label="Self-Service Rate" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost & Consumption Tab */}
          <TabsContent value="cost" className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="Total Tokens"
                value="624K"
                change="15.2% vs last month"
                icon={Activity}
                trend="up"
              />
              <KPICard
                title="Cost per Query"
                value="$0.08"
                change="12% reduction"
                icon={DollarSign}
                trend="down"
              />
              <KPICard
                title="Monthly Spend"
                value="$1,247"
                change="On budget"
                icon={DollarSign}
              />
              <KPICard
                title="Token Efficiency"
                value="342/query"
                change="8% improved"
                icon={TrendingUp}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Token Consumption Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tokenData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="tokens"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--accent))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tokenData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Budget Burn Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Budget</span>
                  <span className="font-medium text-foreground">$1,247 / $2,000</span>
                </div>
                <Progress value={62} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  62% consumed • 12 days remaining • Projected: $1,890
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="Response Time (P50)"
                value="1.2s"
                change="0.3s faster"
                icon={Clock}
              />
              <KPICard
                title="Uptime"
                value="99.9%"
                change="Target: 99.5%"
                icon={Shield}
              />
              <KPICard
                title="Error Rate"
                value="0.3%"
                change="0.1% reduction"
                icon={Activity}
                trend="down"
              />
              <KPICard
                title="Fallback Rate"
                value="4.2%"
                change="1.2% reduction"
                icon={TrendingUp}
                trend="down"
              />
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="s" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="p50"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        name="P50"
                      />
                      <Line
                        type="monotone"
                        dataKey="p95"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="P95"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">SLA Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Response &lt; 2s</span>
                      <span className="text-sm font-medium text-foreground">96.2%</span>
                    </div>
                    <Progress value={96.2} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Response &lt; 5s</span>
                      <span className="text-sm font-medium text-foreground">99.8%</span>
                    </div>
                    <Progress value={99.8} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Tool Invocation Success</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Document Search</span>
                    <span className="font-medium text-green-500">98.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Policy Lookup</span>
                    <span className="font-medium text-green-500">97.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">External API</span>
                    <span className="font-medium text-yellow-500">94.1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Database Query</span>
                    <span className="font-medium text-green-500">99.1%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Satisfaction Tab */}
          <TabsContent value="satisfaction" className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="CSAT Score"
                value="4.5/5"
                change="0.2 improvement"
                icon={TrendingUp}
              />
              <KPICard
                title="Thumbs Up"
                value="2,847"
                change="78% positive"
                icon={ThumbsUp}
              />
              <KPICard
                title="Thumbs Down"
                value="412"
                change="22% negative"
                icon={ThumbsDown}
                trend="down"
              />
              <KPICard
                title="Rephrasing Rate"
                value="8.2%"
                change="2.1% reduction"
                icon={MessageSquare}
                trend="down"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">CSAT Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={csatData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          domain={[3.5, 5]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--accent))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Feedback Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-4">
                      <ThumbsUp className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Positive</span>
                          <span className="text-sm font-medium text-foreground">78%</span>
                        </div>
                        <Progress value={78} className="h-3" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <ThumbsDown className="h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Negative</span>
                          <span className="text-sm font-medium text-foreground">22%</span>
                        </div>
                        <Progress value={22} className="h-3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">User Satisfaction Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around py-4">
                  <GaugeChart value={89} max={100} label="Accuracy" />
                  <GaugeChart value={94} max={100} label="Helpfulness" />
                  <GaugeChart value={87} max={100} label="Clarity" />
                  <GaugeChart value={91} max={100} label="Speed" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
