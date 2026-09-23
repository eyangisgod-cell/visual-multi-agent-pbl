'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  agentType?: string;
  expectedOutput?: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  points: number;
}

interface Student {
  id: string;
  name: string;
  grade?: number;
}

// Mock students data
const MOCK_STUDENTS: Student[] = [
  { id: '1', name: '张三', grade: 7 },
  { id: '2', name: '李四', grade: 7 },
  { id: '3', name: '王五', grade: 8 },
  { id: '4', name: '赵六', grade: 8 },
  { id: '5', name: '钱七', grade: 9 },
];

const SUBJECT_OPTIONS = [
  { value: 'math', label: '数学' },
  { value: 'science', label: '科学' },
  { value: 'language', label: '语言' },
  { value: 'history', label: '历史' },
  { value: 'art', label: '艺术' },
  { value: 'technology', label: '技术' },
  { value: 'other', label: '其他' },
];

const GRADE_OPTIONS = [
  { value: '6', label: '六年级' },
  { value: '7', label: '七年级' },
  { value: '8', label: '八年级' },
  { value: '9', label: '九年级' },
  { value: '10', label: '十年级' },
  { value: '11', label: '十一年级' },
  { value: '12', label: '十二年级' },
];

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '★ 简单' },
  { value: '2', label: '★★ 中等' },
  { value: '3', label: '★★★ 困难' },
  { value: '4', label: '★★★★ 挑战' },
  { value: '5', label: '★★★★★ 专家' },
];

export default function NewProjectPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gradeMin: 6,
    gradeMax: 8,
    subject: '',
    difficulty: 1,
    estimatedTime: '',
    tags: [] as string[],
    coverImageUrl: '',
  });

  // Set page title
  if (typeof document !== 'undefined') {
    document.title = '创建新项目 - 可视项目式学习平台';
  }

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Rubric criteria state
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionDescription, setNewCriterionDescription] = useState('');
  const [newCriterionPoints, setNewCriterionPoints] = useState(10);

  // Student assignment state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Generate unique ID
  const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  // Add tag
  const addTag = useCallback((tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      handleInputChange('tags', [...formData.tags, tag.trim()]);
    }
  }, [formData.tags, handleInputChange]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, handleInputChange]);

  // Add task
  const addTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle,
      description: newTaskDescription,
      orderIndex: tasks.length,
      agentType: 'guide',
      expectedOutput: '',
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskDescription('');
  }, [newTaskTitle, newTaskDescription, tasks.length]);

  // Delete task
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // Move task up
  const moveTaskUp = useCallback((index: number) => {
    if (index === 0) return;
    setTasks(prev => {
      const newTasks = [...prev];
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
      return newTasks.map((task, i) => ({ ...task, orderIndex: i }));
    });
  }, []);

  // Move task down
  const moveTaskDown = useCallback((index: number) => {
    if (index === tasks.length - 1) return;
    setTasks(prev => {
      const newTasks = [...prev];
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      return newTasks.map((task, i) => ({ ...task, orderIndex: i }));
    });
  }, [tasks.length]);

  // Add rubric criterion
  const addRubricCriterion = useCallback(() => {
    if (!newCriterionName.trim()) return;

    const newCriterion: RubricCriterion = {
      id: generateId(),
      name: newCriterionName,
      description: newCriterionDescription,
      points: newCriterionPoints,
    };

    setRubricCriteria(prev => [...prev, newCriterion]);
    setNewCriterionName('');
    setNewCriterionDescription('');
    setNewCriterionPoints(10);
  }, [newCriterionName, newCriterionDescription, newCriterionPoints]);

  // Delete rubric criterion
  const deleteRubricCriterion = useCallback((criterionId: string) => {
    setRubricCriteria(prev => prev.filter(criterion => criterion.id !== criterionId));
  }, []);

  // Toggle student selection
  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  // Filter students by search
  const filteredStudents = MOCK_STUDENTS.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = '标题不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rubricCriteria,
          tasks: tasks.map((task, index) => ({
            ...task,
            orderIndex: index,
          })),
          assignedStudents: selectedStudents,
        }),
      });

      if (response.ok) {
        setShowSuccessMessage(true);
        setTimeout(() => {
          router.push('/admin/projects');
        }, 1500);
      } else {
        const error = await response.json();
        setFormErrors({ submit: error.error || '创建项目失败' });
      }
    } catch (error) {
      setFormErrors({ submit: '网络错误，请稍后重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key press for tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      addTag(input.value);
      input.value = '';
    }
  };

  return (
    <AdminLayout>
      <div className="pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="/admin/projects"
              className="text-indigo-600 hover:text-indigo-800 text-lg"
              data-testid="back-link"
            >
              ← 返回项目
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建新项目</h1>
          <p className="text-gray-600 mt-2">设计新的项目式学习任务</p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div
            data-testid="success-message"
            className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg"
          >
            项目创建成功！正在跳转...
          </div>
        )}

        {/* Error Message */}
        {formErrors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {formErrors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="project-form">
          <div className="space-y-6">
            {/* Project Information Section */}
            <section
              className="bg-white rounded-xl shadow-md p-6"
              data-testid="project-info-section"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">项目基本信息</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    项目标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      formErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="输入项目标题"
                    data-testid="project-title-input"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    项目描述
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="描述项目内容和目标"
                    rows={4}
                    data-testid="project-description-input"
                  />
                </div>

                {/* Grade Range */}
                <div>
                  <label htmlFor="gradeMin" className="block text-sm font-medium text-gray-700 mb-2">
                    最低年级
                  </label>
                  <select
                    id="gradeMin"
                    value={formData.gradeMin}
                    onChange={(e) => handleInputChange('gradeMin', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    data-testid="grade-min-select"
                  >
                    {GRADE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="gradeMax" className="block text-sm font-medium text-gray-700 mb-2">
                    最高年级
                  </label>
                  <select
                    id="gradeMax"
                    value={formData.gradeMax}
                    onChange={(e) => handleInputChange('gradeMax', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    data-testid="grade-max-select"
                  >
                    {GRADE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    学科 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      formErrors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-testid="subject-select"
                  >
                    <option value="">选择学科</option>
                    {SUBJECT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.subject && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.subject}</p>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    难度
                  </label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    data-testid="difficulty-select"
                  >
                    {DIFFICULTY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Time */}
                <div>
                  <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-2">
                    预计时间（分钟）
                  </label>
                  <input
                    type="number"
                    id="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="60"
                    min="0"
                    data-testid="estimated-time-input"
                  />
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    id="tags"
                    onKeyDown={handleTagKeyDown}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="输入标签后按回车添加"
                    data-testid="tags-input"
                  />
                </div>

                {/* Cover Image */}
                <div className="md:col-span-2">
                  <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
                    封面图片
                  </label>
                  <input
                    type="url"
                    id="coverImage"
                    value={formData.coverImageUrl}
                    onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="输入封面图片 URL"
                    data-testid="cover-image-input"
                  />
                </div>
              </div>
            </section>

            {/* Tasks Editor Section */}
            <section
              className="bg-white rounded-xl shadow-md p-6"
              data-testid="tasks-editor-section"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">任务设计</h2>

              {/* Add Task Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="任务标题"
                    data-testid="new-task-title-input"
                  />
                  <input
                    type="text"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="任务描述"
                    data-testid="new-task-description-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTask}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  data-testid="add-task-button"
                >
                  + 添加任务
                </button>
              </div>

              {/* Tasks List */}
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      data-testid={`task-item-${index}`}
                    >
                      <span className="text-sm font-medium text-gray-500 w-8">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor={`task-order-${index}`} className="text-sm text-gray-600">顺序:</label>
                        <input
                          type="number"
                          id={`task-order-${index}`}
                          value={index + 1}
                          readOnly
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                          data-testid={`task-order-${index}`}
                          aria-label={`顺序`}
                        />
                        <button
                          type="button"
                          onClick={() => moveTaskUp(index)}
                          disabled={index === 0}
                          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`task-move-up-${index}`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTaskDown(index)}
                          disabled={index === tasks.length - 1}
                          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`task-move-down-${index}`}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="px-3 py-1 text-sm text-red-500 border border-red-200 rounded hover:bg-red-50 hover:text-red-700"
                          data-testid={`task-delete-${index}`}
                          role="button"
                          aria-label="删除任务"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  暂无任务，点击上方按钮添加任务
                </p>
              )}
            </section>

            {/* Student Assignment Section */}
            <section
              className="bg-white rounded-xl shadow-md p-6"
              data-testid="student-assignment-section"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">学生分配</h2>

              {/* Search */}
              <div className="mb-4">
                <label htmlFor="studentSearch" className="block text-sm font-medium text-gray-700 mb-2">
                  搜索学生
                </label>
                <input
                  type="text"
                  id="studentSearch"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="输入学生姓名搜索"
                  data-testid="student-search-input"
                />
              </div>

              {/* Student List */}
              <div
                className="mb-4 border border-gray-200 rounded-lg max-h-64 overflow-y-auto"
                data-testid="student-list"
              >
                {filteredStudents.map(student => (
                  <label
                    key={student.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      data-testid="student-checkbox"
                    />
                    <span className="flex-1 text-gray-900">{student.name}</span>
                    <span className="text-sm text-gray-500">{student.grade}年级</span>
                  </label>
                ))}
              </div>

              {/* Selected Count */}
              <div
                className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg"
                data-testid="selected-count"
              >
                <span className="text-indigo-800">
                  已选择 {selectedStudents.length} 名学生
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStudents([])}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                  disabled={selectedStudents.length === 0}
                >
                  清空选择
                </button>
              </div>

              {/* Assign Button */}
              <div className="mt-4">
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  data-testid="assign-students-button"
                >
                  分配学生到项目
                </button>
              </div>
            </section>

            {/* Assessment Criteria Section */}
            <section
              className="bg-white rounded-xl shadow-md p-6"
              data-testid="assessment-section"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">评估标准</h2>

              {/* Add Criterion Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={newCriterionName}
                    onChange={(e) => setNewCriterionName(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="评估标准名称"
                    data-testid="new-criterion-name-input"
                  />
                  <input
                    type="text"
                    value={newCriterionDescription}
                    onChange={(e) => setNewCriterionDescription(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="评估标准描述"
                    data-testid="new-criterion-description-input"
                  />
                  <div className="flex items-center gap-2">
                    <label htmlFor="criterion-points" className="text-sm text-gray-700">分值:</label>
                    <input
                      type="number"
                      id="criterion-points"
                      value={newCriterionPoints}
                      onChange={(e) => setNewCriterionPoints(parseInt(e.target.value))}
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="1"
                      max="100"
                      data-testid="new-criterion-points-input"
                      aria-label="分值"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addRubricCriterion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  data-testid="add-criteria-button"
                >
                  + 添加评估标准
                </button>
              </div>

              {/* Criteria List */}
              {rubricCriteria.length > 0 ? (
                <div className="space-y-3">
                  {rubricCriteria.map((criterion, index) => (
                    <div
                      key={criterion.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      data-testid={`criterion-item-${index}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="font-medium text-gray-900">{criterion.name}</h3>
                          <span className="text-sm text-indigo-600 font-medium">
                            {criterion.points} 分
                          </span>
                        </div>
                        {criterion.description && (
                          <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteRubricCriterion(criterion.id)}
                        className="px-3 py-1 text-sm text-red-500 border border-red-200 rounded hover:bg-red-50 hover:text-red-700"
                        data-testid={`criterion-delete-${index}`}
                        role="button"
                        aria-label="删除评估标准"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  暂无评估标准，点击上方按钮添加
                </p>
              )}
            </section>

            {/* Project Statistics Section */}
            <section
              className="bg-white rounded-xl shadow-md p-6"
              data-testid="project-stats-section"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">项目统计预览</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                  <div
                    className="text-2xl font-bold text-indigo-600"
                    data-testid="task-count"
                  >
                    {tasks.length}
                  </div>
                  <div className="text-sm text-indigo-800">任务数</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div
                    className="text-2xl font-bold text-green-600"
                    data-testid="total-time"
                  >
                    {formData.estimatedTime || 0}
                  </div>
                  <div className="text-sm text-green-800">预计分钟</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {rubricCriteria.reduce((sum, c) => sum + c.points, 0)}
                  </div>
                  <div className="text-sm text-purple-800">评估总分</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedStudents.length}
                  </div>
                  <div className="text-sm text-orange-800">已选学生</div>
                </div>
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href="/admin/projects"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-block text-center"
                data-testid="cancel-button"
                role="button"
              >
                取消
              </Link>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid="save-draft-button"
              >
                保存草稿
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="submit-button"
              >
                {isSubmitting ? '创建中...' : '创建项目'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
