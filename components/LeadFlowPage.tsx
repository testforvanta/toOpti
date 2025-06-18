import React, { useMemo, useState } from 'react';
import { Lead, LeadStage, UserProfile, UserRole } from '../src/types'; // Added UserProfile, UserRole
import { LIGHT_LEAD_STAGE_CHART_COLORS, DARK_LEAD_STAGE_CHART_COLORS } from '../constants';
import LoadingSpinner from './shared/LoadingSpinner'; 
import ErrorDisplay from './shared/ErrorDisplay';   
import { useTheme } from '../context/ThemeContext';
import MeetingScheduledTagIcon from './shared/MeetingScheduledTagIcon';

const FrostIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`w-5 h-5 ${className}`}
  >
    <path d="M12 2v20M12 12l-6.24-3.47M12 12l6.24-3.47M12 12l-6.24 3.47M12 12l6.24 3.47M12 12l-3.47-6.24M12 12l3.47-6.24M12 12l-3.47 6.24M12 12l3.47 6.24" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/> 
  </svg>
);

const JunkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0A48.11 48.11 0 0112 5.69c2.97 0 5.743-.83 8.243-2.275m0 0c.342.052.682.107 1.022.166" />
    </svg>
);


interface LeadFlowPageProps {
  leads: Lead[]; // These will be pre-filtered for BASIC_USER
  isLoading: boolean;
  error: string | null;
  navigateToFilteredLeadsPage: (stageOrTag: LeadStage | string) => void; // Updated to accept string for tags
  userProfile: UserProfile | null; // Added userProfile
}

const PROGRESSION_STAGES_ORDER: LeadStage[] = [
  LeadStage.COLD,
  // LeadStage.MEETING_SCHEDULED, // Removed
  LeadStage.WARM,
  LeadStage.HOT,
  LeadStage.CLOSED,
];

// Terminal stages that are not part of the main progression
const TERMINAL_STAGES: LeadStage[] = [LeadStage.FROZEN_LOST, LeadStage.JUNK];

function LeadFlowPage({ leads, isLoading, error, navigateToFilteredLeadsPage, userProfile }: LeadFlowPageProps) {
  const { theme } = useTheme();
  const [hoveredStage, setHoveredStage] = useState<LeadStage | null>(null);
  const leadStageColors = theme === 'dark' ? DARK_LEAD_STAGE_CHART_COLORS : LIGHT_LEAD_STAGE_CHART_COLORS;
  const isSuperUser = userProfile?.role === UserRole.SUPERUSER;

  const meetingScheduledTaggedLeadsCount = useMemo(() => {
    return leads.filter(lead => lead.tags?.includes("Meeting Scheduled")).length;
  }, [leads]);

  const leadsByStageCounts = useMemo(() => {
    const counts: Record<LeadStage, number> = Object.values(LeadStage).reduce((acc, stage) => {
      acc[stage] = 0;
      return acc;
    }, {} as Record<LeadStage, number>);
    
    leads.forEach(lead => { // 'leads' is already filtered if user is BASIC_USER
      if (counts[lead.stage] !== undefined) {
        counts[lead.stage]++;
      }
    });
    return counts;
  }, [leads]);

  if (isLoading) {
    return <LoadingSpinner message="Loading Lead Flow..." />;
  }

  if (error && !leads.length) { 
    return <ErrorDisplay message={error} title="Lead Flow Data Error:" />;
  }

  return (
    <div className="p-4 md:p-8 max-w-screen-xl mx-auto">
      <header className="pb-6 border-b border-gray-300/50 dark:border-zinc-800/60 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-9 md:w-9 inline-block mr-3 -mt-0.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Lead Flow Visualization
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">
           {isSuperUser ? "Hover over a stage to see the flow. Click to view leads." : "Your assigned leads flow. Click a stage to view."}
        </p>
      </header>

      {error && leads.length > 0 && <div className="mb-6"><ErrorDisplay message={error} title="Lead Flow Data Warning:" /></div>}

      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative"
        onMouseLeave={() => setHoveredStage(null)}
      >
        {Object.values(LeadStage).map((stage) => {
          const count = leadsByStageCounts[stage] || 0;
          
          if (!isSuperUser && count === 0 && !TERMINAL_STAGES.includes(stage)) {
             // Optionally skip rendering non-terminal stages with 0 assigned leads for basic users
             // return null; 
          }

          const stageColorHex = leadStageColors[stage] || (theme === 'dark' ? '#71717A' : '#A0AEC0'); 
          const isTerminal = TERMINAL_STAGES.includes(stage);

          const currentStageOrderIndex = PROGRESSION_STAGES_ORDER.indexOf(stage);
          const hoveredStageOrderIndex = hoveredStage ? PROGRESSION_STAGES_ORDER.indexOf(hoveredStage) : -1;

          let isFilled = false;
          if (hoveredStage) {
            if (isTerminal) {
              isFilled = (stage === hoveredStage);
            } else if (currentStageOrderIndex !== -1 && hoveredStageOrderIndex !== -1) {
              isFilled = currentStageOrderIndex <= hoveredStageOrderIndex;
            }
          }
          const isDirectlyHovered = (stage === hoveredStage);

          let cardClasses = `relative p-5 rounded-2xl transition-all duration-300 ease-in-out 
                             focus:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:focus-within:ring-offset-zinc-950
                             overflow-hidden flex flex-col justify-between min-h-[160px]`;
          let cardStyle: React.CSSProperties = { borderWidth: '1px', borderStyle: 'solid' };
          
          let shadowClass = 'shadow-glass-neumorphic dark:shadow-dark-glass-neumorphic';
          let scaleClass = '';
          let countTextColor = stageColorHex;
          let stageNameTextColorClass = 'text-gray-700 dark:text-zinc-200';
          let iconComponent = null;

          if (stage === LeadStage.FROZEN_LOST) {
            const frozenColor = theme === 'dark' ? leadStageColors[LeadStage.FROZEN_LOST] : leadStageColors[LeadStage.FROZEN_LOST]; 
            const frozenBorderColor = theme === 'dark' ? '#0EA5E9' : '#0BA5E9'; 
            stageNameTextColorClass = theme === 'dark' ? 'text-sky-300' : 'text-sky-700';
            countTextColor = frozenColor; 
            iconComponent = <FrostIcon className={`mr-2 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-500'}`} />;
            if (isDirectlyHovered) {
              cardStyle.backgroundColor = theme === 'dark' ? `${frozenColor}4D` : `${frozenColor}4D`; 
              cardStyle.borderColor = frozenBorderColor;
              shadowClass = 'shadow-soft-dreamy dark:shadow-dark-soft-dreamy';
              scaleClass = 'scale-105';
            } else {
              cardStyle.backgroundColor = theme === 'dark' ? '#0C4A6EBF' : '#E0F2FEBF'; 
              cardStyle.borderColor = theme === 'dark' ? `${frozenColor}80` : `${frozenBorderColor}CB`;
            }
          } else if (stage === LeadStage.JUNK) {
            const junkColor = theme === 'dark' ? leadStageColors[LeadStage.JUNK] : leadStageColors[LeadStage.JUNK];
            const junkBorderColor = theme === 'dark' ? '#4B5563' : '#6B7280'; // Darker grays for border
            stageNameTextColorClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
            countTextColor = junkColor;
            iconComponent = <JunkIcon className={`mr-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />;
            if (isDirectlyHovered) {
              cardStyle.backgroundColor = theme === 'dark' ? `${junkColor}4D` : `${junkColor}4D`;
              cardStyle.borderColor = junkBorderColor;
              shadowClass = 'shadow-soft-dreamy dark:shadow-dark-soft-dreamy';
              scaleClass = 'scale-105';
            } else {
              cardStyle.backgroundColor = theme === 'dark' ? '#374151BF' : '#F3F4F6BF'; // Grayish backgrounds
              cardStyle.borderColor = theme === 'dark' ? `${junkColor}80` : `${junkBorderColor}CB`;
            }
          } else { // Progression stages
             if (isDirectlyHovered) {
              cardStyle.backgroundColor = theme === 'dark' ? `${stageColorHex}66` : `${stageColorHex}66`; 
              cardStyle.borderColor = stageColorHex;
              shadowClass = 'shadow-soft-dreamy dark:shadow-dark-soft-dreamy';
              scaleClass = 'scale-105';
            } else if (isFilled) {
              cardStyle.backgroundColor = theme === 'dark' ? `${stageColorHex}4D` : `${stageColorHex}4D`;
              cardStyle.borderColor = theme === 'dark' ? `${stageColorHex}B3` : `${stageColorHex}B3`;
              shadowClass = 'shadow-md dark:shadow-lg'; 
            } else {
              cardStyle.backgroundColor = theme === 'dark' ? `${stageColorHex}20` : `${stageColorHex}20`;
              cardStyle.borderColor = theme === 'dark' ? `${stageColorHex}80` : `${stageColorHex}80`;
            }
          }
          cardClasses = `${cardClasses} ${shadowClass} ${scaleClass}`;

          return (
            <div 
              key={stage}
              onMouseEnter={() => setHoveredStage(stage)}
              className={cardClasses}
              style={cardStyle}
              role="group" 
              aria-labelledby={`stage-title-${stage.replace(/\s+/g, '-')}`}
              onClick={() => navigateToFilteredLeadsPage(stage)} 
              tabIndex={0} 
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateToFilteredLeadsPage(stage);}}
            >
              {!isTerminal && (
                  <div 
                    className="absolute top-0 left-0 h-1.5 w-full" 
                    style={{ backgroundColor: stageColorHex, opacity: (isFilled || isDirectlyHovered) ? 1 : 0.7 }}
                  />
              )}
              {isTerminal && ( // Side bar for terminal stages
                   <div 
                    className="absolute top-0 left-0 h-full w-1.5"
                    style={{ backgroundColor: isDirectlyHovered ? (stage === LeadStage.FROZEN_LOST ? (theme === 'dark' ? '#0284C7' : '#0BA5E9') : (theme === 'dark' ? '#374151' : '#9CA3AF') ) : (stage === LeadStage.FROZEN_LOST ? (theme === 'dark' ? '#0369A1' : '#38BDF8') : (theme === 'dark' ? '#4B5563' : '#D1D5DB')) }} 
                  />
              )}
              
              <div className="flex items-start justify-between">
                <h3 id={`stage-title-${stage.replace(/\s+/g, '-')}`} className={`text-lg font-semibold ${stageNameTextColorClass} flex items-center ${isTerminal ? 'ml-2' : ''}`}>
                  {iconComponent}
                  {stage}
                </h3>
              </div>
              
              <div className="mt-auto"> 
                <p 
                  className={`text-4xl sm:text-5xl font-bold transition-transform duration-200 ease-out ${isDirectlyHovered ? 'scale-105' : ''}`}
                  style={{ color: countTextColor }}
                >
                  {count}
                </p>
                <p className={`text-xs transition-colors ${isDirectlyHovered ? (theme === 'dark' ? 'text-zinc-300' : 'text-gray-600') : (theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}`}>
                  {count === 1 ? "Lead" : "Leads"} in this stage {!isSuperUser && count > 0 ? "(Assigned to you)" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card for Meeting Scheduled Tagged Leads */}
      {isSuperUser || meetingScheduledTaggedLeadsCount > 0 ? ( // Show if superuser or if count > 0
        <div
          key="meeting-scheduled-tag"
          onMouseEnter={() => setHoveredStage(null)}
          className={`relative p-5 rounded-2xl transition-all duration-300 ease-in-out 
                     focus:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:focus-within:ring-offset-zinc-950
                     overflow-hidden flex flex-col justify-between min-h-[160px] shadow-glass-neumorphic dark:shadow-dark-glass-neumorphic mt-6
                     hover:shadow-lg hover:scale-105 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer`}
          style={{ 
            borderWidth: '1px', 
            borderStyle: 'solid',
            borderColor: theme === 'dark' ? '#818CF8' : '#6366F1',
            backgroundColor: theme === 'dark' ? '#818CF820' : '#6366F120',
          }}
          role="group"
          aria-labelledby="stage-title-meeting-scheduled-tag"
          onClick={() => {
            navigateToFilteredLeadsPage('MEETING_SCHEDULED_TAG');
          }}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateToFilteredLeadsPage('MEETING_SCHEDULED_TAG');}}
        >
          <div className="flex items-start justify-between">
            <h3 id="stage-title-meeting-scheduled-tag" className={`text-lg font-semibold flex items-center ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
              <MeetingScheduledTagIcon className="mr-2" />
              Meeting Scheduled (Tag)
            </h3>
          </div>
          <div className="mt-auto">
            <p
              className="text-4xl sm:text-5xl font-bold"
              style={{ color: theme === 'dark' ? '#818CF8' : '#6366F1' }}
            >
              {meetingScheduledTaggedLeadsCount}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              {meetingScheduledTaggedLeadsCount === 1 ? "Lead" : "Leads"} with this tag
            </p>
          </div>
        </div>
      ) : null}

      <footer className="text-center py-8 text-gray-400 dark:text-zinc-500 border-t border-gray-300/50 dark:border-zinc-800/60 mt-12">
        Lead Flow View &copy; {new Date().getFullYear()}.
      </footer>
    </div>
  );
}

export default LeadFlowPage;