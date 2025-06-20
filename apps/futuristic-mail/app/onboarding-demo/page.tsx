'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingDemoPage() {
  const [showAgentSelection, setShowAgentSelection] = useState(false);

  const agents = [
    {
      id: 'email-ninja',
      name: 'Email Ninja',
      tagline: 'Swift, silent, inbox zero',
      stats: {
        speed: 95,
        organization: 80,
        automation: 90,
        intelligence: 75
      },
      abilities: ['Lightning replies', 'Smart categorization', 'Stealth mode'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'relationship-sage',
      name: 'Relationship Sage',
      tagline: 'Master of connections',
      stats: {
        speed: 70,
        organization: 85,
        automation: 75,
        intelligence: 95
      },
      abilities: ['Deep insights', 'Network mapping', 'Sentiment analysis'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'productivity-beast',
      name: 'Productivity Beast',
      tagline: 'Crushing tasks since 2024',
      stats: {
        speed: 85,
        organization: 95,
        automation: 100,
        intelligence: 80
      },
      abilities: ['Task automation', 'Time optimization', 'Bulk operations'],
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!showAgentSelection ? (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="h-screen flex items-center justify-center"
          >
            <button
              onClick={() => setShowAgentSelection(true)}
              className="px-8 py-4 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Begin
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="min-h-screen flex flex-col items-center justify-center p-8"
          >
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl font-bold mb-12 text-gray-900"
            >
              Pick Your Agent
            </motion.h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  className="relative group cursor-pointer"
                >
                  <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-xl">
                    {/* Agent Header */}
                    <div className="mb-6">
                      <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${agent.color} mx-auto mb-4 flex items-center justify-center`}>
                        <div className="text-white text-3xl font-bold">
                          {agent.name.charAt(0)}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-center mb-1">{agent.name}</h3>
                      <p className="text-sm text-gray-600 text-center italic">{agent.tagline}</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-6">
                      {Object.entries(agent.stats).map(([stat, value]) => (
                        <div key={stat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize text-gray-700">{stat}</span>
                            <span className="font-medium">{value}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                              className={`h-full bg-gradient-to-r ${agent.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Abilities */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Special Abilities:</p>
                      {agent.abilities.map((ability, i) => (
                        <div key={i} className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">•</span>
                          {ability}
                        </div>
                      ))}
                    </div>

                    {/* Select Button */}
                    <button className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Select {agent.name}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}