import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  Users,
  Clock,
  MapPin,
  Send,
} from "lucide-react";

export default function ContactSupport() {
  const teamMembers = [
    {
      name: "Christian S. Santiago",
      role: "System Architect & Lead Programmer",
      email: "kurisuuuchannn@gmail.com",
      description: "Project lead and system architecture design",
      color: "from-blue-600 to-cyan-600",
      avatar: "🦁", // Lion
    },
    {
      name: "Louiesse Shane C. Herrera",
      role: "Lead Developer",
      email: "shanepot@gmail.com",
      description: "Core system development and integration",
      color: "from-purple-600 to-pink-600",
      avatar: "🦊", // Fox
    },
    {
      name: "Gabriel T. Malacca",
      role: "Full Stack Developer",
      email: "gabrieleandrewmalacca@gmail.com",
      description: "Frontend and backend development",
      color: "from-emerald-600 to-teal-600",
      avatar: "🐻", // Bear
    },
    {
      name: "Rhealiza G. Nabong",
      role: "QA Tester & Documentation",
      email: "nabong26@gmail.com",
      description: "Quality assurance and technical documentation",
      color: "from-orange-600 to-red-600",
      avatar: "🦉", // Owl
    },
    {
      name: "Charles Vincent P. Clemente",
      role: "Backend Developer",
      email: "clementecharles@gmail.com",
      description: "Database and API development",
      color: "from-indigo-600 to-purple-600",
      avatar: "🐺", // Wolf
    },
    {
      name: "John Jasper C. Narvasa",
      role: "Frontend Developer & UI/UX",
      email: "narvasacutie@gmail.com",
      description: "User interface design and development",
      color: "from-cyan-600 to-blue-600",
      avatar: "🦅", // Eagle
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="font-medium">Back to Login</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">MedCure Pro</h1>
                <p className="text-xs text-gray-500">Support Center</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Contact Support
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get in touch with our development team for technical assistance,
            inquiries, or collaboration opportunities.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Email Support
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Send us an email and we'll respond within 24-48 hours.
            </p>
            <a
              href="mailto:medcure@gmail.com"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
            >
              medcure@gmail.com
              <Send className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Live Chat
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Chat with our team during business hours for quick assistance.
            </p>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm inline-flex items-center gap-1">
              Start a conversation
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Phone Support
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Call us for urgent technical support and assistance.
            </p>
            <a
              href="tel:+639933213592"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1"
            >
              +63 993 321 3592
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Business Hours & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Business Hours
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monday - Friday</span>
                <span className="font-medium text-gray-900">
                  8:00 AM - 6:00 PM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saturday</span>
                <span className="font-medium text-gray-900">
                  9:00 AM - 4:00 PM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium text-gray-900">Closed</span>
              </div>
              <div className="pt-2 border-t border-gray-100 mt-3">
                <p className="text-xs text-gray-500">
                  All times are in Philippine Standard Time (PST)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>MedCure Pharmacy Office</p>
              <p>Plaridel, Bulacan, Philippines</p>
              <div className="pt-3 mt-3 border-t border-gray-100">
                <div className="flex gap-3">
                  <a
                    href="https://github.com/KurisuuChan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
                    aria-label="GitHub Repository"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/MedCure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
                    aria-label="Facebook Page"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="mailto:medcure@gmail.com"
                    className="p-2 bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
                    aria-label="Email Contact"
                  >
                    <Mail className="w-5 h-5 text-gray-700" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Development Team Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Development Team
              </h2>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the talented individuals behind MedCure Pro - dedicated
              professionals committed to building world-class pharmacy
              management solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => {
              return (
                <div
                  key={member.name}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {/* Gradient Header with Avatar */}
                  <div
                    className={`h-32 bg-gradient-to-br ${member.color} relative flex items-center justify-center`}
                  >
                    <div className="text-7xl transform group-hover:scale-110 transition-transform">
                      {member.avatar}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p
                      className={`text-sm font-semibold bg-gradient-to-r ${member.color} bg-clip-text text-transparent mb-3`}
                    >
                      {member.role}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {member.description}
                    </p>

                    {/* Email Contact */}
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What is MedCure Pro?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                MedCure Pro is an enterprise-grade pharmacy management system
                built with React 19, Vite 7, and Supabase. It provides
                comprehensive inventory management, POS functionality,
                analytics, and notification systems specifically designed for
                pharmaceutical operations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How can I get technical support?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                You can reach our development team via email at
                medcurepro@support.com, through live chat during business hours,
                or by calling our support hotline. We typically respond to
                inquiries within 24-48 hours.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is the system customizable?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes, MedCure Pro is built with flexibility in mind. Our
                development team can work with you to customize features,
                integrate with existing systems, or develop new functionality to
                meet your specific pharmacy needs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What technologies power MedCure Pro?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Built with modern web technologies: React 19, Vite 7, Tailwind
                CSS 4, Supabase (PostgreSQL), Zustand for state management,
                Chart.js for analytics, and Resend for email notifications. The
                system follows domain-driven design principles for
                maintainability.
              </p>
            </div>
          </div>
        </div>

        {/* Project Info Footer */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-white text-center shadow-2xl">
          <h2 className="text-2xl font-bold mb-3">MedCure Pro</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Enterprise-grade Pharmacy Management System designed and developed
            to revolutionize pharmaceutical operations with cutting-edge
            technology and user-centric design.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="font-semibold">Built with React 19</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="font-semibold">Powered by Supabase</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="font-semibold">October 2025</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm text-blue-100">
              © 2025 MedCure Pro Development Team. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
