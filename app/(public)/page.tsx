import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Link from "next/link";

interface featureProps {
  title: string;
  description: string;
  icon: string;
}

const coreFeatures: featureProps[] = [
  {
    title: "AI-Powered Learning Assistant",
    description:
      "Obtain contextual responses pertaining to any segment of instructional video content through artificial intelligence models trained on lesson transcripts. The system provides real-time summarization, multilingual translation, and conceptual clarification capabilities.",
    icon: "🤖",
  },
  {
    title: "Blockchain-Verified Certificates",
    description:
      "Receive verifiable, tamper-resistant certificates anchored on blockchain technology. Employers and educational institutions may instantaneously verify academic achievements through the public validation portal.",
    icon: "⛓️",
  },
  {
    title: "Advanced Anti-Cheating System",
    description:
      "Comprehensive proctoring mechanisms incorporate tab-switching detection, minimized screen prevention, and copy-paste blocking functionality. Academic integrity is maintained through real-time monitoring and behavioral analysis.",
    icon: "🔒",
  },
  {
    title: "Time-Controlled Assessments",
    description:
      "Secure, time-bound quizzes and examinations feature automatic submission protocols. Randomized question sequencing and stringent access controls preserve assessment integrity throughout the evaluation process.",
    icon: "⏱️",
  },
  {
    title: "Progress Tracking & Analytics",
    description:
      "Monitor academic progression through comprehensive tracking systems, completion metrics, and personalized dashboard interfaces. Achievement milestones and learning analytics are systematically recorded and displayed.",
    icon: "📊",
  },
  {
    title: "Secure Payment Integration",
    description:
      "Course enrollment is facilitated through secure Stripe-powered payment processing infrastructure. Access is granted immediately upon successful transaction completion, with comprehensive refund support mechanisms.",
    icon: "💳",
  },
];

const additionalFeatures: featureProps[] = [
  {
    title: "Comprehensive Course Library",
    description:
      "Access an extensive collection of carefully curated courses developed by industry subject matter experts. Content publication, management, and organizational capabilities are provided for administrative users.",
    icon: "📚",
  },
  {
    title: "Interactive Learning Experience",
    description:
      "Engage with interactive video lessons, real-time artificial intelligence assistance, and contextual question-and-answer functionality. Learning enhancement is achieved through modern technological integration.",
    icon: "🎮",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/20 via-background to-background" />
        <div className="flex flex-col items-center text-center space-y-8 relative z-10">
          <Badge variant="outline" className="text-sm px-4 py-1.5 mb-2 border-primary/20 bg-primary/5">
            Intelligent & Secure Learning Management System
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight px-4">
            Edris LMS: Advanced Learning
            <br />
            <span className="text-foreground">
              Powered by <span className="text-primary font-semibold">AI</span> & <span className="text-primary font-semibold">Blockchain</span>
            </span>
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl leading-relaxed px-4">
            Edris LMS enhances online learning integrity, interactivity, and engagement
            by integrating Artificial Intelligence, Blockchain technology, and Proctoring Mechanisms
            to establish a secure and verifiable e-learning ecosystem that maintains academic standards.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link
              className={buttonVariants({
                size: "lg",
                className: "shadow-lg hover:shadow-xl transition-shadow",
              })}
              href="/courses"
            >
              Explore Course Catalog
            </Link>

            <Link
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "border-2 hover:bg-muted/50 transition-colors",
              })}
              href="/login"
            >
              Access Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="mb-20 py-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Intelligent & Secure Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            The Edris LMS platform integrates advanced technological solutions to ensure
            academic integrity, security compliance, and enhanced pedagogical experiences
            for learners and administrators.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {coreFeatures.map((feature, index) => (
            <Card
              key={index}
              className="hover:shadow-xl hover:border-primary/20 transition-all duration-300 border-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="mb-20 py-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Enhanced Pedagogical Experience
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          {additionalFeatures.map((feature, index) => (
            <Card
              key={index}
              className="hover:shadow-xl hover:border-primary/20 transition-all duration-300 border-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground leading-relaxed text-base">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Security & Integrity Highlight */}
      <section className="bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 rounded-2xl p-12 md:p-16 mb-20 border border-primary/10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="text-center space-y-6 relative z-10">
          <Badge variant="secondary" className="text-sm px-4 py-1.5 mb-4 bg-primary/10 border-primary/20">
            Trust & Security
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Academic Integrity Assurance
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
            The Edris LMS advanced proctoring infrastructure ensures equitable assessment
            administration through real-time monitoring, browser activity tracking, and
            artificial intelligence-based anomaly detection. Issued certificates are
            blockchain-verified, rendering them tamper-resistant and immediately
            verifiable by employers and educational institutions.
          </p>
        </div>
      </section>
    </>
  );
}
