import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, Search, GraduationCap, Clock, BookOpen } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

interface Course {
  id: string;
  title: string;
  author: string;
  description: string;
  level: 'Beginner' | 'Advanced';
  lessonsCount: number;
  durationMinutes: number;
}

const courses: Course[] = [
  {
    id: 'beginner-masterclass',
    title: 'Comprehensive Beginner',
    author: 'AllyTZ Panel',
    description: 'This is a comprehensive beginner course about everything you need to become a Trader.',
    level: 'Beginner',
    lessonsCount: 11,
    durationMinutes: 3,
  },
  {
    id: 'goat-strategy',
    title: 'The GOAT Strategy',
    author: 'AllyTZ Panel',
    description: 'The GOAT Strategy is a high-level, confluence-driven trading approach designed for traders who prioritize accuracy over noise.',
    level: 'Advanced',
    lessonsCount: 20,
    durationMinutes: 4,
  },
];

export default function AcademyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'Beginner' | 'Advanced'>('all');
  const { unreadCount } = useUnreadNotificationsCount();

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const handleEnroll = (course: Course) => {
    // All courses are now free - directly enroll
    alert('Enrolled successfully! Access granted.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Academy</Text>
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={Colors.gold} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#A0A0A0" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={Colors.gold}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterPill, selectedLevel === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedLevel('all')}
          >
            <Text style={[styles.filterPillText, selectedLevel === 'all' && styles.filterPillTextActive]}>
              All Courses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, selectedLevel === 'Beginner' && styles.filterPillActive]}
            onPress={() => setSelectedLevel('Beginner')}
          >
            <Text style={[styles.filterPillText, selectedLevel === 'Beginner' && styles.filterPillTextActive]}>
              Beginner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, selectedLevel === 'Advanced' && styles.filterPillActive]}
            onPress={() => setSelectedLevel('Advanced')}
          >
            <Text style={[styles.filterPillText, selectedLevel === 'Advanced' && styles.filterPillTextActive]}>
              Advanced
            </Text>
          </TouchableOpacity>
        </View>

        {/* Course List */}
        <View style={styles.courseList}>
          {filteredCourses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseImage}>
                <GraduationCap size={48} color={Colors.rainyGrey} strokeWidth={2} />
              </View>
              <View style={styles.courseContent}>
                <View style={styles.courseBadgeRow}>
                  <View style={[
                    styles.levelBadge,
                    course.level === 'Beginner' ? styles.levelBadgeBeginner : styles.levelBadgeAdvanced
                  ]}>
                    <Text style={styles.levelBadgeText}>{course.level}</Text>
                  </View>
                </View>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseAuthor}>by {course.author}</Text>
                <Text style={styles.courseDescription}>{course.description}</Text>
                <View style={styles.courseMetaRow}>
                  <View style={styles.courseMeta}>
                    <BookOpen size={14} color="#A0A0A0" strokeWidth={2} />
                    <Text style={styles.courseMetaText}>{course.lessonsCount} lessons</Text>
                  </View>
                  <View style={styles.courseMeta}>
                    <Clock size={14} color="#A0A0A0" strokeWidth={2} />
                    <Text style={styles.courseMetaText}>{course.durationMinutes}h</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.enrollButton}
                  onPress={() => handleEnroll(course)}
                >
                  <GraduationCap size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.enrollButtonText}>Start course</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredCourses.length === 0 && (
          <View style={styles.emptyState}>
            <GraduationCap size={48} color={Colors.rainyGrey} />
            <Text style={styles.emptyStateText}>No courses found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Axiforma-Bold',
    lineHeight: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: Colors.gold,
  },
  filterPillText: {
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
    color: '#A0A0A0',
  },
  filterPillTextActive: {
    color: '#000000',
  },
  courseList: {
    marginTop: 8,
  },
  courseCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseContent: {
    padding: 16,
  },
  courseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  levelBadgeBeginner: {
    backgroundColor: '#22C55E',
  },
  levelBadgeAdvanced: {
    backgroundColor: '#FF4444',
  },
  levelBadgeText: {
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  courseTitle: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  courseAuthor: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    lineHeight: 20,
    marginBottom: 12,
  },
  courseMetaRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  courseMetaText: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginLeft: 6,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
  },
  enrollButtonText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: Colors.rainyGrey,
    marginTop: 16,
  },
});
