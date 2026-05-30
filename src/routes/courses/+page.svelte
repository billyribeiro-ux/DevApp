<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts, vault } from '$stores/app.svelte';
	import { getCourses, createCourse, updateCourse, deleteCourse } from '$services/database';
	import { COURSE_PLATFORMS } from '$config/constants';
	import { getStatusColor } from '$utils/formatters';
	import { handleError } from '$lib/utils/error-handler';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import type { Course } from '$types';
	import { v4 as uuid } from 'uuid';

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

	let filteredCourses = $derived.by(() => {
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
		try {
			if (editingCourse) {
				await updateCourse(editingCourse.id, { name: cName, instructor: cInstructor || null, platform: cPlatform || null, url: cUrl || null, description: cDescription || null });
			} else {
				const coursesFolder = vault.folders.find(f => f.folder_type === 'course' && f.is_deleted === 0);
				const folderId = coursesFolder?.id ?? vault.folders[0]?.id;
				if (!folderId) { toasts.error('No folder available'); return; }
				await createCourse({ id: uuid(), folder_id: folderId, name: cName, instructor: cInstructor || null, platform: cPlatform || null, url: cUrl || null, description: cDescription || null });
			}
			courses = await getCourses();
			showForm = false;
			toasts.success(editingCourse ? 'Course Updated' : 'Course Created');
		} catch (err) { handleError(err, 'Save Course'); }
	}

	async function toggleStatus(course: Course) {
		try {
			const statuses: Course['status'][] = ['not_started', 'in_progress', 'completed', 'paused'];
			const idx = statuses.indexOf(course.status);
			const next = statuses[(idx + 1) % statuses.length];
			await updateCourse(course.id, { status: next });
			courses = await getCourses();
		} catch (err) { handleError(err, 'Update Course Status'); }
	}

	function requestDelete(id: string) {
		pendingDeleteId = id;
		confirmDeleteOpen = true;
	}

	async function handleDelete() {
		if (!pendingDeleteId) return;
		const id = pendingDeleteId;
		pendingDeleteId = null;
		try {
			await deleteCourse(id);
			courses = await getCourses();
			toasts.success('Course Deleted');
		} catch (err) { handleError(err, 'Delete Course'); }
	}

	onMount(async () => {
		nav.navigate('/courses');
		try { courses = await getCourses(); }
		catch (err) { handleError(err, 'Load Courses'); }
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="page-header">
		<div class="flex items-center gap-3">
			<Icon icon="ph:graduation-cap-bold" width={24} height={24} style="color: var(--color-accent-500);" />
			<h1>Courses</h1>
			<span class="rounded-full px-2.5 py-0.5 font-semibold" style="font-size: var(--text-xs); background: var(--color-accent-light); color: var(--color-accent-500);">{courses.length}</span>
		</div>
		<button onclick={() => startEdit()} class="btn-primary">
			<Icon icon="ph:plus-bold" width={15} height={15} /> New Course
		</button>
	</div>

	<div class="page-tabs">
		{#each [{ v: 'all', l: 'All' }, { v: 'not_started', l: 'Not Started' }, { v: 'in_progress', l: 'In Progress' }, { v: 'completed', l: 'Completed' }, { v: 'paused', l: 'Paused' }] as f}
			<button onclick={() => { activeFilter = f.v; }} class="rounded-full px-4 py-1.5 font-medium transition-colors" style="font-size: var(--text-sm); background: {activeFilter === f.v ? 'var(--bg-active)' : 'transparent'}; color: {activeFilter === f.v ? 'var(--text-accent)' : 'var(--text-secondary)'};">
				{f.l}
			</button>
		{/each}
	</div>

	<div class="page-content">
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
				{#each filteredCourses as course (course.id)}
					<div class="rounded-2xl border p-6 transition-all duration-150 hover:shadow-md" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
						<div class="flex items-start justify-between mb-3">
							<div>
								<h3 class="font-semibold" style="font-size: var(--text-base); color: var(--text-primary);">{course.name}</h3>
								{#if course.instructor}
									<p class="mt-0.5" style="font-size: var(--text-sm); color: var(--text-tertiary);">by {course.instructor}</p>
								{/if}
							</div>
							<button onclick={() => toggleStatus(course)} class="rounded-full px-2.5 py-1 font-semibold" style="font-size: var(--text-xs); background: {getStatusColor(course.status)}20; color: {getStatusColor(course.status)};">
								{course.status.replace('_', ' ')}
							</button>
						</div>
						{#if course.platform}
							<span class="inline-block rounded-lg px-2.5 py-1 font-medium mb-3" style="font-size: var(--text-xs); background: var(--bg-surface-raised); color: var(--text-secondary);">{course.platform}</span>
						{/if}
						{#if course.description}
							<p class="mb-4 line-clamp-2" style="font-size: var(--text-sm); color: var(--text-secondary);">{course.description}</p>
						{/if}
						<div class="mb-3">
							<div class="flex items-center justify-between mb-1.5">
								<span style="font-size: var(--text-xs); color: var(--text-tertiary);">Progress</span>
								<span class="font-semibold" style="font-size: var(--text-xs); color: var(--text-primary);">{course.progress_percent}%</span>
							</div>
							<div class="h-2 rounded-full overflow-hidden" style="background: var(--bg-surface-raised);">
								<div class="h-full rounded-full transition-all duration-300" style="width: {course.progress_percent}%; background: {getStatusColor(course.status)};"></div>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span style="font-size: var(--text-xs); color: var(--text-tertiary);">{course.completed_lessons}/{course.total_lessons} lessons</span>
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
									<Icon icon={i < (course.rating ?? 0) ? 'ph:star-fill' : 'ph:star'} width={14} height={14} style="color: {i < (course.rating ?? 0) ? 'var(--color-warning)' : 'var(--text-tertiary)'};" />
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
			{#if filteredCourses.length === 0}
				<div class="flex flex-col items-center justify-center py-24">
					<Icon icon="ph:graduation-cap" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
					<p class="mt-4 text-sm" style="color: var(--text-tertiary);">No courses yet</p>
					<button onclick={() => startEdit()} class="mt-4 btn-primary">Add your first course</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete Course"
	description="This course will be moved to trash."
	confirmLabel="Delete"
	variant="danger"
	onconfirm={handleDelete}
/>
