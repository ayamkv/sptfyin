import { redirect } from '@sveltejs/kit';

export const GET = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  throw redirect(302, '/dash/links');
};


