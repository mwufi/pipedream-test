'use client';

import { useState } from 'react';
import { Calendar, Link, AtSign, Paperclip, Check, X, Edit, Trash2, Plus } from 'lucide-react';
import RuleCard from '@/components/RuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AraPage() {
  const [rules, setRules] = useState([
    { id: 'rule-dBnEeZ96YaJFKSZ5HNjtCU', content: 'ok sure', isNew: false }
  ]);

  const [schedulingRules, setSchedulingRules] = useState([
    { id: 'scheduling-rule-1', content: 'Only schedule meetings between 9am and 5pm, Monday to Friday', isNew: false }
  ]);

  const handleSaveRule = (id: string, content: string) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, content, isNew: false } : rule
    ));
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleAddRule = () => {
    const newRule = {
      id: `rule-${Date.now()}`,
      content: '',
      isNew: true
    };
    setRules([...rules, newRule]);
  };

  const handleSaveSchedulingRule = (id: string, content: string) => {
    setSchedulingRules(schedulingRules.map(rule =>
      rule.id === id ? { ...rule, content, isNew: false } : rule
    ));
  };

  const handleDeleteSchedulingRule = (id: string) => {
    setSchedulingRules(schedulingRules.filter(rule => rule.id !== id));
  };

  const handleAddSchedulingRule = () => {
    const newRule = {
      id: `scheduling-rule-${Date.now()}`,
      content: '',
      isNew: true
    };
    setSchedulingRules([...schedulingRules, newRule]);
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto relative bg-[rgb(40,40,40)] text-[#fff6eeb8]">
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="fixed left-[-30vh] top-[-30vh] w-[100vh] h-[100vh] rounded-full opacity-20 bg-[#d0c3f4] blur-[70px] pointer-events-none">
        </div>
        <div
          className="fixed right-[-30vh] bottom-[-30vh] w-[100vh] h-[100vh] rounded-full opacity-20 bg-[#fdda60] blur-[120px] pointer-events-none">
        </div>
        <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-7xl mt-20">
            <div className="text-center mb-8 md:mb-12 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-serif text-white mb-6">Personalize Your AI Assistant</h1>
              <p className="text-text-body-muted text-lg md:text-xl">Tell Ara how to handle your emails and
                schedule meetings. These settings apply when Ara creates draft replies for emails labeled
                "Needs Reply".</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/10 rounded-3xl p-8 pr-0 max-h-[600px]">
                <ScrollArea className="h-full pr-8">
                  <div className="flex flex-col gap-8">
                    <div>
                      <div className="flex flex-col gap-md">
                        <div className="flex flex-col">
                          <h2 className="text-xl font-semibold text-foreground">Scheduling Preferences
                            <span className="text-sm font-normal text-text-body-muted">(optional)</span>
                          </h2>
                          <p className="text-md text-text-body-muted mb-3">Configure Ara's behavior for
                            scheduling meetings, managing your calendar, and coordinating with others.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <button
                            className="flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-colors bg-neutral-800 hover:bg-neutral-700 text-foreground">
                            <Calendar className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-sm h-icon-sm mb-2" />
                            <span className="text-md font-medium text-center">Google Calendar</span>
                          </button>
                          <button
                            className="flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-colors bg-neutral-800 hover:bg-neutral-700 text-foreground">
                            <Link className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-sm h-icon-sm mb-2" />
                            <span className="text-md font-medium text-center">Scheduling Links</span>
                          </button>
                          <button
                            className="flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-colors bg-surface-highlight text-text-body-inverted border-surface-highlight shadow-[inset_0_0_0_2px_rgba(0,0,0,0.8)]">
                            <AtSign className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-sm h-icon-sm mb-2" />
                            <span className="text-md font-medium text-center">CC Someone</span>
                          </button>
                        </div>
                        <div className="flex flex-col gap-xs mt-4">
                          <label className="text-md font-medium text-foreground mb-2">Person to CC (name and email
                            - who will handle setting up meetings)</label>
                          <div
                            className="flex flex-col w-full gap-xs rounded-input rounded-lg bg-input-background text-input-text">
                            <input
                              className="text-md outline-none max-w-md p-3 bg-transparent text-foreground placeholder:text-input-text-placeholder"
                              placeholder="e.g. Sarah, sarah@company.com" type="text"
                              defaultValue="tangzen09@gmail.com" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 mt-6">
                          <div className="flex flex-col gap-xs mb-4">
                            <h3 className="font-medium text-foreground">Additional Scheduling
                              Preferences <span
                                className="text-sm font-normal text-text-body-muted">(optional)</span>
                            </h3>
                            <p className="text-md text-text-body-muted">Define any other specific
                              preferences for how Ara handles scheduling.</p>
                          </div>
                          {schedulingRules.map((rule) => (
                            <RuleCard
                              key={rule.id}
                              id={rule.id}
                              initialContent={rule.content}
                              initialIsEditing={rule.isNew}
                              onSave={(content) => handleSaveSchedulingRule(rule.id, content)}
                              onDelete={() => handleDeleteSchedulingRule(rule.id)}
                            />
                          ))}
                          <button
                            onClick={handleAddSchedulingRule}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] bg-button-bg-base text-button-text-base shadow hover:opacity-80 h-8 px-4 self-start text-md py-3">
                            <Plus className="inline-block flex-grow-0 flex-shrink-0 w-icon-md h-icon-md mr-1 text-white" />
                            Add Scheduling Rule
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
              <div className="bg-white/10 rounded-3xl p-8 max-h-[600px]">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-8">
                    <div>
                      <div className="flex flex-col gap-md">
                        <div className="flex flex-col">
                          <h2 className="text-xl font-semibold text-foreground">Customize Ara <span
                            className="text-sm font-normal text-text-body-muted">(optional)</span>
                          </h2>
                          <p className="text-md text-text-body-muted mb-3">Help Ara understand your work
                            context and preferences. This helps create better draft replies.</p>
                          <ul
                            className="text-md text-text-body-muted list-disc list-inside space-y-1 mb-4">
                            <li>Email templates you commonly use</li>
                            <li>Knowledge base about your company</li>
                            <li>Your communication style preferences</li>
                            <li>Important policies or guidelines</li>
                            <li>Always CC my manager when emailing client X</li>
                          </ul>
                        </div>
                        <div className="flex flex-col gap-4 mt-4">
                          {rules.map((rule) => (
                            <RuleCard
                              key={rule.id}
                              id={rule.id}
                              initialContent={rule.content}
                              initialIsEditing={rule.isNew}
                              onSave={(content) => handleSaveRule(rule.id, content)}
                              onDelete={() => handleDeleteRule(rule.id)}
                            />
                          ))}
                          <button
                            onClick={handleAddRule}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] bg-button-bg-base text-button-text-base shadow hover:opacity-80 h-8 px-4 self-start text-md py-3">
                            <Plus className="inline-block flex-grow-0 flex-shrink-0 w-icon-md h-icon-md mr-1 text-white" />
                            Add Another Rule
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 px-4">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] bg-surface-highlight text-text-body-inverted shadow-sm hover:bg-surface-highlight-hover h-10 rounded-lg px-6 text-md min-w-[200px]">
                Continue
              </button>
              <p className="text-sm text-text-body-muted text-center">You can always update these settings later
                in Settings → Rules</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
