
import React from 'react';
import { Home, Dumbbell, Zap, Utensils, Users } from 'lucide-react';
import { Tab } from './types';

export const COLORS = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  accent: '#FFFFFF',
  muted: '#8E8E93',
  stroke: 'rgba(255, 255, 255, 0.1)'
};

export const TABS = [
  { id: Tab.HOME, icon: <Home size={20} /> },
  { id: Tab.EXERCISES, icon: <Dumbbell size={20} /> },
  { id: Tab.WORKOUTS, icon: <Zap size={20} /> },
  { id: Tab.MEALS, icon: <Utensils size={20} /> },
  { id: Tab.COMMUNITY, icon: <Users size={20} /> },
];
