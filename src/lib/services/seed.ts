import { v4 as uuid } from 'uuid';
import {
  createWorkspace,
  createFolder,
  createNote,
  createPrompt,
  createReminder,
  createSnippet,
  createCourse,
  getDb
} from '$lib/services/database';

export async function seedDatabase() {
  const db = await getDb();
  
  // Create default workspace
  const workspaceId = uuid();
  await createWorkspace({
    id: workspaceId,
    name: 'My Workspace',
    icon: 'ph:folder-bold',
    color: '#007AFF',
    sort_order: 0,
    is_default: 1
  });

  // Create folders
  const defaultFolderId = uuid();
  await createFolder({
    id: defaultFolderId,
    workspace_id: workspaceId,
    name: 'General',
    folder_type: 'general',
    sort_order: 0
  });

  const projectsFolderId = uuid();
  await createFolder({
    id: projectsFolderId,
    workspace_id: workspaceId,
    name: 'Projects',
    folder_type: 'general',
    sort_order: 1
  });

  // Create sample notes
  const notes = [
    {
      id: uuid(),
      folder_id: defaultFolderId,
      title: 'Welcome to DevVault',
      content_text: 'This is your first note. DevVault helps you organize your development knowledge, code snippets, and learning materials all in one place.',
      word_count: 23
    },
    {
      id: uuid(),
      folder_id: defaultFolderId,
      title: 'Getting Started Guide',
      content_text: 'DevVault features:\n\n1. Notes - Write and organize your thoughts\n2. Prompts - Save AI prompts for reuse\n3. Snippets - Store code snippets\n4. Courses - Track your learning progress\n5. Reminders - Never forget important tasks',
      word_count: 35
    },
    {
      id: uuid(),
      folder_id: projectsFolderId,
      title: 'Project Ideas',
      content_text: '- Build a personal portfolio website\n- Create a task management app\n- Develop a Chrome extension\n- Build a REST API with Node.js',
      word_count: 22
    }
  ];

  for (const note of notes) {
    await createNote(note);
  }

  // Create sample prompts
  const prompts = [
    {
      id: uuid(),
      title: 'Code Review Assistant',
      content: 'Review the following code and provide suggestions for improvement:\n\n{{code}}',
      category: 'coding' as const,
      language: 'markdown',
      variables: JSON.stringify(['code'])
    },
    {
      id: uuid(),
      title: 'Bug Fix Helper',
      content: 'Help me debug this {{language}} code. The error is: {{error}}\n\nCode:\n{{code}}',
      category: 'debugging' as const,
      language: 'markdown',
      variables: JSON.stringify(['language', 'error', 'code'])
    },
    {
      id: uuid(),
      title: 'Documentation Generator',
      content: 'Generate comprehensive documentation for this function:\n\n{{function}}',
      category: 'documentation' as const,
      language: 'markdown',
      variables: JSON.stringify(['function'])
    }
  ];

  for (const prompt of prompts) {
    await createPrompt(prompt);
  }

  // Create sample snippets
  const snippets = [
    {
      id: uuid(),
      title: 'React useState Hook',
      description: 'Basic useState hook example',
      code: 'const [count, setCount] = useState(0);',
      language: 'javascript',
      tags: JSON.stringify(['react', 'hooks', 'state'])
    },
    {
      id: uuid(),
      title: 'Async/Await Pattern',
      description: 'Async function with error handling',
      code: `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`,
      language: 'javascript',
      tags: JSON.stringify(['async', 'fetch', 'error-handling'])
    },
    {
      id: uuid(),
      title: 'Tailwind Flex Center',
      description: 'Center content with flexbox',
      code: '<div class="flex items-center justify-center h-screen">\n  <p>Centered content</p>\n</div>',
      language: 'html',
      tags: JSON.stringify(['tailwind', 'css', 'flexbox'])
    }
  ];

  for (const snippet of snippets) {
    await createSnippet(snippet);
  }

  // Create sample reminders
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const reminders = [
    {
      id: uuid(),
      title: 'Review DevVault features',
      description: 'Explore all the features and customize your workspace',
      due_date: tomorrow.toISOString(),
      priority: 'medium' as const,
      status: 'pending' as const,
      recurrence: 'none' as const
    },
    {
      id: uuid(),
      title: 'Complete React course module',
      description: 'Finish the hooks section',
      due_date: nextWeek.toISOString(),
      priority: 'high' as const,
      status: 'pending' as const,
      recurrence: 'none' as const
    }
  ];

  for (const reminder of reminders) {
    await createReminder(reminder);
  }

  // Create courses folder
  const coursesFolderId = uuid();
  await createFolder({
    id: coursesFolderId,
    workspace_id: workspaceId,
    name: 'Courses',
    folder_type: 'course',
    sort_order: 2
  });

  // Create sample courses
  const courses = [
    {
      id: uuid(),
      folder_id: coursesFolderId,
      name: 'Complete React Developer Course',
      instructor: 'Andrew Mead',
      platform: 'Udemy',
      url: 'https://udemy.com',
      description: 'Master React by building real-world applications',
      status: 'in_progress' as const,
    },
    {
      id: uuid(),
      folder_id: coursesFolderId,
      name: 'Node.js - The Complete Guide',
      instructor: 'Maximilian Schwarzmüller',
      platform: 'Udemy',
      url: 'https://udemy.com',
      description: 'Master Node.js, build REST APIs with Node.js, GraphQL APIs, add Authentication',
      status: 'in_progress' as const,
    }
  ];

  for (const course of courses) {
    await createCourse(course);
  }

  console.log('✅ Database seeded successfully!');
  return {
    workspaceId,
    foldersCreated: 2,
    notesCreated: notes.length,
    promptsCreated: prompts.length,
    snippetsCreated: snippets.length,
    remindersCreated: reminders.length,
    coursesCreated: courses.length
  };
}

export async function clearDatabase() {
  const db = await getDb();
  
  await db.execute('DELETE FROM activity');
  await db.execute('DELETE FROM course_lesson');
  await db.execute('DELETE FROM course_section');
  await db.execute('DELETE FROM course');
  await db.execute('DELETE FROM snippet');
  await db.execute('DELETE FROM reminder');
  await db.execute('DELETE FROM prompt');
  await db.execute('DELETE FROM note');
  await db.execute('DELETE FROM file');
  await db.execute('DELETE FROM folder');
  await db.execute('DELETE FROM workspace');
  
  console.log('✅ Database cleared!');
}
