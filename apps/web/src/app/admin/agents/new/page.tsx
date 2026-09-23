'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

const AGENT_TYPES = [
  { value: 'tutor', label: '导师' },
  { value: 'assistant', label: '助手' },
  { value: 'companion', label: '伙伴' },
  { value: 'evaluator', label: '评估者' },
  { value: 'custom', label: '自定义' },
];

const PERSONALITY_TRAITS = [
  { value: 'friendly', label: '友好' },
  { value: 'professional', label: '专业' },
  { value: 'humorous', label: '幽默' },
  { value: 'serious', label: '严肃' },
  { value: 'enthusiastic', label: '热情' },
  { value: 'calm', label: '冷静' },
  { value: 'creative', label: '富有创造力' },
  { value: 'logical', label: '逻辑性强' },
];

const TONE_OPTIONS = [
  { value: 'warm', label: '温暖' },
  { value: 'neutral', label: '中性' },
  { value: 'formal', label: '正式' },
  { value: 'casual', label: '随意' },
  { value: 'encouraging', label: '鼓励性' },
  { value: 'directive', label: '指导性' },
];

const SKILL_OPTIONS = [
  { value: 'math', label: '数学' },
  { value: 'science', label: '科学' },
  { value: 'language', label: '语言' },
  { value: 'programming', label: '编程' },
  { value: 'art', label: '艺术' },
  { value: 'music', label: '音乐' },
  { value: 'sports', label: '体育' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'literature', label: '文学' },
];

const KNOWLEDGE_DOMAINS = [
  { value: 'stem', label: 'STEM' },
  { value: 'humanities', label: '人文学科' },
  { value: 'arts', label: '艺术' },
  { value: 'social', label: '社会科学' },
  { value: 'business', label: '商业' },
  { value: 'health', label: '健康' },
];

const BODY_TYPES = [
  { value: 'slim', label: '苗条' },
  { value: 'average', label: '标准' },
  { value: 'athletic', label: '健壮' },
  { value: 'round', label: '圆润' },
];

const HEAD_SHAPES = [
  { value: 'round', label: '圆形' },
  { value: 'oval', label: '椭圆' },
  { value: 'square', label: '方形' },
  { value: 'heart', label: '心形' },
];

const BEHAVIOR_MODES = [
  { value: 'proactive', label: '主动' },
  { value: 'reactive', label: '被动' },
  { value: 'balanced', label: '平衡' },
];

const RESPONSE_STYLES = [
  { value: 'concise', label: '简洁' },
  { value: 'detailed', label: '详细' },
  { value: 'socratic', label: '苏格拉底式' },
  { value: 'storytelling', label: '故事化' },
];

const INTERACTION_FREQUENCIES = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

const HINT_FREQUENCIES = [
  { value: 'never', label: '从不' },
  { value: 'on request', label: '仅在请求时' },
  { value: 'occasional', label: '偶尔' },
  { value: 'frequent', label: '频繁' },
];

const FEEDBACK_STYLES = [
  { value: 'positive', label: '积极' },
  { value: 'constructive', label: '建设性' },
  { value: 'direct', label: '直接' },
  { value: 'gentle', label: '温和' },
];

const LLM_PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google' },
  { value: 'azure', label: 'Azure' },
  { value: 'local', label: '本地部署' },
  { value: 'custom', label: '自定义' },
];

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'custom', label: '自定义' },
];

const AVATAR_TEMPLATES = [
  { id: 'template1', name: '经典', bodyType: 'average', bodyColor: '#4F46E5', headShape: 'round' },
  { id: 'template2', name: '活力', bodyType: 'athletic', bodyColor: '#10B981', headShape: 'oval' },
  { id: 'template3', name: '专业', bodyType: 'slim', bodyColor: '#6366F1', headShape: 'square' },
  { id: 'template4', name: '创意', bodyType: 'average', bodyColor: '#EC4899', headShape: 'heart' },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Basic info
  const [name, setName] = useState('');
  const [agentType, setAgentType] = useState('');
  const [description, setDescription] = useState('');

  // Personality
  const [personalityTraits, setPersonalityTraits] = useState([]);
  const [tone, setTone] = useState('warm');
  const [formality, setFormality] = useState(50);
  const [empathy, setEmpathy] = useState(50);
  const [patience, setPatience] = useState(50);
  const [greetingMessage, setGreetingMessage] = useState('');

  // Skills
  const [skills, setSkills] = useState([]);
  const [customSkills, setCustomSkills] = useState([]);
  const [knowledgeDomains, setKnowledgeDomains] = useState([]);
  const [specialtyAreas, setSpecialtyAreas] = useState('');

  // Appearance
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [bodyType, setBodyType] = useState('average');
  const [headShape, setHeadShape] = useState('round');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [accessories, setAccessories] = useState([]);

  // Behavior
  const [behaviorMode, setBehaviorMode] = useState('balanced');
  const [responseStyle, setResponseStyle] = useState('concise');
  const [interactionFrequency, setInteractionFrequency] = useState('medium');
  const [autoGreeting, setAutoGreeting] = useState(true);
  const [hintFrequency, setHintFrequency] = useState('on request');
  const [feedbackStyle, setFeedbackStyle] = useState('constructive');

  // LLM Config
  const [llmProvider, setLlmProvider] = useState('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [customModel, setCustomModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [contextLength, setContextLength] = useState(8192);

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = '名称不能为空';
    if (!agentType) newErrors.agentType = '类型不能为空';
    if (apiKey && !apiKey.startsWith('sk-') && !apiKey.startsWith('key-') && !apiKey.startsWith('AI')) {
      newErrors.apiKey = '无效的 API Key 格式';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const payload = {
        agentType, name, description,
        personality: { traits: personalityTraits, tone, formality, empathy, patience, greetingMessage },
        skills: { skills: [...skills, ...customSkills], knowledgeDomains, specialtyAreas },
        appearance: { bodyType, headShape, primaryColor, accessories, template: selectedTemplate },
        behavior: { behaviorMode, responseStyle, interactionFrequency, autoGreeting, hintFrequency, feedbackStyle },
        llmConfig: { provider: llmProvider, apiKey: apiKey || undefined, baseUrl: baseUrl || undefined, model: model === 'custom' ? customModel : model, temperature, maxTokens, contextLength },
      };
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建失败');
      }
      router.push('/admin/agents?created=true');
    } catch (error: any) {
      setErrors({ submit: error?.message || '创建失败' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skill) => setSkills(skills.includes(skill) ? skills.filter(s => s !== skill) : [...skills, skill]);
  const togglePersonalityTrait = (trait) => setPersonalityTraits(personalityTraits.includes(trait) ? personalityTraits.filter(t => t !== trait) : [...personalityTraits, trait]);
  const toggleKnowledgeDomain = (domain) => setKnowledgeDomains(knowledgeDomains.includes(domain) ? knowledgeDomains.filter(d => d !== domain) : [...knowledgeDomains, domain]);
  const selectTemplate = (tpl) => { setSelectedTemplate(tpl.id); setBodyType(tpl.bodyType); setPrimaryColor(tpl.bodyColor); setHeadShape(tpl.headShape); };

  return (
    <AdminLayout>
      <div data-testid="agent-form" className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/agents" className="text-indigo-600 hover:text-indigo-800">← 返回智能体管理</Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建智能体</h1>
          <p className="text-gray-600 mt-2">配置新的 AI 助手</p>
        </div>

        {errors.submit && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{errors.submit}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div data-testid="agent-basic-info" className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">基本信息</h2>
            <div className="space-y-4">
              <Input label="智能体名称" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入智能体名称" error={errors.name} required />
              <div>
                <label htmlFor="agentType" className="block text-sm font-medium text-gray-700 mb-1">智能体类型</label>
                <select id="agentType" value={agentType} onChange={(e) => setAgentType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                  <option value="">请选择类型</option>
                  {AGENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {errors.agentType && <p className="mt-1 text-sm text-red-600">{errors.agentType}</p>}
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">智能体描述</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述智能体的用途和特点" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Personality */}
          <div data-testid="agent-personality" className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">人格特征</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">性格特征</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PERSONALITY_TRAITS.map((trait) => (
                    <label key={trait.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={personalityTraits.includes(trait.value)} onChange={() => togglePersonalityTrait(trait.value)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">{trait.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">语气</label>
                  <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {TONE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">正式程度</label>
                  <input type="range" id="formality" min="0" max="100" value={formality} onChange={(e) => setFormality(Number(e.target.value))} className="w-full" aria-label="正式程度" />
                  <span className="text-sm text-gray-500">{formality}</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">同理心</label>
                  <input type="range" id="empathy" min="0" max="100" value={empathy} onChange={(e) => setEmpathy(Number(e.target.value))} className="w-full" aria-label="同理心" />
                  <span className="text-sm text-gray-500">{empathy}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">耐心</label>
                  <input type="range" id="patience" min="0" max="100" value={patience} onChange={(e) => setPatience(Number(e.target.value))} className="w-full" aria-label="耐心" />
                  <span className="text-sm text-gray-500">{patience}</span>
                </div>
              </div>
              <div>
                <label htmlFor="greetingMessage" className="block text-sm font-medium text-gray-700 mb-1">问候语</label>
                <input id="greetingMessage" type="text" value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="你好！我是你的 AI 助手" />
              </div>
              <Button type="button" variant="secondary">预览</Button>
            </div>
          </div>

          {/* Skills */}
          <div data-testid="agent-skills" className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">技能配置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">技能</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2" role="group" aria-label="技能">
                  {SKILL_OPTIONS.map((skill) => (
                    <label key={skill.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" data-testid="skill-checkbox" checked={skills.includes(skill.value)} onChange={() => toggleSkill(skill.value)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">{skill.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={() => { const s = prompt('技能名称:'); if(s) setCustomSkills([...customSkills, s]); }}>添加技能</Button>
              {skills.length > 0 && (
                <div className="space-y-2">
                  {skills.map((s) => (
                    <div key={s}>
                      <label className="text-sm text-gray-700">{s} 水平</label>
                      <input type="range" data-testid="skill-level-slider" min="1" max="5" defaultValue="3" className="w-full" />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">知识领域</label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="知识领域">
                  {KNOWLEDGE_DOMAINS.map((d) => (
                    <label key={d.value} className="flex items-center gap-2">
                      <input type="checkbox" checked={knowledgeDomains.includes(d.value)} onChange={() => toggleKnowledgeDomain(d.value)} className="rounded border-gray-300 text-indigo-600" />
                      <span className="text-sm text-gray-700">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="specialtyAreas" className="block text-sm font-medium text-gray-700 mb-1">专长领域</label>
                <input id="specialtyAreas" type="text" value={specialtyAreas} onChange={(e) => setSpecialtyAreas(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="例如：初中数学、高中物理" />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div data-testid="agent-appearance" className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">外观自定义</h2>
            <div className="space-y-4">
              <div data-testid="avatar-templates">
                <label className="block text-sm font-medium text-gray-700 mb-2">头像模板</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {AVATAR_TEMPLATES.map((tpl) => (
                    <button key={tpl.id} type="button" onClick={() => selectTemplate(tpl)} className={selectedTemplate === tpl.id ? 'p-4 border-2 rounded-lg text-center border-indigo-500 bg-indigo-50' : 'p-4 border-2 rounded-lg text-center border-gray-200'}>
                      <div className="text-3xl mb-2">🤖</div>
                      <div className="text-sm font-medium">{tpl.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体型</label>
                  <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {BODY_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">头型</label>
                  <select value={headShape} onChange={(e) => setHeadShape(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {HEAD_SHAPES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主色调</label>
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-20 h-10" />
              </div>
              <div data-testid="avatar-preview" className="bg-gray-100 rounded-lg p-8 text-center">
                <div className="text-6xl">🤖</div>
                <p className="text-sm text-gray-500 mt-2">预览：{bodyType} / {headShape} / {primaryColor}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传自定义头像</label>
                <input type="file" accept="image/*" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div data-testid="agent-behavior" className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">行为模式</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行为模式</label>
                <select value={behaviorMode} onChange={(e) => setBehaviorMode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {BEHAVIOR_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">回复风格</label>
                <div className="space-y-2">
                  {RESPONSE_STYLES.map((s) => (
                    <label key={s.value} className="flex items-center gap-2">
                      <input type="radio" name="responseStyle" checked={responseStyle === s.value} onChange={() => setResponseStyle(s.value)} className="text-indigo-600" />
                      <span className="text-sm text-gray-700">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">互动频率</label>
                <select value={interactionFrequency} onChange={(e) => setInteractionFrequency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {INTERACTION_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={autoGreeting} onChange={(e) => setAutoGreeting(e.target.checked)} className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">自动问候</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">提示频率</label>
                <select value={hintFrequency} onChange={(e) => setHintFrequency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {HINT_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">反馈风格</label>
                <div className="space-y-2">
                  {FEEDBACK_STYLES.map((s) => (
                    <label key={s.value} className="flex items-center gap-2">
                      <input type="radio" name="feedbackStyle" checked={feedbackStyle === s.value} onChange={() => setFeedbackStyle(s.value)} className="text-indigo-600" />
                      <span className="text-sm text-gray-700">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LLM Config */}
          <div data-testid="agent-llm-config" className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">LLM 服务配置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LLM 提供商</label>
                <select value={llmProvider} onChange={(e) => setLlmProvider(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {LLM_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="flex gap-2">
                  <input type={showApiKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="sk-..." />
                  <Button type="button" variant="outline" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? '隐藏' : '显示'}</Button>
                </div>
                {errors.apiKey && <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://api.example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模型</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {MODEL_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {model === 'custom' && <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)} className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="输入自定义模型" />}
              </div>
              <Button type="button" variant="outline">测试连接</Button>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">温度 (Temperature)</label>
                <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full" />
                <span className="text-sm text-gray-500">{temperature}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大 Token</label>
                <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上下文长度</label>
                <input type="number" value={contextLength} onChange={(e) => setContextLength(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pb-8">
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>创建智能体</Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => router.push('/admin/agents')}>取消</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
