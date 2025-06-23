import { Calendar, Link, AtSign, Paperclip, Check, X, Edit, Trash2, Plus } from 'lucide-react';

export default function AraPage() {
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
              <div className="bg-white/10 rounded-3xl p-8 max-h-[600px] overflow-y-auto">
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
                        <label className="text-md font-medium text-foreground">Person to CC (name and email
                          - who will handle setting up meetings)</label>
                        <div
                          className="flex flex-col w-full gap-xs rounded-input bg-input-background px-lg py-md text-input-text">
                          <input
                            className="text-md outline-none max-w-md bg-transparent text-foreground placeholder:text-input-text-placeholder"
                            placeholder="e.g. Sarah, sarah@company.com" type="text"
                            defaultValue="tangzen09@gmail.com" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-sm mt-6">
                        <div className="flex flex-col gap-xs mb-4">
                          <h3 className="font-medium text-foreground">Additional Scheduling
                            Preferences <span
                              className="text-sm font-normal text-text-body-muted">(optional)</span>
                          </h3>
                          <p className="text-md text-text-body-muted">Define any other specific
                            preferences for how Ara handles scheduling.</p>
                        </div>
                        <div id="new-rule"
                          className="bg-neutral-800/50 rounded-lg overflow-hidden transition-all duration-200">
                          <div className="px-4 py-3 space-y-2">
                            <div className="flex flex-col gap-xs">
                              <textarea name="content"
                                placeholder="e.g., Only schedule meetings between 9am and 5pm, Monday to Friday"
                                className="w-full text-md bg-input-background text-input-text placeholder:text-input-text-placeholder resize-none outline-none rounded-input px-3 py-2.5 overflow-hidden h-auto"
                                style={{ minHeight: '36px', height: '40px' }}></textarea>
                              <div
                                className="flex justify-between items-center pt-2">
                                <input className="hidden" multiple type="file" />
                                <button
                                  className="inline-flex w-[32px] h-[32px] rounded-md grow-0 shrink-0 justify-center items-center text-icon-light-gray hover:text-icon-light-gray/80 hover:bg-button-bg-ghost-hover"
                                  data-state="closed">
                                  <Paperclip className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                </button>
                                <div className="flex gap-xs">
                                  <button
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-icon-light-gray/50 cursor-not-allowed"
                                    disabled>
                                    <Check className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-icon-light-gray hover:text-icon-light-gray/80 transition-opacity duration-150 opacity-100">
                                    <X className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-3xl p-8 max-h-[600px] overflow-y-auto">
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
                      <div className="flex flex-col gap-md mt-4">
                        <div id="rule-dBnEeZ96YaJFKSZ5HNjtCU"
                          className="bg-neutral-800/50 rounded-lg overflow-hidden transition-all duration-200">
                          <div className="px-4 py-3 space-y-2">
                            <textarea readOnly
                              className="w-full text-md bg-transparent text-input-text resize-none outline-none rounded-input px-3 py-2.5 overflow-hidden h-auto cursor-default"
                              style={{ minHeight: '36px', height: '40px' }}
                              defaultValue="ok sure" />
                            <div
                              className="flex justify-between items-center pt-2">
                              <div className="opacity-0 pointer-events-none">
                                <input className="hidden" multiple type="file" />
                                <button
                                  className="inline-flex w-[32px] h-[32px] rounded-md grow-0 shrink-0 justify-center items-center text-icon-light-gray hover:text-icon-light-gray/80 hover:bg-button-bg-ghost-hover"
                                  data-state="closed">
                                  <Paperclip className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                </button>
                              </div>
                              <div className="flex gap-xs">
                                <button
                                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-icon-light-gray hover:text-icon-light-gray/80">
                                  <Edit className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                </button>
                                <button
                                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] hover:bg-button-bg-ghost h-8 w-8 text-destructive hover:text-destructive/80">
                                  <Trash2 className="inline-block flex-grow-0 flex-shrink-0 text-inherit w-icon-xs h-icon-xs" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[.99] bg-button-bg-base text-button-text-base shadow hover:opacity-80 h-8 px-4 self-start text-md mt-4 py-3">
                          <Plus className="inline-block flex-grow-0 flex-shrink-0 w-icon-md h-icon-md mr-1 text-white" />
                          Add Another Rule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
