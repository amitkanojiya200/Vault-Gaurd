// src/pages/training/OprcModulePage.jsx
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Presentation, PlayCircle, ChevronLeft, Download, Video, X } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import ModalPdfViewer from '@/components/ModalPdfViewer';

import vidoprc21 from '@/assets/videos/1Response to Marine Oil Spills_ Aerial surveillance.mp4';
import vidoprc22 from '@/assets/videos/2Response to Marine Oil Spills_ At-sea response.mp4';
import vidoprc23 from '@/assets/videos/3Response to Marine Oil Spills_ Environmental impacts.mp4';
// import vid1 from '/videos/level2'

const MODULE_CONFIG = {
    level1: {
        title: 'OPRC Level-1',
        subtitle: 'Awareness & Basic Response',
        instructorManual: {
            title: "OPRC Level 1_Instructor's Manual",
            buttonText: "OPRC Level 1_Instructor's Manual",
            filePath: "/manual-doc/OPRC_Level1_Instructor_Manual.pdf"
        },
        participantManual: {
            title: "OPRC Level 1_Participant's Manual",
            buttonText: "OPRC Level 1_Participant's Manual",
            filePath: "/manual-doc/OPRC_Level1_Participant_Manual.pdf"
        },
        overview: [
            ''],
        coursePpts: [
            { id: 'l1-1', label: 'L1-01 · Introduction and Orientation', fileName: 'L.1.1 Introduction and Orientation CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.1 Introduction and Orientation CGPRT(W).pptx" },
            { id: 'l1-2', label: 'L1-02 · Fate and Behaviour', fileName: 'L.1.2 Fate and Behaviour  By CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.2 Fate and Behaviour  By CGPRT(W).pptx" },
            { id: 'l1-3', label: 'L1-03 · Impacts of Oil Spill', fileName: 'L.1.3 Impacts of oil spill  By CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.3 Impacts of oil spill  By CGPRT(W).pptx" },
            { id: 'l1-4', label: 'L1-04 · Principles of Incident Management', fileName: 'L.1.4 Principles of Incident Management By CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.4 Principles of Incident Management By CGPRT(W).pptx" },
            { id: 'l1-5', label: 'L1-05 · Health and Safety', fileName: 'L.1.5 Health and Safety CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.5 Health and Safety CGPRT(W).pptx" },
            { id: 'l1-6', label: 'L1-06 · Overview of Oil Spill Response Techniques', fileName: 'L.1.6 Overview of Oil Spill Response Techniques CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.6 Overview of Oil Spill Response Techniques CGPRT(W).pptx" },
            { id: 'l1-7', label: 'L1-07 · Dispersants', fileName: 'L.1.7 Dispersants CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.7 Dispersants CGPRT(W).pptx" },
            { id: 'l1-8', label: 'L1-08 · Booms Containment and Protection', fileName: 'L.1.8 Booms Containment and Protection CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.8 Booms Containment and Protection CGPRT(W).pptx" },
            { id: 'l1-9', label: 'L1-09 · Skimmers', fileName: 'L.1.9 Skimmers CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.9 Skimmers CGPRT(W).pptx" },
            { id: 'l1-10', label: 'L1-10 · Temporary Storage', fileName: 'L.1.10 Temporary Storage CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.10 Temporary Storage CGPRT(W).pptx" },
            { id: 'l1-11', label: 'L1-11 · In Situ Burning', fileName: 'L.1.11 In Situ Burning CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.11 In Situ Burning CGPRT(W).pptx" },
            { id: 'l1-12', label: 'L1-12 · Sorbents', fileName: 'L.1.12 Sorbents CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.12 Sorbents CGPRT(W).pptx" },
            { id: 'l1-13', label: 'L1-13 · Shoreline Assessment and Evaluation', fileName: 'L.1.13 Shoreline Assessment and Evaluation CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.13 Shoreline Assessment and Evaluation CGPRT(W).pptx" },
            { id: 'l1-14', label: 'L1-14 · Shoreline Clean-Up Techniques', fileName: 'L.1.14 Shoreline Clean-Up Techniques CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.14 Shoreline Clean-Up Techniques CGPRT(W).pptx" },
            { id: 'l1-15', label: 'L1-15 · Shoreline Site Set-up', fileName: 'L.1.15 Shoreline Site Set-up CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.15 Shoreline Site Set-up CGPRT(W).pptx" },
            { id: 'l1-16', label: 'L1-16 · Implementing Waste Management', fileName: 'L.1.16 Implementing Waste Management CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.16 Implementing Waste Management CGPRT(W).pptx" },
            { id: 'l1-17', label: 'L1-17 · Post incident operations', fileName: 'L.1.17 Post incident operations CGPRT(W).pptx', path: "/D-OPRC-Level-1/L.1.17 Post incident operations CGPRT(W).pptx" }
        ],
        exercises: [
            { id: 'l1-e1', label: 'Tabletop Exercise – Small Jetty Spill', fileName: 'L1_Exercise_Jetty_Spill.pdf' },
            { id: 'l1-e2', label: 'Quiz – Basic OPRC Concepts', fileName: 'L1_Quiz_OPRC_Basics.docx' },
        ],
        videos: [
            // { id: 'l1-v1', label: 'Basic Oil Spill Response Techniques', fileName: 'OPRC_Level1_Basic_Response.mp4', path: '/videos/level1/basic_response.mp4' },
            // { id: 'l1-v2', label: 'Safety Procedures in Spill Response', fileName: 'OPRC_Level1_Safety_Procedures.mp4', path: '/videos/level1/safety_procedures.mp4' },
        ],
    },
    level2: {
        title: 'OPRC Level-2',
        subtitle: 'Equipment & Field Operations',
        instructorManual: {
            title: "OPRC Level 2_Instructor's Manual",
            buttonText: "OPRC Level 2_Instructor's Manual",
            filePath: "/manual-doc/OPRC_Level2_Instructor_Manual.pdf"
        },
        participantManual: {
            title: "OPRC Level 2_Participant's Manual",
            buttonText: "OPRC Level 2_Participant's Manual",
            filePath: "/manual-doc/OPRC_Level2_Participant_Manual.pdf"
        },
        overview: [''
            // 'Intermediate course focusing on deployment of response equipment, shoreline operations and safety during field response.',
            // 'Participants should be familiar with Level-1 content before attending Level-2 sessions.',
        ],
        coursePpts: [
            { id: 'l2-1', label: 'L2-01 · Introduction and Orientation', fileName: 'L.2.1 Introduction and Orientation.pptx', path: "/D-OPRC-Level-2/L.2.1 Introduction and Orientation.pptx" },
            { id: 'l2-2', label: 'L2-02 · Sources and Impacts of Oil Spills', fileName: 'L.2.2 Sources and Impacts of Oil Spills.pptx', path: "/D-OPRC-Level-2/L.2.2 Sources and Impacts of Oil Spills.pptx" },
            { id: 'l2-3', label: 'L2-03 · Overview of Contingency Planning and Preparedness', fileName: 'L.2.3 Overview of Contingency Planning and Preparedness.pptx', path: "/D-OPRC-Level-2/L.2.3 Overview of Contingency Planning and Preparedness.pptx" },
            { id: 'l2-4', label: 'L2-04 · Principles of Incident Management', fileName: 'L.2.4 Principles of Incident Management.pptx', path: "/D-OPRC-Level-2/L.2.4 Principles of Incident Management.pptx" },
            { id: 'l2-5', label: 'L2-05 · Response Tools', fileName: 'L.2.5 Response Tools.ppt', path: "/D-OPRC-Level-2/L.2.5 Response Tools.ppt" },
            { id: 'l2-6', label: 'L2-06 · Fate and behavior', fileName: 'L.2.6 Fate and behavior.pptx', path: "/D-OPRC-Level-2/L.2.6 Fate and behavior.pptx" },
            { id: 'l2-7', label: 'L2-07 · Observation & Remote Sensing', fileName: 'L.2.7 Observation & Remote Sensing.pptx', path: "/D-OPRC-Level-2/L.2.7 Observation & Remote Sensing.pptx" },
            { id: 'l2-8', label: 'L2-08 · Containment, Recovery and Salvage Considerations', fileName: 'L.2.8 Containment, Recovery and Salvage Considerations.pptx', path: "/D-OPRC-Level-2/L.2.8 Containment, Recovery and Salvage Considerations.pptx" },
            { id: 'l2-9', label: 'L2-09 · Use of Dispersants', fileName: 'L.2.9 Use of Dispersants.pptx', path: "/D-OPRC-Level-2/L.2.9 Use of Dispersants.pptx" },
            { id: 'l2-10', label: 'L2-10 · In-situ Burning', fileName: 'L.2.10 In-situ Burning.pptx', path: "/D-OPRC-Level-2/L.2.10 In-situ Burning.pptx" },
            { id: 'l2-11', label: 'L2-11 · Shoreline Assessment', fileName: 'L.2.11 Shoreline Assessment.pptx', path: "/D-OPRC-Level-2/L.2.11 Shoreline Assessment.pptx" },
            { id: 'l2-12', label: 'L2-12 · Oil Spill Response in Fast Water', fileName: 'L.2.12 Oil Spill Response in Fast Water.pptx', path: "/D-OPRC-Level-2/L.2.12 Oil Spill Response in Fast Water.pptx" },
            { id: 'l2-13', label: 'L2-13 · Oil Spill Response in Ice', fileName: 'L.2.13 Oil Spill Response in Ice.pptx', path: "/D-OPRC-Level-2/L.2.13 Oil Spill Response in Ice.pptx" },
            { id: 'l2-14', label: 'L2-14 · Oiled Wildlife Management', fileName: 'L.2.14 Oiled Wildlife Management.pptx', path: "/D-OPRC-Level-2/L.2.14 Oiled Wildlife Management.pptx" },
            { id: 'l2-15', label: 'L2-15 · Archaeological and Cultural Resources', fileName: 'L.2.15 Archaeological and Cultural Resources.pptx', path: "/D-OPRC-Level-2/L.2.15 Archaeological and Cultural Resources.pptx" },
            { id: 'l2-16', label: 'L2-16 · Health and Safety considerations', fileName: 'L.2.16 Health and Safety considerations.pptx', path: "/D-OPRC-Level-2/L.2.16 Health and Safety considerations.pptx" },
            { id: 'l2-17', label: 'L2-17 · Logistical and decontamination issues', fileName: 'L.2.17 Logisitical and decontamination issues_highlighted.pptx', path: "/D-OPRC-Level-2/L.2.17 Logisitical and decontamination issues_highlighted.pptx" },
            { id: 'l2-18', label: 'L2-18 · Waste management and disposal', fileName: 'L.2.18 Waste management and disposal.pptx', path: "/D-OPRC-Level-2/L.2.18 Waste management and disposal.pptx" },
            { id: 'l2-19', label: 'L2-19 · Communications and Media', fileName: 'L.2.19 Communications and Media.pptx', path: "/D-OPRC-Level-2/L.2.19 Communications and Media.pptx" },
            { id: 'l2-20', label: 'L2-20 · Response termination criteria', fileName: 'L.2.20 Response termination criteria.pptx', path: "/D-OPRC-Level-2/L.2.20 Response termination criteria.pptx" },
            { id: 'l2-21', label: 'L2-21 · Post incident operations', fileName: 'L.2.21 Post incident operations.pptx', path: "/D-OPRC-Level-2/L.2.21 Post incident operations.pptx" },
            { id: 'l2-22', label: 'L2-22 · Administrative issues', fileName: 'L.2.22 Administrative issues.pptx', path: "/D-OPRC-Level-2/L.2.22 Administrative issues.pptx" }
        ],
        exercises: [
            { id: 'l2-e1', label: 'Field Drill – Boom Deployment', fileName: 'L2_FieldDrill_Boom_Deployment.pdf' },
            { id: 'l2-e2', label: 'Case Study – Harbour Spill', fileName: 'L2_CaseStudy_Harbour_Spill.docx' },
        ],
        videos: [
            { id: 'l2-v1', label: 'Response to Marine Oil Spills_ Aerial surveillance', fileName: '1Response to Marine Oil Spills_ Aerial surveillance.mp4', path: vidoprc21 },
            { id: 'l2-v2', label: 'Response to Marine Oil Spills_ At-sea response', fileName: '2Response to Marine Oil Spills_ At-sea response.mp4', path: vidoprc22 },
            { id: 'l2-v3', label: 'Response to Marine Oil Spills_ Environmental impacts', fileName: '3Response to Marine Oil Spills_ Environmental impacts.mp4', path: vidoprc23 },
        ],
    },
    level3: {
        title: 'OPRC Level-3',
        subtitle: 'Tier-3 Response & Command',
        instructorManual: {
            title: "OPRC Level 3_Instructor's Manual",
            buttonText: "OPRC Level 3_Instructor's Manual",
            filePath: "/manual-doc/OPRC_Level3_Instructor_Manual.pdf"
        },
        participantManual: {
            title: "OPRC Level 3_Participant's Manual",
            buttonText: "OPRC Level 3_Participant's Manual",
            filePath: "/manual-doc/OPRC_Level3_Participant_Manual.pdf"
        },
        overview: [''
            // 'Advanced module for command-level officers covering national and international tier-3 spill response arrangements.',
            // 'Emphasis on NOSDCP integration, inter-agency coordination and strategic decision-making.',
        ],
        coursePpts: [
            { id: 'l3-1', label: 'L3-01 · Introduction and Orientation', fileName: 'L.3.1 Introduction and Orientation.pptx', path: "/D-OPRC-Level-3/L.3.1 Introduction and Orientation.pptx" },
            { id: 'l3-2', label: 'L3-02 · The Legal Framework', fileName: 'L.3.2 The Legal Framework.pptx', path: "/D-OPRC-Level-3/L.3.2 The Legal Framework.pptx" },
            { id: 'l3-3', label: 'L3-03 · Oil Spill Response Preparedness', fileName: 'L.3.3 Oil Spill Response Preparedness.pptx', path: "/D-OPRC-Level-3/L.3.3 Oil Spill Response Preparedness.pptx" },
            { id: 'l3-4', label: 'L3-04 · Technical tools for oil spill planning and response', fileName: 'L.3.4 Technical tools for oil spill planning and response.pptx', path: "/D-OPRC-Level-3/L.3.4 Technical tools for oil spill planning and response.pptx" },
            { id: 'l3-5', label: 'L3-05 · Assessment of spill risks', fileName: 'L.3.5 Assessment of spill risks.pptx', path: "/D-OPRC-Level-3/L.3.5 Assessment of spill risks.pptx" },
            { id: 'l3-6', label: 'L3-06 · Impacts of oil spills', fileName: 'L.3.6 Impacts of oil spills.pptx', path: "/D-OPRC-Level-3/L.3.6 Impacts of oil spills.pptx" },
            { id: 'l3-7', label: 'L3-07 · Oil Spill Response Options', fileName: 'L.3.7 Oil Spill Response Options.pptx', path: "/D-OPRC-Level-3/L.3.7 Oil Spill Response Options.pptx" },
            { id: 'l3-8', label: 'L3-08 · Places of Refuge and Salvage Considerations', fileName: 'L.3.8 Places of Refuge and Salvage Considerations.pptx', path: "/D-OPRC-Level-3/L.3.8 Places of Refuge and Salvage Considerations.pptx" },
            { id: 'l3-9', label: 'L3-09 · Planning & Cooperation', fileName: 'L.3.9 Planning & Cooperation.pptx', path: "/D-OPRC-Level-3/L.3.9 Planning & Cooperation.pptx" },
            { id: 'l3-10', label: 'L3-10 · Strategic Directions and Policies', fileName: 'L.3.10 Strategic Directions and Policies.pptx', path: "/D-OPRC-Level-3/L.3.10 Strategic Directions and Policies.pptx" },
            { id: 'l3-11', label: 'L3-11 · Roles and Responsibilities', fileName: 'L.3.11 Roles and Responsibilities.pptx', path: "/D-OPRC-Level-3/L.3.11 Roles and Responsibilities.pptx" },
            { id: 'l3-12', label: 'L3-12 · Leadership during an Emergency', fileName: 'L.3.12 Leadership during an Emergency.pptx', path: "/D-OPRC-Level-3/L.3.12 Leadership during an Emergency.pptx" },
            { id: 'l3-13', label: 'L3-13 · Incident Management Systems (IMS)', fileName: 'L.3.13 Incident Management Systems (IMS).pptx', path: "/D-OPRC-Level-3/L.3.13 Incident Management Systems (IMS).pptx" },
            { id: 'l3-14', label: 'L3-14 · Termination of Response', fileName: 'L.3.14 Termination of Response.pptx', path: "/D-OPRC-Level-3/L.3.14 Termination of Response.pptx" },
            { id: 'l3-15', label: 'L3-15 · Managing Information', fileName: 'L.3.15 Managing Information.pptx', path: "/D-OPRC-Level-3/L.3.15 Managing Information.pptx" },
            { id: 'l3-16', label: 'L3-16 · Internal Communications Requirements', fileName: 'L.3.16 Internal Communications Requirements.pptx', path: "/D-OPRC-Level-3/L.3.16 Internal Communications Requirements.pptx" },
            { id: 'l3-17', label: 'L3-17 · External Communication Requirements', fileName: 'L.3.17 External Communication Requirements.pptx', path: "/D-OPRC-Level-3/L.3.17 External Communication Requirements.pptx" },
            { id: 'l3-18', label: 'L3-18 · International compensation regime', fileName: 'L.3.18 International compensation regime.pptx', path: "/D-OPRC-Level-3/L.3.18 International compensation regime.pptx" },
            { id: 'l3-19', label: 'L3-19 · Admissible claims', fileName: 'L.3.19 Admissible claims.pptx', path: "/D-OPRC-Level-3/L.3.19 Admissible claims.pptx" }
        ],
        exercises: [
            { id: 'l3-e1', label: 'Command-Post Exercise – Offshore Spill', fileName: 'L3_CPX_Offshore_Spill.pdf' },
            { id: 'l3-e2', label: 'Strategic Drill – Multi-Agency Response', fileName: 'L3_Strategic_Drill_MultiAgency.docx' },
        ],
        videos: [], // No videos for Level-3
    },
    pr: {
        title: 'OPRC PR Capsule',
        subtitle: 'Public Relations & Communication',
        instructorManual: {
            title: "OPRC PR Capsule_Instructor's Manual",
            buttonText: "OPRC PR Capsule_Instructor's Manual",
            filePath: "/manual-doc/OPRC_PR_Capsule_Instructor_Manual.pdf"
        },
        participantManual: {
            title: "OPRC PR Capsule_Participant's Manual",
            buttonText: "OPRC PR Capsule_Participant's Manual",
            filePath: "/manual-doc/OPRC_PR_Capsule_Participant_Manual.pdf"
        },
        overview: [''
            // 'Capsule focused on external communication, media handling and stakeholder information during pollution incidents.',
            // 'Supports spokespeople, PRO staff and designated officers handling public messaging.',
        ],
        coursePpts: [
            { id: 'pr-1', label: 'PR-01 · Overview of Oil Spill Response Techniques', fileName: 'L.1.1 Overview of Oil Spill Response Techniques CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.1 Overview of Oil Spill Response Techniques CGPRT(W).pptx" },
            { id: 'pr-2', label: 'PR-02 · Impacts of oil spill', fileName: 'L.1.2 Impacts of oil spill  By CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.2 Impacts of oil spill  By CGPRT(W).pptx" },
            { id: 'pr-3', label: 'PR-03 · Fate and Behaviour', fileName: 'L.1.3 Fate and Behaviour  By CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.3 Fate and Behaviour  By CGPRT(W).pptx" },
            { id: 'pr-4', label: 'PR-04 · Booms Containment and Protection', fileName: 'L.1.4 Booms Containment and Protection CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.4 Booms Containment and Protection CGPRT(W).pptx" },
            { id: 'pr-5', label: 'PR-05 · Skimmers', fileName: 'L.1.5 Skimmers CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.5 Skimmers CGPRT(W).pptx" },
            { id: 'pr-6', label: 'PR-06 · Shoreline Clean-Up Techniques', fileName: 'L.1.6 Shoreline Clean-Up Techniques CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.6 Shoreline Clean-Up Techniques CGPRT(W).pptx" },
            { id: 'pr-7', label: 'PR-07 · Dispersants', fileName: 'L.1.7 Dispersants CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.7 Dispersants CGPRT(W).pptx" },
            { id: 'pr-8', label: 'PR-08 · Sorbents', fileName: 'L.1.8 Sorbents CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.8 Sorbents CGPRT(W).pptx" },
            { id: 'pr-9', label: 'PR-09 · Temporary Storage', fileName: 'L.1.9 Temporary Storage CGPRT(W).pptx', path: "/D-PR-Capsule/L.1.9 Temporary Storage CGPRT(W).pptx" },
            { id: 'pr-10', label: 'PR-10 · Cleaning, Maintenance & Storage of Equipment', fileName: 'L.1.10 Cleaning, Maintenance & Storage of Equipment.ppt', path: "/D-PR-Capsule/L.1.10 Cleaning, Maintenance & Storage of Equipment.ppt" }
        ],
        exercises: [
            { id: 'pr-e1', label: 'Press Conference Simulation', fileName: 'PR_Exercise_Press_Conference.pdf' },
            { id: 'pr-e2', label: 'Press Note Drafting Drill', fileName: 'PR_Exercise_Press_Note.docx' },
        ],
        videos: [
            { id: 'pr-v1', label: 'Media Handling Best Practices', fileName: 'OPRC_PR_Media_Handling.mp4', path: '/videos/pr/media_handling.mp4' },
        ],
    },
};

function SectionCard({ icon, title, description, items, onOpen }) {
    return (
        <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40">
            <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                    {icon}
                </div>
                <div>
                    <p className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100">
                        {title}
                    </p>
                    <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>
            </div>

            <div className="mt-1 flex flex-col gap-1.5">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpen(item)}
                        className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-left text-[0.75rem] transition hover:border-sky-400 hover:bg-sky-50/90 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-sky-400/70 dark:hover:bg-slate-800/80"
                    >
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-slate-900 dark:text-slate-50">
                                {item.label}
                            </span>
                            <span className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                                {item.fileName}
                            </span>
                        </div>
                        <FileText className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:text-sky-500 dark:text-slate-500" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function VideoSectionCard({ icon, title, description, items, onOpen }) {
    return (
        <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40">
            <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200">
                    {icon}
                </div>
                <div>
                    <p className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100">
                        {title}
                    </p>
                    <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>
            </div>

            <div className="mt-1 flex flex-col gap-1.5">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpen(item)}
                        className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-left text-[0.75rem] transition hover:border-green-400 hover:bg-green-50/90 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-green-400/70 dark:hover:bg-slate-800/80"
                    >
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-slate-900 dark:text-slate-50">
                                {item.label}
                            </span>
                            <span className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                                {item.fileName}
                            </span>
                        </div>
                        <PlayCircle className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:text-green-500 dark:text-slate-500" />
                    </button>
                ))}
            </div>
        </div>
    );
}

// File Viewer Component
function FileViewer({ filePath, title, fileType, onClose }) {
    const getFileContent = () => {
        const extension = filePath.split('.').pop().toLowerCase();

        if (['pdf'].includes(extension)) {
            return (
                <embed
                    src={filePath}
                    type="application/pdf"
                    className="w-full h-full rounded-lg"
                    title={title}
                />
            );
        } else if (['ppt', 'pptx'].includes(extension)) {
            // Using Microsoft Office Online Viewer for better compatibility
            const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + filePath)}`;

            // Function to open the file in the default application
            const openInPowerPoint = (e) => {
                e.preventDefault();
                window.open(filePath, '_blank');
            };

            return (
                <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center">
                            <Presentation className="h-5 w-5 text-sky-500 mr-2" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {title}
                            </span>
                        </div>
                        <button
                            onClick={openInPowerPoint}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                        >
                            <Presentation className="h-3.5 w-3.5" />
                            Open in PowerPoint
                        </button>
                    </div>
                    <div className="flex-1 w-full">
                        <iframe
                            src={officeViewerUrl}
                            className="w-full h-full border-0"
                            frameBorder="0"
                            allowFullScreen
                            title={`PowerPoint Viewer - ${title}`}
                            style={{ backgroundColor: 'white' }}
                        ></iframe>
                    </div>
                </div>
            );
        } else if (['doc', 'docx'].includes(extension)) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center p-8">
                        <FileText className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                        <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                            Word Document
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            {title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                            This document is best viewed in Word.
                            <br />
                            Click the button below to open it in your default application.
                        </p>
                        <a
                            href={filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            Open in Word
                        </a>
                    </div>
                </div>
            );
        } else if (['mp4', 'avi', 'mov'].includes(extension)) {
            return (
                <video
                    controls
                    className="w-full h-full rounded-lg"
                    autoPlay
                >
                    <source src={filePath} type={`video/${extension}`} />
                    Your browser does not support the video tag.
                </video>
            );
        } else {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center p-8">
                        <FileText className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                            File Preview Not Available
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            {title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                            This file type cannot be previewed in the browser.
                            <br />
                            Click the button below to open it in your default application.
                        </p>
                        <a
                            href={filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                            <Download className="h-4 w-4" />
                            Open File
                        </a>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[0.9rem] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {title}
                </h3>
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-[0.7rem] font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 flex-shrink-0 ml-2"
                >
                    <X className="h-3.5 w-3.5" />
                    Close
                </button>
            </div>
            <div className="w-full h-[600px] rounded-lg overflow-hidden">
                {getFileContent()}
            </div>
        </div>
    );
}

export default function OprcModulePage2({ variant, routes, onNavigate }) {
    const config = useMemo(() => MODULE_CONFIG[variant] || MODULE_CONFIG.level1, [variant]);
    const [activeFile, setActiveFile] = useState(null); // { path: string, title: string, type: string }

    function handleOpenFile(item) {
        setActiveFile({
            path: item.path,
            title: item.label,
            type: item.fileName.split('.').pop().toLowerCase()
        });
    }

    function handleOpenVideo(item) {
        setActiveFile({
            path: item.path,
            title: item.label,
            type: 'video'
        });
    }

    function handleOpenInstructorManual() {
        setActiveFile({
            path: config.instructorManual.filePath,
            title: config.instructorManual.title,
            type: 'pdf'
        });
    }

    function handleOpenParticipantManual() {
        setActiveFile({
            path: config.participantManual.filePath,
            title: config.participantManual.title,
            type: 'pdf'
        });
    }

    function handleCloseFile() {
        setActiveFile(null);
    }

    const hasVideos = config.videos && config.videos.length > 0;

    return (
        <div className="relative min-h-screen overflow-hidden">
            <img
                src={bgImage2}
                alt="PRABAL background"
                className="fixed inset-0 -z-20 h-full w-full object-cover blur-lg brightness-75 saturate-150"
            />
            <div
                className="fixed inset-0 -z-10 backdrop-blur-xl opacity-90 dark:opacity-60"
                style={{
                    background:
                        'radial-gradient(circle at top, rgba(148,163,253,0.22), transparent 80%), linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                }}
            />
            <div className="pointer-events-none fixed inset-0 -z-10 hidden bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.85),_transparent_70%)] dark:block" />

            <div className="relative z-10 px-4 py-4 text-slate-900 md:px-10 md:py-6 dark:text-[var(--soft-white,_#e5e7eb)]">
                {/* Top bar: Back to Training */}
                <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onNavigate(routes.SERVICES_TRAINING_NATIONAL)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[0.7rem] text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Back to Training - National</span>
                    </button>
                </div>

                {/* Header */}
                <div className="mb-4">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Documents · OPRC
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50">
                        {config.title}
                    </h1>
                    {config.subtitle && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {config.subtitle}
                        </p>
                    )}
                </div>

                {/* Manuals Section - Instructor and Participant */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
                >
                    {/* Instructor Manual */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-[0.9rem] font-bold text-slate-800 dark:text-slate-100">
                                {config.instructorManual.title}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleOpenInstructorManual}
                            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-[0.75rem] font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-700 dark:hover:bg-sky-600 dark:focus:ring-offset-slate-900 whitespace-nowrap self-start lg:self-center"
                        >
                            <Download className="h-4 w-4" />
                            {config.instructorManual.buttonText}
                        </button>
                    </div>

                    {/* Participant Manual */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-[0.9rem] font-bold text-slate-800 dark:text-slate-100">
                                {config.participantManual.title}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleOpenParticipantManual}
                            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-[0.75rem] font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-700 dark:hover:bg-sky-600 dark:focus:ring-offset-slate-900 whitespace-nowrap self-start lg:self-center"
                        >
                            <Download className="h-4 w-4" />
                            {config.participantManual.buttonText}
                        </button>
                    </div>
                </motion.div>

                {/* File Viewer Section - Conditionally Rendered */}
                {activeFile && (
                    <>
                        {/* Use ModalPdfViewer for PDFs and PPTs */}
                        {(activeFile.type === 'pdf' || activeFile.type === 'ppt' || activeFile.type === 'pptx') ? (
                            <ModalPdfViewer
                                title={activeFile.title}
                                src={activeFile.path}
                                onClose={handleCloseFile}
                            />
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4"
                            >
                                <FileViewer
                                    filePath={activeFile.path}
                                    title={activeFile.title}
                                    fileType={activeFile.type}
                                    onClose={handleCloseFile}
                                />
                            </motion.div>
                        )}
                    </>
                )}

                {/* Three sections: Course PPT + Exercise + Videos (conditionally) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className={`flex flex-col gap-3 ${hasVideos ? 'lg:flex-row' : 'lg:flex-row'}`}
                >
                    {/* Videos Section - Conditionally Rendered */}
                    {hasVideos && (
                        <div className="lg:flex-1">
                            <VideoSectionCard
                                icon={<Video className="h-3.5 w-3.5" />}
                                title="Training Videos"
                                description="Instructional videos and demonstrations."
                                items={config.videos}
                                onOpen={handleOpenVideo}
                            />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}