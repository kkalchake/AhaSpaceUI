import React from 'react';
import { Link } from 'react-router-dom';
import './AgenticLearning.css';

/*
 * Static, unauthenticated resource page for task 9 - no fetches, no context,
 * no props, no API surface at all. RESOURCE_GROUPS is module-level (not
 * component state) because this list is fixed content, not data the app
 * ever mutates or reloads.
 *
 * Every item's label is a real title, not the raw URL: Reading labels are
 * human-readable names derived from the source page; Watching titles came
 * from each video's YouTube oEmbed response (title + channel, via
 * `curl https://www.youtube.com/oembed?url=...&format=json`); Code Reference
 * titles/summaries came from each repo's GitHub API `description` field
 * (`curl https://api.github.com/repos/<owner>/<repo>`). Both were fetched
 * once while building this page, not at runtime - this stays a fully static
 * page with zero fetches.
 */
const RESOURCE_GROUPS = [
  {
    heading: 'Reading',
    items: [
      {
        label: 'Google Cloud — Choose a design pattern for an agentic AI system',
        url: 'https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system'
      },
      {
        label: 'Google Cloud — Choose agentic AI architecture components',
        url: 'https://docs.cloud.google.com/architecture/choose-agentic-ai-architecture-components'
      },
      {
        label: 'Google Cloud — What is agentic AI?',
        url: 'https://cloud.google.com/discover/what-is-agentic-ai'
      },
      {
        label: 'IBM Developer — Multi-agent orchestration with watsonx Orchestrate',
        url: 'https://developer.ibm.com/articles/multi-agent-orchestration-watsonx-orchestrate/'
      },
      {
        label: 'Microsoft Learn — Multi-agent patterns in Copilot Studio',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/multi-agent-patterns'
      }
    ]
  },
  {
    heading: 'Watching',
    items: [
      {
        label: '20 AI Concepts Explained in 40 Minutes',
        meta: 'Gaurav Sen',
        url: 'https://www.youtube.com/watch?v=OYvlznJ4IZQ'
      },
      {
        label: 'Agentic AI Architecture: RAG, Tools, and Multi-Agent Orchestration',
        meta: 'Kong',
        url: 'https://www.youtube.com/watch?v=hH6AlfbnWWA'
      },
      {
        label: 'AGENTIC WORKFLOWS: Build & Sell AI Automations (2026)',
        meta: 'Nick Saraev',
        url: 'https://www.youtube.com/watch?v=MxyRjL7NG18'
      },
      {
        label: '5 Multi-Agent Orchestration Patterns You MUST Know in 2025!',
        meta: 'AI Anytime',
        url: 'https://www.youtube.com/watch?v=l_i7icCA56c'
      }
    ]
  },
  {
    heading: 'Code Reference',
    items: [
      {
        label: 'moazbuilds/CodeMachine-CLI',
        meta: 'Orchestrates AI coding agents into repeatable, long-running workflows.',
        url: 'https://github.com/moazbuilds/CodeMachine-CLI'
      },
      {
        label: 'bmad-code-org/BMAD-METHOD',
        meta: 'Breakthrough Method for Agile Ai Driven Development.',
        url: 'https://github.com/bmad-code-org/BMAD-METHOD'
      },
      {
        label: 'ruvnet/ruflo',
        meta: 'Agent meta-harness for deploying multi-agent swarms and coordinating autonomous workflows.',
        url: 'https://github.com/ruvnet/ruflo'
      },
      {
        label: 'kyegomez/swarms',
        meta: 'Enterprise-grade multi-agent orchestration framework.',
        url: 'https://github.com/kyegomez/swarms'
      },
      {
        label: 'github/spec-kit',
        meta: 'Toolkit to help you get started with Spec-Driven Development.',
        url: 'https://github.com/github/spec-kit'
      },
      {
        label: 'Fission-AI/OpenSpec',
        meta: 'Spec-driven development (SDD) for AI coding assistants.',
        url: 'https://github.com/Fission-AI/OpenSpec/'
      }
    ]
  }
];

export default function AgenticLearning() {
  return (
    <div className="agentic-page course-page">
      <nav className="course-page-nav" aria-label="Page navigation">
        <Link to="/courses">← Back to courses</Link>
        <Link to="/">Main page</Link>
      </nav>

      <h1>AI Agentic: Self Learning</h1>
      {RESOURCE_GROUPS.map((group) => (
        <section className="agentic-group" key={group.heading}>
          <h2>{group.heading}</h2>
          <ul className="agentic-list">
            {group.items.map((item) => (
              <li key={item.url}>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
                {item.meta && <p className="agentic-meta">{item.meta}</p>}
                <p className="agentic-url">{item.url}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
