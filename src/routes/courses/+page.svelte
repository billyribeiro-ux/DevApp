<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getCourses, createCourse, updateCourse, deleteCourse } from '$services/database';
	import { COURSE_PLATFORMS } from '$config/constants';
	import { getStatusColor } from '$utils/formatters';
	import type { Course } from '$types';
	import { v4 as uuid } from 'uuid';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import DropZone from '$lib/components/ui/DropZone.svelte';

	let courses = $state<Course[]>([]);
	let activeFilter = $state('all');
	let showForm = $state(false);
	let editingCourse = $state<Course | null>(null);
	let confirmDeleteOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);

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

	function requestDelete(id: string) {
		pendingDeleteId = id;
		confirmDeleteOpen = true;
	}

	async function handleDelete() {
		if (!pendingDeleteId) return;
		await deleteCourse(pendingDeleteId);
		courses = await getCourses();
		pendingDeleteId = null;
		toasts.success('Course Deleted');
	}

	async function handleFileDrop(files: File[]) {
		let imported = 0;
		for (const file of files) {
			const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
			if (ext !== 'json') continue;
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				await createCourse({ id: uuid(), name: data.name || file.name.replace(/\.json$/, ''), instructor: data.instructor || null, platform: data.platform || null, url: data.url || null, description: data.description || null, status: 'not_started' });
				imported++;
			} catch { toasts.warning(`Invalid JSON in ${file.name}`); }
		}
		if (imported > 0) {
			courses = await getCourses();
			toasts.success(`Imported ${imported} course${imported > 1 ? 's' : ''}`);
		} else {
			toasts.warning('No .json course files found');
		}
	}

	onMount(async () => {
		nav.navigate('/courses');
		courses = await getCourses();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="flex items-center justify-between px-8 py-5 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:graduation-cap-bold" width={24} height={24} style="color: #14b8a6;" />
			<h1 class="text-[22px] font-bold" style="color: var(--text-primary); letter-spacing: -0.02em;">Courses</h1>
			<span class="rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style="background: rgba(20, 184, 166, 0.1); color: #14b8a6;">{courses.length}</span>
		</div>
		<button onclick={() => startEdit()} class="btn-primary">
			<Icon icon="ph:plus-bold" width={15} height={15} /> New Course
		</button>
	</div>

	<div class="flex items-center gap-1.5 px-8 py-3 border-b shrink-0" style="border-color: var(--border-default);">
		{#each [{ v: 'all', l: 'All' }, { v: 'not_started', l: 'Not Started' }, { v: 'in_progress', l: 'In Progress' }, { v: 'completed', l: 'Completed' }, { v: 'paused', l: 'Paused' }] as f}
			<button onclick={() => { activeFilter = f.v; }} class="rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors" style="background: {activeFilter === f.v ? 'var(--bg-active)' : 'transparent'}; color: {activeFilter === f.v ? 'var(--text-accent)' : 'var(--text-secondary)'};">
				{f.l}
			</button>
		{/each}
	</div>

	<div class="flex-1 overflow-y-auto px-8 py-6">
		{#if showForm}
			<div class="max-w-lg mx-auto animate-slide-up">
				<div class="rounded-2xl border p-8 space-y-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<h3 class="text-base font-semibold" style="color: var(--text-primary);">{editingCourse ? 'Edit Course' : 'New Course'}</h3>
					<input type="text" bind:value={cName} placeholder="Course name..." class="input-field" />
					<input type="text" bind:value={cInstructor} placeholder="Instructor..." class="input-field" />
					<div class="grid grid-cols-2 gap-4">
						<select bind:value={cPlatform} class="input-field input-field-sm">
							<option value="">Select platform</option>
							{#each COURSE_PLATFORMS as p}
								<option value={p}>{p}</option>
							{/each}
						</select>
						<input type="url" bind:value={cUrl} placeholder="Course URL..." class="input-field input-field-sm" />
					</div>
					<textarea bind:value={cDescription} placeholder="Description..." rows={3} class="input-field resize-none"></textarea>
					<div class="flex justify-end gap-2 pt-2">
						<button onclick={() => { showForm = false; }} class="btn-ghost">Cancel</button>
						<button onclick={handleSave} class="btn-primary">Save</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
				{#each filteredCourses() as course (course.id)}
					<div class="rounded-2xl border p-6 transition-all duration-150 hover:shadow-md" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
						<div class="flex items-start justify-between mb-3">
							<div>
								<h3 class="text-[16px] font-semibold" style="color: var(--text-primary);">{course.name}</h3>
								{#if course.instructor}
									<p class="text-[13px] mt-0.5" style="color: var(--text-tertiary);">by {course.instructor}</p>
								{/if}
							</div>
							<button onclick={() => toggleStatus(course)} class="rounded-full px-2.5 py-1 text-[11px] font-semibold" style="background: {getStatusColor(course.status)}20; color: {getStatusColor(course.status)};">
								{course.status.replace('_', ' ')}
							</button>
						</div>
						{#if course.platform}
							<span class="inline-block rounded-lg px-2.5 py-1 text-[12px] font-medium mb-3" style="background: var(--bg-surface-raised); color: var(--text-secondary);">{course.platform}</span>
						{/if}
						{#if course.description}
							<p class="text-[13px] mb-4 line-clamp-2" style="color: var(--text-secondary);">{course.description}</p>
						{/if}
						<div class="mb-3">
							<div class="flex items-center justify-between mb-1.5">
								<span class="text-[12px]" style="color: var(--text-tertiary);">Progress</span>
								<span class="text-[12px] font-semibold" style="color: var(--text-primary);">{course.progress_percent}%</span>
							</div>
							<div class="h-2 rounded-full overflow-hidden" style="background: var(--bg-surface-raised);">
								<div class="h-full rounded-full transition-all duration-300" style="width: {course.progress_percent}%; background: {getStatusColor(course.status)};"></div>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-[12px]" style="color: var(--text-tertiary);">{course.completed_lessons}/{course.total_lessons} lessons</span>
							<div class="flex items-center gap-1">
								<button onclick={() => startEdit(course)} class="rounded-xl p-2" style="color: var(--text-tertiary);">
									<Icon icon="ph:pencil" width={16} height={16} />
								</button>
								<button onclick={() => requestDelete(course.id)} class="rounded-xl p-2" style="color: var(--text-tertiary);">
									<Icon icon="ph:trash" width={16} height={16} />
								</button>
							</div>
						</div>
						{#if course.rating}
							<div class="flex items-center gap-0.5 mt-3">
								{#each Array(5) as _, i}
									<Icon icon={i < (course.rating ?? 0) ? 'ph:star-fill' : 'ph:star'} width={14} height={14} style="color: {i < (course.rating ?? 0) ? '#f59e0b' : 'var(--text-tertiary)'};" />
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
			{#if filteredCourses().length === 0}
				<DropZone onfiledrop={handleFileDrop}>
					<div class="flex flex-col items-center justify-center py-24">
						<Icon icon="ph:graduation-cap" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
						<p class="mt-4 text-sm" style="color: var(--text-tertiary);">No courses yet</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">Drop .json files to import courses</p>
						<button onclick={() => startEdit()} class="mt-4 btn-primary">Add your first course</button>
					</div>
				</DropZone>
			{/if}
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete Course"
	description="Are you sure you want to delete this course? This action cannot be undone."
	confirmLabel="Delete"
	variant="danger"
	onconfirm={handleDelete}
/>
