import { useState } from 'react';
import type { AiProviderName } from '@/ai/types';

interface ApiKeyGuideProps {
  provider: AiProviderName;
  onClose: () => void;
}

type GuideTab = AiProviderName;

const PROVIDER_INFO: Record<GuideTab, { name: string; icon: string }> = {
  openai: { name: 'OpenAI', icon: '⚡' },
  deepseek: { name: 'DeepSeek', icon: '🔍' },
  ollama: { name: 'Ollama', icon: '🦙' },
};

export function ApiKeyGuide({ provider: initialProvider, onClose }: ApiKeyGuideProps) {
  const [tab, setTab] = useState<GuideTab>(initialProvider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            API Setup Guide
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          {(Object.keys(PROVIDER_INFO) as GuideTab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{PROVIDER_INFO[key].icon}</span>
              <span>{PROVIDER_INFO[key].name}</span>
            </button>
          ))}
        </div>

        {tab === 'openai' && <OpenAIGuide />}
        {tab === 'deepseek' && <DeepSeekGuide />}
        {tab === 'ollama' && <OllamaGuide />}
      </div>
    </div>
  );
}

function OpenAIGuide() {
  const steps = [
    { title: 'Create an account', description: 'Go to platform.openai.com and sign up for an account.' },
    { title: 'Navigate to API Dashboard', description: 'Click on the API section in the sidebar, then go to "API Keys".' },
    { title: 'Create a new API key', description: 'Click "Create new secret key", give it a name like "MyBudgetOS", and copy the key.' },
    { title: 'Copy the key', description: 'The key starts with "sk-". Copy it to your clipboard immediately — you won\'t be able to see it again.' },
    { title: 'Paste into MyBudgetOS', description: 'Paste the key into the API Key field below. Then click "Test Connection" to verify it works.' },
  ];

  return (
    <GuideContent
      steps={steps}
      linkUrl="https://platform.openai.com/api-keys"
      linkLabel="Open OpenAI API Dashboard"
      note="OpenAI requires a paid account with credits. New accounts receive $5 in free credits."
    />
  );
}

function DeepSeekGuide() {
  const steps = [
    { title: 'Create an account', description: 'Go to platform.deepseek.com and sign up.' },
    { title: 'Navigate to API Keys', description: 'Go to the API Keys section in your account dashboard.' },
    { title: 'Generate a new API key', description: 'Click "Create API Key", give it a name, and copy the generated key.' },
    { title: 'Copy the key', description: 'Save the key securely. You won\'t be able to view it again after closing the dialog.' },
    { title: 'Paste into MyBudgetOS', description: 'Paste the key into the API Key field below and click "Test Connection".' },
  ];

  return (
    <GuideContent
      steps={steps}
      linkUrl="https://platform.deepseek.com/api_keys"
      linkLabel="Open DeepSeek API Dashboard"
      note="DeepSeek offers competitive pricing — significantly cheaper than OpenAI for comparable performance."
    />
  );
}

function OllamaGuide() {
  const steps = [
    { title: 'Install Ollama', description: 'Download from ollama.com and install for your operating system.' },
    { title: 'Start the Ollama server', description: 'Run "ollama serve" in a terminal, or the Ollama app will run it automatically.' },
    { title: 'Download a model', description: 'Run "ollama pull llama3" (recommended) or "ollama pull llama2", "ollama pull mistral" in a terminal.' },
    { title: 'Verify the endpoint', description: 'Open http://localhost:11434 in your browser. You should see "Ollama is running".' },
    { title: 'Test the connection', description: 'Click "Test Connection" below to verify MyBudgetOS can reach your local Ollama server.' },
  ];

  return (
    <GuideContent
      steps={steps}
      linkUrl="https://ollama.com/download"
      linkLabel="View Ollama Setup Guide"
      note="Ollama runs entirely on your machine. No API key needed, no data sent to the cloud — completely free and private."
      noKey
    />
  );
}

interface GuideContentProps {
  steps: { title: string; description: string }[];
  linkUrl: string;
  linkLabel: string;
  note: string;
  noKey?: boolean;
}

function GuideContent({ steps, linkUrl, linkLabel, note, noKey }: GuideContentProps) {
  return (
    <div className="space-y-4">
      {!noKey && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <strong>No API key required for Ollama.</strong> Ollama runs 100% locally — setup is different. Switch to the Ollama tab above.
        </div>
      )}

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{step.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {linkLabel}
      </a>

      <p className="text-xs text-slate-400 dark:text-slate-500">{note}</p>
    </div>
  );
}
