import { Link } from 'react-router-dom';
import { Activity, Shield, Brain, MapPin, BarChart3, Zap, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }),
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Aurion</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link to="/dashboard" className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-slate-200 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Predictive Maintenance for EV Chargers
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Stop charger failures
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              before they happen
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Aurion monitors your EV charging network in real-time, predicts failures days in advance, 
            and helps you maintain 99.9% uptime across your entire fleet.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/dashboard" className="group flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-slate-100 transition-all shadow-2xl shadow-white/10">
              Open Live Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2 px-8 py-4 text-slate-300 font-medium border border-slate-800 rounded-full hover:border-slate-600 transition-colors">
              See How It Works
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            {[
              { value: '20+', label: 'Chargers Monitored' },
              { value: '5', label: 'ML Models Active' },
              { value: '99.9%', label: 'Uptime Target' },
              { value: '<5s', label: 'Alert Latency' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Everything you need to keep
              <br />chargers running
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From real-time monitoring to predictive maintenance, Aurion covers your entire charging network.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI Failure Prediction', desc: 'Ensemble of 5 ML models (XGBoost, BiLSTM, TCN, Isolation Forest) predicts failures days before they happen.', color: 'from-violet-500 to-purple-600' },
              { icon: MapPin, title: 'Live Network Map', desc: 'Real-time geographic view of your entire fleet with health-coded markers and instant drill-down.', color: 'from-cyan-500 to-blue-600' },
              { icon: Zap, title: 'Real-time Telemetry', desc: 'Voltage, current, temperature, power — streaming every 5 seconds with anomaly detection.', color: 'from-amber-500 to-orange-600' },
              { icon: Shield, title: 'Proactive Alerts', desc: 'Get notified before failures, not after. Smart severity classification prevents alert fatigue.', color: 'from-green-500 to-emerald-600' },
              { icon: BarChart3, title: 'Fleet Analytics', desc: 'Health score trends, maintenance optimization, and revenue impact analysis across your network.', color: 'from-pink-500 to-rose-600' },
              { icon: Activity, title: 'Health Scoring', desc: 'Composite health score (0-100) computed from 5 weighted components with transparent breakdown.', color: 'from-blue-500 to-indigo-600' },
            ].map((feature) => (
              <div key={feature.title} className="group relative p-8 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              How Aurion works
            </h2>
            <p className="text-slate-400 text-lg">From telemetry ingestion to proactive maintenance in 4 steps.</p>
          </div>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Ingest Telemetry', desc: 'Chargers stream voltage, current, temperature via MQTT/OCPP every 5 seconds into our Kafka pipeline.' },
              { step: '02', title: 'Compute Health Scores', desc: 'Sliding window algorithms compute real-time composite health scores from 5 weighted penalty components.' },
              { step: '03', title: 'Predict Failures', desc: 'Our 5-model ensemble (XGBoost + LSTM + TCN + Isolation Forest) estimates days-until-failure per charger.' },
              { step: '04', title: 'Alert & Act', desc: 'Operators receive proactive alerts with severity classification and recommended maintenance actions.' },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Simple per-charger pricing
            </h2>
            <p className="text-slate-400 text-lg">Scale as your network grows. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Monitor', price: '₹200', period: '/charger/month', features: ['Real-time telemetry', 'Health scoring', 'Basic alerts', 'Map view', 'Up to 50 chargers'], highlighted: false },
              { name: 'Predict', price: '₹500', period: '/charger/month', features: ['Everything in Monitor', 'AI failure prediction', 'Proactive maintenance', 'Advanced analytics', 'Up to 500 chargers', 'Priority support'], highlighted: true },
              { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Predict', 'Unlimited chargers', 'Custom ML models', 'API access', 'Dedicated account manager', 'SLA guarantee'], highlighted: false },
            ].map((plan) => (
              <div key={plan.name} className={`relative p-8 rounded-2xl border transition-all ${plan.highlighted ? 'border-cyan-500/50 bg-cyan-500/5 shadow-2xl shadow-cyan-500/10' : 'border-slate-800 bg-slate-900/50'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black" style={{ fontFamily: 'var(--font-display)' }}>{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/dashboard" className={`block w-full py-3 text-center rounded-xl font-medium text-sm transition-colors ${plan.highlighted ? 'bg-cyan-500 text-black hover:bg-cyan-400' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                  Get Started <ChevronRight className="inline w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="about" className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Built with production-grade tech
          </h2>
          <p className="text-slate-400 mb-12">The same stack powering industrial IoT monitoring at scale.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['MQTT/OCPP', 'Apache Kafka', 'Python', 'XGBoost', 'TensorFlow', 'BiLSTM', 'TCN', 'FastAPI', 'WebSocket', 'React', 'TypeScript', 'Tailwind CSS', 'Leaflet', 'Docker', 'PostgreSQL', 'Redis'].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-slate-300 font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to predict, not react?
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join operators who save ₹5,000/charger/month in prevented downtime.
          </p>
          <Link to="/dashboard" className="group inline-flex items-center gap-2 px-10 py-5 bg-white text-black font-semibold text-lg rounded-full hover:bg-slate-100 transition-all shadow-2xl shadow-white/10">
            Open Live Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Aurion</span>
            <span className="text-slate-500 text-sm ml-2">© 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
