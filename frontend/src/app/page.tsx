import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Clock,
  Globe,
  Plus,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
              API Monitor
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30 p-12 mb-20">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-60"></div>
          <div className="relative text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl shadow-blue-500/25">
                <Activity className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-6">
              Monitor Your APIs with Confidence
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Get instant alerts when your APIs go down. Track performance,
              uptime, and response times with our reliable monitoring service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start Monitoring Free
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
                >
                  <Globe className="h-5 w-5 mr-2" />
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="grid md:grid-cols-3 gap-8">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-blue-50/20 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Card className="relative border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50 transition-colors h-[240px]">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-lg shadow-blue-500/25 mx-auto mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white text-lg mb-2">
                  Real-time Monitoring
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Monitor your APIs 24/7 with customizable check intervals
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-blue-50/20 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Card className="relative border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50 transition-colors h-[240px]">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-lg shadow-blue-500/25 mx-auto mb-4">
                  <Bell className="h-6 w-6" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white text-lg mb-2">
                  Instant Alerts
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Get notified immediately via email when your APIs go down
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-blue-50/20 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Card className="relative border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50 transition-colors h-[240px]">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-lg shadow-blue-500/25 mx-auto mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white text-lg mb-2">
                  Performance Analytics
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Track response times, uptime percentages, and historical data
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30 p-12">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-60"></div>
          <div className="relative grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                99.9%
              </div>
              <div className="text-slate-600 dark:text-slate-300">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                &lt;1s
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Response Time
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                24/7
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Monitoring
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Free
              </div>
              <div className="text-slate-600 dark:text-slate-300">To Start</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-4">
            Ready to Monitor Your APIs?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            Join developers who trust API Monitor for reliable uptime monitoring
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-5 w-5 mr-2" />
              Start Free Monitoring
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center text-slate-600 dark:text-slate-400">
          <p>&copy; 2024 API Monitor. Built for reliable API monitoring.</p>
        </div>
      </footer>
    </div>
  );
}
