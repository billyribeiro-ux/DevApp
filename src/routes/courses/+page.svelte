<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getCourses, createCourse, updateCourse, deleteCourse } from '$services/database';
	import { COURSE_PLATFORMS } from '$config/constants';
	import { getStatusColor } from '$utils/formatters';
	import type { Course } from '$types';
	import { v4 as uuid } from 'uuid';

	let courses = $state<Course[]>([]);
	let activeFilter = $state('all');
	let showForm = $state(false);
	let editingCourse = $state<Course | null>(null);

	let cName = $state('');
	let cInstructor = $state('');
	let cPlatform = $state('');
	let cUrl = $state('');
	let cDescription = $state('');

	let filteredCourses = $derived(() => {
		if (activeFilter === 'all') return courses;
		return courses.filter(c => c.status === activeFilter);
	});

	function startEdit(course?: Course) {
		if (course) {
			editingCourse = course;
			cName = course.name;
			cInstructor = course.instructor ?? '';
			cPlatform = course.platform ?? '';
			cUrl = course.url ?? '';
			cDescription = course.description ?? '';
		} else {
			editingCourse = null;
			cName = '';
			cInstructor = '';
			cPlatform = '';
			cUrl = '';
			cDescription = '';
		}
		showForm = true;
	}

	async function handleSave() {
		if (!cName.trim()) { toasts.warning('Course name is required'); return; }
		if (editingCourse) {
			await updateCourse(editingCourse.id, { name: cName, instructor: cInstructor || null, platform: cPlatform || null, url: cUrl || null, description: cDescription || null });
		} else {
			await createCourse({ id: uuid(), folder_id: 'courses', name: cName, instructor: cInstructor || null, platform: cPlatform || null, url: cUrl || null, description: cDescription || null });
		}
		courses = await getCourses();
		showForm = false;
		toasts.success(editingCourse ? 'Course Updated' : 'Course Created');
	}

	async function toggleStatus(course: Course) {
		const statuses: Course['status'][] = ['not_started', 'in_progress', 'completed', 'paused'];
		const idx = statuses.indexOf(course.status);
		const next = statuses[(idx + 1) % statuses.length];
		await updateCourse(course.id, { status: next });
		courses = await getCourses();
	}

	async function handleDelete(id: string) {
		await deleteCourse(id);
		courses = await getCourses();
		toasts.success('Course Deleted');
	}

	onMount(async () => {
		nav.navigate('/courses');
		courses = await getCourses();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="flex items-center justify-between px-6 py-4 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:graduation-cap-bold" width={22} height={22} style="color: #14b8a6;" />
			<h1 class="text-lg font-bold" style="color: var(--text-primary);">Courses</h1>
			<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" style="background: rgba(20, 184, 166, 0.1); color: #14b8a6;">{courses.length}</span>
		</div>
		<button onclick={() => startEdit()} class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white" style="background: var(--color-primary-600);">
			<Icon icon="ph:plus-bold" width={14} height={14} /> New Course
		</button>
	</div>

	<div class="flex items-center gap-1 px-6 py-2 border-b shrink-0" style="border-color: var(--border-default);">
		{#each [{ v: 'all', l: 'All' }, { v: 'not_started', l: 'Not Started' }, { v: 'in_progress', l: 'In Progress' }, { v: 'completed', l: 'Completed' }, { v: 'paused', l: 'Paused' }] as f}
			<button onclick={() => { activeFilter = f.v; }} class="rounded-full px-3 py-1 text-xs font-medium transition-colors" style="background: {activeFilter === f.v ? 'var(--bg-active)' : 'transparent'}; color: {activeFilter === f.v ? 'var(--text-accent)' : 'var(--text-secondary)'};">
				{f.l}
			</button>
		{/each}
	</div>

	<div class="flex-1 overflow-y-auto px-6 py-4">
		{#if showForm}
			<div class="max-w-lg mx-auto animate-slide-up">
				<div class="rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border-default);">
					<h3 class="text-sm font-semibold" style="color: var(--text-primary);">{editingCourse ? 'Edit Course' : 'New Course'}</h3>
					<input type="text" bind:value={cName} placeholder="Course name..." class="w-full rounded-lg border px-3 py-2 text-sm outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
					<input type="text" bind:value={cInstructor} placeholder="Instructor..." class="w-full rounded-lg border px-3 py-2 text-sm outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
					<div class="grid grid-cols-2 gap-3">
						<select bind:value={cPlatform} class="rounded-lg border px-3 py-2 text-xs" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);">
							<option value="">Select platform</option>
							{#each COURSE_PLATFORMS as p}
								<option value={p}>{p}</option>
							{/each}
						</select>
						<input type="url" bind:value={cUrl} placeholder="Course URL..." class="rounded-lg border px-3 py-2 text-xs outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
					</div>
					<textarea bind:value={cDescription} placeholder="Description..." rows={3} class="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);"></textarea>
					<div class="flex justify-end gap-2">
						<button onclick={() => { showForm = false; }} class="rounded-lg px-4 py-2 text-xs" style="color: var(--text-secondary);">Cancel</button>
						<button onclick={handleSave} class="rounded-lg px-4 py-2 text-xs font-medium text-white" style="background: var(--color-primary-600);">Save</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{#each filteredCourses() as course (course.id)}
					<div class="rounded-xl border p-5 transition-all duration-150 hover:shadow-md" style="background: var(--bg-card); border-color: var(--border-default);">
						<div class="flex items-start justify-between mb-3">
							<div>
								<h3 class="text-sm font-semibold" style="color: var(--text-primary);">{course.name}</h3>
								{#if course.instructor}
									<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">by {course.instructor}</p>
								{/if}
							</div>
							<button onclick={() => toggleStatus(course)} class="rounded-full px-2 py-0.5 text-[10px] font-semibold" style="background: {getStatusColor(course.status)}20; color: {getStatusColor(course.status)};">
								{course.status.replace('_', ' ')}
							</button>
						</div>
						{#if course.platform}
							<span class="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium mb-3" style="background: var(--bg-surface-raised); color: var(--text-secondary);">{course.platform}</span>
						{/if}
						{#if course.description}
							<p class="text-xs mb-3 line-clamp-2" style="color: var(--text-secondary);">{course.description}</p>
						{/if}
						<!-- Progress bar -->
						<div class="mb-3">
							<div class="flex items-center justify-between mb-1">
								<span class="text-[10px]" style="color: var(--text-tertiary);">Progress</span>
								<span class="text-[10px] font-semibold" style="color: var(--text-primary);">{course.progress_percent}%</span>
							</div>
							<div class="h-1.5 rounded-full overflow-hidden" style="background: var(--bg-surface-raised);">
								<div class="h-full rounded-full transition-all duration-300" style="width: {course.progress_percent}%; background: {getStatusColor(course.status)};"></div>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-[10px]" style="color: var(--text-tertiary);">{course.completed_lessons}/{course.total_lessons} lessons</span>
							<div class="flex items-center gap-1">
								<button onclick={() => startEdit(course)} class="rounded-md p-1.5" style="color: var(--text-tertiary);">
									<Icon icon="ph:pencil" width={14} height={14} />
								</button>
								<button onclick={() => handleDelete(course.id)} class="rounded-md p-1.5" style="color: var(--text-tertiary);">
									<Icon icon="ph:trash" width={14} height={14} />
								</button>
							</div>
						</div>
						<!-- Rating -->
						{#if course.rating}
							<div class="flex items-center gap-0.5 mt-2">
								{#each Array(5) as _, i}
									<Icon icon={i < (course.rating ?? 0) ? 'ph:star-fill' : 'ph:star'} width={12} height={12} style="color: {i < (course.rating ?? 0) ? '#f59e0b' : 'var(--text-tertiary)'};" />
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
			{#if filteredCourses().length === 0}
				<div class="flex flex-col items-center justify-center py-20">
					<Icon icon="ph:graduation-cap" width={48} height={48} style="color: var(--text-tertiary); opacity: 0.3;" />
					<p class="mt-3 text-sm" style="color: var(--text-tertiary);">No courses yet</p>
					<button onclick={() => startEdit()} class="mt-3 rounded-lg px-4 py-2 text-xs font-medium text-white" style="background: var(--color-primary-600);">Add your first course</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
