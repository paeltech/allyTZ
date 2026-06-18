"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import CourseCard, { Course } from "../components/course/CourseCard";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { Search } from "lucide-react";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import FilterSaveBar from "@/components/forms/FilterSaveBar.tsx";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp } from "@/lib/animations";

const initialCourses: Course[] = [
  {
    id: "beginner-masterclass",
    title: "Comprehensive Beginner",
    author: "AllyTZ Panel",
    description:
      "This is a comprehensive beginner course about everything you need to become a Trader.",
    level: "Beginner",
    category: "Beginner",
    lessonsCount: 11,
    durationMinutes: 3,
    price: 0,
    premium: false,
    coverUrl: "/assets/placeholder.svg",
  },
  {
    id: "goat-strategy",
    title: "The GOAT Strategy",
    author: "AllyTZ Panel",
    description:
      "The GOAT Strategy is a high-level, confluence-driven trading approach designed for traders who prioritize accuracy over noise.",
    level: "Advanced",
    category: "Advanced",
    lessonsCount: 20,
    durationMinutes: 4,
    price: 199,
    premium: true,
    coverUrl: "/assets/placeholder.svg",
  },
];

const CoursePage: React.FC = () => {
  const { session } = useSupabaseSession();
  const [tab, setTab] = React.useState<"all" | "mine">("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<"all" | "Beginner" | "Advanced">("all");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | "Beginner" | "Advanced">("all");
  const [enrolledIds, setEnrolledIds] = React.useState<string[]>([]);

  const handleEnroll = (courseId: string) => {
    const course = initialCourses.find((c) => c.id === courseId);
    if (!course) return;
    // All courses are now free - directly enroll
    if (!enrolledIds.includes(courseId)) {
      setEnrolledIds((prev) => [...prev, courseId]);
    }
    if (session?.user?.id) {
      // Save enrollment to Supabase
      supabase.from("user_course_enrollments").insert({
        user_id: session.user.id,
        course_id: courseId,
      }).then(({ error }) => {
        if (error) {
          throw error;
        }
      });
    }
    showSuccess("Enrolled successfully. Access granted.");
  };

  const filtered = initialCourses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" ? true : c.level === levelFilter;
    const matchesCategory = categoryFilter === "all" ? true : c.category === categoryFilter;
    const matchesTab = tab === "all" ? true : enrolledIds.includes(c.id);
    return matchesSearch && matchesLevel && matchesCategory && matchesTab;
  });

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header */}
        <ScrollReveal>
          <PanelCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-white text-xl md:text-2xl font-semibold">Courses</h1>
                  <p className="text-slate-400 text-sm">{initialCourses.length} courses available</p>
                </div>
              </div>
            </CardContent>
          </PanelCard>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal>
          <div className="mb-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="bg-slate-800">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  All Courses
                </TabsTrigger>
                <TabsTrigger value="mine" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  My Courses
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search courses..."
                className="pl-9 bg-slate-900/60 border-slate-800 text-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
            >
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={levelFilter}
              onValueChange={(v) => setLevelFilter(v as typeof levelFilter)}
            >
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ScrollReveal>

        <div className="mb-6">
          <FilterSaveBar
            page="courses"
            values={{ tab, searchTerm, levelFilter, categoryFilter }}
          />
        </div>

        {/* Course grid */}
        <StaggerChildren className="grid md:grid-cols-2 gap-6">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrolled={enrolledIds.includes(course.id)}
              onEnroll={handleEnroll}
            />
          ))}
          {filtered.length === 0 && (
            <PanelCard>
              <CardContent className="p-6 text-center text-slate-400">
                No courses match your filters.
                <div className="mt-3">
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                    onClick={() => {
                      setSearchTerm("");
                      setLevelFilter("all");
                      setCategoryFilter("all");
                      setTab("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </PanelCard>
          )}
        </StaggerChildren>
      </DashboardLayout>
    </PageTransition>
  );
};

export default CoursePage;