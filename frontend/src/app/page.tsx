"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@headlessui/react";
import {
  FileUp,
  Clock,
  BookOpen,
  Brain,
  BarChart,
  Menu,
  X,
} from "lucide-react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const handleClickOutside = (event: { target: any }) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="ml-2 text-2xl font-bold text-gray-800">
            StudyDuo
          </span>
        </Link>

        {/* Hamburger Menu for Mobile */}
        <button
          className="lg:hidden text-gray-700"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop Navigation */}
        <nav className="ml-auto hidden lg:flex items-center gap-6">
          <Link
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            href="#"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            href="#"
          >
            Pricing
          </Link>
          <Link
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            href="#"
          >
            About
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 py-1.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors">
                Login
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="inline-flex items-center gap-2 rounded-full border-2 border-blue-600 py-1.5 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                Sign Up
              </button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="lg:hidden fixed top-14 left-0 w-full bg-white shadow-md z-50"
        >
          <nav className="flex flex-col p-4 space-y-4">
            <Link
              className="text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
              href="#"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              className="text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
              href="#"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              className="text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
              href="#"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <div className="flex flex-col gap-4">
              <Link href="/auth/login">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center rounded-full bg-blue-600 py-2 px-4 text-lg font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center rounded-full border-2 border-blue-600 py-2 px-4 text-lg font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  Sign Up
                </button>
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Study Smarter, Not Harder
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-gray-200">
              Upload your study materials, set your study duration, and let
              StudyDuo generate personalized sessions for you.
            </p>
            <div className="space-x-4">
              <Link href="/auth/login">
                <button className="inline-flex items-center gap-2 rounded-full bg-white py-2 px-6 text-sm font-semibold text-blue-600 shadow-md hover:bg-gray-100 transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="inline-flex items-center gap-2 rounded-full border-2 border-white py-2 px-6 text-sm font-semibold text-white hover:bg-white hover:text-blue-600 transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 text-center">
              <FileUp className="h-12 w-12 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Upload Your Study Material
              </h2>
              <p className="text-gray-500">
                Easily upload your notes, pictures, or PDFs to create
                personalized study sessions.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <Clock className="h-12 w-12 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Set Your Study Duration
              </h2>
              <p className="text-gray-500">
                Choose your study duration (e.g., 3 months) and track your
                progress over time.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <BookOpen className="h-12 w-12 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Generate Study Sessions
              </h2>
              <p className="text-gray-500">
                StudyDuo creates Anki-like flashcards and quizzes to help you
                revise effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Study Features Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 sm:grid-cols-2 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold sm:text-4xl text-gray-800">
                Study Like a Pro with Anki-Style Learning
              </h2>
              <p className="text-gray-500 md:text-lg">
                StudyDuo uses powerful spaced repetition techniques like Anki to
                enhance long-term retention.
              </p>
              <ul className="space-y-3 text-gray-500">
                <li className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-blue-600" />
                  <span>Optimized for long-term retention</span>
                </li>
                <li className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-blue-600" />
                  <span>Personalized study schedules</span>
                </li>
                <li className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-600" />
                  <span>Efficient use of study time</span>
                </li>
              </ul>
            </div>
            <div className="relative h-[400px] overflow-hidden rounded-xl shadow-lg">
              <Image
                src="/med-student.jpg?height=400&width=600"
                alt="Medical student studying with StudyDuo"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-gray-500">
          © 2024 StudyDuo. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
            href="#"
          >
            Terms of Service
          </Link>
          <Link
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
            href="#"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
